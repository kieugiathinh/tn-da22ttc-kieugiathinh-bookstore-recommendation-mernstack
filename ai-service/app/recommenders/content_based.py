"""
content_based.py — Content-Based Filtering Recommender
=======================================================
Thuật toán:
    1. Gom các text features của sách thành một chuỗi "combined_features".
    2. Vectorize bằng TF-IDF (Term Frequency - Inverse Document Frequency).
    3. Tính Cosine Similarity giữa tất cả cặp sách → Similarity Matrix (N x N).
    4. Khi query item_id, tra similarity matrix → sort → trả top-K.

Ưu điểm của TF-IDF + Cosine Similarity:
    - Không cần dữ liệu hành vi người dùng (giải quyết Cold Start).
    - Giải thích được: "Gợi ý vì cùng tác giả / thể loại / chủ đề".
    - Tính toán offline một lần → query realtime O(1).
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from typing import List, Dict, Any


class ContentBasedRecommender:
    """
    Content-Based Filtering dựa trên TF-IDF của metadata sách.

    Vòng đời:
        recommender = ContentBasedRecommender()
        recommender.fit(df_products)          # Offline — gọi 1 lần khi startup
        results = recommender.get_similar_items(product_id, top_k=5)  # Online
    """

    def __init__(self):
        self._tfidf = TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),     # Unigram + Bigram: bắt cả "kinh dị" lẫn "sách kinh"
            min_df=1,               # Giữ lại từ xuất hiện ít nhất 1 lần (dataset nhỏ)
            max_df=0.95,            # Bỏ từ xuất hiện trong > 95% sách (stop-words thực tế)
            sublinear_tf=True,      # log(1 + tf) → giảm ảnh hưởng của từ lặp nhiều
            strip_accents="unicode",
        )
        self._similarity_matrix: np.ndarray | None = None
        self._product_ids: List[str] = []
        self._id_to_idx: Dict[str, int] = {}
        self._df: pd.DataFrame | None = None  # Lưu để enrich kết quả
        self._is_fitted: bool = False

    # ─── Feature Engineering ──────────────────────────────────────────────────

    @staticmethod
    def _build_combined_features(df: pd.DataFrame) -> pd.Series:
        """
        Gom các text fields thành một chuỗi duy nhất cho mỗi sách.

        Chiến lược weighting bằng repetition:
            - title × 3: Tên sách quan trọng nhất
            - author × 2: Tác giả là yếu tố gợi ý mạnh
            - categoryName × 2: Thể loại quyết định phong cách
            - desc × 1: Mô tả cung cấp ngữ nghĩa sâu hơn
            - tags × 2: Từ khóa được curate thủ công — chất lượng cao

        Args:
            df: DataFrame sản phẩm từ data_fetcher.fetch_products()

        Returns:
            pd.Series: Mỗi phần tử là chuỗi combined features của 1 sách.
        """

        def safe_str(val) -> str:
            """Chuyển bất kỳ giá trị nào thành string an toàn."""
            if val is None or (isinstance(val, float) and np.isnan(val)):
                return ""
            return str(val).strip()

        def repeat(text: str, n: int) -> str:
            """Lặp lại text n lần để tăng trọng số trong TF-IDF."""
            cleaned = text.strip()
            return (cleaned + " ") * n if cleaned else ""

        combined = df.apply(
            lambda row: (
                repeat(safe_str(row.get("title")), 3)
                + repeat(safe_str(row.get("author")), 2)
                + repeat(safe_str(row.get("categoryName")), 2)
                + repeat(safe_str(row.get("tags")), 2)
                + repeat(safe_str(row.get("desc")), 1)
                + repeat(safe_str(row.get("publisher")), 1)
                + repeat(safe_str(row.get("language")), 1)
                + repeat(safe_str(row.get("ageGroup")), 1)
            ).strip(),
            axis=1,
        )

        return combined

    # ─── Training ─────────────────────────────────────────────────────────────

    def fit(self, df_products: pd.DataFrame) -> "ContentBasedRecommender":
        """
        Huấn luyện model TF-IDF và tính toán Similarity Matrix.
        Phải gọi trước get_similar_items(). Thời gian: O(N²) với N = số sách.

        Args:
            df_products: DataFrame từ data_fetcher.fetch_products().
                         Cần có cột: _id, title, author, categoryName,
                                     desc, tags, publisher, language, ageGroup.

        Returns:
            self — để chaining: recommender.fit(df).get_similar_items(...)

        Raises:
            ValueError: Nếu df_products rỗng hoặc thiếu cột _id.
        """
        if df_products is None or df_products.empty:
            raise ValueError("[CBF] DataFrame rong. Kiem tra ket noi Node.js.")

        if "_id" not in df_products.columns:
            raise ValueError("[CBF] DataFrame thieu cot '_id'.")

        print(f"[CBF] Bat dau fit model voi {len(df_products)} san pham...")

        # Lưu DataFrame để enrich kết quả sau này
        self._df = df_products.reset_index(drop=True).copy()

        # Danh sách product_id theo thứ tự index trong matrix
        self._product_ids = self._df["_id"].astype(str).tolist()
        self._id_to_idx = {pid: idx for idx, pid in enumerate(self._product_ids)}

        # Bước 1: Feature engineering
        combined_features = self._build_combined_features(self._df)

        # Fallback nếu tất cả features đều rỗng
        if combined_features.str.strip().eq("").all():
            print("[CBF] WARN: Tat ca san pham co features rong. Dung placeholder.")
            combined_features = self._df["_id"].astype(str)

        # Bước 2: TF-IDF Vectorization → Ma trận (N, vocab_size)
        tfidf_matrix = self._tfidf.fit_transform(combined_features)
        vocab_size = tfidf_matrix.shape[1]
        print(f"[CBF] TF-IDF matrix: {len(df_products)} x {vocab_size} (vocab size)")

        # Bước 3: Cosine Similarity = linear_kernel(TF-IDF) vì TF-IDF đã L2-normalized
        # linear_kernel nhanh hơn cosine_similarity ~2x với sparse matrix
        self._similarity_matrix = linear_kernel(tfidf_matrix, tfidf_matrix)
        print(f"[CBF] Similarity matrix: {self._similarity_matrix.shape}")

        self._is_fitted = True
        print("[CBF] Fit hoan thanh. Model san sang.")
        return self

    # ─── Inference ────────────────────────────────────────────────────────────

    def get_similar_items(
        self, product_id: str, top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Tìm top-K sách tương đồng nhất với sách được chỉ định.

        Args:
            product_id: ObjectId của sách cần tìm gợi ý (string).
            top_k:      Số lượng kết quả trả về (mặc định 5, tối đa 20).

        Returns:
            List[dict] — mỗi phần tử gồm:
                {
                    "productId":    str,   # ObjectId
                    "title":        str,
                    "author":       str,
                    "categoryName": str,
                    "score":        float, # Cosine similarity [0.0, 1.0]
                    "rank":         int    # 1 = giống nhất
                }

        Raises:
            RuntimeError: Nếu model chưa được fit().
            KeyError:     Nếu product_id không tồn tại trong index.
        """
        if not self._is_fitted:
            raise RuntimeError(
                "[CBF] Model chua duoc fit. Goi fit(df_products) truoc."
            )

        if product_id not in self._id_to_idx:
            raise KeyError(
                f"[CBF] product_id '{product_id}' khong ton tai trong index "
                f"({len(self._product_ids)} san pham da duoc indexing)."
            )

        # Giới hạn top_k hợp lý
        top_k = min(max(top_k, 1), 20)

        # Lấy vector similarity của sách query với toàn bộ sách còn lại
        idx = self._id_to_idx[product_id]
        sim_scores = list(enumerate(self._similarity_matrix[idx]))

        # Sắp xếp giảm dần theo điểm, loại bỏ chính nó (score = 1.0 với chính nó)
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = [s for s in sim_scores if s[0] != idx]  # Bỏ chính item
        sim_scores = sim_scores[:top_k]

        # Enrich với metadata từ DataFrame
        results = []
        for rank, (item_idx, score) in enumerate(sim_scores, start=1):
            row = self._df.iloc[item_idx]
            results.append({
                "productId":    str(row.get("_id", "")),
                "title":        str(row.get("title", "")),
                "author":       str(row.get("author", "")),
                "categoryName": str(row.get("categoryName", "")),
                "score":        round(float(score), 4),
                "rank":         rank,
            })

        return results

    # ─── Utilities ────────────────────────────────────────────────────────────

    @property
    def is_fitted(self) -> bool:
        """Kiểm tra model đã sẵn sàng chưa — dùng trong health check."""
        return self._is_fitted

    @property
    def product_count(self) -> int:
        """Số sách đã được index."""
        return len(self._product_ids)

    def get_product_ids(self) -> List[str]:
        """Trả về danh sách tất cả product_id đã được index."""
        return self._product_ids.copy()
