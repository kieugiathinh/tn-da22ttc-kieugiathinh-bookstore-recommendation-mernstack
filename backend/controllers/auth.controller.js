import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import generateToken from "../util/generateToken.js";

// Register User
// Route POST /api/v1/auth/register
// @access public
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password, phone, role } = req.body;

  const userEmailExists = await User.findOne({ email });
  if (userEmailExists) {
    res.status(400);
    throw new Error("Email này đã được sử dụng");
  }

  const userUsernameExists = await User.findOne({ username });
  if (userUsernameExists) {
    res.status(400);
    throw new Error("Username này đã được sử dụng");
  }

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    phone,
    role: role || 0,
  });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error("Thông tin người dùng không hợp lệ");
  }
});

// Login User
// route POST api/v1/auth/Login
// @access public
const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
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
  } else {
    res.status(401);
    throw new Error("Username hoặc mật khẩu không đúng");
  }
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

export { LogOut, loginUser, registerUser };
