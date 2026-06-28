import asyncHandler from "express-async-handler";
import * as reviewService from "../services/reviewService.js";

// @desc    Tạo đánh giá mới
// @route   POST /api/v1/reviews/:productId
// @access  Private (Cần đăng nhập)
const createReview = asyncHandler(async (req, res) => {
  await reviewService.createReview(req.user._id, req.params.productId, req.body);
  res.status(201).json({ message: "Đánh giá thành công!" });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getProductReviews(req.params.productId);
  res.status(200).json(reviews);
});

// 2. ADMIN: LẤY TẤT CẢ REVIEW (Để quản lý)
const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await reviewService.getAllReviewsAdmin();
  res.status(200).json(reviews);
});

// 3. ADMIN: TRẢ LỜI REVIEW
const replyReview = asyncHandler(async (req, res) => {
  await reviewService.replyReview(req.params.id, req.body.reply);
  res.status(200).json({ message: "Đã trả lời đánh giá" });
});

// 4. ADMIN: ẨN/HIỆN REVIEW
const toggleHideReview = asyncHandler(async (req, res) => {
  await reviewService.toggleHideReview(req.params.id);
  res.status(200).json({ message: "Đã cập nhật trạng thái hiển thị" });
});

// 5. ADMIN: XÓA REVIEW (Chỉ dùng cho spam nặng)
const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id);
  res.status(200).json({ message: "Đã xóa review" });
});

export {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
  replyReview,
  toggleHideReview,
  deleteReview,
};
