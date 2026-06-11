/**
 * recommendationProxyController.js — Controller nhịp cầu Node.js ↔ Python AI
 * =============================================================================
 * Chức năng: Nhận HTTP request từ Frontend React, delegate sang Python AI,
 * enrichment từ MongoDB, rồi trả JSON chuẩn cho client.
 *
 * Lưu ý thiết kế:
 *   - Khi AI Service unavailable (503/ECONNREFUSED), tự động fallback
 *     sang MongoDB query thông thường — không để Frontend bị trắng trang.
 *   - userId lấy từ req.user (JWT middleware) thay vì params để bảo mật.
 */

import asyncHandler from "express-async-handler";
import {
  getSimilarProductsData,
  getUserRecommendationsData,
  triggerCFRetrain,
} from "../services/recommendationProxyService.js";
import Product from "../models/productModel.js";

// ─── Helper: Fallback khi AI Service chết ────────────────────────────────────

const getRelatedFallback = async (productId, limit = 6) => {
  // Lấy category của sản phẩm hiện tại rồi query sản phẩm cùng category
  const current = await Product.findById(productId).lean();
  if (!current) return [];

  return await Product.find({
    category: current.category,
    _id: { $ne: current._id },
  })
    .populate("category", "name")
    .sort({ sold: -1 })
    .limit(limit)
    .lean();
};

const getBestSellerFallback = async (limit = 6) => {
  return await Product.find({})
    .populate("category", "name")
    .sort({ sold: -1 })
    .limit(limit)
    .lean();
};

// ─── Controller Functions ─────────────────────────────────────────────────────

/**
 * GET /api/v1/recommend/similar/:productId?top_k=6
 *
 * Trả về danh sách sách tương đồng (Content-Based Filtering).
 * Fallback: sách cùng category, sort by sold — nếu AI không phản hồi.
 */
export const getSimilarProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const topK = Math.min(parseInt(req.query.top_k, 10) || 6, 12);

  try {
    const result = await getSimilarProductsData(productId, topK);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (aiError) {
    // AI Service down hoặc productId chưa được index → dùng fallback
    console.warn(`[ProxyController] AI unavailable (${aiError.code ?? aiError.message}). Fallback to related products.`);

    const fallback = await getRelatedFallback(productId, topK);
    res.status(200).json({
      success: true,
      products: fallback,
      algorithm: "category-fallback",
      source: "mongodb",
      isFallback: true,
      count: fallback.length,
    });
  }
});

/**
 * GET /api/v1/recommend/for-you?top_k=6
 *
 * Trả về gợi ý cá nhân hóa cho user đang đăng nhập (Collaborative Filtering).
 * - Yêu cầu: req.user từ authMiddleware (JWT).
 * - Cold Start: AI trả về [] → fallback Best Sellers.
 * - AI down: fallback Best Sellers.
 */
export const getUserRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user?._id?.toString() ?? req.user?.id?.toString();
  const topK = Math.min(parseInt(req.query.top_k, 10) || 6, 12);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Vui lòng đăng nhập để xem gợi ý cá nhân hóa.",
    });
  }

  try {
    const result = await getUserRecommendationsData(userId, topK);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (aiError) {
    console.warn(`[ProxyController] AI unavailable for user ${userId}. Fallback to best sellers.`);

    const fallback = await getBestSellerFallback(topK);
    res.status(200).json({
      success: true,
      products: fallback,
      algorithm: "bestseller-fallback",
      source: "mongodb",
      isFallback: true,
      isColdStart: true,
      count: fallback.length,
    });
  }
});

/**
 * POST /api/v1/recommend/retrain
 *
 * [Admin only] Trigger retrain CF model ngay lập tức trên Python AI Service.
 * Dùng sau khi có nhiều review mới hoặc đơn hàng mới.
 */
export const triggerRetrain = asyncHandler(async (req, res) => {
  try {
    const result = await triggerCFRetrain();
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (aiError) {
    res.status(503).json({
      success: false,
      message: "Không thể kết nối AI Service để trigger retrain.",
      error: aiError.message,
    });
  }
});
