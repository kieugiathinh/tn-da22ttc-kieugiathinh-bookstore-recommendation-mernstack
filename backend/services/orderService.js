import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Review from "../models/reviewModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

const createOrder = async (orderData, userId) => {
  const { products, couponCode } = orderData;

  // 1. KIỂM TRA TỒN KHO
  for (const item of products) {
    const product = await Product.findById(item.productId).lean();
    if (!product) throw new Error(`Sản phẩm ${item.title} không tồn tại`);
    if (product.countInStock < item.quantity) {
      throw new Error(`Sản phẩm "${product.title}" không đủ hàng`);
    }
  }

  // 2. TẠO ĐƠN HÀNG
  const newOrder = new Order({ ...orderData, userId });
  const savedOrder = await newOrder.save();

  // 3. XỬ LÝ HẬU KỲ
  if (!savedOrder) throw new Error("Không thể tạo đơn hàng");

  for (const item of products) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { countInStock: -item.quantity, sold: item.quantity },
    });
  }

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });
    if (coupon) {
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      await User.updateOne(
        { _id: userId, "wallet.coupon": coupon._id },
        { $set: { "wallet.$.isUsed": true } }
      );
    }
  }

  return savedOrder;
};

const getUserOrder = async (userId) => {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });
  const reviews = await Review.find({ user: userId }).lean();
  
  const reviewedSet = new Set(
    reviews.map((r) => `${r.order?.toString()}-${r.product?.toString()}`)
  );
  
  return orders.map((order) => {
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
};

const getAllOrders = async () => {
  return await Order.find().sort({ createdAt: -1 }).lean();
};

const cancelOrder = async (id, userId) => {
  const order = await Order.findById(id);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (order.userId.toString() !== userId.toString()) throw new Error("Không có quyền");
  if (order.status !== 0) throw new Error("Không thể hủy");

  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { countInStock: item.quantity, sold: -item.quantity },
    });
  }
  
  order.status = 3;
  return await order.save();
};

const updateOrder = async (id, data) => {
  const updatedOrder = await Order.findByIdAndUpdate(id, { $set: data }, { new: true });
  if (!updatedOrder) throw new Error("Order not found");
  return updatedOrder;
};

const deleteOrder = async (id) => {
  const order = await Order.findByIdAndDelete(id);
  if (!order) throw new Error("Order not found");
  return order;
};

export {
  createOrder,
  getUserOrder,
  getAllOrders,
  cancelOrder,
  updateOrder,
  deleteOrder,
};
