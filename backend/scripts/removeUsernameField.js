/**
 * Migration Script: Xóa field `username` khỏi toàn bộ documents trong collection `users`
 *
 * Chạy một lần duy nhất: node scripts/removeUsernameField.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("✅ Đã kết nối MongoDB");

    const result = await mongoose.connection
      .collection("users")
      .updateMany(
        { username: { $exists: true } }, // Chỉ update những doc còn trường username
        { $unset: { username: "" } }
      );

    console.log(`✅ Hoàn thành! Đã xóa field 'username' khỏi ${result.modifiedCount} documents.`);
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB.");
    process.exit(0);
  }
};

run();
