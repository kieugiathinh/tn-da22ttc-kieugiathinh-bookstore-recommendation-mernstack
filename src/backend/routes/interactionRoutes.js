import express from "express";
import { getInteractions, trackUserInteraction, deleteInteraction, getCategoryAnalytics } from "../controllers/interactionController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Lấy thống kê
router.get("/analytics/categories", protect, admin, getCategoryAnalytics);

// Lấy danh sách hành vi (bắt buộc Admin)
router.get("/", protect, admin, getInteractions);

// Gửi hành vi người dùng (Yêu cầu đăng nhập)
router.post("/track", protect, trackUserInteraction);

// Xóa hành vi (bắt buộc Admin)
router.delete("/:id", protect, admin, deleteInteraction);

export default router;
