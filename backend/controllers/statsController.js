import asyncHandler from "express-async-handler";
import * as statsService from "../services/statsService.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getDashboardStats(req.query.type);
  res.status(200).json(stats);
});

export const getRevenueChart = asyncHandler(async (req, res) => {
  const result = await statsService.getRevenueChart();
  res.status(200).json(result);
});

export const getRevenueComparison = asyncHandler(async (req, res) => {
  const result = await statsService.getRevenueComparison(
    parseInt(req.query.year1),
    parseInt(req.query.year2)
  );
  res.status(200).json(result);
});

export const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getCategoryStats();
  res.status(200).json(stats);
});

export const getOrderStatusStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getOrderStatusStats();
  res.status(200).json(stats);
});

export const getProductAnalytics = asyncHandler(async (req, res) => {
  const analytics = await statsService.getProductAnalytics();
  res.status(200).json(analytics);
});

export const getTopCustomers = asyncHandler(async (req, res) => {
  const stats = await statsService.getTopCustomers();
  res.status(200).json(stats);
});

export const getLatestOrders = asyncHandler(async (req, res) => {
  const orders = await statsService.getLatestOrders();
  res.status(200).json(orders);
});
