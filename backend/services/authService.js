import User from "../models/userModel.js";

const registerUser = async (userData) => {
  const { fullname, username, email, password, phone, role } = userData;

  const userEmailExists = await User.findOne({ email }).lean();
  if (userEmailExists) {
    throw new Error("Email này đã được sử dụng");
  }

  const userUsernameExists = await User.findOne({ username }).lean();
  if (userUsernameExists) {
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

  if (!user) {
    throw new Error("Thông tin người dùng không hợp lệ");
  }

  return user;
};

const loginUser = async (username, password) => {
  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    return user;
  } else {
    throw new Error("Username hoặc mật khẩu không đúng");
  }
};

export { registerUser, loginUser };
