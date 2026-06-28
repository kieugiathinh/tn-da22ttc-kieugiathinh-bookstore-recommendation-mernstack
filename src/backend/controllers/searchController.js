import asyncHandler from "express-async-handler";
import * as searchService from "../services/searchService.js";

// @desc    Lưu từ khóa tìm kiếm
// @route   POST /api/search/record
// @access  Public (Optional User)
const recordSearch = asyncHandler(async (req, res) => {
  const { keyword, source } = req.body;
  const userId = req.user ? req.user._id : null;
  
  await searchService.recordSearch(userId, keyword, source);
  res.status(201).json({ message: "Search recorded successfully" });
});

// @desc    Lấy lịch sử tìm kiếm cá nhân (Chỉ user đã login)
// @route   GET /api/search/history
// @access  Private
const getSearchHistory = asyncHandler(async (req, res) => {
  const history = await searchService.getSearchHistory(req.user._id);
  res.status(200).json(history);
});

// @desc    Xóa 1 từ khóa lịch sử
// @route   DELETE /api/search/history/:keyword
// @access  Private
const deleteSearchHistory = asyncHandler(async (req, res) => {
  await searchService.deleteSearchHistory(req.user._id, req.params.keyword);
  res.status(200).json({ message: "Search history deleted" });
});

// @desc    Xóa TẤT CẢ lịch sử
// @route   DELETE /api/search/history
// @access  Private
const clearSearchHistory = asyncHandler(async (req, res) => {
  await searchService.clearSearchHistory(req.user._id);
  res.status(200).json({ message: "All search history cleared" });
});

// @desc    Lấy top từ khóa trending toàn hệ thống (7 ngày qua)
// @route   GET /api/search/trending
// @access  Public
const getTrendingSearches = asyncHandler(async (req, res) => {
  const trending = await searchService.getTrendingSearches();
  res.status(200).json(trending);
});

// @desc    Lấy gợi ý tìm kiếm (Auto-Suggest)
// @route   GET /api/search/suggest?q=...
// @access  Public
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const keyword = req.query.q;
  const suggestions = await searchService.getSearchSuggestions(keyword);
  res.status(200).json(suggestions);
});

export {
  recordSearch,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
  getTrendingSearches,
  getSearchSuggestions,
};
