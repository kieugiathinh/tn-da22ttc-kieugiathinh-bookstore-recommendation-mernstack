"""
collaborative.py — Collaborative Filtering bằng SVD (Matrix Factorization)
===========================================================================
Cài đặt thuần numpy (không cần C++ compiler, không cần scikit-surprise).

Thuật toán: Funk SVD (Simon Funk, 2006) với Stochastic Gradient Descent.
    - Factorize R ≈ P × Q^T
        R: Ma trận User-Item ratings (shape: n_users x n_items)
        P: User latent matrix (shape: n_users x n_factors)
        Q: Item latent matrix (shape: n_items x n_factors)
    - Dự đoán: r_hat(u,i) = mu + b_u + b_i + P[u] · Q[i]
        mu:  Global mean rating
        b_u: User bias
        b_i: Item bias

[v2] Cải tiến: Kết hợp Implicit Signals (view, add_to_cart, purchase)
    - Chuyển đổi implicit interactions thành pseudo-ratings dùng công thức:
        implicit_score(user, item) = Σ [ weight(type) × time_decay(days) ]
        time_decay(t) = e^(-λ * days)  với λ = 0.01
    - Merge với explicit ratings (1-5 sao) theo quy tắc:
        • Nếu user đã rate explicit → giữ nguyên explicit rating
        • Nếu chỉ có implicit → dùng implicit_score làm pseudo-rating
    - Kết quả: tận dụng được hành vi xem/mua để gợi ý cho user chưa đánh giá
"""

import numpy as np
import pandas as pd
import math
from typing import List, Dict, Any, Tuple, Optional


# ─── Trọng số implicit signals ─────────────────────────────────────────────────
# Khớp với INTERACTION_WEIGHT trong userInteractionModel.js
IMPLICIT_WEIGHTS = {
    "view":         1.0,
    "search_click": 2.0,
    "add_to_cart":  3.0,
    "favorite":     3.5,
    "review":       4.0,
    "purchase":     5.0,
}

# Time decay: λ ~ 0.01 → interaction 70 ngày trước ≈ còn 50% giá trị
DECAY_LAMBDA = 0.01

# Pseudo-rating range: implicit score được chuẩn hóa về [4.0, 5.0] để
# thể hiện sự quan tâm tích cực (view = 4.0, purchase = 5.0).
# Nếu để min=1.0, việc user click xem (view) sẽ bị quy thành đánh giá 1 sao!
IMPLICIT_RATING_MIN = 4.0
IMPLICIT_RATING_MAX = 5.0


def _compute_time_decay(created_at_series: pd.Series) -> pd.Series:
    """
    Tính time decay cho mỗi interaction.
    decay(t) = e^(-λ * days_since)
    """
    now = pd.Timestamp.now(tz="UTC")
    dt_series = pd.to_datetime(created_at_series, utc=True, errors="coerce")
    days_since = (now - dt_series).dt.total_seconds() / 86400
    days_since = days_since.fillna(30.0).clip(lower=0)
    return np.exp(-DECAY_LAMBDA * days_since)


