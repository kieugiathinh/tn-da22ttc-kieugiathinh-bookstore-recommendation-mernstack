import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", // Người đánh giá
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product", // Đánh giá cho sách nào
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order", // Liên kết review với đơn hàng cụ thể
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    reply: {
      type: String,
      default: "",
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Mới: Một User, với 1 Product, trong 1 Order chỉ được đánh giá 1 lần
reviewSchema.index({ product: 1, user: 1, order: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
