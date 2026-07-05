"""
routers/recommend.py — Recommendation API Endpoints
=====================================================
Content-Based (TF-IDF) + Collaborative Filtering (Funk SVD) endpoints.

[v2] Thêm:
  - POST /recommend/retrain  : Trigger manual retrain CF model
  - GET  /recommend/status   : Hiện thêm explicit_count / implicit_count
"""

from fastapi import APIRouter, HTTPException, Request, Query, BackgroundTasks
from typing import List, Dict, Any
import threading

from app.data_fetcher import fetch_ratings, fetch_interactions, fetch_purchases
from app.recommenders.collaborative import CollaborativeRecommender

router = APIRouter()

# Lock để tránh 2 retrain chạy song song
_retrain_lock = threading.Lock()


# ─── GET /api/v1/recommend/item/{product_id} ──────────────────────────────────

@router.get(
    "/recommend/item/{product_id}",
    summary="Content-Based: Tim sach tuong dong",
    response_description="Danh sach sach co noi dung tuong dong nhat",
)
def get_similar_items(
    product_id: str,
    request: Request,
    top_k: int = Query(default=5, ge=1, le=20, description="So luong ket qua tra ve (1-20)"),
) -> Dict[str, Any]:
    """
    Tim top-K sach co noi dung tuong dong voi sach duoc chi dinh.

    **Thuat toan**: TF-IDF Cosine Similarity tren combined text features
    (title, author, category, desc, tags).

    **Giai thich score**:
    - 1.0 = giong hoan toan (chinh no)
    - 0.7+ = rat tuong dong (cung tac gia / cung chu de)
    - 0.3-0.7 = tuong doi tuong dong
    - < 0.3 = it lien quan

    **Truong hop loi**:
    - 503: Model chua duoc khoi tao (server dang warm up)
    - 404: product_id khong ton tai trong he thong
    """
    cbf_model = getattr(request.app.state, "cbf_model", None)

    # Kiểm tra model đã sẵn sàng chưa
    if cbf_model is None or not cbf_model.is_fitted:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "MODEL_NOT_READY",
                "message": (
                    "Content-Based model chua duoc khoi tao. "
                    "Doi vai giay de server warm up va thu lai."
                ),
            },
        )

    # Tìm sản phẩm tương đồng
    try:
        similar_items = cbf_model.get_similar_items(product_id, top_k=top_k)
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "PRODUCT_NOT_FOUND",
                "message": f"product_id '{product_id}' khong ton tai trong index.",
                "hint": "Goi GET /api/v1/recommend/products/list de xem danh sach ID hop le.",
            },
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail={"error": "MODEL_ERROR", "message": str(e)})

    return {
        "success": True,
        "query": {
            "productId": product_id,
            "top_k": top_k,
            "algorithm": "content-based-tfidf",
        },
        "count": len(similar_items),
        "recommendations": similar_items,
    }


# ─── GET /api/v1/recommend/products/list ──────────────────────────────────────

@router.get(
    "/recommend/products/list",
    summary="Lay danh sach tat ca product_id da duoc index",
    response_description="Danh sach product_id co the dung de test recommendation",
)
def list_indexed_products(request: Request) -> Dict[str, Any]:
    """
    Tra ve danh sach product_id da duoc index trong Content-Based model.
    Dung de test: copy mot ID tu day va paste vao endpoint /recommend/item/{id}.
    """
    cbf_model = getattr(request.app.state, "cbf_model", None)

    if cbf_model is None or not cbf_model.is_fitted:
        raise HTTPException(
            status_code=503,
            detail={"error": "MODEL_NOT_READY", "message": "Model chua san sang."},
        )

    return {
        "success": True,
        "count": cbf_model.product_count,
        "product_ids": cbf_model.get_product_ids(),
    }


# ─── GET /api/v1/recommend/user/{user_id}/collaborative ──────────────────────

