import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("✅ Đã kết nối MongoDB");

    const result = await mongoose.connection
      .collection("banners")
      .updateMany(
        { type: { $exists: false } }, // Banners that don't have a type yet
        { $set: { type: "main" } }
      );

    console.log(`✅ Hoàn thành! Đã cập nhật ${result.modifiedCount} banners thành 'main'.`);
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối MongoDB.");
    process.exit(0);
  }
};

run();
