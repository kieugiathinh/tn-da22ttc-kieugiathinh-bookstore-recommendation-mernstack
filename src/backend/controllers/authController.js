import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import * as authService from "../services/authService.js";
import { sendWelcomeEmail, sendResetPasswordEmail } from "../services/emailService.js";

// Register User
// Route POST /api/v1/auth/register
// @access public
const registerUser = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  
  // Gửi Welcome Email bất đồng bộ (không dùng await để tránh block response)
  sendWelcomeEmail(user.email, user.fullname).catch((err) => {
    console.error("❌ Gửi welcome email thất bại:", err.message);
  });

  generateToken(res, user._id);
  res.status(201).json({
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    role: user.role,
    addresses: user.addresses || [],
    wallet: user.wallet || [],
  });
});

// Login User
// route POST api/v1/auth/Login
// @access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  
  generateToken(res, user._id);
  res.status(200).json({
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    addresses: user.addresses || [],
    wallet: user.wallet || [],
  });
});

// Logout User
// route POST /api/v1/auth/Logout
// @access public
const LogOut = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Đăng xuất thành công" });
});

// Login with Google
// route POST /api/v1/auth/google
// @access public
const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    res.status(400);
    throw new Error("Thiếu Google ID Token");
  }

  const user = await authService.loginWithGoogle(idToken);
  
  generateToken(res, user._id);
  res.status(200).json({
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    addresses: user.addresses || [],
    wallet: user.wallet || [],
  });
});

// Forgot Password
// route POST /api/v1/auth/forgot-password
// @access public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Vui lòng nhập email");
  }

  const resetToken = await authService.forgotPassword(email);

  // Tạo reset URL trỏ về Frontend
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  // Gửi email chứa link reset
  await sendResetPasswordEmail(email, resetUrl);

  res.status(200).json({
    message: "Email đặt lại mật khẩu đã được gửi thành công",
  });
});

// Reset Password
// route POST /api/v1/auth/reset-password/:token
// @access public
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400);
    throw new Error("Vui lòng nhập mật khẩu mới");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
  }

  await authService.resetPassword(token, newPassword);

  res.status(200).json({
    message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
  });
});

export { LogOut, loginUser, registerUser, loginWithGoogle, forgotPassword, resetPassword };

