import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

const updateUser = async (id, userData, currentUserRole) => {
  if (userData.role && currentUserRole !== 1) {
    delete userData.role;
  }

  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: userData },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    throw new Error("Không tìm thấy người dùng để cập nhật");
  }
  return updatedUser;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("Không tìm thấy người dùng để xóa");
  return user;
};

const getUserById = async (id) => {
  const user = await User.findById(id).select("-password").lean();
  if (!user) throw new Error("Người dùng không tồn tại");
  return user;
};

const getAllUsers = async () => {
  const users = await User.find().sort({ createdAt: -1 }).select("-password").lean();
  if (!users) throw new Error("Không lấy được danh sách người dùng");
  return users;
};

const createUser = async (userData) => {
  const { fullname, username, email, password, phone, role } = userData;

  const userExists = await User.findOne({ email }).lean();
  if (userExists) throw new Error("Email đã tồn tại");

  const usernameExists = await User.findOne({ username }).lean();
  if (usernameExists) throw new Error("Username đã tồn tại");

  const user = await User.create({
    fullname,
    username,
    email,
    password, 
    phone: phone || "",
    role: role || 0,
  });

  if (!user) throw new Error("Dữ liệu người dùng không hợp lệ");
  return user;
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Không tìm thấy người dùng");

  if (await user.matchPassword(currentPassword)) {
    user.password = newPassword;
    return await user.save();
  } else {
    throw new Error("Mật khẩu hiện tại không đúng");
  }
};

// ============================================================
// ADDRESS BOOK (Sổ địa chỉ)
// ============================================================

const addAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Không tìm thấy người dùng");

  // Nếu đây là địa chỉ đầu tiên → tự động set mặc định
  if (user.addresses.length === 0) {
    addressData.isDefault = true;
  }

  // Nếu user muốn set mặc định → bỏ mặc định của các address cũ
  if (addressData.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(addressData);
  await user.save();

  return user.toObject({ versionKey: false });
};

const setDefaultAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Không tìm thấy người dùng");

  let found = false;
  user.addresses.forEach((addr) => {
    if (addr._id.toString() === addressId) {
      addr.isDefault = true;
      found = true;
    } else {
      addr.isDefault = false;
    }
  });

  if (!found) throw new Error("Không tìm thấy địa chỉ");

  await user.save();
  return user.toObject({ versionKey: false });
};

const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("Không tìm thấy người dùng");

  const index = user.addresses.findIndex(
    (addr) => addr._id.toString() === addressId
  );
  if (index === -1) throw new Error("Không tìm thấy địa chỉ");

  const wasDefault = user.addresses[index].isDefault;
  user.addresses.splice(index, 1);

  // Nếu xóa address mặc định → set address đầu tiên làm mặc định
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return user.toObject({ versionKey: false });
};

export {
  updateUser,
  deleteUser,
  getUserById,
  getAllUsers,
  createUser,
  updatePassword,
  addAddress,
  setDefaultAddress,
  deleteAddress,
};
