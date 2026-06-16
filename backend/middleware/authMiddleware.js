import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const protect = asyncHandler(async (req, res, next) => {
  let token;
  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SEC);

      req.user = await User.findById(decoded.userId).select("-password");

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, invalid token");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 1) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};

/**
 * Optional Protect – Cố gắng xác thực user nhưng không chặn nếu không có token.
 * Dùng cho endpoint hỗ trợ cả guest và user đã đăng nhập (ví dụ: Chatbot).
 */
const optionalProtect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SEC);
      req.user = await User.findById(decoded.userId).select("-password");
    } catch (error) {
      // Token không hợp lệ → vẫn cho đi tiếp như guest
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});

export { protect, admin, optionalProtect };
