import Contact from "../models/contactModel.js";
import { sendContactAutoReply, sendContactAdminReply } from "./emailService.js";

class ContactService {
  /**
   * Tạo liên hệ mới
   */
  async createContact(data) {
    const { name, email, phone, topic, message } = data;

    if (!name || !email || !message) {
      throw new Error("Vui lòng điền đầy đủ Họ tên, Email và Nội dung.");
    }

    const contact = new Contact({
      name,
      email,
      phone,
      topic,
      message,
    });

    await contact.save();

    // Tự động gửi email thông báo đã nhận yêu cầu (chạy ngầm không block process)
    sendContactAutoReply(email, name);

    return contact;
  }

  /**
   * Lấy danh sách liên hệ cho Admin (có phân trang và lọc)
   */
  async getContacts(filters, page = 1, limit = 10) {
    const query = {};

    if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }
    if (filters.topic && filters.topic !== "all") {
      query.topic = filters.topic;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { email: { $regex: filters.search, $options: "i" } },
      ];
    }

    const sort = filters.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;

    const contacts = await Contact.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);

    return {
      contacts,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      totalContacts: total,
    };
  }

  /**
   * Cập nhật và phản hồi liên hệ
   */
  async replyContact(contactId, replyMessage) {
    const contact = await Contact.findById(contactId);

    if (!contact) {
      throw new Error("Không tìm thấy liên hệ này.");
    }

    if (contact.status === "replied") {
      throw new Error("Liên hệ này đã được phản hồi.");
    }

    if (!replyMessage) {
      throw new Error("Vui lòng nhập nội dung phản hồi.");
    }

    // Cập nhật Database
    contact.status = "replied";
    contact.replyMessage = replyMessage;
    await contact.save();

    // Gửi email cho khách hàng
    await sendContactAdminReply(contact.email, contact.name, contact.message, replyMessage);

    return contact;
  }
  /**
   * Xóa liên hệ
   */
  async deleteContact(contactId) {
    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new Error("Không tìm thấy liên hệ này.");
    }
    await Contact.findByIdAndDelete(contactId);
    return true;
  }
}

export default new ContactService();
