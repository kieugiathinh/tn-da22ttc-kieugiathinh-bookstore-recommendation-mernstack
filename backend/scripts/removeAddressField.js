/**
 * Migration Script: Xóa field `address` (String) legacy khỏi toàn bộ users
 *
 * Chạy một lần duy nhất: node scripts/removeAddressField.js
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
        { address: { $exists: true } },
        { $unset: { address: "" } }
      );

    console.log(`✅ Hoàn thành! Đã xóa field 'address' khỏi ${result.modifiedCount} documents.`);
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB.");
    process.exit(0);
  }
};

run();
