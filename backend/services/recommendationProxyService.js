/**
 * recommendationProxyService.js — Service layer cho AI Proxy
 * ============================================================
 * Toàn bộ logic: gọi Python AI, query MongoDB, sort kết quả.
 * Controller không chứa bất kỳ DB hay HTTP call nào.
 */

import axios from "axios";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import dotenv from "dotenv";

dotenv.config();

// ─── AI Service Client ────────────────────────────────────────────────────────

const AI_BASE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000/api/v1";
const AI_TIMEOUT = 8000; // 8 giây — đủ cho inference, không block UX

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
          rank: aiItem.rank,
          score: aiItem.score ?? null,
          predictedRating: aiItem.predictedRating ?? null,
        },
      };
    })
    .filter(Boolean); // Bỏ null (product đã xóa nhưng AI chưa retrain)
};

/**
 * Fallback: lấy sách phổ biến nhất (Popularity-based) khi Cold Start xảy ra.
 * @param {number} limit
 */
const getBestSellerFallback = async (limit = 6) => {
  const { getPopularBooks } = await import("./recommendationService.js");
  return await getPopularBooks(limit);
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

  // ── Cold Start Handling ──────────────────────────────────────────
  // Cold Start thực sự: AI không biết user này (chưa có trong training data)
  if (coldStart) {
    const fallback = await getBestSellerFallback(topK);
    return {
      products: fallback,
      algorithm: "bestseller-fallback",
      source: "mongodb",
      isColdStart: true,
      count: fallback.length,
    };
  }

  // AI có recommendations → enrich từ MongoDB
  if (recommendations.length > 0) {
    const products = await enrichAndSort(recommendations);

    // Nếu enrich trả về rỗng (sản phẩm bị xóa khỏi DB nhưng AI chưa retrain)
    // → fallback Best Sellers thay vì trả trang rỗng
    if (products.length === 0) {
      const fallback = await getBestSellerFallback(topK);
      return {
        products: fallback,
        algorithm: "bestseller-fallback",
        source: "mongodb",
        isColdStart: false,   // Không phải cold start — là stale AI data
        isStaleFallback: true,
        count: fallback.length,
      };
    }

    return {
      products,
      algorithm: "collaborative-funk-svd",
      source: "ai-service",
      isColdStart: false,
      count: products.length,
    };
  }

  // AI trả về mảng rỗng nhưng không phải cold start
  // (user đã tương tác với tất cả sản phẩm trong DB) → fallback
  const fallback = await getBestSellerFallback(topK);
  return {
    products: fallback,
    algorithm: "bestseller-fallback",
    source: "mongodb",
    isColdStart: false,
    count: fallback.length,
  };
};

/**
 * Trigger retrain CF model bên Python AI Service.
 * Dùng sau khi có nhiều review / purchase mới để không chờ 6 giờ.
 *
 * @returns {Promise<{success: boolean, status: string, message: string}>}
 */
const triggerCFRetrain = async () => {
  const aiRes = await aiClient.post("/recommend/retrain");
  return aiRes.data;
};

/**
 * Lấy Health Status của AI Service (Admin).
 */
const getAIHealthStatus = async () => {
  const aiRes = await aiClient.get("/health");
  return aiRes.data;
};

/**
 * Lấy Mock Recommendations cho 1 User bất kỳ (Admin).
 * Chỉ gọi AI, không cần parse lại UI context, trả về raw meta.
 */
const getUserRecommendationsSimulator = async (userId, topK = 6) => {
  const aiRes = await aiClient.get(`/recommend/user/${userId}/collaborative`, {
    params: { top_k: topK },
  });

  const { recommendations = [], coldStart = false } = aiRes.data;
  if (coldStart || recommendations.length === 0) {
    const fallback = await getBestSellerFallback(topK);
    return {
      isColdStart: true,
      algorithm: "bestseller-fallback",
      products: fallback
    };
  }

  const products = await enrichAndSort(recommendations);
  return {
    isColdStart: false,
    algorithm: "collaborative-svd",
    products
  };
};

/**
 * ─── HYBRID ENGINE ───────────────────────────────────────────────────────────
 * Kết hợp: CF + Content-Based + Popularity theo tỉ lệ động (từ SystemConfig).
 * Nếu User chưa đăng nhập hoặc Cold Start, tự động nghiêng về Popularity.
 */
const getHybridRecommendationsData = async (userId, topK = 20) => {
  let hybridProducts = [];
  const addedIds = new Set();
  
  const addProducts = (products) => {
    for (const p of products) {
      if (!addedIds.has(p._id.toString())) {
        hybridProducts.push(p);
        addedIds.add(p._id.toString());
      }
    }
  };

  // Đọc config tỉ lệ từ DB
  let cfRatio = 0.4;
  let cbfRatio = 0.3;
  let popRatio = 0.3;

  try {
    const SystemConfig = (await import("../models/systemConfigModel.js")).default;
    const config = await SystemConfig.findOne({ key: "HYBRID_WEIGHTS" }).lean();
    if (config && config.value) {
      const total = (config.value.cf || 0) + (config.value.cbf || 0) + (config.value.pop || 0);
      if (total > 0) {
        cfRatio = config.value.cf / total;
        cbfRatio = config.value.cbf / total;
        popRatio = config.value.pop / total;
      }
    }
  } catch (err) {
    console.error("[Hybrid] Không thể đọc config HYBRID_WEIGHTS:", err.message);
  }

  const cfLimit = Math.ceil(topK * cfRatio);
  const cbfLimit = Math.ceil(topK * cbfRatio);

  // 1. Lấy CF Recommendations
  if (userId && cfLimit > 0) {
    try {
      const cfData = await getUserRecommendationsData(userId, topK);
      if (!cfData.isColdStart && cfData.products) {
        addProducts(cfData.products.slice(0, cfLimit));
      }
    } catch (e) {
      console.error("[Hybrid] CF Error:", e.message);
    }
  }

  // 2. Lấy Content-Based (dựa trên sách vừa xem gần nhất)
  if (userId && cbfLimit > 0) {
    try {
      const UserInteraction = (await import("../models/userInteractionModel.js")).default;
      const lastView = await UserInteraction.findOne({ userId, interactionType: "view" })
        .sort({ createdAt: -1 })
        .lean();
        
      if (lastView) {
        const cbfData = await getSimilarProductsData(lastView.productId, cbfLimit);
        if (cbfData.products) {
          addProducts(cbfData.products);
        }
      }
    } catch (e) {
      console.error("[Hybrid] CBF Error:", e.message);
    }
  }

  // 3. Lấy Popularity điền vào chỗ trống
  const remaining = topK - hybridProducts.length;
  if (remaining > 0) {
    try {
      const fallback = await getBestSellerFallback(remaining + 5); // Lấy dư để trừ trùng
      addProducts(fallback);
    } catch (e) {
      console.error("[Hybrid] Popularity Error:", e.message);
    }
  }

  // Trả về đúng topK
  return {
    products: hybridProducts.slice(0, topK),
    algorithm: "hybrid-mixer (cf+cbf+pop)",
    source: "nodejs-mixer",
    count: Math.min(hybridProducts.length, topK),
  };
};


export {
  getSimilarProductsData,
  getUserRecommendationsData,
  triggerCFRetrain,
  getAIHealthStatus,
  getUserRecommendationsSimulator,
  getHybridRecommendationsData,
};
