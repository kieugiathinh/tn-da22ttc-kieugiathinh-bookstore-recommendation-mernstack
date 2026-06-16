import asyncHandler from "express-async-handler";
import {
  getProductsData,
  getRatingsData,
  getInteractionsData,
  getPurchasesData,
} from "../services/recommendationService.js";

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Chuẩn hóa response trả về cho Python Service.
 * Field `count` giúp Python kiểm tra sanity (data có đủ để train không)
 * trước khi đưa vào pipeline — tránh train với dataset rỗng.
 */
const sendAIResponse = (res, data, meta = {}) => {
  res.status(200).json({
    success: true,
    count: Array.isArray(data) ? data.length : null,
    ...meta,
    data,
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/v1/recommend/data/products
 * Trả về Product corpus cho Content-Based Filtering (TF-IDF / Embedding).
 */
export const getProductsForAI = asyncHandler(async (req, res) => {
  const data = await getProductsData();

  sendAIResponse(res, data, {
    description: "Product corpus for Content-Based Filtering (TF-IDF / embedding)",
  });
});

/**
 * GET /api/v1/recommend/data/ratings
 * Trả về ma trận Explicit Rating (User-Item) cho Collaborative Filtering.
 */
export const getRatingsForAI = asyncHandler(async (req, res) => {
  const data = await getRatingsData();

  sendAIResponse(res, data, {
    description: "Explicit User-Item ratings matrix (1–5 stars)",
    ratingRange: { min: 1, max: 5 },
  });
});

/**
 * GET /api/v1/recommend/data/interactions?days=30&type=view,add_to_cart
 * Trả về Implicit Feedback signals trong N ngày gần nhất.
 *
 * Query params:
 *   - days (number, default: 30, max: 365): khoảng thời gian lookback
 *   - type (string, comma-separated): lọc loại interaction
 *     Ví dụ: ?type=view,add_to_cart,purchase
 */
export const getInteractionsForAI = asyncHandler(async (req, res) => {
  // Parse & validate tại Controller — Service không cần biết về HTTP
  const days = parseInt(req.query.days, 10) || 30;
  const typeFilter = req.query.type
    ? req.query.type.split(",").map((t) => t.trim())
    : null;

  const data = await getInteractionsData(days, typeFilter);

  // Tính lại clampedDays để trả về filter context chính xác
  const clampedDays = Math.min(Math.max(days, 1), 365);
  const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);

  sendAIResponse(res, data, {
    description: "Implicit User-Item interaction signals",
    filter: {
      days: clampedDays,
      since: since.toISOString(),
      typeFilter: typeFilter ?? "all",
    },
  });
});

/**
 * GET /api/v1/recommend/data/purchases
 * Trả về lịch sử mua hàng (đơn DELIVERED) dạng phẳng — implicit signal mạnh nhất.
 */
export const getPurchasesForAI = asyncHandler(async (req, res) => {
  const data = await getPurchasesData();

  sendAIResponse(res, data, {
    description: "Purchase history (DELIVERED orders only) — strongest implicit signal",
  });
});