def build_implicit_ratings(
    df_interactions: pd.DataFrame,
    df_purchases: pd.DataFrame,
    weights: dict = None,
) -> pd.DataFrame:
    """
    Chuyển đổi implicit feedback thành pseudo-ratings DataFrame.

    Công thức mỗi (user, item):
        raw_score = Σ [ weight(type) × time_decay(createdAt) ]
        pseudo_rating = normalize(raw_score) → [IMPLICIT_RATING_MIN, IMPLICIT_RATING_MAX]

    Args:
        df_interactions: DataFrame với cột userId, productId, interactionType, createdAt
        df_purchases:    DataFrame với cột userId, productId, quantity, purchasedAt
        weights:         Dict trọng số tương tác

    Returns:
        pd.DataFrame với cột userId, productId, rating (pseudo), source="implicit"
    """
    if weights is None:
        weights = IMPLICIT_WEIGHTS
        
    rows = []

    # ── Xử lý interactions ────────────────────────────────────────────────────
    if df_interactions is not None and not df_interactions.empty:
        required_cols = {"userId", "productId", "interactionType", "createdAt"}
        if required_cols.issubset(df_interactions.columns):
            df_i = df_interactions.copy()
            df_i["weight"] = df_i["interactionType"].map(weights).fillna(1.0)
            df_i["decay"]  = _compute_time_decay(df_i["createdAt"])
            df_i["score"]  = df_i["weight"] * df_i["decay"]
            agg = (
                df_i.groupby(["userId", "productId"])["score"]
                .sum()
                .reset_index()
                .rename(columns={"score": "raw_score"})
            )
            rows.append(agg)

    # ── Xử lý purchases (implicit signal mạnh nhất) ───────────────────────────
    if df_purchases is not None and not df_purchases.empty:
        required_cols = {"userId", "productId", "quantity", "purchasedAt"}
        if required_cols.issubset(df_purchases.columns):
            df_p = df_purchases.copy()
            # Purchase weight = quantity × weights["purchase"]
            purchase_w = weights.get("purchase", 5.0)
            df_p["decay"]     = _compute_time_decay(df_p["purchasedAt"])
            df_p["score"]     = df_p["quantity"].clip(upper=5) * purchase_w * df_p["decay"]
            df_p["userId"]    = df_p["userId"].astype(str)
            df_p["productId"] = df_p["productId"].astype(str)
            agg = (
                df_p.groupby(["userId", "productId"])["score"]
                .sum()
                .reset_index()
                .rename(columns={"score": "raw_score"})
            )
            rows.append(agg)

    if not rows:
        return pd.DataFrame(columns=["userId", "productId", "rating"])

    combined = pd.concat(rows, ignore_index=True)
    combined["userId"]    = combined["userId"].astype(str)
    combined["productId"] = combined["productId"].astype(str)

    # Cộng dồn score cùng (user, item) từ các nguồn khác nhau
    combined = (
        combined.groupby(["userId", "productId"])["raw_score"]
        .sum()
        .reset_index()
    )

    # Chuẩn hóa raw_score → [IMPLICIT_RATING_MIN, IMPLICIT_RATING_MAX]
    score_min = combined["raw_score"].min()
    score_max = combined["raw_score"].max()

    if score_max > score_min:
        combined["rating"] = IMPLICIT_RATING_MIN + (
            (combined["raw_score"] - score_min) / (score_max - score_min)
            * (IMPLICIT_RATING_MAX - IMPLICIT_RATING_MIN)
        )
    else:
        # Tất cả bằng nhau → gán trung bình
        combined["rating"] = (IMPLICIT_RATING_MIN + IMPLICIT_RATING_MAX) / 2

    combined["rating"] = combined["rating"].round(3)
    return combined[["userId", "productId", "rating"]]


def merge_ratings(
    df_explicit: pd.DataFrame,
    df_implicit: pd.DataFrame,
) -> pd.DataFrame:
    """
    Kết hợp explicit ratings và implicit pseudo-ratings.

    Quy tắc merge:
        - Nếu (user, item) có cả explicit và implicit → giữ explicit (chính xác hơn)
        - Nếu chỉ có implicit → dùng implicit pseudo-rating
        - Nếu chỉ có explicit → giữ nguyên

    Kết quả: DataFrame dùng để train SVD có nhiều dữ liệu hơn, giúp giảm cold-start.

    Args:
        df_explicit: DataFrame với cột userId, productId, rating (explicit, 1-5)
        df_implicit: DataFrame với cột userId, productId, rating (pseudo, 1-4)

    Returns:
        pd.DataFrame: Merged ratings, cột userId, productId, rating
    """
    if df_explicit is None or df_explicit.empty:
        return df_implicit if df_implicit is not None else pd.DataFrame()

    if df_implicit is None or df_implicit.empty:
        return df_explicit

    # Tag nguồn để ưu tiên explicit
    df_e = df_explicit[["userId", "productId", "rating"]].copy()
    df_e["source"] = "explicit"

    df_i = df_implicit[["userId", "productId", "rating"]].copy()
    df_i["source"] = "implicit"

    # Concat và drop duplicate (user, item): giữ explicit khi trùng
    merged = pd.concat([df_e, df_i], ignore_index=True)
    # "explicit" < "implicit" alphabetically, sort ascending → explicit first
    merged = merged.sort_values("source")
    merged = merged.drop_duplicates(subset=["userId", "productId"], keep="first")
    merged = merged.drop(columns=["source"]).reset_index(drop=True)

    return merged


# ─────────────────────────────────────────────────────────────────────────────


