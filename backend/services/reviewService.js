import Review from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";

const createReview = async (userId, productId, data) => {
  const { rating, comment, orderId } = data;

  const order = await Order.findOne({
    _id: orderId,
    userId: userId,
    "products.productId": productId,
  });

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng hợp lệ để đánh giá!");
  }

  const alreadyReviewed = await Review.findOne({
    user: userId,
    product: productId,
    order: orderId,
  });

  if (alreadyReviewed) {
    throw new Error("Bạn đã đánh giá sản phẩm trong đơn hàng này rồi!");
  }

  const review = new Review({
    user: userId,
    product: productId,
    order: orderId,
    rating: Number(rating),
    comment,
  });

  await review.save();

  const reviews = await Review.find({ product: productId }).lean();
  const numReviews = reviews.length;
  const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

  await Product.findByIdAndUpdate(productId, { numReviews, rating: averageRating });

  return review;
};

const getProductReviews = async (productId) => {
  return await Review.find({
    product: productId,
    isHidden: false,
  })
    .populate("user", "fullname avatar")
    .populate("order", "createdAt")
    .sort({ createdAt: -1 })
    .lean();
};

const getAllReviewsAdmin = async () => {
  return await Review.find()
    .populate("user", "fullname email")
    .populate("product", "title img")
    .sort({ createdAt: -1 })
    .lean();
};

const replyReview = async (id, replyText) => {
  const review = await Review.findById(id);
  if (!review) throw new Error("Review không tồn tại");
  review.reply = replyText;
  return await review.save();
};

const toggleHideReview = async (id) => {
  const review = await Review.findById(id);
  if (!review) throw new Error("Review không tồn tại");
  review.isHidden = !review.isHidden;
  return await review.save();
};

const deleteReview = async (id) => {
  const review = await Review.findById(id);
  if (!review) throw new Error("Review không tồn tại");
  return await review.deleteOne();
};

export {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
  replyReview,
  toggleHideReview,
  deleteReview,
};
