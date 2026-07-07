import Product from "../models/productModel.js";
import Review from "../models/reviewModel.js";
import UserInteraction from "../models/userInteractionModel.js";
import Order, { ORDER_STATUS } from "../models/orderModel.js";
import * as configService from "./configService.js";
import { getTimeRange } from "./statsService.js";

// ─── 1. Products ──────────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ sản phẩm với các text features phục vụ Content-Based Filtering.
 * Populate category để Python nhận được tên thể loại (string) thay vì ObjectId.
 * Sử dụng .lean() để trả về plain object, tăng tốc độ ~3-4x so với Mongoose Document.
 *
 * @returns {Promise<Array>} Mảng product đã normalize, sẵn sàng cho TF-IDF corpus.
 */
const getProductsData = async () => {
  const products = await Product.find({ status: "active" })
    .populate("category", "name")
    .select(
      "_id title author publisher category desc tags language publishedYear pageCount ageGroup rating numReviews sold"
    )
    .lean();

  // Flatten: category object { _id, name } → 2 field riêng biệt
  // Python nhận { categoryId, categoryName } dễ encode hơn ObjectId lồng nhau
  return products.map((p) => ({
    ...p,
    categoryId: p.category?._id ?? null,
    categoryName: p.category?.name ?? "Uncategorized",
    category: undefined,
  }));
};

// ─── 2. Ratings (Explicit Feedback) ──────────────────────────────────────────

/**
 * Lấy ma trận Explicit Rating (User-Item) từ Review collection.
 * Loại bỏ các review bị ẩn (isHidden: true) để tránh dữ liệu nhiễu.
 * Rename field: user → userId, product → productId (nhất quán với UserInteraction).
 *
 * Python dùng:
 *   df = pd.DataFrame(data)
 *   matrix = df.pivot(index='userId', columns='productId', values='rating')
 *
 * @returns {Promise<Array<{userId, productId, rating, createdAt}>>}
 */
const getRatingsData = async () => {
  const reviews = await Review.find({ isHidden: false })
    .select("user product rating createdAt -_id")
    .lean();

  return reviews.map((r) => ({
    userId: r.user,
    productId: r.product,
    rating: r.rating,
    createdAt: r.createdAt,
  }));
};

// ─── 3. Interactions (Implicit Feedback) ─────────────────────────────────────

/**
 * Lấy Implicit Feedback signals trong khoảng thời gian N ngày gần nhất.
 * Hỗ trợ lọc thêm theo loại interaction (typeFilter).
 *
 * Ghi chú về tham số:
 *   - days: giới hạn trong [1, 365] để tránh query quá nặng
 *   - typeFilter: null = lấy tất cả loại, Array = chỉ lấy loại được chỉ định
 *
 * Python dùng ALS (Alternating Least Squares) với implicit library:
 *   model = implicit.als.AlternatingLeastSquares()
 *   model.fit(sparse_item_user_matrix)
 *
 * @param {number} days   - Số ngày lookback (default: 30)
 * @param {string[]|null} typeFilter - Mảng loại interaction cần lọc, null = tất cả
 * @returns {Promise<Array<{userId, productId, interactionType, durationSeconds, source, createdAt}>>}
 */
const getInteractionsData = async (days = 30, typeFilter = null) => {
  // Giới hạn hợp lý: tối đa 365 ngày, tối thiểu 1 ngày
  const clampedDays = Math.min(Math.max(days, 1), 365);
  const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);

  const query = { createdAt: { $gte: since }, isDeleted: { $ne: true } };
  if (Array.isArray(typeFilter) && typeFilter.length > 0) {
    query.interactionType = { $in: typeFilter };
  }

  return await UserInteraction.find(query)
    .select("userId productId interactionType durationSeconds source createdAt -_id")
    .lean();
};

// ─── 4. Purchases (Implicit Feedback — strong signal) ─────────────────────────

/**
 * Lấy lịch sử mua hàng thành công, flatten thành danh sách phẳng.
 * Chỉ lấy đơn hàng có status DELIVERED — tín hiệu implicit mạnh nhất.
 *
 * Lý do flatten (không trả về order document gốc):
 *   Python cần 1 row = 1 (user, item) pair để build interaction matrix.
 *   1 order có N sản phẩm → cần tách thành N rows riêng biệt.
 *
 * Python dùng:
 *   df['implicit_score'] = df['quantity'].apply(lambda q: min(q * 2, 10))
 *
 * @returns {Promise<Array<{userId, productId, quantity, purchasedAt}>>}
 */
