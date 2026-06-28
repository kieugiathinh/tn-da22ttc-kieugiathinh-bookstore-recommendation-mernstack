import mongoose from "mongoose";

const ProductSchema = mongoose.Schema(
  {
    // ──────────────────────────────────────────────
    //  TRƯỜNG GỐC (giữ nguyên, không thay đổi logic)
    // ──────────────────────────────────────────────

    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    publisher: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    desc: {
      type: String,
      required: true,
    },

    img: {
      type: String,
      required: true,
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountedPrice: {
      type: Number,
      default: 0,
    },

    countInStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    sold: {
      type: Number,
      default: 0,
    },

    rating: {
      type: Number,
      required: true,
      default: 0,
    },

    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },

    weight: {
      type: Number,
      default: 300,
      min: 0,
    },

    // ──────────────────────────────────────────────
    //  TRƯỜNG MỚI — PHỤC VỤ RECOMMENDATION SYSTEM
    // ──────────────────────────────────────────────

    /**
     * Tags / Từ khóa nội dung
     * Dùng để xây dựng TF-IDF / BM25 vector cho Content-Based Filtering.
     * Ví dụ: ["trinh thám", "huyền bí", "bestseller 2024", "gia đình"]
     * Admin hoặc hệ thống AI có thể tự động gán khi tạo/sửa sản phẩm.
     */
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    /**
     * Ngôn ngữ của sách
     * Quan trọng để tránh gợi ý sách Nhật cho người dùng đọc tiếng Việt.
     * "vi" | "en" | "ja" | "zh" | "fr" | "other"
     */
    language: {
      type: String,
      enum: ["vi", "en", "ja", "zh", "fr", "other"],
      default: "vi",
      index: true,
    },

    /**
     * Năm xuất bản
     * Feature temporal — sách mới thường được ưu tiên hơn.
     * Python service dùng để tính "freshness score" trong re-ranking.
     */
    publishedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear() + 2,
      default: null,
    },

    /**
     * Số trang
     * Dùng phân loại sách ngắn/dài — giúp gợi ý đúng với thói quen đọc.
     * (Ví dụ: user hay mua sách < 200 trang → ưu tiên gợi ý sách ngắn)
     */
    pageCount: {
      type: Number,
      min: 1,
      default: null,
    },

    /**
     * Nhóm độ tuổi mục tiêu
     * Rất quan trọng để không gợi ý sách người lớn cho trẻ em.
     * "children" | "teen" | "adult" | "all"
     */
    ageGroup: {
      type: String,
      enum: ["children", "teen", "adult", "all"],
      default: "all",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Text index mở rộng — tìm kiếm full-text và hỗ trợ Content-Based vector.
 * Python service dùng để tokenize và build TF-IDF corpus.
 */
ProductSchema.index({
  title: "text",
  author: "text",
  desc: "text",
  tags: "text",
});

const Product = mongoose.model("Product", ProductSchema);
export default Product;
