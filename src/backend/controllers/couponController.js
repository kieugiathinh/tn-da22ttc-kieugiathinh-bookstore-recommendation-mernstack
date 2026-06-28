import asyncHandler from "express-async-handler";
import * as couponService from "../services/couponService.js";

// 1. ADMIN: Tạo mã giảm giá
export const createCoupon = asyncHandler(async (req, res) => {
  const savedCoupon = await couponService.createCoupon(req.body);
  res.status(201).json(savedCoupon);
});

// 2. USER: Lấy danh sách mã
export const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponService.getAllActiveCoupons();
  res.status(200).json(coupons);
});

// 3. USER: Lưu mã vào ví
export const saveCouponToWallet = asyncHandler(async (req, res) => {
  const wallet = await couponService.saveCouponToWallet(req.user.id, req.body.couponId);
  res.status(200).json({
    message: "Lưu mã thành công!",
    wallet,
  });
});

// 4. SYSTEM: Tính toán giá
export const calculateDiscount = asyncHandler(async (req, res) => {
  const { couponCode, cartTotal } = req.body;
  const result = await couponService.calculateDiscount(req.user.id, couponCode, cartTotal);
  
  res.status(200).json({
    success: true,
    ...result,
    message: "Áp dụng mã thành công",
  });
});

// 5. ADMIN: Lấy tất cả mã
export const getAllCouponsAdmin = asyncHandler(async (req, res) => {
  const coupons = await couponService.getAllCouponsAdmin();
  res.status(200).json(coupons);
});

// 6. ADMIN: Cập nhật mã
export const updateCoupon = asyncHandler(async (req, res) => {
  const updatedCoupon = await couponService.updateCoupon(req.params.id, req.body);
  res.status(200).json(updatedCoupon);
});

// 7. ADMIN: Xóa mã
export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  res.status(200).json({ message: "Đã xóa mã giảm giá" });
});
