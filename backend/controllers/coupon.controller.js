import Coupon from "../models/coupon.model.js";
import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";

// 1. ADMIN: Tạo mã giảm giá
export const createCoupon = asyncHandler(async (req, res) => {
  const newCoupon = new Coupon(req.body);
  const savedCoupon = await newCoupon.save();
  res.status(201).json(savedCoupon);
});

// 2. USER: Lấy danh sách mã
export const getAllCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true,
    endDate: { $gt: now },
  }).sort({ createdAt: -1 });
  res.status(200).json(coupons);
});

// 3. USER: Lưu mã vào ví
export const saveCouponToWallet = asyncHandler(async (req, res) => {
  const { couponId } = req.body;
  const userId = req.user.id;

  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    res.status(404);
    throw new Error("Mã giảm giá không tồn tại");
  }

  const now = new Date();
  if (now > coupon.endDate || !coupon.isActive) {
    res.status(400);
    throw new Error("Mã này đã hết hạn");
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("Mã này đã hết số lượng");
  }

  const user = await User.findById(userId);
  // Kiểm tra trùng
  const alreadySaved = user.wallet.find(
    (item) => item.coupon.toString() === couponId
  );
  if (alreadySaved) {
    res.status(400);
    throw new Error("Bạn đã lưu mã này rồi");
  }

  user.wallet.push({ coupon: couponId, isUsed: false });
  await user.save();

  // Populate ngay để Frontend hiển thị được thông tin mã
  const updatedUser = await User.findById(userId).populate("wallet.coupon");

  res.status(200).json({
    message: "Lưu mã thành công!",
    wallet: updatedUser.wallet,
  });
});

// 4. SYSTEM: Tính toán giá (LOGIC ĐÃ SỬA: CHỈ TÍNH, KHÔNG LƯU DB)
export const calculateDiscount = asyncHandler(async (req, res) => {
  const { couponCode, cartTotal } = req.body;
  const userId = req.user.id;

  // A. Kiểm tra Voucher tồn tại
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
  if (!coupon) {
    res.status(404);
    throw new Error("Mã không hợp lệ");
  }

  // B. Kiểm tra User có sở hữu mã này không
  const user = await User.findById(userId);
  const userCoupon = user.wallet.find(
    (item) => item.coupon.toString() === coupon._id.toString()
  );

  if (!userCoupon) {
    res.status(400);
    throw new Error("Bạn chưa lưu mã này");
  }

  // C. Kiểm tra trạng thái đã dùng (Trong DB)
  if (userCoupon.isUsed) {
    res.status(400);
    throw new Error("Bạn đã sử dụng mã này rồi");
  }

  // D. Kiểm tra điều kiện hiệu lực
  const now = new Date();
  if (!coupon.isActive) {
    res.status(400);
    throw new Error("Mã này đang bị khóa");
  }
  if (now < coupon.startDate) {
    res.status(400);
    throw new Error("Mã chưa đến đợt áp dụng");
  }
  if (now > coupon.endDate) {
    res.status(400);
    throw new Error("Mã đã hết hạn");
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("Mã đã hết lượt sử dụng");
  }

  if (cartTotal < coupon.minOrderValue) {
    res.status(400);
    throw new Error(
      `Đơn hàng phải tối thiểu ${coupon.minOrderValue.toLocaleString()}đ`
    );
  }

  // E. Tính toán số tiền giảm
  let discountAmount = 0;
  if (coupon.discountType === "PERCENT") {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    if (
      coupon.maxDiscountAmount > 0 &&
      discountAmount > coupon.maxDiscountAmount
    ) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "AMOUNT") {
    discountAmount = coupon.discountValue;
  }

  if (discountAmount > cartTotal) discountAmount = cartTotal;

  // QUAN TRỌNG: Không có lệnh save() nào ở đây cả.

  res.status(200).json({
    success: true,
    couponCode: coupon.code,
    discountAmount: discountAmount,
    finalPrice: cartTotal - discountAmount,
    message: "Áp dụng mã thành công",
  });
});

// 5. ADMIN: Lấy tất cả mã (Bao gồm cả mã ẩn, hết hạn để quản lý)
export const getAllCouponsAdmin = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json(coupons);
});

// 6. ADMIN: Cập nhật mã (Sửa thông tin hoặc Ẩn/Hiện)
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Mã giảm giá không tồn tại");
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true } // Trả về data mới sau khi update
  );

  res.status(200).json(updatedCoupon);
});

// 7. ADMIN: Xóa mã
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Mã giảm giá không tồn tại");
  }

  await Coupon.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Đã xóa mã giảm giá" });
});
