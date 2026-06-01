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

Ưu điểm của implementation này:
    - Không cần thư viện compile (không yêu cầu Visual C++).
    - Kiểm soát hoàn toàn: dễ tùy chỉnh, dễ debug, dễ giải thích.
    - Hiệu năng đủ tốt cho dataset vừa (<10k ratings) với numpy vectorization.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple


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

    Vòng đời:
        cf = CollaborativeRecommender()
        cf.fit(df_ratings)
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

    # ─── Training ─────────────────────────────────────────────────────────────

    def fit(self, df_ratings: pd.DataFrame) -> "CollaborativeRecommender":
        """
        Huấn luyện Funk SVD trên ma trận User-Item ratings.

        Args:
            df_ratings: DataFrame với cột userId, productId, rating.

        Returns:
            self

        Raises:
            ValueError: Nếu data không hợp lệ.
        """
        if df_ratings is None or df_ratings.empty:
            raise ValueError("[CF] DataFrame ratings rong.")

        required = {"userId", "productId", "rating"}
        if not required.issubset(df_ratings.columns):
            raise ValueError(f"[CF] Thieu cot: {required - set(df_ratings.columns)}")

        if len(df_ratings) < 5:
            raise ValueError(f"[CF] Can it nhat 5 ratings de train (hien co {len(df_ratings)}).")

        print(f"[CF] Bat dau fit SVD model voi {len(df_ratings)} ratings...")
        print(f"[CF]   Unique users : {df_ratings['userId'].nunique()}")
        print(f"[CF]   Unique items : {df_ratings['productId'].nunique()}")

        self._df_ratings = df_ratings.copy()

        # Build encoders: string ID → int index
        unique_users = sorted(df_ratings["userId"].astype(str).unique())
        unique_items = sorted(df_ratings["productId"].astype(str).unique())

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
            for _, row in df_ratings.iterrows()
        ]

        mu = float(df_ratings["rating"].mean())

        # Train SVD
        self._svd.fit(
            ratings=ratings_list,
            n_users=len(unique_users),
            n_items=len(unique_items),
            mu=mu,
        )

        self._is_fitted = True
        print("[CF] SVD fit hoan thanh. Model san sang.")
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

        # Sản phẩm user đã rate → loại trừ
        rated_items = set(
            self._df_ratings[self._df_ratings["userId"] == user_id]["productId"]
            .astype(str)
            .tolist()
        )

        # Predict cho unrated items (chỉ items có trong training data)
        unrated_known = [
            pid for pid in all_product_ids
            if pid not in rated_items and pid in self._item_encoder
        ]

        if not unrated_known:
            return []

        # Vectorized prediction: P[u] @ Q[items].T + biases
        item_indices = [self._item_encoder[pid] for pid in unrated_known]
        Q_subset = self._svd.Q[item_indices]                         # (n_unrated, n_factors)
        scores = self._svd.mu + self._svd.bu[u_idx] + self._svd.bi[item_indices] + Q_subset @ self._svd.P[u_idx]
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

    def is_known_user(self, user_id: str) -> bool:
        return str(user_id) in self._known_users
