import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { getChatInsights, getChatbotStats, getChatHistoryList } from "../controllers/analyticsController.js";

const router = express.Router();

// GET /api/v1/analytics/chat-insights?days=7 – Phân tích AI// Chatbot Analytics
router.get("/chat-insights", protect, admin, getChatInsights);
router.get("/chatbot-stats", protect, admin, getChatbotStats);
router.get("/chat-history", protect, admin, getChatHistoryList);

export default router;