@router.get(
    "/recommend/user/{user_id}/collaborative",
    summary="Collaborative Filtering: Goi y sach cho User",
    response_description="Danh sach sach duoc du doan la user thich nhat",
)
def get_recommendations_for_user(
    user_id: str,
    request: Request,
    top_k: int = Query(default=5, ge=1, le=20, description="So luong ket qua (1-20)"),
) -> Dict[str, Any]:
    """
    Goi y sach cho mot User dua tren lich su rating (Collaborative Filtering - Funk SVD).

    **Thuat toan**: Funk SVD - Matrix Factorization.
    Phan tich ma tran User-Item ratings thanh latent factors
    de du doan rating cho cac sach user chua doc.

    **Cold Start**: Neu user_id chua co trong training data,
    tra ve mang rong va message canh bao thay vi crash.

    **Cach test**:
        1. Lay user_id tu endpoint GET /api/v1/recommend/user/list
        2. Paste vao day de xem goi y
    """
    cbf_model = getattr(request.app.state, "cbf_model", None)
    cf_model = getattr(request.app.state, "cf_model", None)

    if cf_model is None or not cf_model.is_fitted:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "CF_MODEL_NOT_READY",
                "message": "Collaborative Filtering model chua san sang. Doi server warm up.",
            },
        )

    # Lay danh sach tat ca product IDs tu CBF model (da duoc index day du)
    all_product_ids = (
        cbf_model.get_product_ids() if cbf_model and cbf_model.is_fitted else []
    )

    try:
        recommendations = cf_model.recommend_for_user(
            user_id=user_id,
            all_product_ids=all_product_ids,
            top_k=top_k,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail={"error": "CF_ERROR", "message": str(e)})

    # ── Cold Start handling ────────────────────────────────────────────────────
    is_cold_start = not cf_model.is_known_user(user_id)

    return {
        "success": True,
        "query": {
            "userId": user_id,
            "top_k": top_k,
            "algorithm": "collaborative-funk-svd",
        },
        "coldStart": is_cold_start,
        "coldStartMessage": (
            "User nay chua co rating nao trong he thong. "
            "Hay su dung Content-Based Filtering thay the, "
            "hoac khuyen khich user danh gia it nhat 3 cuon sach."
        ) if is_cold_start else None,
        "count": len(recommendations),
        "recommendations": recommendations,
    }


# ─── GET /api/v1/recommend/user/list ─────────────────────────────────────────

@router.get(
    "/recommend/user/list",
    summary="Lay danh sach user_id da co trong CF training data",
)
def list_known_users(request: Request) -> Dict[str, Any]:
    """
    Tra ve danh sach user_id da duoc training trong CF model.
    Dung de test: copy mot ID va paste vao /recommend/user/{id}/collaborative.
    """
    cf_model = getattr(request.app.state, "cf_model", None)

    if cf_model is None or not cf_model.is_fitted:
        raise HTTPException(
            status_code=503,
            detail={"error": "CF_MODEL_NOT_READY", "message": "Model chua san sang."},
        )

    # Lay tu df_ratings cua cf_model
    known_users = list(cf_model._known_users)

    return {
        "success": True,
        "count": len(known_users),
        "user_ids": sorted(known_users),
    }


# ─── GET /api/v1/recommend/status ────────────────────────────────────────────

@router.get(
    "/recommend/status",
    summary="Trang thai cua Recommendation Models",
)
def get_model_status(request: Request) -> Dict[str, Any]:
    """Kiem tra trang thai cac model trong bo nho."""
    cbf_model = getattr(request.app.state, "cbf_model", None)
    cf_model  = getattr(request.app.state, "cf_model", None)

    cbf_status = {
        "fitted":        cbf_model is not None and cbf_model.is_fitted,
        "product_count": cbf_model.product_count if cbf_model and cbf_model.is_fitted else 0,
        "algorithm":     "TF-IDF Cosine Similarity",
    }

    cf_status = {
        "fitted":          cf_model is not None and cf_model.is_fitted,
        "rating_count":    cf_model.rating_count   if cf_model and cf_model.is_fitted else 0,
        "explicit_count":  cf_model.explicit_count  if cf_model and cf_model.is_fitted else 0,
        "implicit_count":  cf_model.implicit_count  if cf_model and cf_model.is_fitted else 0,
        "user_count":      cf_model.user_count      if cf_model and cf_model.is_fitted else 0,
        "item_count":      cf_model.item_count      if cf_model and cf_model.is_fitted else 0,
        "algorithm":       "Funk SVD (Matrix Factorization) + Implicit Signals",
    }

    return {
        "success": True,
        "models": {
            "content_based":           cbf_status,
            "collaborative_filtering": cf_status,
        },
    }


