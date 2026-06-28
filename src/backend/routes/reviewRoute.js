import express from "express";
import {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
  replyReview,
  toggleHideReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public & User Routes
router.get("/:productId", getProductReviews);
router.post("/:productId", protect, createReview);

// ADMIN Routes
router.get("/", protect, admin, getAllReviewsAdmin); // Lấy tất cả
router.put("/:id/reply", protect, admin, replyReview); // Trả lời
router.put("/:id/hide", protect, admin, toggleHideReview); // Ẩn/Hiện
router.delete("/:id", protect, admin, deleteReview); // Xóa

export default router;