class FunkSVD:
    """
    Funk SVD implementation thuần numpy với SGD + bias terms.
    Tương đương scikit-surprise SVD về thuật toán, không cần C++ compiler.
    """

    def __init__(
        self,
        n_factors: int = 50,
        n_epochs: int = 30,
        lr: float = 0.005,
        reg: float = 0.02,
        random_state: int = 42,
    ):
        self.n_factors = n_factors
        self.n_epochs = n_epochs
        self.lr = lr            # Learning rate
        self.reg = reg          # L2 regularization
        self.rng = np.random.RandomState(random_state)

        # Được khởi tạo khi fit()
        self.mu: float = 0.0        # Global mean
        self.bu: np.ndarray = None  # User biases
        self.bi: np.ndarray = None  # Item biases
        self.P: np.ndarray = None   # User latent factors
        self.Q: np.ndarray = None   # Item latent factors

    def fit(
        self,
        ratings: List[Tuple[int, int, float]],  # (user_idx, item_idx, rating)
        n_users: int,
        n_items: int,
        mu: float,
    ) -> "FunkSVD":
        self.mu = mu
        self.bu = np.zeros(n_users)
        self.bi = np.zeros(n_items)
        self.P = self.rng.normal(0, 0.1, (n_users, self.n_factors))
        self.Q = self.rng.normal(0, 0.1, (n_items, self.n_factors))

        # SGD training loop
        for epoch in range(self.n_epochs):
            # Shuffle mỗi epoch để tránh bias thứ tự
            self.rng.shuffle(ratings)
            total_loss = 0.0

            for u, i, r in ratings:
                # Dự đoán
                pred = self.mu + self.bu[u] + self.bi[i] + self.P[u] @ self.Q[i]
                err = r - pred
                total_loss += err ** 2

                # Gradient step
                self.bu[u] += self.lr * (err - self.reg * self.bu[u])
                self.bi[i] += self.lr * (err - self.reg * self.bi[i])
                self.P[u]  += self.lr * (err * self.Q[i] - self.reg * self.P[u])
                self.Q[i]  += self.lr * (err * self.P[u] - self.reg * self.Q[i])

            if (epoch + 1) % 10 == 0:
                rmse = np.sqrt(total_loss / len(ratings))
                print(f"[CF] Epoch {epoch + 1}/{self.n_epochs} | RMSE: {rmse:.4f}")

        return self

    def predict(self, u: int, i: int) -> float:
        """Dự đoán rating cho (user_idx, item_idx)."""
        pred = self.mu + self.bu[u] + self.bi[i] + self.P[u] @ self.Q[i]
        return float(np.clip(pred, 1.0, 5.0))  # Giới hạn trong [1, 5]


# ─────────────────────────────────────────────────────────────────────────────


