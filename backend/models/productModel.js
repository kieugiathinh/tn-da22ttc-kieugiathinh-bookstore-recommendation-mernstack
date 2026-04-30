import mongoose from "mongoose";

const ProductSchema = mongoose.Schema(
  {
    // 1. Tên sách (Title)
    title: {
      type: String,
      required: true, // Bắt buộc
      unique: true, // Tên sách không được trùng
      trim: true,
    },

    // 2. Tác giả (Author) - MỚI
    author: {
      type: String,
      required: true,
      trim: true,
    },

    // 3. Nhà xuất bản (Publisher) - MỚI (Thay thế cho brand)
    publisher: {
      type: String,
      required: true,
      trim: true,
    },

    // 4. Thể loại (Category) - Liên kết bảng Category
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // 5. Mô tả sách (Description)
    desc: {
      type: String,
      required: true,
    },

    // 6. Hình ảnh (ImageURL)
    img: {
      type: String,
      required: true,
    },

    // 7. Giá gốc (OriginalPrice)
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // 8. Giá khuyến mãi (DiscountedPrice)
    discountedPrice: {
      type: Number,
      default: 0, // Nếu không giảm giá thì để 0 hoặc bằng giá gốc
    },

    // 9. Số lượng tồn kho (StockQuantity) - SỬA TỪ BOOLEAN SANG NUMBER
    countInStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    //đã bán
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
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ title: "text", author: "text" });

const Product = mongoose.model("Product", ProductSchema);
export default Product;
