import { GoogleGenAI } from "@google/genai";
import Product from "../models/productModel.js";
import dotenv from "dotenv";

dotenv.config();

// ── Khởi tạo Gemini client ────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Cấu hình ──────────────────────────────────────────────────────────────────
const GEMINI_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash-lite";
const MAX_BOOKS_CONTEXT = 5; // Số sách tối đa bơm vào prompt

// ── System prompt – "Tính cách" của chatbot ───────────────────────────────────
const SYSTEM_PROMPT = `Bạn là nhân viên tư vấn của nhà sách GTBOOKS – một nhà sách trực tuyến uy tín.

QUY TẮC BẮT BUỘC:
1. Xưng hô: Xưng là "GTBOOKS" hoặc "mình", gọi khách là "bạn".
2. Phong cách: Thân thiện, nhiệt tình, ngắn gọn. Dùng emoji vừa phải 📚✨.
3. CHỈ được tư vấn dựa trên DANH SÁCH SÁCH bên dưới. TUYỆT ĐỐI KHÔNG bịa ra sách không có trong danh sách.
4. Nếu không tìm thấy sách phù hợp, hãy nói: "Hiện tại GTBOOKS chưa có sách phù hợp với yêu cầu của bạn, nhưng mình sẽ cập nhật thêm nhé!"
5. Khi giới thiệu sách, đề cập: tên sách, tác giả, giá bán, và mô tả ngắn gọn.
6. Nếu sách có giá khuyến mãi (discountedPrice > 0), hãy highlight giá ưu đãi.
7. Format giá tiền theo VNĐ (ví dụ: 120.000đ).
8. Nếu câu hỏi không liên quan đến sách/nhà sách, lịch sự từ chối và hướng về chủ đề sách.`;

/**
 * Trích xuất các từ khóa chính từ câu hỏi của user.
 * Loại bỏ các stop words tiếng Việt phổ biến để tìm kiếm hiệu quả hơn.
 */