const getPurchasesData = async () => {
  const deliveredOrders = await Order.find({ status: ORDER_STATUS.DELIVERED })
    .select("userId products createdAt -_id")
    .lean();

  // Flatten: 1 order (N items) → N flat purchase records
  const flatPurchases = [];
  for (const order of deliveredOrders) {
    for (const item of order.products ?? []) {
      flatPurchases.push({
        userId: order.userId,
        productId: item.productId,
        quantity: item.quantity ?? 1,
        purchasedAt: order.createdAt,
      });
    }
  }

  return flatPurchases;
};

// ─── 5. Popularity-based Recommendations (Độ phổ biến) ─────────────────────────

/**
 * Lấy danh sách sách phổ biến nhất (Popular Books) kết hợp giữa:
 * 1. Base Score (Dữ liệu nền tảng): Lượt bán (sold), Đánh giá (rating & numReviews).
 * 2. Trending Score (Xu hướng 30 ngày qua): View, Cart, Purchase (từ UserInteraction).
 * 
 * Công thức:
 * Score = (sold * 5) + (rating * log10(numReviews + 1) * 10) + trendingScore
 */
const getPopularBooks = async (limit = 10, period = "month") => {
  const { start } = getTimeRange(period);
  const since = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Lấy config trọng số từ DB
  const config = await configService.getConfigByKey("INTERACTION_WEIGHTS");
  const weights = config.value;

  // Tạo mảng branches cho $switch của MongoDB
  const branches = Object.entries(weights).map(([key, weight]) => ({
    case: { $eq: ["$interactionType", key] },
    then: weight
  }));

  const trendingScores = await UserInteraction.aggregate([
    { $match: { createdAt: { $gte: since }, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: "$productId",
        trendingScore: {
          $sum: {
            $switch: {
              branches: branches,
              default: 0,
            },
          },
        },
      },
    },
  ]);

  const trendingMap = new Map();
  trendingScores.forEach((item) => {
    trendingMap.set(item._id.toString(), item.trendingScore);
  });

  // 1.5 Tính lượng bán thực tế trong khoảng thời gian `days` (periodSold)
  const Order = (await import("../models/orderModel.js")).default;
  const ordersAggregation = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, status: { $in: [1, 2, 3, 4] } } },
    { $unwind: "$products" },
    { $group: { _id: "$products.productId", periodSold: { $sum: "$products.quantity" } } }
  ]);

  const ordersMap = new Map();
  ordersAggregation.forEach((item) => {
    ordersMap.set(item._id.toString(), item.periodSold);
  });

  // 2. Lấy toàn bộ sách (thêm author, publisher, desc)
  const allProducts = await Product.find({})
    .populate("category", "name")
    .select("_id title author publisher desc img originalPrice discountedPrice rating numReviews sold category countInStock")
    .lean();

  // 3. Tính điểm Popularity Score
  // Nhấn mạnh vào dữ liệu của khoảng thời gian `days` (periodSold, trending)
  const scoredProducts = allProducts.map((p) => {
    const periodSold = ordersMap.get(p._id.toString()) || 0;
    const trending = trendingMap.get(p._id.toString()) || 0;
    
    // Base all-time score (tie-breaker)
    const baseSoldScore = (p.sold || 0) * 0.5; 
    const ratingScore = (p.rating || 0) * Math.log10((p.numReviews || 0) + 1) * 2;
    
    // Period score (trọng số cao để filter ngày/tuần/tháng có ý nghĩa)
    const periodScore = (periodSold * 20) + (trending * 2);
    
    const popularityScore = periodScore + baseSoldScore + ratingScore;

    return {
      ...p,
      popularityScore,
      periodSold, // Gửi kèm để hiển thị nếu cần
      _aiMeta: {
        algorithm: "popularity-weighted",
        score: popularityScore,
        periodSold,
        trending,
      }
    };
  });

  // 4. Sort giảm dần theo điểm Popularity và limit
  scoredProducts.sort((a, b) => b.popularityScore - a.popularityScore);

  return scoredProducts.slice(0, limit);
};

export {
  getProductsData,
  getRatingsData,
  getInteractionsData,
  getPurchasesData,
  getPopularBooks,
};
