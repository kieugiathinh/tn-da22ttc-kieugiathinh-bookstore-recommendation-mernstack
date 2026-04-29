import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";

// Update User
const updateUser = asyncHandler(async (req, res) => {
  if (req.body.role && req.user.role !== 1) {
    delete req.body.role;
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng để cập nhật");
  } else {
    res.status(200).json(updatedUser);
  }
});

// Delete User
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng để xóa");
  } else {
    res.status(200).json({ message: "Xóa người dùng thành công" });
  }
});

// Get One User
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("Người dùng không tồn tại");
  } else {
    res.status(200).json(user);
  }
});

// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("-password");

  if (!users) {
    res.status(404);
    throw new Error("Không lấy được danh sách người dùng");
  } else {
    res.status(200).json(users);
  }
});

// ADMIN CREATE USER (Không tạo token, không ghi đè cookie)
// POST /api/v1/users
const createUser = asyncHandler(async (req, res) => {
  const { fullname, username, email, password, phone, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("Email đã tồn tại");
  }

  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    res.status(400);
    throw new Error("Username đã tồn tại");
  }

  const user = await User.create({
    fullname,
    username,
    email,
    password, // Password sẽ được pre-save hash trong Model
    phone: phone || "",
    role: role || 0,
  });

  if (user) {
    // CHỈ TRẢ VỀ DATA, KHÔNG GỌI generateToken()
    res.status(201).json({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error("Dữ liệu người dùng không hợp lệ");
  }
});

// ĐỔI MẬT KHẨU
// PUT /api/v1/users/update-password
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // req.user lấy từ middleware protect
  const user = await User.findById(req.user._id);

  if (user) {
    // 1. Kiểm tra mật khẩu cũ có đúng không
    if (await user.matchPassword(currentPassword)) {
      // 2. Gán mật khẩu mới
      user.password = newPassword;

      await user.save();

      res.json({ message: "Đổi mật khẩu thành công!" });
    } else {
      res.status(401);
      throw new Error("Mật khẩu hiện tại không đúng");
    }
  } else {
    res.status(404);
    throw new Error("Không tìm thấy người dùng");
  }
});

export {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  createUser,
  updatePassword,
};
