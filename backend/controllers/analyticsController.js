import asyncHandler from "express-async-handler";
import ChatSession from "../models/chatSessionModel.js";
import { analyzeChatInsights, getChatbotBasicStats, getChatbotFunnelStats } from "../services/analyticsService.js";

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

/**
 * @desc    Lấy số liệu định lượng cơ bản của Chatbot
 * @route   GET /api/v1/analytics/chatbot-stats
 * @access  Private/Admin
 */
const getChatbotStats = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const stats = await getChatbotBasicStats(days);
  const funnel = await getChatbotFunnelStats(days);
  
  res.status(200).json({ 
    success: true, 
    ...stats,
    ...funnel 
  });
});

/**
 * @desc    Lấy danh sách Lịch sử Chatbot
 * @route   GET /api/v1/analytics/chat-history
 * @access  Private/Admin
 */
const getChatHistoryList = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const total = await ChatSession.countDocuments();
  const sessions = await ChatSession.find({})
    .populate("userId", "fullname email")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const formattedSessions = sessions.map(s => ({
    _id: s._id,
    user: s.userId ? s.userId.fullname : (s.sessionId || "Khách vãng lai"),
    email: s.userId ? s.userId.email : "",
    messagesCount: s.messages.length,
    status: s.status,
    lastMessage: s.messages.length > 0 ? s.messages[s.messages.length - 1].parts[0].text : "",
    updatedAt: s.updatedAt,
    messages: s.messages.map(m => ({
      sender: m.role === "user" ? "user" : "bot",
      text: m.parts.map((p) => p.text).join(""),
      timestamp: m.timestamp,
    }))
  }));

  res.status(200).json({
    success: true,
    sessions: formattedSessions,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

export { getChatInsights, getChatbotStats, getChatHistoryList };
