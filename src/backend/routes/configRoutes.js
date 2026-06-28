import express from "express";
import { getConfigByKey, updateConfigByKey } from "../controllers/configController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Lấy cấu hình (ai cũng có thể lấy hoặc chỉ admin? 
// Python Service gọi tới nên có thể không có token admin, nhưng Python không truyền JWT.
// Chúng ta sẽ cho phép public hoặc dùng API Key nội bộ. Tạm thời public vì đây là cấu hình không nhạy cảm bảo mật)
router.get("/:key", getConfigByKey);

// Cập nhật cấu hình (bắt buộc Admin từ giao diện Frontend)
router.put("/:key", protect, admin, updateConfigByKey);

export default router;
