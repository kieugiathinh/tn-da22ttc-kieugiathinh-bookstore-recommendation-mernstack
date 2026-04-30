import express from "express";
import {
  createFlashSale,
  addProductToFlashSale,
  getActiveFlashSale,
  getAllFlashSales,
  deleteFlashSale,
  updateFlashSale,
  removeProductFromFlashSale,
} from "../controllers/flashsaleController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: Ai cũng xem được sale đang chạy
router.get("/active", getActiveFlashSale);

// Admin: Mới được tạo và thêm sản phẩm
router.get("/all", protect, admin, getAllFlashSales);
router.post("/", protect, admin, createFlashSale);
router.post("/:id/add-product", protect, admin, addProductToFlashSale);
router.delete("/:id", protect, admin, deleteFlashSale);
router.put("/:id", protect, admin, updateFlashSale);
router.delete(
  "/:id/remove-product/:productId",
  protect,
  admin,
  removeProductFromFlashSale
);

export default router;
