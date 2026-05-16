import { GoogleGenAI } from "@google/genai";
import Product from "../models/productModel.js";
import Category from "../models/categoryModel.js";
import ChatSession from "../models/chatSessionModel.js";
import dotenv from "dotenv";

dotenv.config();

// ── Khởi tạo Gemini client ────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Cấu hình ──────────────────────────────────────────────────────────────────
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];
const MAX_BOOKS_CONTEXT = 7; // Tăng lên 7 để Gemini có đủ nguyên liệu
const MAX_HISTORY_MESSAGES = 14; // Giới hạn lịch sử gửi cho Gemini (7 cặp user-model)

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

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bảng đồng nghĩa / Alias – Mở rộng từ khóa để tăng độ phủ tìm kiếm.
 * Key: cụm từ user có thể nhập → Values: các từ mở rộng để search.
 */
const SYNONYM_MAP = [
  { patterns: ["tiếng anh", "english", "anh ngữ", "anh văn"], expand: ["english", "tiếng anh", "ngoại ngữ", "vocabulary", "grammar", "toeic", "ielts"] },
  { patterns: ["tiếng nhật", "japanese", "nhật ngữ"], expand: ["tiếng nhật", "japanese", "ngoại ngữ", "nihongo"] },
  { patterns: ["tiếng hàn", "korean", "hàn ngữ"], expand: ["tiếng hàn", "korean", "ngoại ngữ"] },
  { patterns: ["tiếng trung", "chinese", "trung ngữ", "trung quốc"], expand: ["tiếng trung", "chinese", "ngoại ngữ", "hán"] },
  { patterns: ["ngoại ngữ", "ngôn ngữ", "language"], expand: ["ngoại ngữ", "english", "tiếng anh", "tiếng nhật", "tiếng hàn", "tiếng trung"] },
  { patterns: ["kinh tế", "kinh doanh", "business", "tài chính", "đầu tư"], expand: ["kinh tế", "kinh doanh", "tài chính", "đầu tư", "business", "marketing"] },
  { patterns: ["tâm lý", "kỹ năng sống", "self-help", "phát triển bản thân"], expand: ["tâm lý", "kỹ năng sống", "self-help", "phát triển", "thói quen", "tư duy"] },
  { patterns: ["thiếu nhi", "trẻ em", "children", "nhi đồng", "trẻ con"], expand: ["thiếu nhi", "trẻ em", "children", "cổ tích", "nhi đồng", "tuổi thơ"] },
  { patterns: ["văn học", "tiểu thuyết", "truyện", "novel"], expand: ["văn học", "tiểu thuyết", "truyện", "novel", "tản văn", "thơ"] },
  { patterns: ["nuôi dạy con", "làm cha mẹ", "parenting", "giáo dục con"], expand: ["nuôi dạy con", "cha mẹ", "parenting", "giáo dục", "trẻ em"] },
  { patterns: ["lịch sử", "history", "tiểu sử", "hồi ký"], expand: ["lịch sử", "history", "tiểu sử", "hồi ký", "nhân vật"] },
  { patterns: ["giáo khoa", "tham khảo", "học sinh", "lớp"], expand: ["giáo khoa", "tham khảo", "bài tập", "học sinh"] },
  { patterns: ["khoa học", "science", "công nghệ", "technology", "lập trình", "programming"], expand: ["khoa học", "science", "công nghệ", "lập trình", "programming", "AI"] },
  { patterns: ["nấu ăn", "ẩm thực", "cooking", "món ăn"], expand: ["nấu ăn", "ẩm thực", "cooking", "công thức"] },
  { patterns: ["bán chạy", "best seller", "nổi bật", "hot", "phổ biến"], expand: ["__BESTSELLER__"] },
];

/**
 * Các cụm từ ghép cần giữ nguyên, không được tách rời.
 */
const COMPOUND_PHRASES = [
  "tiếng anh", "tiếng nhật", "tiếng hàn", "tiếng trung", "tiếng pháp", "tiếng đức",
  "kỹ năng sống", "phát triển bản thân", "nuôi dạy con", "kinh doanh",
  "thiếu nhi", "ngoại ngữ", "giáo khoa", "tham khảo", "tiểu sử", "hồi ký",
  "tâm lý học", "văn học", "khoa học", "lập trình", "trí tuệ nhân tạo",
  "trinh thám", "kinh dị", "lãng mạn", "self help",
];

/**
 * Trích xuất từ khóa thông minh: giữ cụm từ ghép, lọc stop words, mở rộng synonym.
 * Trả về object { keywords: string[], isBestSeller: boolean }
 */
