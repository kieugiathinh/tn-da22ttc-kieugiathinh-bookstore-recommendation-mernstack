import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import asyncHandler from "express-async-handler";
import Order from "../models/order.model.js";

// @desc    Tạo đánh giá mới
// @route   POST /api/v1/reviews/:productId
// @access  Private (Cần đăng nhập)
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, orderId } = req.body; // <--- Nhận thêm orderId từ Frontend
  const productId = req.params.productId;
  const userId = req.user._id;

  // 1. Kiểm tra đơn hàng hợp lệ (Phải chứa sản phẩm này và status là Hoàn thành)
  const order = await Order.findOne({
    _id: orderId,
    userId: userId,
    "products.productId": productId,
    // status: ... (Kiểm tra status đã giao hay chưa tùy bạn)
  });

  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng hợp lệ để đánh giá!");
  }

  // 2. Kiểm tra đã đánh giá CHO ĐƠN HÀNG NÀY chưa
  const alreadyReviewed = await Review.findOne({
    user: userId,
    product: productId,
    order: orderId, // <--- Kiểm tra theo Order ID
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error("Bạn đã đánh giá sản phẩm trong đơn hàng này rồi!");
  }

  // 3. Tạo Review mới (Gắn orderId vào)
  const review = new Review({
    user: userId,
    product: productId,
    order: orderId, // <--- Lưu orderId
    rating: Number(rating),
    comment,
  });

  await review.save();

  // 4. Tính toán lại rating cho Product (Giữ nguyên)
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const averageRating =
    reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

  const product = await Product.findById(productId);
  product.numReviews = numReviews;
  product.rating = averageRating;
  await product.save();

  res.status(201).json({ message: "Đánh giá thành công!" });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    product: req.params.productId,
    isHidden: false, // <--- CHỈ LẤY REVIEW KHÔNG BỊ ẨN
  })
    .populate("user", "fullname avatar")
    .populate("order", "createdAt") // Lấy thêm ngày mua hàng nếu cần
    .sort({ createdAt: -1 });

  // Trả về cả phần reply của admin luôn (Model đã có field reply rồi)
  res.status(200).json(reviews);
});

// 2. ADMIN: LẤY TẤT CẢ REVIEW (Để quản lý)
const getAllReviewsAdmin = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate("user", "fullname email") // Lấy thông tin người review
    .populate("product", "title img") // Lấy thông tin sách
    .sort({ createdAt: -1 });
  res.status(200).json(reviews);
});

// 3. ADMIN: TRẢ LỜI REVIEW
const replyReview = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  const review = await Review.findById(req.params.id);

  if (review) {
    review.reply = reply;
    await review.save();
    res.status(200).json({ message: "Đã trả lời đánh giá" });
  } else {
    res.status(404);
    throw new Error("Review không tồn tại");
  }
});

// 4. ADMIN: ẨN/HIỆN REVIEW
const toggleHideReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (review) {
    review.isHidden = !review.isHidden; // Đảo ngược trạng thái
    await review.save();

    // *Lưu ý: Khi ẩn review, bạn có thể cân nhắc việc có trừ lại điểm rating của Product hay không.
    // Tuy nhiên, thường thì Shopee/Tiki vẫn tính điểm sao đó, chỉ ẩn nội dung comment nếu vi phạm thôi.

    res.status(200).json({ message: "Đã cập nhật trạng thái hiển thị" });
  } else {
    res.status(404);
    throw new Error("Review không tồn tại");
  }
});

// 5. ADMIN: XÓA REVIEW (Chỉ dùng cho spam nặng)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (review) {
    await review.deleteOne();
    // Nâng cao: Cần tính toán lại Rating Product sau khi xóa (như lúc thêm mới)
    res.status(200).json({ message: "Đã xóa review" });
  } else {
    res.status(404);
    throw new Error("Review không tồn tại");
  }
});

export {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
  replyReview,
  toggleHideReview,
  deleteReview,
};
