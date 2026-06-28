import mongoose from "mongoose";

/**
 * Schema cho từng tin nhắn trong cuộc trò chuyện.
 * Tuân thủ chuẩn Gemini API: { role: 'user' | 'model', parts: [{ text }] }
 */
const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },
    parts: [
      {
        text: {
          type: String,
          required: true,
        },
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Schema cho phiên trò chuyện (Chat Session).
 * Hỗ trợ cả user đã đăng nhập (userId) và khách vãng lai (sessionId).
 */
const ChatSessionSchema = new mongoose.Schema(
  {
    // ID người dùng đã đăng nhập (liên kết với User model)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ID phiên cho khách vãng lai (sinh random ở Frontend)
    sessionId: {
      type: String,
      default: null,
    },

    // Mảng tin nhắn – Lịch sử trò chuyện
    messages: [MessageSchema],

    // Trạng thái phiên: active hoặc closed
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Index để tìm kiếm nhanh theo userId hoặc sessionId
ChatSessionSchema.index({ userId: 1, status: 1 });
ChatSessionSchema.index({ sessionId: 1, status: 1 });
// TTL index: tự động xóa session khách vãng lai sau 7 ngày không hoạt động
ChatSessionSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { userId: null } }
);

const ChatSession = mongoose.model("ChatSession", ChatSessionSchema);
export default ChatSession;
