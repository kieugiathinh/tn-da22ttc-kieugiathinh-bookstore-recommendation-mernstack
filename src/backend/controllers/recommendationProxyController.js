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
import Category from "../models/categoryModel.js";

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
  const topK = Math.min(parseInt(req.query.top_k, 10) || 6, 30);

  try {
    const result = await getSimilarProductsData(productId, topK);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (aiError) {
    // AI Service down hoặc productId chưa được index → dùng fallback
    const status = aiError.response?.status;
    if (status === 404) {
      console.log(`[ProxyController] Product ${productId} chưa có trong AI dataset. Chuyển sang fallback.`);
    } else {
      console.warn(`[ProxyController] AI unavailable (${aiError.code ?? aiError.message}). Fallback to related products.`);
    }

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
  const topK = Math.min(parseInt(req.query.top_k, 10) || 6, 20);

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
    const status = aiError.response?.status;
    const errorCode = aiError.code ?? status ?? "UNKNOWN";
    if (status === 404) {
      console.log(`[ProxyController] User ${userId} chưa có dữ liệu AI. Chuyển sang fallback.`);
    } else {
      console.warn(`[ProxyController] AI unavailable for user ${userId} (${errorCode}). Fallback to best sellers.`);
    }

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
 * GET /api/v1/recommend/hybrid?top_k=20
 * 
 * Trả về gợi ý Lai (Hybrid) trộn từ CF, Content-Based và Popularity.
 */
export const getHybridRecommendations = asyncHandler(async (req, res) => {
  // Lấy userId nếu có (có thể không đăng nhập vẫn trả về đc Popularity)
  const userId = req.user?._id?.toString() ?? req.user?.id?.toString();
  const topK = Math.min(parseInt(req.query.top_k, 10) || 20, 50);

  try {
    const { getHybridRecommendationsData } = await import("../services/recommendationProxyService.js");
    const result = await getHybridRecommendationsData(userId, topK);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 404) {
      console.log(`[ProxyController] Hybrid AI data not found. Chuyển sang fallback.`);
    } else {
      console.warn(`[ProxyController] Hybrid error (${error.code ?? error.message}). Fallback to best sellers.`);
    }
    const fallback = await getBestSellerFallback(topK);
    res.status(200).json({
      success: true,
      products: fallback,
      algorithm: "bestseller-fallback",
      source: "mongodb",
      isFallback: true,
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

/**
 * GET /api/v1/recommend/popular?limit=10&days=30
 * 
 * [Public] Lấy danh sách sách phổ biến (Popularity-based)
 */
export const getPopularProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const period = req.query.period || "month"; // week, month, year

  try {
    const { getPopularBooks } = await import("../services/recommendationService.js");
    const products = await getPopularBooks(limit, period);

    res.status(200).json({
      success: true,
      products,
      algorithm: "popularity-weighted",
      source: "mongodb",
      count: products.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy sách phổ biến.",
      error: error.message,
    });
  }
});

// ─── Debounce map: userId → lastRefreshTime ───────────────────────────────────
// Tránh spam Python AI khi user click nhiều sản phẩm liên tiếp trong 1 phiên.
const _userRefreshMap = new Map();
const REFRESH_COOLDOWN_MS = 0; // Đặt thành 0 để demo (thực tế nên để 60 * 1000)

/**
 * POST /api/v1/recommend/refresh
 *
 * [User — đã đăng nhập] Trigger retrain CF model để cập nhật gợi ý cá nhân.
 * Được gọi tự động từ Frontend sau khi user xem chi tiết sản phẩm.
 *
 * Debounce: mỗi user chỉ trigger tối đa 1 lần / 60 giây.
 * Nếu Python đang retrain → trả về status BUSY (không block, không lỗi).
 */
export const triggerRetrainForUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id?.toString();

  // Debounce: kiểm tra xem user này có vừa trigger không
  const lastRefresh = _userRefreshMap.get(userId) ?? 0;
  const now = Date.now();

  if (now - lastRefresh < REFRESH_COOLDOWN_MS) {
    // Còn trong cooldown → không cần retrain lại, trả về OK (gợi ý đã mới đủ)
    return res.status(200).json({
      success: true,
      status: "SKIPPED",
      message: "Gợi ý đã được làm mới gần đây. Không cần retrain thêm.",
      cooldownRemainingSeconds: Math.ceil(
        (REFRESH_COOLDOWN_MS - (now - lastRefresh)) / 1000
      ),
    });
  }

  // Cập nhật timestamp cho user này
  _userRefreshMap.set(userId, now);

  try {
    const result = await triggerCFRetrain();
    res.status(200).json({
      success: true,
      triggeredBy: "user-view",
      ...result,
    });
  } catch (aiError) {
    res.status(200).json({
      success: false,
      status: "AI_UNAVAILABLE",
      message: "AI Service tạm thời không phản hồi. Gợi ý sẽ dùng dữ liệu cũ.",
    });
  }
});

/**
 * GET /api/v1/recommend/health
 * 
 * [Admin only] Lấy trạng thái Health của AI service
 */
export const getAIHealth = asyncHandler(async (req, res) => {
  try {
    const { getAIHealthStatus } = await import("../services/recommendationProxyService.js");
    const healthData = await getAIHealthStatus();
    res.status(200).json({
      success: true,
      ...healthData
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "degraded",
      node_connected: false,
      message: "Node.js không thể kết nối tới AI Service (Python đang offline)",
      error: error.message
    });
  }
});

/**
 * GET /api/v1/recommend/simulator/:userId
 * 
 * [Admin only] Mô phỏng kết quả gợi ý cá nhân hóa cho một user bất kỳ
 */
export const simulateUserRecommendations = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const topK = parseInt(req.query.top_k, 10) || 10;

  try {
    const { getUserRecommendationsSimulator } = await import("../services/recommendationProxyService.js");
    const result = await getUserRecommendationsSimulator(userId, topK);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Lỗi khi mô phỏng gợi ý từ AI Service.",
      error: error.message
    });
  }
});

