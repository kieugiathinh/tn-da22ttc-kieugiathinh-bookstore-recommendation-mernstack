import express from "express";
import { askChatbot } from "../controllers/chatbotController.js";

const router = express.Router();

// POST /api/v1/chatbot/ask – Endpoint nhận câu hỏi từ khách hàng
router.post("/ask", askChatbot);

export default router;
