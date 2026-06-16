import express from "express";
import { askChatbot, getHistory } from "../controllers/chatbotController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/v1/chatbot/ask – Endpoint nhận câu hỏi (hỗ trợ cả guest & user)
router.post("/ask", optionalProtect, askChatbot);

// GET /api/v1/chatbot/history – Lấy lịch sử chat
router.get("/history", optionalProtect, getHistory);

export default router;
