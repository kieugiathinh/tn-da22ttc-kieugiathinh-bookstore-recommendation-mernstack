import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Review from "../models/review.model.js";
import Coupon from "../models/coupon.model.js";
import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";

// Create Order
const createOrder = asyncHandler(async (req, res) => {
  const { products, couponCode } = req.body;

  // 1. KIỂM TRA TỒN KHO
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Sản phẩm ${item.title} không tồn tại`);
    }
    if (product.countInStock < item.quantity) {
      res.status(400);
      throw new Error(`Sản phẩm "${product.title}" không đủ hàng`);
    }
  }

  // 2. TẠO ĐƠN HÀNG
  const newOrder = new Order(req.body);
  const savedOrder = await newOrder.save();

  // 3. XỬ LÝ HẬU KỲ (Chỉ chạy khi đơn hàng ĐÃ TẠO THÀNH CÔNG)
  if (savedOrder) {
    // A. Trừ tồn kho sản phẩm
    for (const item of products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { countInStock: -item.quantity, sold: item.quantity },
      });
    }

    // B. Xử lý Coupon (ĐÁNH DẤU ĐÃ DÙNG TẠI ĐÂY)
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode });
      if (coupon) {
        // Tăng số lượt dùng chung của mã
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });

        // Đánh dấu mã này là "isUsed: true" trong ví User
        await User.updateOne(
          { _id: req.user.id, "wallet.coupon": coupon._id },
          { $set: { "wallet.$.isUsed": true } }
        );
      }
    }

    // C. Trả về kết quả
    res.status(201).json(savedOrder);
  } else {
    res.status(400);
    throw new Error("Không thể tạo đơn hàng");
  }
});

// ... (Giữ nguyên các hàm getUserOrder, getAllOrders, cancelOrder cũ của bạn)
// Các hàm dưới đây bạn giữ nguyên như cũ nhé:
const getUserOrder = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });
  const reviews = await Review.find({ user: userId });
  const reviewedSet = new Set(
    reviews.map((r) => `${r.order?.toString()}-${r.product?.toString()}`)
  );
  const result = orders.map((order) => {
    const orderObj = order.toObject();
    orderObj.products = orderObj.products.map((product) => {
      const key = `${order._id.toString()}-${product.productId.toString()}`;
      return {
        ...product,
        isReviewed: reviewedSet.has(key),
      };
    });
    return orderObj;
  });
  res.status(200).json(result);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.status(200).json(orders);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Không tìm thấy đơn hàng");
  }
  if (order.userId.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Không có quyền");
  }
  if (order.status !== 0) {
    res.status(400);
    throw new Error("Không thể hủy");
  }

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { countInStock: item.quantity, sold: -item.quantity },
    });
  }
  order.status = 3;
  const updatedOrder = await order.save();
  res.status(200).json({ message: "Hủy đơn thành công", order: updatedOrder });
});

const updateOrder = asyncHandler(async (req, res) => {
  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );
  if (!updatedOrder) {
    res.status(404);
    throw new Error("Order not found");
  } else {
    res.status(200).json(updatedOrder);
  }
});

const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  } else {
    res.status(200).json({ message: "Order has been deleted" });
  }
});

export {
  getAllOrders,
  getUserOrder,
  deleteOrder,
  createOrder,
  updateOrder,
  cancelOrder,
};
