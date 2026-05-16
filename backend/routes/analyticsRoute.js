import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { getChatInsights } from "../controllers/analyticsController.js";

const router = express.Router();

// GET /api/v1/analytics/chat-insights?days=7 – Phân tích AI (chỉ Admin)
router.get("/chat-insights", protect, admin, getChatInsights);

export default router;
