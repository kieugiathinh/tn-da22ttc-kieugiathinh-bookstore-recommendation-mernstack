import Wishlist from "../models/wishlistModel.js";
import UserInteraction from "../models/userInteractionModel.js";

/**
 * Thêm sản phẩm vào danh sách yêu thích.
 * Đồng thời ghi nhận 1 record "favorite" vào UserInteraction cho AI.
 */
const addToWishlist = async (userId, productId) => {
  // Kiểm tra đã tồn tại chưa
  const existing = await Wishlist.findOne({ userId, productId });
  if (existing) {
    throw new Error("Sản phẩm đã có trong danh sách yêu thích");
  }

  const wishlistItem = await Wishlist.create({ userId, productId });

  // Ghi nhận implicit signal "favorite" cho hệ thống AI gợi ý
  try {
    await UserInteraction.create({
      userId,
      productId,
      interactionType: "favorite",
      source: "direct",
    });
  } catch (err) {
    // Không throw lỗi nếu interaction ghi nhận thất bại
    console.error("Lỗi ghi nhận favorite interaction:", err.message);
  }

  return wishlistItem;
};

/**
 * Xóa sản phẩm khỏi danh sách yêu thích.
 * KHÔNG xóa record UserInteraction cũ (giữ lại lịch sử cho AI học).
 */
const removeFromWishlist = async (userId, productId) => {
  const result = await Wishlist.findOneAndDelete({ userId, productId });
  if (!result) {
    throw new Error("Sản phẩm không có trong danh sách yêu thích");
  }

  try {
    await UserInteraction.create({
      userId,
      productId,
      interactionType: "remove_favorite",
      source: "direct",
    });
  } catch (err) {
    console.error("Lỗi ghi nhận remove_favorite interaction:", err.message);
  }

  return result;
};

/**
 * Lấy danh sách sản phẩm yêu thích của user (có populate đầy đủ thông tin sách).
 */
const getWishlist = async (userId) => {
  const items = await Wishlist.find({ userId })
    .populate({
      path: "productId",
      populate: { path: "category", select: "name" },
    })
    .sort({ createdAt: -1 })
    .lean();

  // Lọc bỏ các item mà productId đã bị xóa khỏi DB hoặc ngừng kinh doanh
  return items.filter((item) => item.productId !== null && item.productId.status !== "discontinued");
};

/**
 * Kiểm tra 1 sản phẩm có trong danh sách yêu thích không.
 */
const isInWishlist = async (userId, productId) => {
  const item = await Wishlist.findOne({ userId, productId }).lean();
  return !!item;
};

/**
 * Lấy tất cả productId trong wishlist của user (dùng cho Frontend bulk check).
 */
const getWishlistIds = async (userId) => {
  const items = await Wishlist.find({ userId }).select("productId").lean();
  return items.map((item) => item.productId.toString());
};

/**
 * Đếm số lượng sách yêu thích của user.
 */
const getWishlistCount = async (userId) => {
  return await Wishlist.countDocuments({ userId });
};

export {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  isInWishlist,
  getWishlistIds,
  getWishlistCount,
};
