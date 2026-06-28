import asyncHandler from "express-async-handler";
import { getChatbotResponse, getChatHistory } from "../services/chatbotService.js";

/**
 * @desc    Nhận tin nhắn từ khách hàng, gọi Chatbot Service (RAG + Gemini) và trả kết quả
 * @route   POST /api/v1/chatbot/ask
 * @access  Public (Hỗ trợ cả user đã đăng nhập và khách vãng lai)
 */
const askChatbot = asyncHandler(async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("Vui lòng nhập câu hỏi.");
  }

  // Ưu tiên userId (nếu đã đăng nhập), fallback sang sessionId (khách vãng lai)
  const userId = req.user?._id || null;
  const guestSessionId = userId ? null : sessionId;

  if (!userId && !guestSessionId) {
    res.status(400);
    throw new Error("Cần có userId hoặc sessionId để duy trì phiên chat.");
  }

  const result = await getChatbotResponse(message.trim(), userId, guestSessionId);

  res.status(200).json({
    success: true,
    reply: result.reply,
    books: result.books,
    meta: {
      booksFound: result.booksFound,
      keywords: result.keywords,
    },
  });
});

/**
 * @desc    Lấy lịch sử chat của user/guest
 * @route   GET /api/v1/chatbot/history?sessionId=xxx
 * @access  Public
 */
const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const sessionId = userId ? null : req.query.sessionId;

  if (!userId && !sessionId) {
    return res.status(200).json({ success: true, messages: [] });
  }

  const messages = await getChatHistory(userId, sessionId);

  res.status(200).json({
    success: true,
    messages,
  });
});

export { askChatbot, getHistory };