# ─── POST /api/v1/recommend/retrain ──────────────────────────────────────────

def _do_retrain(app_state) -> None:
    """
    Background task: retrain CF model với toàn bộ data mới nhất.
    Nếu CBF model chưa load được (startup fail), tự động refit luôn.
    Chạy trong thread riêng để không block HTTP response.
    """
    if not _retrain_lock.acquire(blocking=False):
        print("[Retrain] Mot retrain khac dang chay, bo qua.")
        return

    try:
        # ── Refit CBF model nếu đang bị None (startup thất bại) ────────────────
        cbf_model = getattr(app_state, "cbf_model", None)
        if cbf_model is None or not cbf_model.is_fitted:
            print("[Retrain] >> CBF model chua san sang, dang refit...")
            try:
                from app.data_fetcher import fetch_products
                from app.recommenders.content_based import ContentBasedRecommender
                df_products = fetch_products()
                new_cbf = ContentBasedRecommender()
                new_cbf.fit(df_products)
                app_state.cbf_model = new_cbf
                print(f"[Retrain] CBF model san sang. Da index {new_cbf.product_count} san pham.")
            except Exception as cbf_err:
                print(f"[Retrain] Refit CBF that bai: {cbf_err}")

        # ── Retrain CF model ──────────────────────────────────────────────────
        print("\n[Retrain] >> Bat dau manual retrain CF model...")
        from app.data_fetcher import fetch_interaction_weights
        df_ratings      = fetch_ratings()
        df_interactions = fetch_interactions(days=90)
        df_purchases    = fetch_purchases()
        weights         = fetch_interaction_weights()

        cf = CollaborativeRecommender(n_factors=50, n_epochs=30)
        cf.fit(
            df_ratings=df_ratings,
            df_interactions=df_interactions,
            df_purchases=df_purchases,
            weights=weights,
        )
        app_state.cf_model = cf
        print(
            f"[Retrain] Thanh cong: {cf.rating_count} ratings "
            f"({cf.explicit_count} explicit + {cf.implicit_count} implicit) | "
            f"{cf.user_count} users | {cf.item_count} items"
        )
    except Exception as e:
        print(f"[Retrain] That bai: {e}")
    finally:
        _retrain_lock.release()


@router.post(
    "/recommend/retrain",
    summary="[Admin] Trigger retrain CF model ngay lap tuc",
    response_description="Xac nhan da khoi dong retrain trong background",
)
def trigger_retrain(
    request: Request,
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    """
    Khởi động retrain Collaborative Filtering model ngay lập tức.

    **Lưu ý**:
    - Retrain chạy ở background — API trả về ngay, không chờ.
    - Nếu đã có retrain đang chạy, request này sẽ bị bỏ qua.
    - Model cũ vẫn phục vụ request trong khi retrain đang chạy.
    - Sau khi xong, model mới được swap vào ngay lập tức.

    Dùng sau khi:
    - Thêm nhiều review mới (explicit ratings)
    - Sau khi nhiều user mua hàng (purchase signals)
    - Khi muốn force update gợi ý không chờ 6 giờ.
    """
    if _retrain_lock.locked():
        return {
            "success": False,
            "message": "Mot retrain khac dang chay. Vui long thu lai sau.",
            "status": "BUSY",
        }

    app_state = request.app.state
    thread = threading.Thread(
        target=_do_retrain,
        args=(app_state,),
        daemon=True,
        name="CF-Manual-Retrain",
    )
    thread.start()

    cf_model = getattr(app_state, "cf_model", None)
    current_stats = {
        "rating_count":   cf_model.rating_count  if cf_model and cf_model.is_fitted else 0,
        "explicit_count": cf_model.explicit_count if cf_model and cf_model.is_fitted else 0,
        "implicit_count": cf_model.implicit_count if cf_model and cf_model.is_fitted else 0,
        "user_count":     cf_model.user_count     if cf_model and cf_model.is_fitted else 0,
    }

    return {
        "success": True,
        "message": "Retrain CF model da duoc khoi dong trong background.",
        "status": "STARTED",
        "note": "Model cu van hoat dong binh thuong trong khi retrain.",
        "current_model_stats": current_stats,
    }
