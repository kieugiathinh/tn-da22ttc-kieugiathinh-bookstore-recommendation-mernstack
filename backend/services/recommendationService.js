import Product from "../models/productModel.js";
import Review from "../models/reviewModel.js";
import UserInteraction from "../models/userInteractionModel.js";
import Order, { ORDER_STATUS } from "../models/orderModel.js";

// ─── 1. Products ──────────────────────────────────────────────────────────────

/**
 * Lấy toàn bộ sản phẩm với các text features phục vụ Content-Based Filtering.
 * Populate category để Python nhận được tên thể loại (string) thay vì ObjectId.
 * Sử dụng .lean() để trả về plain object, tăng tốc độ ~3-4x so với Mongoose Document.
 *
 * @returns {Promise<Array>} Mảng product đã normalize, sẵn sàng cho TF-IDF corpus.
 */
const getProductsData = async () => {
  const products = await Product.find({})
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

  const query = { createdAt: { $gte: since } };
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

export {
  getProductsData,
  getRatingsData,
  getInteractionsData,
  getPurchasesData,
};
