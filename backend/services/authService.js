import User from "../models/userModel.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const loginWithGoogle = async (idToken) => {
  // 1. Verify idToken từ Google
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, name, picture, sub: googleId } = payload;

  // 2. Kiểm tra xem user đã tồn tại chưa (check theo email)
  let user = await User.findOne({ email });

  if (user) {
    // Nếu user tồn tại nhưng chưa có googleId, cập nhật thêm googleId
    if (!user.googleId) {
      user.googleId = googleId;
      // Cập nhật avatar nếu user chưa có
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }
  } else {
    // 3. Nếu user chưa tồn tại -> Tạo user mới
    // Sinh username ngẫu nhiên từ email để tránh trùng lặp
    const baseUsername = email.split('@')[0];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${baseUsername}${randomSuffix}`;

    user = await User.create({
      fullname: name,
      username: username,
      email: email,
      googleId: googleId,
      avatar: picture,
      // Không truyền password vì login bằng Google
    });
  }

  return user;
};

// ============================================
// FORGOT PASSWORD
// Tạo reset token -> Hash lưu DB -> Trả về raw token
// ============================================
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Không tìm thấy tài khoản với email này");
  }

  // Tạo token ngẫu nhiên 32 bytes
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token trước khi lưu vào DB (bảo mật)
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token hết hạn sau 15 phút
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  await user.save();

  // Trả về raw token (chưa hash) để gửi qua email
  return resetToken;
};

// ============================================
// RESET PASSWORD
// Hash token từ URL -> Tìm user hợp lệ -> Cập nhật password
// ============================================
const resetPassword = async (token, newPassword) => {
  // Hash token từ URL để so khớp với token đã hash trong DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }, // Token chưa hết hạn
  });

  if (!user) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }

  // Cập nhật password mới (sẽ được hash tự động bởi pre-save hook)
  user.password = newPassword;

  // Xóa token khỏi DB
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;

  await user.save();

  return user;
};

export { registerUser, loginUser, loginWithGoogle, forgotPassword, resetPassword };

