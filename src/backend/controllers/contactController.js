import contactService from "../services/contactService.js";

class ContactController {
  // CREATE CONTACT (PUBLIC)
  async createContact(req, res) {
    try {
      const contact = await contactService.createContact(req.body);
      res.status(201).json({ message: "Yêu cầu của bạn đã được gửi thành công.", contact });
    } catch (error) {
      res.status(400).json({ message: error.message || "Lỗi khi gửi yêu cầu." });
    }
  }

  // GET ALL CONTACTS (ADMIN ONLY)
  async getAllContacts(req, res) {
    try {
      const { status, topic, search, sort, page, limit } = req.query;
      const filters = { status, topic, search, sort };

      const result = await contactService.getContacts(filters, page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách liên hệ." });
    }
  }

  // REPLY CONTACT (ADMIN ONLY)
  async replyContact(req, res) {
    try {
      const { replyMessage } = req.body;
      const contact = await contactService.replyContact(req.params.id, replyMessage);
      res.status(200).json({ message: "Đã gửi phản hồi thành công.", contact });
    } catch (error) {
      res.status(400).json({ message: error.message || "Lỗi khi phản hồi." });
    }
  }

  // DELETE CONTACT (ADMIN ONLY)
  async deleteContact(req, res) {
    try {
      await contactService.deleteContact(req.params.id);
      res.status(200).json({ message: "Đã xóa liên hệ thành công." });
    } catch (error) {
      res.status(400).json({ message: error.message || "Lỗi khi xóa liên hệ." });
    }
  }
}

export default new ContactController();
