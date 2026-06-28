import asyncHandler from "express-async-handler";
import * as orderService from "../services/orderService.js";

// Create Order
const createOrder = asyncHandler(async (req, res) => {
  // Pass req.user.id if available, otherwise it relies on req.body for now
  const userId = req.user ? req.user.id : req.body.userId;
  const savedOrder = await orderService.createOrder(req.body, userId);
  res.status(201).json(savedOrder);
});

const getUserOrder = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrder(req.params.id);
  res.status(200).json(result);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.status(200).json(orders);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const updatedOrder = await orderService.cancelOrder(req.params.id, req.user._id);
  res.status(200).json({ message: "Hủy đơn thành công", order: updatedOrder });
});

const updateOrder = asyncHandler(async (req, res) => {
  const updatedOrder = await orderService.updateOrder(req.params.id, req.body);
  res.status(200).json(updatedOrder);
});

const deleteOrder = asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  res.status(200).json({ message: "Order has been deleted" });
});

export {
  getAllOrders,
  getUserOrder,
  deleteOrder,
  createOrder,
  updateOrder,
  cancelOrder,
};
