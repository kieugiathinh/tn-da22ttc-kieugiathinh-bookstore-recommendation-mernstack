import Subscriber from "../models/subscriberModel.js";
import User from "../models/userModel.js";
import { sendNewsletterWelcomeEmail, sendMarketingEmail } from "./emailService.js";

export const subscribeNewsletter = async (email) => {
  if (!email) {
    throw new Error("Vui lòng cung cấp email");
  }

  // Regex validate email
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) {
    throw new Error("Email không hợp lệ");
  }

  const subscriberExists = await Subscriber.findOne({ email });

  if (subscriberExists) {
    throw new Error("Email này đã được đăng ký nhận bản tin");
  }

  const subscriber = await Subscriber.create({ email });

  if (!subscriber) {
    throw new Error("Dữ liệu đăng ký không hợp lệ");
  }

  // Send welcome email asynchronously
  sendNewsletterWelcomeEmail(subscriber.email).catch((err) => {
    console.error("❌ Gửi newsletter welcome email thất bại:", err.message);
  });

  return { message: "Đăng ký nhận bản tin thành công" };
};

export const getSubscribers = async () => {
  return await Subscriber.find({}).sort({ createdAt: -1 });
};

export const sendCampaign = async (target, specificEmails, subject, content) => {
  if (!subject || !content) {
    throw new Error("Vui lòng cung cấp tiêu đề và nội dung email");
  }

  let emailsToSend = [];

  if (target === "all_users") {
    const users = await User.find({}).select("email").lean();
    emailsToSend = users.map(u => u.email).filter(e => e);
  } else if (target === "subscribers" || target === "all") {
    const subscribers = await Subscriber.find({ isSubscribed: true });
    emailsToSend = subscribers.map(s => s.email);
  } else if (target === "specific") {
    if (!specificEmails || specificEmails.length === 0) {
      throw new Error("Vui lòng chọn ít nhất một email");
    }
    emailsToSend = specificEmails;
  } else {
    throw new Error("Target không hợp lệ");
  }

  if (emailsToSend.length === 0) {
    throw new Error("Không có email nào để gửi");
  }

  // Gọi service gửi email
  sendMarketingEmail(emailsToSend, subject, content).catch(err => {
    console.error("❌ Lỗi gửi chiến dịch email:", err.message);
  });

  return {
    message: `Chiến dịch đang được gửi tới ${emailsToSend.length} người dùng`,
  };
};
