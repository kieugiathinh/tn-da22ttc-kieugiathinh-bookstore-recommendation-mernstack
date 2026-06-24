import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import { paymentService } from "../services/paymentService.js";

// @desc    Tạo link thanh toán VNPay
// @route   POST /api/v1/payment/create_payment_url
// @access  Private (hoặc Public nếu khách không đăng nhập)
const createPaymentUrl = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;

  if (!amount || !orderId) {
    res.status(400);
    throw new Error("Thiếu số tiền hoặc mã đơn hàng");
  }

  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress ||
    "127.0.0.1";

  // Ủy quyền toàn bộ logic tạo mã hóa cho Service
  const paymentUrl = paymentService.createVNPayUrl({
    orderId,
    amount,
    ipAddr,
  });

  res.status(200).json({ paymentUrl });
});

// @desc    Xử lý kết quả trả về từ VNPay (Return URL)
// @route   GET /api/v1/payment/vnpay_return
// @access  Public
const vnpayReturn = asyncHandler(async (req, res) => {
  // Nhờ Service phân tích và check tính vẹn toàn (Checksum)
  const result = paymentService.verifyVNPayReturn(req.query);

  if (result.isValid) {
    if (result.responseCode === "00") {
      // Giao dịch thành công
      await Order.findByIdAndUpdate(result.orderId, { status: 1 });
      res.status(200).json({
        success: true,
        message: "Giao dịch thành công",
        orderId: result.orderId,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Giao dịch thất bại",
        code: result.responseCode,
      });
    }
  } else {
    res.status(400).json({ success: false, message: "Chữ ký không hợp lệ" });
  }
});

export { createPaymentUrl, vnpayReturn };
