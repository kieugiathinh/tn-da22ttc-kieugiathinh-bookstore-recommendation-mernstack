import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import * as authService from "../services/authService.js";

// Register User
// Route POST /api/v1/auth/register
// @access public
const registerUser = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  
  generateToken(res, user._id);
  res.status(201).json({
    _id: user._id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    role: user.role,
  });
});

// Login User
// route POST api/v1/auth/Login
// @access public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await authService.loginUser(username, password);
  
  generateToken(res, user._id);
  res.status(200).json({
    _id: user._id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    avatar: user.avatar,
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
    username: user.username,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    avatar: user.avatar,
  });
});

export { LogOut, loginUser, registerUser, loginWithGoogle };
