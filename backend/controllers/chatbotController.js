import asyncHandler from "express-async-handler";
import { getChatbotResponse } from "../services/chatbotService.js";

/**
 * @desc    Nhận tin nhắn từ khách hàng, gọi Chatbot Service (RAG + Gemini) và trả kết quả
 * @route   POST /api/v1/chatbot/ask
 * @access  Public (Khách hàng không cần đăng nhập để hỏi chatbot)
 */
const askChatbot = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("Vui lòng nhập câu hỏi.");
  }

  const result = await getChatbotResponse(message.trim());

  res.status(200).json({
    success: true,
    reply: result.reply,
    meta: {
      booksFound: result.booksFound,
      keywords: result.keywords,
    },
  });
});

export { askChatbot };