const extractKeywords = (message) => {
  const stopWords = new Set([
    "tôi", "tui", "mình", "bạn", "ơi", "à", "ạ", "nhé", "nha", "vậy",
    "cho", "của", "và", "với", "hay", "hoặc", "nếu", "thì", "là", "có",
    "không", "được", "đang", "đã", "sẽ", "rồi", "nhưng", "mà", "còn",
    "này", "đó", "kia", "nào", "gì", "sao", "thế", "như", "để", "vì",
    "từ", "tới", "đến", "trong", "ngoài", "trên", "dưới", "giữa",
    "muốn", "cần", "tìm", "kiếm", "xem", "biết", "hỏi", "giúp",
    "cuốn", "quyển", "book", "gợi ý", "giới thiệu",
    "mua", "bán", "nên", "thích", "yêu",
    "sách", "học", "đọc", "giá", "rẻ", "đắt", "tư vấn",
    "về", "liên", "quan", "the", "and", "of", "an", "is", "it",
    "hãy", "xin", "làm", "ơn", "cảm", "ơn", "ok", "hi", "hello",
    "chào", "hey", "haha", "hihi", "ừ", "ờ", "dạ",
  ]);

  const lowerMessage = message.toLowerCase().trim();

  // ── Bước 1: Tìm cụm từ ghép trong câu ────────────────────────────────────
  const foundPhrases = [];
  let processedMessage = lowerMessage;

  for (const phrase of COMPOUND_PHRASES) {
    if (processedMessage.includes(phrase)) {
      foundPhrases.push(phrase);
      processedMessage = processedMessage.replace(new RegExp(phrase, "g"), " ");
    }
  }

  // ── Bước 2: Tách từ đơn còn lại, lọc stop words ─────────────────────────
  const singleWords = processedMessage
    .replace(/[^\w\sàáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  // Gộp: cụm từ ghép + từ đơn
  const baseKeywords = [...new Set([...foundPhrases, ...singleWords])];

  // ── Bước 3: Mở rộng từ khóa bằng synonym ────────────────────────────────
  // CHỈ match khi: pattern xuất hiện TRỌN VẸN trong câu gốc HOẶC keyword khớp chính xác
  const expandedKeywords = new Set(baseKeywords);
  let isBestSeller = false;

  for (const entry of SYNONYM_MAP) {
    const matched = entry.patterns.some(
      (p) => lowerMessage.includes(p) || baseKeywords.some((kw) => kw === p)
    );
    if (matched) {
      for (const exp of entry.expand) {
        if (exp === "__BESTSELLER__") {
          isBestSeller = true;
        } else {
          expandedKeywords.add(exp);
        }
      }
    }
  }

  const result = {
    keywords: [...expandedKeywords],
    isBestSeller,
  };

  // ── DEBUG LOG ────────────────────────────────────────────────────────────
  console.log(`\n🔑 [CHATBOT] extractKeywords("${message}"):`);
  console.log(`   Base: [${baseKeywords.join(", ")}]`);
  console.log(`   Expanded: [${result.keywords.join(", ")}]`);

  return result;
};

/**
 * Tìm sách liên quan trong MongoDB – Chiến lược 2 pha:
 *   Phase A: Ưu tiên Category match + Title match (relevance cao)
 *   Phase B: Bổ sung từ author/desc/publisher nếu chưa đủ
 */
const findRelevantBooks = async ({ keywords, isBestSeller }) => {
  let books = [];

  try {
    // ── Bestseller shortcut ─────────────────────────────────────────────────
    if (isBestSeller || keywords.length === 0) {
      books = await Product.find({})
        .sort({ sold: -1, rating: -1 })
        .limit(MAX_BOOKS_CONTEXT)
        .populate("category")
        .lean();
      console.log(`📚 [CHATBOT] Bestseller mode → ${books.length} sách`);
      return books;
    }

    // ── Bước 1: Tìm Category IDs khớp với từ khóa ──────────────────────────
    const categoryRegexConditions = keywords.map((kw) => ({
      name: { $regex: kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
    }));

    let matchedCategoryIds = [];
    try {
      const matchedCategories = await Category.find({
        $or: categoryRegexConditions,
      })
        .select("_id name")
        .lean();
      matchedCategoryIds = matchedCategories.map((c) => c._id);
      console.log(`📂 [CHATBOT] Categories matched: [${matchedCategories.map((c) => c.name).join(", ")}]`);
    } catch (err) {
      console.warn("Category search failed:", err.message);
    }

    // ── Bước 2 (Phase A): Ưu tiên – Category + Title ───────────────────────
    const priorityConditions = [];

    if (matchedCategoryIds.length > 0) {
      priorityConditions.push({ category: { $in: matchedCategoryIds } });
    }

    for (const kw of keywords) {
      const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      priorityConditions.push({ title: { $regex: escapedKw, $options: "i" } });
    }

    if (priorityConditions.length > 0) {
      books = await Product.find({ $or: priorityConditions })
        .sort({ sold: -1, rating: -1 })
        .limit(MAX_BOOKS_CONTEXT)
        .populate("category")
        .lean();
    }

    // ── Bước 3 (Phase B): Bổ sung từ author/desc/publisher ─────────────────
    if (books.length < MAX_BOOKS_CONTEXT) {
      const existingIds = books.map((b) => b._id);
      const secondaryConditions = [];

      for (const kw of keywords) {
        const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        secondaryConditions.push({ author: { $regex: escapedKw, $options: "i" } });
        secondaryConditions.push({ desc: { $regex: escapedKw, $options: "i" } });
        secondaryConditions.push({ publisher: { $regex: escapedKw, $options: "i" } });
      }

      if (secondaryConditions.length > 0) {
        const moreBooks = await Product.find({
          $and: [
            { _id: { $nin: existingIds } },
            { $or: secondaryConditions },
          ],
        })
          .sort({ sold: -1, rating: -1 })
          .limit(MAX_BOOKS_CONTEXT - books.length)
          .populate("category")
          .lean();

        books = [...books, ...moreBooks];
      }
    }

    // ── Bước 4: Fallback – Text search ──────────────────────────────────────
    if (books.length < 3) {
      const existingIds = books.map((b) => b._id);
      const searchString = keywords.join(" ");

      try {
        const textBooks = await Product.find(
          { $text: { $search: searchString }, _id: { $nin: existingIds } },
          { score: { $meta: "textScore" } }
        )
          .sort({ score: { $meta: "textScore" } })
          .limit(MAX_BOOKS_CONTEXT - books.length)
          .populate("category")
          .lean();

        books = [...books, ...textBooks];
      } catch (err) {
        console.warn("Text search fallback failed:", err.message);
      }
    }

    // ── Bước 5: Fallback cuối – Sách nổi bật ───────────────────────────────
    if (books.length === 0) {
      books = await Product.find({})
        .sort({ sold: -1, rating: -1 })
        .limit(MAX_BOOKS_CONTEXT)
        .populate("category")
        .lean();
    }
  } catch (error) {
    console.error("findRelevantBooks Error:", error.message);
    books = await Product.find({})
      .sort({ sold: -1, rating: -1 })
      .limit(MAX_BOOKS_CONTEXT)
      .populate("category")
      .lean();
  }

  // ── DEBUG LOG (BẮT BUỘC) ──────────────────────────────────────────────────
  console.log(`📚 [CHATBOT] Tìm được ${books.length} sách: [${books.map((b) => b.title).join(" | ")}]`);

  return books;
};

/**
 * Format sách thành text context cho prompt.
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

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tìm hoặc tạo mới ChatSession cho user/guest.
 */
const findOrCreateSession = async (userId, sessionId) => {
  const query = userId
    ? { userId, status: "active" }
    : { sessionId, status: "active" };

  let session = await ChatSession.findOne(query).lean();

  if (!session) {
    session = await ChatSession.create({
      userId: userId || null,
      sessionId: userId ? null : sessionId,
      messages: [],
    });
    session = session.toObject();
  }

  return session;
};

/**
 * Lấy lịch sử chat gần nhất và format đúng chuẩn Gemini.
 * Giới hạn số lượng để tránh quá tải Context Window.
 */
const getFormattedHistory = (session) => {
  if (!session.messages || session.messages.length === 0) return [];

  // Lấy N tin nhắn gần nhất
  const recentMessages = session.messages.slice(-MAX_HISTORY_MESSAGES);

  // Đảm bảo lịch sử bắt đầu bằng "user" (yêu cầu của Gemini API)
  const startIdx = recentMessages.findIndex((m) => m.role === "user");
  const validHistory = startIdx >= 0 ? recentMessages.slice(startIdx) : [];

  // Đảm bảo lịch sử kết thúc bằng "model" (user message mới sẽ gửi qua sendMessage)
  if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
    validHistory.pop();
  }

  // Format đúng chuẩn Gemini: { role, parts: [{ text }] }
  return validHistory.map((msg) => ({
    role: msg.role,
    parts: msg.parts.map((p) => ({ text: p.text })),
  }));
};

/**
 * Lưu cặp tin nhắn (user + model) vào MongoDB.
 */
const saveMessages = async (sessionId_db, userMessage, botReply) => {
  const userMsg = {
    role: "user",
    parts: [{ text: userMessage }],
    timestamp: new Date(),
  };
  const modelMsg = {
    role: "model",
    parts: [{ text: botReply }],
    timestamp: new Date(),
  };

  await ChatSession.findByIdAndUpdate(sessionId_db, {
    $push: { messages: { $each: [userMsg, modelMsg] } },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI API CALL (with multi-turn chat + fallback)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Gọi Gemini startChat với history, xoay vòng qua nhiều model nếu quota exceeded.
 * Thêm delay 5s trước mỗi fallback để đợi rate limit reset.
 */
const callGeminiChat = async (systemInstruction, history, userMessage) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    try {
      const chat = ai.chats.create({
        model,
        history,
        config: {
          systemInstruction,
        },
      });

      const response = await chat.sendMessage({ message: userMessage });
      return response.text?.trim() || null;
    } catch (error) {
      const isQuotaError =
        error.status === 429 ||
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuotaError && i < GEMINI_MODELS.length - 1) {
        console.warn(`⚠️ Model ${model} quota exceeded, waiting 5s then trying ${GEMINI_MODELS[i + 1]}...`);
        await delay(5000);
        continue;
      }
      throw error;
    }
  }
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: getChatbotResponse
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hàm chính: RAG + Multi-turn Chat + MongoDB History.
 * @param {string} userMessage - Tin nhắn của user
 * @param {string|null} userId - ID user đã đăng nhập (ObjectId)
 * @param {string|null} sessionId - ID phiên cho khách vãng lai
 */
const getChatbotResponse = async (userMessage, userId = null, sessionId = null) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong file .env");
  }

  try {
    // ── BƯỚC 1: SESSION – Tìm/tạo phiên chat ───────────────────────────────
    const session = await findOrCreateSession(userId, sessionId);

    // ── BƯỚC 2: RETRIEVAL – Trích xuất từ khóa & tìm sách ──────────────────
    const extracted = extractKeywords(userMessage);
    const relevantBooks = await findRelevantBooks(extracted);
    const booksContext = formatBooksForPrompt(relevantBooks);

    // ── BƯỚC 3: HISTORY – Lấy lịch sử chat để bơm vào Gemini ───────────────
    const history = getFormattedHistory(session);

    // ── BƯỚC 4: AUGMENTED – Tạo System Instruction với context sách ─────────
    const systemInstruction = `${SYSTEM_PROMPT}

═══════════════════════════════════════
📚 DANH SÁCH SÁCH CÓ TRONG CỬA HÀNG:
═══════════════════════════════════════
${booksContext}
═══════════════════════════════════════

Hãy trả lời dựa HOÀN TOÀN vào danh sách sách ở trên. Nhớ ngữ cảnh cuộc trò chuyện trước đó.`;

    // ── BƯỚC 5: GENERATION – Gọi Gemini Chat API ───────────────────────────
    const botReply =
      (await callGeminiChat(systemInstruction, history, userMessage)) ||
      "Xin lỗi, GTBOOKS tạm thời không thể trả lời. Bạn vui lòng thử lại nhé! 🙏";

    // ── BƯỚC 6: SAVE – Lưu lịch sử vào MongoDB ────────────────────────────
    await saveMessages(session._id, userMessage, botReply);

    return {
      reply: botReply,
      booksFound: relevantBooks.length,
      keywords: extracted.keywords,
      sessionId: session._id,
    };
  } catch (error) {
    console.error("Chatbot Service Error:", error);

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

/**
 * Lấy lịch sử chat của user/guest.
 */
const getChatHistory = async (userId = null, sessionId = null) => {
  const query = userId
    ? { userId, status: "active" }
    : { sessionId, status: "active" };

  const session = await ChatSession.findOne(query)
    .select("messages")
    .lean();

  if (!session || !session.messages) return [];

  // Format về dạng frontend-friendly
  return session.messages.map((msg) => ({
    sender: msg.role === "user" ? "user" : "bot",
    text: msg.parts.map((p) => p.text).join(""),
    timestamp: msg.timestamp,
  }));
};

export { getChatbotResponse, getChatHistory };
