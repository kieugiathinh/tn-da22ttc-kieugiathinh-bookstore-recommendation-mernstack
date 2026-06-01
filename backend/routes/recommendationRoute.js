import express from "express";
import {
  getProductsForAI,
  getRatingsForAI,
  getInteractionsForAI,
  getPurchasesForAI,
} from "../controllers/recommendationController.js";
import verifyApiKey from "../middleware/verifyApiKey.js";

const router = express.Router();

/**
 * Tất cả routes trong file này đều yêu cầu header: x-api-key: <AI_SERVICE_API_KEY>
 * Áp dụng verifyApiKey một lần cho toàn bộ router.
 */
router.use(verifyApiKey);

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/recommend/data/products
// Trả về: Product corpus với đầy đủ text features cho Content-Based Filtering.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/products", getProductsForAI);

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/recommend/data/ratings
// Trả về: Ma trận Explicit Rating (user, product, rating) cho Collaborative Filtering.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/ratings", getRatingsForAI);

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/recommend/data/interactions?days=30&type=view,add_to_cart
// Trả về: Implicit Feedback log (view, search_click, add_to_cart...).
// Query params:
//   - days (default: 30, max: 365): lấy dữ liệu trong N ngày gần nhất
//   - type (comma-separated): lọc theo loại interaction
// ──────────────────────────────────────────────────────────────────────────────
router.get("/interactions", getInteractionsForAI);

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/v1/recommend/data/purchases
// Trả về: Lịch sử mua hàng (đơn DELIVERED) dạng phẳng — implicit signal mạnh nhất.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/purchases", getPurchasesForAI);

export default router;
