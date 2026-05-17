import asyncHandler from "express-async-handler";
import * as userService from "../services/userService.js";

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body, req.user.role);
  res.status(200).json(updatedUser);
});

// Delete User
const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(200).json({ message: "Xóa người dùng thành công" });
});

// Get One User
const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json(user);
});

// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json(users);
});

// ADMIN CREATE USER
// POST /api/v1/users
const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({
    _id: user._id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    role: user.role,
  });
});

// ĐỔI MẬT KHẨU
// PUT /api/v1/users/update-password
const updatePassword = asyncHandler(async (req, res) => {
  await userService.updatePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  res.json({ message: "Đổi mật khẩu thành công!" });
});

// ============================================================
// ADDRESS BOOK
// ============================================================

// POST /api/v1/users/addresses
const addAddress = asyncHandler(async (req, res) => {
  const user = await userService.addAddress(req.user._id, req.body);
  res.status(201).json(user);
});

// PUT /api/v1/users/addresses/:addressId/default
const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await userService.setDefaultAddress(
    req.user._id,
    req.params.addressId
  );
  res.status(200).json(user);
});

// DELETE /api/v1/users/addresses/:addressId
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await userService.deleteAddress(
    req.user._id,
    req.params.addressId
  );
  res.status(200).json(user);
});

export {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  createUser,
  updatePassword,
  addAddress,
  setDefaultAddress,
  deleteAddress,
};
