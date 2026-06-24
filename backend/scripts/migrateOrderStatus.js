import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/orderModel.js";

// Load biến môi trường từ file .env trong thư mục backend
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const runMigration = async () => {
  try {
    if (!process.env.DB) {
        throw new Error("Missing DB in .env");
    }
    await mongoose.connect(process.env.DB);
    console.log("Connected to MongoDB for Order Status Migration");

    // Tắt strictQuery để bỏ qua các cảnh báo Mongoose
    mongoose.set('strictQuery', false);

    const orders = await Order.find();
    console.log(`Found ${orders.length} orders. Starting migration...`);

    let updatedCount = 0;

    for (const order of orders) {
      let newStatus = order.status;
      let changed = false;

      // Old mappings: 0=PENDING, 1=PROCESSING, 2=DELIVERED, 3=CANCELLED
      // New mappings: 0=PENDING, 1=CONFIRMED, 2=PREPARING, 3=DELIVERING, 4=DELIVERED, 5=CANCELLED

      if (order.status === 1) {
        newStatus = 3; // PROCESSING -> DELIVERING
        changed = true;
      } else if (order.status === 2) {
        newStatus = 4; // DELIVERED -> DELIVERED (new)
        changed = true;
      } else if (order.status === 3) {
        newStatus = 5; // CANCELLED -> CANCELLED (new)
        changed = true;
      }

      if (changed) {
        // Cập nhật trực tiếp bằng updateOne để bỏ qua các hooks/validation có thể gây lỗi
        await Order.updateOne({ _id: order._id }, { $set: { status: newStatus } });
        updatedCount++;
      }
    }

    console.log(`Migration completed successfully. Updated ${updatedCount} orders.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
