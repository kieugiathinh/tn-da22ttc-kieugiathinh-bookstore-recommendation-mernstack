import asyncHandler from "express-async-handler";
import UserInteraction from "../models/userInteractionModel.js";

/**
 * GET /api/v1/interactions
 * Lấy danh sách lịch sử hành vi (có phân trang, có thể lọc)
 */
export const getInteractions = asyncHandler(async (req, res) => {
  const page = Number(req.query.pageNumber) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Xây dựng query lọc
  const query = {};
  if (req.query.type && req.query.type !== "all") {
    query.interactionType = req.query.type;
  }
  if (req.query.source && req.query.source !== "all") {
    query.source = req.query.source;
  }
  
  if (req.query.keyword) {
    const keyword = req.query.keyword;
    const User = (await import("../models/userModel.js")).default;
    const Product = (await import("../models/productModel.js")).default;
    
    const users = await User.find({ name: { $regex: keyword, $options: "i" } }).select("_id");
    const products = await Product.find({ title: { $regex: keyword, $options: "i" } }).select("_id");
    
    query.$or = [
      { userId: { $in: users.map(u => u._id) } },
      { productId: { $in: products.map(p => p._id) } }
    ];
  }

  // Populate user info & product info
  const interactions = await UserInteraction.find(query)
    .populate("userId", "name email avatar")
    .populate("productId", "title img")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const count = await UserInteraction.countDocuments(query);

  res.status(200).json({
    success: true,
    interactions,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

/**
 * POST /api/v1/interactions/track
 * API công khai (nhưng yêu cầu protect) để frontend chủ động gửi interaction (add_to_cart, purchase, review, etc.)
 */
export const trackUserInteraction = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ success: false, message: "User not authenticated" });
  }

  const { productId, interactionType, source, durationSeconds } = req.body;

  if (!productId || !interactionType) {
    return res.status(400).json({ success: false, message: "Missing productId or interactionType" });
  }

  try {
    const interaction = await UserInteraction.create({
      userId: req.user._id,
      productId,
      interactionType,
      source: source || "direct",
      durationSeconds: durationSeconds || null
    });

    res.status(201).json({
      success: true,
      interaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @desc    Xóa một hành vi
 * @route   DELETE /api/v1/interactions/:id
 * @access  Private/Admin
 */
export const deleteInteraction = asyncHandler(async (req, res) => {
  const interaction = await UserInteraction.findById(req.params.id);

  if (!interaction) {
    res.status(404);
    throw new Error("Không tìm thấy hành vi");
  }

  await interaction.deleteOne();

  res.json({ success: true, message: "Hành vi đã được xóa thành công" });
});
