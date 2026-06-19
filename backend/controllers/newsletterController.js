import asyncHandler from "express-async-handler";
import Subscriber from "../models/subscriberModel.js";
import { sendNewsletterWelcomeEmail, sendMarketingEmail } from "../services/emailService.js";

// @desc    Subscribe to newsletter
// @route   POST /api/v1/newsletter/subscribe
// @access  Public
export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Vui lòng cung cấp email");
  }

  // Regex validate email
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Email không hợp lệ");
  }

  const subscriberExists = await Subscriber.findOne({ email });

  if (subscriberExists) {
    res.status(400);
    throw new Error("Email này đã được đăng ký nhận bản tin");
  }

  const subscriber = await Subscriber.create({ email });

  if (subscriber) {
    // Send welcome email asynchronously
    sendNewsletterWelcomeEmail(subscriber.email).catch((err) => {
      console.error("❌ Gửi newsletter welcome email thất bại:", err.message);
    });

    res.status(201).json({
      message: "Đăng ký nhận bản tin thành công",
    });
  } else {
    res.status(400);
    throw new Error("Dữ liệu đăng ký không hợp lệ");
  }
});

// @desc    Get all subscribers
// @route   GET /api/v1/newsletter/subscribers
// @access  Private/Admin
export const getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
  res.status(200).json(subscribers);
});

// @desc    Send marketing campaign
// @route   POST /api/v1/newsletter/send-campaign
// @access  Private/Admin
export const sendCampaign = asyncHandler(async (req, res) => {
  const { target, specificEmails, subject, content } = req.body;

  if (!subject || !content) {
    res.status(400);
    throw new Error("Vui lòng cung cấp tiêu đề và nội dung email");
  }

  let emailsToSend = [];

  if (target === "all") {
    // Lấy tất cả subscribers
    const subscribers = await Subscriber.find({ isSubscribed: true });
    emailsToSend = subscribers.map(s => s.email);
  } else if (target === "specific") {
    if (!specificEmails || specificEmails.length === 0) {
      res.status(400);
      throw new Error("Vui lòng chọn ít nhất một email");
    }
    emailsToSend = specificEmails;
  } else {
    res.status(400);
    throw new Error("Target không hợp lệ");
  }

  if (emailsToSend.length === 0) {
    res.status(400);
    throw new Error("Không có email nào để gửi");
  }

  // Gọi service gửi email
  sendMarketingEmail(emailsToSend, subject, content).catch(err => {
    console.error("❌ Lỗi gửi chiến dịch email:", err.message);
  });

  res.status(200).json({
    message: `Chiến dịch đang được gửi tới ${emailsToSend.length} người dùng`,
  });
});
