import asyncHandler from "express-async-handler";
import * as statsService from "../services/statsService.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getDashboardStats(req.query);
  res.status(200).json(stats);
});

export const getRevenueChart = asyncHandler(async (req, res) => {
  const result = await statsService.getRevenueChart(req.query);
  res.status(200).json(result);
});

export const getRevenueComparison = asyncHandler(async (req, res) => {
  const result = await statsService.getRevenueComparison(req.query);
  res.status(200).json(result);
});

export const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getCategoryStats(req.query);
  res.status(200).json(stats);
});

export const getOrderStatusStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getOrderStatusStats(req.query);
  res.status(200).json(stats);
});

export const getProductAnalytics = asyncHandler(async (req, res) => {
  const analytics = await statsService.getProductAnalytics(req.query);
  res.status(200).json(analytics);
});

export const getTopCustomers = asyncHandler(async (req, res) => {
  const stats = await statsService.getTopCustomers(req.query);
  res.status(200).json(stats);
});

export const getLatestOrders = asyncHandler(async (req, res) => {
  const orders = await statsService.getLatestOrders(req.query);
  res.status(200).json(orders);
});

export const getUserAnalyticsHandler = asyncHandler(async (req, res) => {
  const data = await statsService.getUserAnalytics(req.query);
  res.status(200).json(data);
});

export const getOrderAnalyticsHandler = asyncHandler(async (req, res) => {
  const data = await statsService.getOrderAnalytics(req.query);
  res.status(200).json(data);
});

export const getProductStatsHandler = asyncHandler(async (req, res) => {
  const data = await statsService.getProductStatsAnalytics(req.query);
  res.status(200).json(data);
});

export const getFlashSaleStatsHandler = asyncHandler(async (req, res) => {
  const data = await statsService.getFlashSaleStatsAnalytics(req.query);
  res.status(200).json(data);
});

export const getInteractionFunnelHandler = asyncHandler(async (req, res) => {
  const data = await statsService.getInteractionFunnel(req.query);
  res.status(200).json(data);
});

export const getRecommendationFunnelHandler = asyncHandler(async (req, res) => {
  const data = await statsService.getRecommendationFunnel(req.query);
  res.status(200).json(data);
});