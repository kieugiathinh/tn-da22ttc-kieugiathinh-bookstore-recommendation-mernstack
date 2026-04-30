import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

const createCoupon = async (couponData) => {
  const newCoupon = new Coupon(couponData);
  return await newCoupon.save();
};

const getAllActiveCoupons = async () => {
  const now = new Date();
  return await Coupon.find({
    isActive: true,
    endDate: { $gt: now },
  }).sort({ createdAt: -1 }).lean();
};

const saveCouponToWallet = async (userId, couponId) => {
  const coupon = await Coupon.findById(couponId).lean();
  if (!coupon) throw new Error("Mã giảm giá không tồn tại");

  const now = new Date();
  if (now > coupon.endDate || !coupon.isActive) throw new Error("Mã này đã hết hạn");
  if (coupon.usedCount >= coupon.usageLimit) throw new Error("Mã này đã hết số lượng");

  const user = await User.findById(userId);
  const alreadySaved = user.wallet.find((item) => item.coupon.toString() === couponId);
  if (alreadySaved) throw new Error("Bạn đã lưu mã này rồi");

  user.wallet.push({ coupon: couponId, isUsed: false });
  await user.save();

  const updatedUser = await User.findById(userId).populate("wallet.coupon").lean();
  return updatedUser.wallet;
};

const calculateDiscount = async (userId, couponCode, cartTotal) => {
  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() }).lean();
  if (!coupon) throw new Error("Mã không hợp lệ");

  const user = await User.findById(userId).lean();
  const userCoupon = user.wallet.find((item) => item.coupon.toString() === coupon._id.toString());
  if (!userCoupon) throw new Error("Bạn chưa lưu mã này");
  if (userCoupon.isUsed) throw new Error("Bạn đã sử dụng mã này rồi");

  const now = new Date();
  if (!coupon.isActive) throw new Error("Mã này đang bị khóa");
  if (now < coupon.startDate) throw new Error("Mã chưa đến đợt áp dụng");
  if (now > coupon.endDate) throw new Error("Mã đã hết hạn");
  if (coupon.usedCount >= coupon.usageLimit) throw new Error("Mã đã hết lượt sử dụng");

  if (cartTotal < coupon.minOrderValue) {
    throw new Error(`Đơn hàng phải tối thiểu ${coupon.minOrderValue.toLocaleString()}đ`);
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENT") {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount > 0 && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "AMOUNT") {
    discountAmount = coupon.discountValue;
  }

  if (discountAmount > cartTotal) discountAmount = cartTotal;

  return {
    couponCode: coupon.code,
    discountAmount,
    finalPrice: cartTotal - discountAmount,
  };
};

const getAllCouponsAdmin = async () => {
  return await Coupon.find().sort({ createdAt: -1 }).lean();
};

const updateCoupon = async (id, data) => {
  const coupon = await Coupon.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!coupon) throw new Error("Mã giảm giá không tồn tại");
  return coupon;
};

const deleteCoupon = async (id) => {
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new Error("Mã giảm giá không tồn tại");
  return coupon;
};

export {
  createCoupon,
  getAllActiveCoupons,
  saveCouponToWallet,
  calculateDiscount,
  getAllCouponsAdmin,
  updateCoupon,
  deleteCoupon,
};
