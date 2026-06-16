import asyncHandler from "express-async-handler";
import { analyzeChatInsights } from "../services/analyticsService.js";

/**
 * @desc    Phân tích insights khách hàng từ dữ liệu chatbot (AI-powered)
 * @route   GET /api/v1/analytics/chat-insights?days=7
 * @access  Private/Admin
 */
const getChatInsights = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;

  // Giới hạn: tối thiểu 1 ngày, tối đa 90 ngày
  if (days < 1 || days > 90) {
    res.status(400);
    throw new Error("Số ngày phải từ 1 đến 90.");
  }

  const result = await analyzeChatInsights(days);

  res.status(200).json({
    success: true,
    ...result,
  });
});

export { getChatInsights };
