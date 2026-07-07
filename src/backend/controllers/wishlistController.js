import asyncHandler from "express-async-handler";
import * as wishlistService from "../services/wishlistService.js";

const addToWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error("Thiếu productId");
  }

  const item = await wishlistService.addToWishlist(userId, productId);
  res.status(201).json({ success: true, message: "Đã thêm vào yêu thích", data: item });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  await wishlistService.removeFromWishlist(userId, productId);
  res.status(200).json({ success: true, message: "Đã xóa khỏi yêu thích" });
});

const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const items = await wishlistService.getWishlist(userId);
  res.status(200).json({ success: true, count: items.length, data: items });
});

const getWishlistIds = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const ids = await wishlistService.getWishlistIds(userId);
  res.status(200).json({ success: true, data: ids });
});

const getWishlistCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const count = await wishlistService.getWishlistCount(userId);
  res.status(200).json({ success: true, count });
});

export {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getWishlistIds,
  getWishlistCount,
};
