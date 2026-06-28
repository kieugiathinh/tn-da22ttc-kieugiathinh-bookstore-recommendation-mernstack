import mongoose from "mongoose";

// 1. Schema con (Tương ứng với bảng FlashSaleItems trong ERD)
const flashSaleItemSchema = mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Tham chiếu tới bảng Book/Product của bạn
      required: true,
    },
    discountPrice: {
      type: Number,
      required: true, // Giá sau khi giảm
    },
    quantityLimit: {
      type: Number,
      default: 10, // Số lượng tối đa bán ra trong đợt sale này
    },
    soldCount: {
      type: Number,
      default: 0, // Số lượng đã bán được
    },
  },
  { _id: false }
); // _id: false vì ta không cần quản lý ID riêng cho sub-document này quá chặt chẽ

// 2. Schema cha (Tương ứng với bảng FlashSales)
const flashSaleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // VD: "Sale 12.12", "Xả kho cuối năm"
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Trạng thái bật/tắt thủ công
    },
    // Đây là chỗ giải quyết mối quan hệ N-N
    products: [flashSaleItemSchema],
  },
  {
    timestamps: true,
  }
);

// Middleware kiểm tra logic thời gian
flashSaleSchema.pre("save", function (next) {
  if (this.startTime >= this.endTime) {
    next(new Error("Thời gian kết thúc phải sau thời gian bắt đầu"));
  }
  next();
});

const FlashSale = mongoose.model("FlashSale", flashSaleSchema);
export default FlashSale;
