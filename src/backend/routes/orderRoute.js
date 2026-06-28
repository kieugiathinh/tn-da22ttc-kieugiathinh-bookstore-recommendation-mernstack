import express from "express";
import {
  getAllOrders,
  getUserOrder,
  deleteOrder,
  createOrder,
  updateOrder,
  cancelOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Order Route
router.post("/", protect, createOrder);

// Update Order Route
router.put("/:id", protect, updateOrder);

// Get All Orders Route
router.get("/", protect, getAllOrders);

// Delete Order Route
router.delete("/:id", protect, deleteOrder);

// Get User's Order Route
router.get("/find/:id", protect, getUserOrder);

// Route Hủy đơn (Cần protect để biết ai đang hủy)
router.put("/:id/cancel", protect, cancelOrder);

export default router;
