import express from "express";
import { subscribeNewsletter, getSubscribers, sendCampaign } from "../controllers/newsletterController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/subscribe", subscribeNewsletter);

// Admin routes
router.get("/subscribers", protect, admin, getSubscribers);
router.post("/send-campaign", protect, admin, sendCampaign);

export default router;