const extractKeywords = (message) => {
  const stopWords = new Set([
    "tôi", "tui", "mình", "bạn", "ơi", "à", "ạ", "nhé", "nha", "vậy",
    "cho", "của", "và", "với", "hay", "hoặc", "nếu", "thì", "là", "có",
    "không", "được", "đang", "đã", "sẽ", "rồi", "nhưng", "mà", "còn",
    "này", "đó", "kia", "nào", "gì", "sao", "thế", "như", "để", "vì",
    "từ", "tới", "đến", "trong", "ngoài", "trên", "dưới", "giữa",
    "muốn", "cần", "tìm", "kiếm", "xem", "biết", "hỏi", "giúp",
    "sách", "cuốn", "quyển", "book", "tư vấn", "gợi ý", "giới thiệu",
    "mua", "bán", "giá", "rẻ", "đắt", "nên", "thích", "yêu",
    "về", "liên", "quan", "the", "and", "of", "a", "an", "is", "it",
    "hãy", "xin", "làm", "ơn", "cảm", "ơn", "ok", "hi", "hello",
    "chào", "hey", "haha", "hihi",
  ]);

  // Loại bỏ dấu câu, chuyển lowercase, tách từ
  const words = message
    .toLowerCase()
    .replace(/[^\w\sàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  return [...new Set(words)]; // Loại bỏ trùng lặp
};

/**
 * Tìm sách liên quan trong MongoDB dựa trên từ khóa.
 * Sử dụng $text search (text index) + regex fallback.
 */
const findRelevantBooks = async (keywords) => {
  let books = [];

  if (keywords.length > 0) {
    const searchString = keywords.join(" ");

    // Thử text search trước (dùng text index đã tạo trên title, author)
    try {
      books = await Product.find(
        { $text: { $search: searchString } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(MAX_BOOKS_CONTEXT)
        .populate("category")
        .lean();
    } catch (err) {
      // Fallback nếu text index có vấn đề
      console.warn("Text search failed, falling back to regex:", err.message);
    }

    // Nếu text search không đủ kết quả → bổ sung bằng regex
    if (books.length < MAX_BOOKS_CONTEXT) {
      const existingIds = books.map((b) => b._id);
      const regexConditions = keywords.map((kw) => ({
        $or: [
          { title: { $regex: kw, $options: "i" } },
          { author: { $regex: kw, $options: "i" } },
          { desc: { $regex: kw, $options: "i" } },
          { publisher: { $regex: kw, $options: "i" } },
        ],
      }));

      const regexBooks = await Product.find({
        $and: [
          { _id: { $nin: existingIds } },
          { $or: regexConditions },
        ],
      })
        .limit(MAX_BOOKS_CONTEXT - books.length)
        .populate("category")
        .lean();

      books = [...books, ...regexBooks];
    }
  }

  // Nếu vẫn không tìm thấy → lấy sách nổi bật (bán chạy + đánh giá cao)
  if (books.length === 0) {
    books = await Product.find({})
      .sort({ sold: -1, rating: -1 })
      .limit(MAX_BOOKS_CONTEXT)
      .populate("category")
      .lean();
  }

  return books;
};

/**
 * Format thông tin sách thành chuỗi text để bơm vào prompt.
 */
const formatBooksForPrompt = (books) => {
  if (!books.length) return "Không có sách nào trong cơ sở dữ liệu.";

  return books
    .map((book, index) => {
      const category = book.category?.name || "Chưa phân loại";
      const price = book.originalPrice?.toLocaleString("vi-VN") + "đ";
      const salePrice =
        book.discountedPrice > 0
          ? book.discountedPrice.toLocaleString("vi-VN") + "đ"
          : null;

      return `${index + 1}. "${book.title}"
   - Tác giả: ${book.author}
   - Thể loại: ${category}
   - NXB: ${book.publisher}
   - Giá: ${price}${salePrice ? ` → Giá KM: ${salePrice}` : ""}
   - Đánh giá: ${book.rating}/5 (${book.numReviews} lượt)
   - Đã bán: ${book.sold || 0} cuốn
   - Mô tả: ${book.desc?.substring(0, 200) || "Chưa có mô tả"}...`;
    })
    .join("\n\n");
};

/**
 * Gọi Gemini API với fallback model nếu model chính bị quota.
 */
const callGemini = async (prompt) => {
  const models = [GEMINI_MODEL, FALLBACK_MODEL];

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      return response.text?.trim() || null;
    } catch (error) {
      const isQuotaError =
        error.status === 429 ||
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuotaError && model !== models[models.length - 1]) {
        console.warn(`Model ${model} quota exceeded, trying fallback...`);
        continue;
      }
      throw error;
    }
  }
  return null;
};

/**
 * Hàm chính: Nhận tin nhắn user → RAG → Gemini → Trả câu trả lời.
 */
const getChatbotResponse = async (userMessage) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong file .env");
  }

  try {
    // ── BƯỚC 1: RETRIEVAL – Trích xuất từ khóa & tìm sách ──────────────────
    const keywords = extractKeywords(userMessage);
    const relevantBooks = await findRelevantBooks(keywords);
    const booksContext = formatBooksForPrompt(relevantBooks);

    // ── BƯỚC 2: AUGMENTED – Tạo prompt với ngữ cảnh sách ───────────────────
    const augmentedPrompt = `${SYSTEM_PROMPT}

═══════════════════════════════════════
📚 DANH SÁCH SÁCH CÓ TRONG CỬA HÀNG:
═══════════════════════════════════════
${booksContext}
═══════════════════════════════════════

Câu hỏi của khách hàng: "${userMessage}"

Hãy trả lời dựa HOÀN TOÀN vào danh sách sách ở trên.`;

    // ── BƯỚC 3: GENERATION – Gọi Gemini API (có fallback) ──────────────────
    const botReply =
      (await callGemini(augmentedPrompt)) ||
      "Xin lỗi, GTBOOKS tạm thời không thể trả lời. Bạn vui lòng thử lại nhé! 🙏";

    return {
      reply: botReply,
      booksFound: relevantBooks.length,
      keywords,
    };
  } catch (error) {
    console.error("Chatbot Service Error:", error);

    // Xử lý các lỗi cụ thể từ Gemini
    if (error.message?.includes("API key") || error.message?.includes("API_KEY_INVALID")) {
      throw new Error("API Key Gemini không hợp lệ. Vui lòng kiểm tra lại.");
    }
    if (error.status === 429 || error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error(
        "Gemini API tạm thời quá tải. Vui lòng thử lại sau vài giây nhé! ⏳"
      );
    }

    throw new Error(
      "Xin lỗi, hệ thống chatbot đang gặp sự cố. Vui lòng thử lại sau."
    );
  }
};

export { getChatbotResponse };

