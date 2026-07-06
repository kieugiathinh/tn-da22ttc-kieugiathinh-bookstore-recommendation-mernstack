import asyncHandler from "express-async-handler";
import * as interactionService from "../services/interactionService.js";

/**
 * GET /api/v1/interactions
 * Lấy danh sách lịch sử hành vi (có phân trang, có thể lọc)
 */
export const getInteractions = asyncHandler(async (req, res) => {
  const result = await interactionService.getInteractions(
    req.query.pageNumber,
    req.query.limit,
    req.query.type,
    req.query.source,
    req.query.keyword
  );
  
  res.status(200).json({
    success: true,
    ...result
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

  try {
    const interaction = await interactionService.trackUserInteraction(
      req.user._id,
      productId,
      interactionType,
      source,
      durationSeconds
    );

    res.status(201).json({
      success: true,
      interaction
    });
  } catch (error) {
    if (error.message === "Missing productId or interactionType") {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * @desc    Xóa một hành vi
 * @route   DELETE /api/v1/interactions/:id
 * @access  Private/Admin
 */
export const deleteInteraction = asyncHandler(async (req, res) => {
  try {
    const result = await interactionService.deleteInteraction(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Không tìm thấy hành vi") {
      res.status(404);
      throw new Error(error.message);
    }
    throw error;
  }
});

/**
 * GET /api/v1/interactions/analytics/categories
 * Lấy thống kê category được tương tác (có thể lọc theo user)
 */
export const getCategoryAnalytics = asyncHandler(async (req, res) => {
  const data = await interactionService.getCategoryAnalytics(req.query.userId);
  res.status(200).json({
    success: true,
    data
  });
});