class CollaborativeRecommender:
    """
    Collaborative Filtering Recommender dùng Funk SVD.

    [v2] Hỗ trợ implicit signals (view, purchase) bên cạnh explicit ratings.

    Vòng đời:
        cf = CollaborativeRecommender()
        cf.fit(df_ratings, df_interactions, df_purchases)
        results = cf.recommend_for_user(user_id, all_product_ids, top_k=5)
    """

    def __init__(self, n_factors: int = 50, n_epochs: int = 30):
        self._svd = FunkSVD(n_factors=n_factors, n_epochs=n_epochs)

        # Encoder: string ID → integer index (SVD cần index số nguyên)
        self._user_encoder: Dict[str, int] = {}
        self._item_encoder: Dict[str, int] = {}
        self._user_decoder: Dict[int, str] = {}
        self._item_decoder: Dict[int, str] = {}

        self._df_ratings: pd.DataFrame | None = None
        self._known_users: set = set()
        self._known_items: set = set()
        self._is_fitted: bool = False

        # Thống kê nguồn dữ liệu để debug
        self._explicit_count: int = 0
        self._implicit_count: int = 0

    # ─── Training ─────────────────────────────────────────────────────────────

    def fit(
        self,
        df_ratings: pd.DataFrame,
        df_interactions: Optional[pd.DataFrame] = None,
        df_purchases: Optional[pd.DataFrame] = None,
        weights: Optional[dict] = None,
    ) -> "CollaborativeRecommender":
        """
        Huấn luyện Funk SVD trên ma trận User-Item ratings kết hợp.

        Args:
            df_ratings:      Explicit ratings từ Review collection (userId, productId, rating).
            df_interactions: Implicit signals từ UserInteraction (tuỳ chọn).
            df_purchases:    Lịch sử mua hàng từ Order (tuỳ chọn).
            weights:         Dict trọng số động.

        Returns:
            self

        Raises:
            ValueError: Nếu không đủ dữ liệu để train.
        """
        # ── Bước 1: Build implicit pseudo-ratings ────────────────────────────
        df_implicit = build_implicit_ratings(df_interactions, df_purchases, weights)
        self._implicit_count = len(df_implicit)

        if df_ratings is not None and not df_ratings.empty:
            self._explicit_count = len(df_ratings)
        else:
            df_ratings = pd.DataFrame(columns=["userId", "productId", "rating"])
            self._explicit_count = 0

        # ── Bước 2: Merge explicit + implicit ────────────────────────────────
        df_merged = merge_ratings(df_ratings, df_implicit)

        if df_merged is None or df_merged.empty:
            raise ValueError(
                "[CF] Khong co du lieu de train. "
                "Can it nhat 1 explicit rating hoac 1 implicit interaction."
            )

        required = {"userId", "productId", "rating"}
        if not required.issubset(df_merged.columns):
            raise ValueError(f"[CF] Thieu cot: {required - set(df_merged.columns)}")

        if len(df_merged) < 5:
            raise ValueError(
                f"[CF] Can it nhat 5 ratings de train "
                f"(hien co {len(df_merged)} sau merge)."
            )

        print(f"[CF] Bat dau fit SVD model voi {len(df_merged)} ratings (merged)...")
        print(f"[CF]   Explicit ratings  : {self._explicit_count}")
        print(f"[CF]   Implicit pseudo   : {self._implicit_count}")
        print(f"[CF]   Unique users      : {df_merged['userId'].nunique()}")
        print(f"[CF]   Unique items      : {df_merged['productId'].nunique()}")

        self._df_ratings = df_merged.copy()

        # Build encoders: string ID → int index
        unique_users = sorted(df_merged["userId"].astype(str).unique())
        unique_items = sorted(df_merged["productId"].astype(str).unique())

        self._user_encoder = {u: i for i, u in enumerate(unique_users)}
        self._item_encoder = {it: i for i, it in enumerate(unique_items)}
        self._user_decoder = {i: u for u, i in self._user_encoder.items()}
        self._item_decoder = {i: it for it, i in self._item_encoder.items()}

        self._known_users = set(unique_users)
        self._known_items = set(unique_items)

        # Chuyển DataFrame → list of (user_idx, item_idx, rating) tuples
        ratings_list = [
            (
                self._user_encoder[str(row["userId"])],
                self._item_encoder[str(row["productId"])],
                float(row["rating"]),
            )
            for _, row in df_merged.iterrows()
        ]

        mu = float(df_merged["rating"].mean())

        # Train SVD
        self._svd.fit(
            ratings=ratings_list,
            n_users=len(unique_users),
            n_items=len(unique_items),
            mu=mu,
        )

        self._is_fitted = True
        print(
            f"[CF] SVD fit hoan thanh. Model san sang. "
            f"({self.rating_count} ratings | {self.user_count} users | {self.item_count} items)"
        )
        return self

    # ─── Inference ────────────────────────────────────────────────────────────

    def recommend_for_user(
        self,
        user_id: str,
        all_product_ids: List[str],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Gợi ý sản phẩm cho user dựa trên predicted rating.

        Returns [] nếu Cold Start (user chưa có trong training data).
        """
        if not self._is_fitted:
            raise RuntimeError("[CF] Model chua duoc fit. Goi fit() truoc.")

        top_k = min(max(top_k, 1), 20)
        user_id = str(user_id)

        # ── Cold Start ────────────────────────────────────────────────────────
        if user_id not in self._known_users:
            return []  # Signal cold-start cho caller

        u_idx = self._user_encoder[user_id]

        # Predict cho tất cả items có trong training data (không loại trừ items đã xem)
        # Để sản phẩm user vừa click không bị mất khỏi danh sách gợi ý.
        unrated_known = [
            pid for pid in all_product_ids
            if pid in self._item_encoder
        ]

        if not unrated_known:
            return []

        # Vectorized prediction: P[u] @ Q[items].T + biases
        item_indices = [self._item_encoder[pid] for pid in unrated_known]
        Q_subset = self._svd.Q[item_indices]                         # (n_unrated, n_factors)
        scores = (
            self._svd.mu
            + self._svd.bu[u_idx]
            + self._svd.bi[item_indices]
            + Q_subset @ self._svd.P[u_idx]
        )
        scores = np.clip(scores, 1.0, 5.0)

        # Sort giảm dần → top_k
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = [
            {
                "productId": unrated_known[i],
                "predictedRating": round(float(scores[i]), 3),
                "rank": rank,
            }
            for rank, i in enumerate(top_indices, start=1)
        ]

        return results

    # ─── Utilities ────────────────────────────────────────────────────────────

    @property
    def is_fitted(self) -> bool:
        return self._is_fitted

    @property
    def rating_count(self) -> int:
        return len(self._df_ratings) if self._df_ratings is not None else 0

    @property
    def user_count(self) -> int:
        return len(self._known_users)

    @property
    def item_count(self) -> int:
        return len(self._known_items)

    @property
    def explicit_count(self) -> int:
        return self._explicit_count

    @property
    def implicit_count(self) -> int:
        return self._implicit_count

    def is_known_user(self, user_id: str) -> bool:
        return str(user_id) in self._known_users
