import express from "express";
import {
  createCoupon,
  saveCouponToWallet,
  calculateDiscount,
  getAllCoupons,
  getAllCouponsAdmin,
  updateCoupon,
  deleteCoupon,
} from "../controllers/coupon.controller.js";

import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public hoặc User logged in
router.get("/", getAllCoupons);
router.post("/save", protect, saveCouponToWallet);
router.post("/apply", protect, calculateDiscount);

// --- ADMIN ROUTES ---
router.get("/admin", protect, admin, getAllCouponsAdmin);
router.post("/", protect, admin, createCoupon);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

export default router;
