/**
 * ============================================================
 * MIGRATION SCRIPT: Chuyển đổi kiểu dữ liệu trong Collection `orders`
 * ============================================================
 * Mục đích: Convert `userId` (String → ObjectId) và
 *           `products[].productId` (String → ObjectId)
 *
 * ⚠️  CẢNH BÁO: Chạy script này TRƯỚC KHI deploy orderModel.js mới.
 *     Backup database trước khi chạy ở môi trường Production!
 *
 * Cách chạy:
 *   node --env-file=.env scripts/migrateOrderData.js
 * ============================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ─── Kết nối MongoDB ──────────────────────────────────────────────────────────
const connectDB = async () => {
  const DB = process.env.DB;
  if (!DB) {
    console.error("❌ Lỗi: Biến môi trường DB chưa được cấu hình trong .env");
    process.exit(1);
  }
  await mongoose.connect(DB);
  console.log(`✅ Đã kết nối MongoDB: ${mongoose.connection.host}`);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Kiểm tra xem một string có phải ObjectId hợp lệ không.
 * Tránh crash khi gặp giá trị rác trong DB.
 */
const isValidObjectId = (str) => mongoose.Types.ObjectId.isValid(str);

// ─── Hàm Migration Chính ─────────────────────────────────────────────────────
const migrateOrders = async () => {
  const db = mongoose.connection.db;
  const ordersCollection = db.collection("orders");

  // Lấy toàn bộ orders mà userId là kiểu String (không phải ObjectId)
  // MongoDB lưu ObjectId với type code 7, String với type code 2
  const allOrders = await ordersCollection.find({}).toArray();

  console.log(`\n📦 Tổng số đơn hàng tìm thấy: ${allOrders.length}`);
  console.log("🔄 Bắt đầu quá trình migration...\n");

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const order of allOrders) {
    // ─ Kiểm tra xem order này đã là ObjectId chưa (đã migrate trước đó)
    const userIdAlreadyObjectId =
      order.userId instanceof mongoose.Types.ObjectId ||
      typeof order.userId === "object";

    if (userIdAlreadyObjectId) {
      skippedCount++;
      continue; // Đã đúng type → bỏ qua
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Convert userId: String → ObjectId
      const rawUserId = String(order.userId).trim();
      if (!isValidObjectId(rawUserId)) {
        throw new Error(
          `userId "${rawUserId}" không phải ObjectId hợp lệ`
        );
      }
      const newUserId = new mongoose.Types.ObjectId(rawUserId);

      // 2. Convert từng productId trong mảng products
      const updatedProducts = (order.products || []).map((item, idx) => {
        const rawProductId = String(item.productId).trim();
        if (!isValidObjectId(rawProductId)) {
          throw new Error(
            `products[${idx}].productId "${rawProductId}" không phải ObjectId hợp lệ`
          );
        }
        return {
          ...item,
          productId: new mongoose.Types.ObjectId(rawProductId),
        };
      });

      // 3. Thực hiện update document
      await ordersCollection.updateOne(
        { _id: order._id },
        {
          $set: {
            userId: newUserId,
            products: updatedProducts,
          },
        },
        { session }
      );

      await session.commitTransaction();
      successCount++;

      // Log tiến trình mỗi 50 records
      if (successCount % 50 === 0) {
        console.log(`   ✔ Đã xử lý ${successCount} đơn hàng...`);
      }
    } catch (err) {
      await session.abortTransaction();
      errorCount++;
      errors.push({
        orderId: order._id.toString(),
        reason: err.message,
      });
    } finally {
      await session.endSession();
    }
  }

  // ─── Báo cáo kết quả ──────────────────────────────────────────────────────
  console.log("\n============================================");
  console.log("         📊 KẾT QUẢ MIGRATION");
  console.log("============================================");
  console.log(`  ✅ Thành công   : ${successCount} đơn hàng`);
  console.log(`  ⏭  Đã bỏ qua   : ${skippedCount} đơn hàng (đã đúng type)`);
  console.log(`  ❌ Thất bại     : ${errorCount} đơn hàng`);
  console.log("============================================");

  if (errors.length > 0) {
    console.error("\n⚠️  Danh sách đơn hàng bị lỗi:");
    errors.forEach((e) => {
      console.error(`   - Order ID: ${e.orderId} | Lý do: ${e.reason}`);
    });
    console.error(
      "\n👉 Kiểm tra thủ công các đơn hàng trên trước khi tiếp tục."
    );
  } else if (successCount > 0) {
    console.log("\n🎉 Migration hoàn tất thành công! Không có lỗi nào.");
  } else {
    console.log(
      "\nℹ️  Không có đơn hàng nào cần migrate (tất cả đã đúng type)."
    );
  }
};

// ─── Entry Point ──────────────────────────────────────────────────────────────
(async () => {
  try {
    await connectDB();
    await migrateOrders();
  } catch (err) {
    console.error("❌ Migration thất bại nghiêm trọng:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🛑 Đã đóng kết nối MongoDB.");
    process.exit(0);
  }
})();
