import asyncHandler from "express-async-handler";
import * as newsletterService from "../services/newsletterService.js";

// @desc    Subscribe to newsletter
// @route   POST /api/v1/newsletter/subscribe
// @access  Public
export const subscribeNewsletter = asyncHandler(async (req, res) => {
  try {
    const result = await newsletterService.subscribeNewsletter(req.body.email);
    res.status(201).json(result);
  } catch (error) {
    if (
      error.message === "Vui lòng cung cấp email" ||
      error.message === "Email không hợp lệ" ||
      error.message === "Email này đã được đăng ký nhận bản tin" ||
      error.message === "Dữ liệu đăng ký không hợp lệ"
    ) {
      res.status(400);
      throw new Error(error.message);
    }
    throw error;
  }
});

// @desc    Get all subscribers
// @route   GET /api/v1/newsletter/subscribers
// @access  Private/Admin
export const getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await newsletterService.getSubscribers();
  res.status(200).json(subscribers);
});

// @desc    Send marketing campaign
// @route   POST /api/v1/newsletter/send-campaign
// @access  Private/Admin
export const sendCampaign = asyncHandler(async (req, res) => {
  const { target, specificEmails, subject, content } = req.body;

  try {
    const result = await newsletterService.sendCampaign(target, specificEmails, subject, content);
    res.status(200).json(result);
  } catch (error) {
    if (
      error.message === "Vui lòng cung cấp tiêu đề và nội dung email" ||
      error.message === "Vui lòng chọn ít nhất một email" ||
      error.message === "Target không hợp lệ" ||
      error.message === "Không có email nào để gửi"
    ) {
      res.status(400);
      throw new Error(error.message);
    }
    throw error;
  }
});
