import express from "express";
import contactController from "../controllers/contactController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: Gửi liên hệ
router.post("/", contactController.createContact);

// Admin: Lấy danh sách liên hệ
router.get("/", protect, admin, contactController.getAllContacts);

// Admin: Phản hồi liên hệ
router.put("/:id/reply", protect, admin, contactController.replyContact);

// Admin: Xóa liên hệ
router.delete("/:id", protect, admin, contactController.deleteContact);

export default router;
