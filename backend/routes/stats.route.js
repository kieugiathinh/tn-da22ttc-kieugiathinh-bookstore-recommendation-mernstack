import express from "express";
import { protect, admin } from "../middleware/auth.middleware.js";
import {
  getDashboardStats,
  getRevenueChart, // Route mới cho chart đơn
  getRevenueComparison,
  getCategoryStats,
  getOrderStatusStats,
  getProductAnalytics,
  getTopCustomers,
  getLatestOrders,
} from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/summary", protect, admin, getDashboardStats);
router.get("/revenue-chart", protect, admin, getRevenueChart); // Fix lỗi 404
router.get("/revenue-comparison", protect, admin, getRevenueComparison);
router.get("/categories", protect, admin, getCategoryStats);
router.get("/order-status", protect, admin, getOrderStatusStats);
router.get("/products-analytics", protect, admin, getProductAnalytics);
router.get("/top-customers", protect, admin, getTopCustomers);
router.get("/latest-orders", protect, admin, getLatestOrders);

export default router;
