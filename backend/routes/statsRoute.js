import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getDashboardStats,
  getRevenueChart,
  getRevenueComparison,
  getCategoryStats,
  getOrderStatusStats,
  getProductAnalytics,
  getTopCustomers,
  getLatestOrders,
  getUserAnalyticsHandler,
  getOrderAnalyticsHandler,
  getProductStatsHandler,
} from "../controllers/statsController.js";

const router = express.Router();

router.get("/summary", protect, admin, getDashboardStats);
router.get("/revenue-chart", protect, admin, getRevenueChart);
router.get("/revenue-comparison", protect, admin, getRevenueComparison);
router.get("/categories", protect, admin, getCategoryStats);
router.get("/order-status", protect, admin, getOrderStatusStats);
router.get("/products-analytics", protect, admin, getProductAnalytics);
router.get("/top-customers", protect, admin, getTopCustomers);
router.get("/latest-orders", protect, admin, getLatestOrders);
router.get("/user-analytics", protect, admin, getUserAnalyticsHandler);
router.get("/order-analytics", protect, admin, getOrderAnalyticsHandler);
router.get("/product-stats", protect, admin, getProductStatsHandler);

export default router;
