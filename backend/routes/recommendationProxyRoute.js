/**
 * recommendationProxyRoute.js — Routes cho AI Proxy (Frontend ↔ Node.js ↔ Python)
 * ==================================================================================
 *
 * GET /api/v1/recommend/similar/:productId?top_k=6
 *   → Public: Sách tương đồng (Content-Based), hiển thị cuối trang chi tiết sản phẩm.
 *
 * GET /api/v1/recommend/for-you?top_k=6
 *   → Protected (JWT): Gợi ý cá nhân, hiển thị trang chủ cho user đã đăng nhập.
 */

import express from "express";
import {
  getSimilarProducts,
  getUserRecommendations,
} from "../controllers/recommendationProxyController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — không cần đăng nhập
router.get("/similar/:productId", getSimilarProducts);

// Protected — yêu cầu JWT cookie
router.get("/for-you", protect, getUserRecommendations);

export default router;
