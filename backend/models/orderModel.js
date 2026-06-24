import mongoose from "mongoose";

// ─── Enum trạng thái đơn hàng ────────────────────────────────────────────────
/**
 * Dùng constant thay vì "số ma thuật" (magic number) trong code.
 * Python Recommendation Service lọc: chỉ lấy đơn DELIVERED (4)
 * làm tín hiệu "purchase" cho Implicit Collaborative Filtering.
 */
export const ORDER_STATUS = Object.freeze({
  PENDING: 0,     // Chờ xác nhận
  CONFIRMED: 1,   // Đã xác nhận
  PREPARING: 2,   // Đang chuẩn bị
  DELIVERING: 3,  // Đang giao
  DELIVERED: 4,   // Giao thành công ← dùng làm implicit feedback
  CANCELLED: 5,   // Đã hủy          ← loại khỏi training data
});

// ─── Schema ───────────────────────────────────────────────────────────────────
const OrderSchema = mongoose.Schema(
  {
    // Thông tin người nhận (snapshot tại thời điểm đặt hàng)
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    /**
     * [FIX] userId: String → ObjectId
     * Bắt buộc phải nhất quán với reviewModel.js để Python service
     * có thể JOIN hai collection mà không bị type mismatch.
     * ⚠️ Chạy script `scripts/migrateOrderData.js` trước khi deploy thay đổi này.
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    products: [
      {
        /**
         * [FIX] productId: String → ObjectId
         * Dùng để JOIN với collection products khi Python service
         * truy vấn "user X đã mua những sản phẩm nào".
         */
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        // Snapshot tên & ảnh tại thời điểm mua (giá trị lịch sử)
        title: { type: String },
        img: { type: String },
        isFlashSale: { type: Boolean, default: false },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        price: { type: Number },
      },
    ],

    total: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      required: true,
      default: "COD",
    },

    shippingFee: {
      type: Number,
      default: 0,
    },

    totalWeight: {
      type: Number,
      default: 0,
    },

    /**
     * [FIX] Dùng enum rõ ràng thay vì comment giải thích số.
     * Sử dụng Object.values(ORDER_STATUS) → [0, 1, 2, 3, 4, 5]
     */
    status: {
      type: Number,
      default: ORDER_STATUS.PENDING,
      enum: Object.values(ORDER_STATUS),
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Compound index: Python service query "tất cả đơn hàng thành công của user X"
 * db.orders.find({ userId: <id>, status: 2 })
 */
OrderSchema.index({ userId: 1, status: 1 });

/**
 * Index: Python service query "sản phẩm Y đã được mua bởi những user nào"
 * (dùng trong Item-Based Collaborative Filtering)
 */
OrderSchema.index({ "products.productId": 1 });

const Order = mongoose.model("Order", OrderSchema);
export default Order;
