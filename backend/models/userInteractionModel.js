import mongoose from "mongoose";

// ─── Enum & Weights (Export để dùng ở Python service và middleware) ────────────

/**
 * Các loại tương tác người dùng — Implicit Feedback signals.
 *
 * Thứ tự tăng dần theo mức độ "ý định mua" (purchase intent):
 *   view → search_click → add_to_cart → review → purchase
 */
export const INTERACTION_TYPE = Object.freeze({
  VIEW: "view",               // Xem trang chi tiết sản phẩm
  SEARCH_CLICK: "search_click", // Click vào sp từ kết quả search/gợi ý
  ADD_TO_CART: "add_to_cart", // Thêm vào giỏ hàng
  REVIEW: "review",           // Gửi đánh giá (viết review)
  PURCHASE: "purchase",       // Mua thành công (đơn DELIVERED)
});

/**
 * Trọng số tương tác — Python service dùng để tính Implicit Rating Score.
 *
 * Công thức:
 *   implicit_score(user, item) = Σ [ weight(type) × time_decay(createdAt) ]
 *
 * time_decay(t) = e^(-λ * days_since_interaction)
 * với λ ~ 0.01 (tương tác 70 ngày trước ≈ còn 50% giá trị)
 *
 * Export object này để Python service đọc qua API config endpoint
 * thay vì hardcode ở phía Python.
 */
export const INTERACTION_WEIGHT = Object.freeze({
  view: 1,
  search_click: 2,
  add_to_cart: 3,
  review: 4,
  purchase: 5,
});

// ─── Schema ───────────────────────────────────────────────────────────────────
const UserInteractionSchema = mongoose.Schema(
  {
    /**
     * User thực hiện hành vi.
     * Bắt buộc — chỉ track user đã đăng nhập để đảm bảo dữ liệu
     * có thể JOIN với User-Item matrix.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Sản phẩm được tương tác.
     */
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    /**
     * Loại tương tác — phải thuộc Object.values(INTERACTION_TYPE).
     */
    interactionType: {
      type: String,
      enum: Object.values(INTERACTION_TYPE),
      required: true,
    },

    /**
     * Thời gian xem trang (giây) — chỉ có ý nghĩa với type "view".
     * Xem > 30s được tính khác với xem < 3s (scroll qua).
     * Frontend tính bằng cách: durationSeconds = Date.now() - pageLoadTime
     * và gửi kèm khi user rời trang (beforeunload event).
     */
    durationSeconds: {
      type: Number,
      default: null,
      min: 0,
    },

    /**
     * Nguồn traffic — dùng để phân tích funnel và A/B test,
     * không dùng trực tiếp trong CF model.
     * "homepage" | "search" | "category" | "recommendation" | "direct" | "chatbot"
     */
    source: {
      type: String,
      enum: ["homepage", "search", "category", "recommendation", "direct", "chatbot", "checkout", "order"],
      default: "direct",
    },
  },
  {
    timestamps: true, // `createdAt` chính là timestamp của hành vi — rất quan trọng
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Compound index #1: Truy vấn "user X đã tương tác gì với product Y?"
 * Python dùng để tổng hợp implicit score theo (user, item, type).
 */
UserInteractionSchema.index({ userId: 1, productId: 1, interactionType: 1 });

/**
 * Compound index #2: Xây dựng User Profile
 * "Tất cả hành vi gần đây của user X, sắp xếp theo thời gian giảm dần"
 * → dùng để tính User Embedding trong session-based recommendation.
 */
UserInteractionSchema.index({ userId: 1, createdAt: -1 });

/**
 * Compound index #3: Incremental training
 * Python service fetch "tất cả interactions mới kể từ lần training cuối"
 * → tránh retrain toàn bộ từ đầu mỗi lần.
 */
UserInteractionSchema.index({ createdAt: -1 });

const UserInteraction = mongoose.model("UserInteraction", UserInteractionSchema);
export default UserInteraction;
