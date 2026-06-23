import SearchHistory from "../models/searchHistoryModel.js";
import Product from "../models/productModel.js";
const recordSearch = async (userId, keyword, source) => {
  if (!keyword || !keyword.trim()) throw new Error("Keyword is required");

  const newSearch = new SearchHistory({
    userId: userId || null,
    keyword: keyword.trim().toLowerCase(),
    source: source || "navbar",
  });

  return await newSearch.save();
};

const getSearchHistory = async (userId) => {
  const history = await SearchHistory.aggregate([
    { $match: { userId: userId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$keyword",
        createdAt: { $first: "$createdAt" },
        id: { $first: "$_id" }
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: 10 }
  ]);

  return history.map((item) => ({
    _id: item.id,
    keyword: item._id,
    createdAt: item.createdAt,
  }));
};

const deleteSearchHistory = async (userId, keyword) => {
  return await SearchHistory.deleteMany({
    userId,
    keyword: keyword.toLowerCase(),
  });
};

const clearSearchHistory = async (userId) => {
  return await SearchHistory.deleteMany({ userId });
};

const getTrendingSearches = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trending = await SearchHistory.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: "$keyword", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  return trending.map((item) => ({
    keyword: item._id,
    count: item.count,
  }));
};

const getSearchSuggestions = async (keyword) => {
  if (!keyword || !keyword.trim()) return [];

  // Tìm kiếm theo title hoặc author, không phân biệt hoa thường
  const regex = new RegExp(keyword.trim(), "i");
  const suggestions = await Product.find({
    $or: [{ title: regex }, { author: regex }],
  })
    .select("_id title author img price") // Chỉ lấy các trường cần thiết
    .limit(5)
    .lean();

  return suggestions;
};

export {
  recordSearch,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  getTrendingSearches,
  getSearchSuggestions,
};
