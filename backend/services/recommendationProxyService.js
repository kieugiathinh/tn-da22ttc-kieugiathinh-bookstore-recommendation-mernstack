/**
 * recommendationProxyService.js — Service layer cho AI Proxy
 * ============================================================
 * Toàn bộ logic: gọi Python AI, query MongoDB, sort kết quả.
 * Controller không chứa bất kỳ DB hay HTTP call nào.
 */

import axios from "axios";
import Product from "../models/productModel.js";
import dotenv from "dotenv";

dotenv.config();

// ─── AI Service Client ────────────────────────────────────────────────────────

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000/api/v1";
const AI_TIMEOUT  = 8000; // 8 giây — đủ cho inference, không block UX

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: AI_TIMEOUT,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Query MongoDB để lấy full product details, sau đó sắp xếp lại
 * đúng thứ tự rank do AI trả về (MongoDB không đảm bảo thứ tự $in).
 *
 * @param {Array<{productId: string, rank: number, [extra]: any}>} aiItems
 * @returns {Promise<Array>} Products sorted by AI rank, enriched with AI metadata
 */
const enrichAndSort = async (aiItems) => {
  if (!aiItems || aiItems.length === 0) return [];

  const ids = aiItems.map((item) => item.productId);

  const products = await Product.find({ _id: { $in: ids } })
    .populate("category", "name")
    .lean();

  // Map _id → product object để O(1) lookup
  const productMap = {};
  products.forEach((p) => { productMap[p._id.toString()] = p; });

  // Sort theo rank AI + attach AI metadata (score, predictedRating...)
  return aiItems
    .map((aiItem) => {
      const product = productMap[aiItem.productId];
      if (!product) return null;
      return {
        ...product,
        _aiMeta: {
          rank:            aiItem.rank,
          score:           aiItem.score            ?? null,
          predictedRating: aiItem.predictedRating  ?? null,
        },
      };
    })
    .filter(Boolean); // Bỏ null (product đã xóa nhưng AI chưa retrain)
};

/**
 * Fallback: lấy sách bán chạy nhất khi Cold Start xảy ra.
 * @param {number} limit
 */
const getBestSellerFallback = async (limit = 6) => {
  return await Product.find({})
    .populate("category", "name")
    .sort({ sold: -1 })
    .limit(limit)
    .lean();
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Lấy sản phẩm tương đồng dựa trên Content-Based Filtering (TF-IDF).
 *
 * @param {string} productId - ObjectId của sản phẩm cần tìm gợi ý
 * @param {number} topK      - Số lượng kết quả (mặc định 6)
 * @returns {Promise<{products: Array, algorithm: string, source: string}>}
 */
const getSimilarProductsData = async (productId, topK = 6) => {
  // Gọi Python AI Service
  const aiRes = await aiClient.get(`/recommend/item/${productId}`, {
    params: { top_k: topK },
  });

  const aiItems = aiRes.data?.recommendations ?? [];

  const products = await enrichAndSort(aiItems);

  return {
    products,
    algorithm: "content-based-tfidf",
    source: "ai-service",
    count: products.length,
  };
};

/**
 * Lấy gợi ý cá nhân hóa cho user dựa trên Collaborative Filtering (Funk SVD).
 * Nếu Cold Start → fallback sang Best Sellers.
 *
 * @param {string} userId - ObjectId của user
 * @param {number} topK
 * @returns {Promise<{products: Array, algorithm: string, isColdStart: boolean}>}
 */
const getUserRecommendationsData = async (userId, topK = 6) => {
  // Gọi Python AI Service
  const aiRes = await aiClient.get(`/recommend/user/${userId}/collaborative`, {
    params: { top_k: topK },
  });

  const { recommendations = [], coldStart = false } = aiRes.data;

  // ── Cold Start Handling ───────────────────────────────────────────────────
  if (coldStart || recommendations.length === 0) {
    const fallback = await getBestSellerFallback(topK);
    return {
      products: fallback,
      algorithm: "bestseller-fallback",
      source: "mongodb",
      isColdStart: true,
      count: fallback.length,
    };
  }

  const products = await enrichAndSort(recommendations);

  return {
    products,
    algorithm: "collaborative-funk-svd",
    source: "ai-service",
    isColdStart: false,
    count: products.length,
  };
};

export {
  getSimilarProductsData,
  getUserRecommendationsData,
};
