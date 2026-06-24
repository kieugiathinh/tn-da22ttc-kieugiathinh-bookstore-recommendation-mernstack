import mongoose from "mongoose";

const SearchHistorySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Cho phép null với khách chưa đăng nhập (dù tracking chủ yếu cho user đã login)
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Lưu lại source nếu cần phân tích từ đâu (chatbot, navbar...)
    source: {
      type: String,
      default: "navbar",
    }
  },
  {
    timestamps: true,
  }
);

// Index cho chức năng lấy trending (keyword phổ biến)
SearchHistorySchema.index({ keyword: 1, createdAt: -1 });

const SearchHistory = mongoose.model("SearchHistory", SearchHistorySchema);
export default SearchHistory;
