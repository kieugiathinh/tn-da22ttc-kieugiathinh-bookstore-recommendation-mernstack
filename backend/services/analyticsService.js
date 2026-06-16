import { GoogleGenAI } from "@google/genai";
import ChatSession from "../models/chatSessionModel.js";
import dotenv from "dotenv";

dotenv.config();

// ── Gemini client ──────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Danh sách model xoay vòng khi quota exceeded ──────────────────────────────
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

// ═══════════════════════════════════════════════════════════════════════════════
// analyzeChatInsights – Gom data ChatSession → Gemini phân tích → JSON Insights
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Phân tích insights khách hàng từ lịch sử chatbot.
 * @param {number} days - Số ngày quá khứ cần phân tích (mặc định 7)
 * @returns {object} JSON insights từ Gemini
 */
const analyzeChatInsights = async (days = 7) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong file .env");
  }

  // ── BƯỚC 1: AGGREGATION – Gom dữ liệu chat từ MongoDB ──────────────────
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const sessions = await ChatSession.aggregate([
    // Lọc session có cập nhật trong N ngày qua
    { $match: { updatedAt: { $gte: dateThreshold } } },
    // Giải phẳng mảng messages
    { $unwind: "$messages" },
    // Chỉ lấy tin nhắn của user (role = 'user')
    { $match: { "messages.role": "user" } },
    // Trích xuất text từ parts
    {
      $project: {
        _id: 0,
        text: { $arrayElemAt: ["$messages.parts.text", 0] },
        timestamp: "$messages.timestamp",
      },
    },
    // Sắp xếp theo thời gian
    { $sort: { timestamp: -1 } },
    // Giới hạn 200 tin nhắn gần nhất (tránh quá tải token)
    { $limit: 200 },
  ]);

  console.log(`📊 [ANALYTICS] Gom được ${sessions.length} tin nhắn user trong ${days} ngày qua`);

  if (sessions.length === 0) {
    throw new Error(`Không đủ dữ liệu chat trong ${days} ngày qua để phân tích.`);
  }

  // ── BƯỚC 2: FORMAT – Tạo chuỗi text gửi cho Gemini ─────────────────────
  const chatDataText = sessions
    .map((s, i) => `${i + 1}. "${s.text}"`)
    .join("\n");

  // ── BƯỚC 3: PROMPT – System Prompt ép Gemini trả JSON ───────────────────
  const systemPrompt = `Bạn là Giám đốc Kinh doanh (Chief Business Officer) của nhà sách BookBee.
Nhiệm vụ: Đọc toàn bộ dữ liệu tin nhắn của khách hàng gửi đến chatbot trong ${days} ngày qua, phân tích và trả về KẾT QUẢ DƯỚI DẠNG JSON THUẦN TÚY.

QUY TẮC:
1. CHỈ trả về JSON, KHÔNG thêm markdown, KHÔNG thêm giải thích bên ngoài.
2. Mỗi mảng phải có ít nhất 1 phần tử, tối đa 5 phần tử.
3. Mỗi phần tử là một câu ngắn gọn, súc tích bằng tiếng Việt.
4. Nếu không đủ data để kết luận, ghi "Chưa đủ dữ liệu để đánh giá".

FORMAT JSON BẮT BUỘC:
{
  "totalMessagesAnalyzed": <số tin nhắn đã phân tích>,
  "topRequestedMissingBooks": ["Tên sách/thể loại khách tìm nhưng cửa hàng không có 1", "..."],
  "popularCategories": ["Thể loại được hỏi nhiều nhất 1", "..."],
  "commonIssues": ["Vấn đề thường gặp 1 (ví dụ: Phí ship cao, Không tìm thấy sách...)", "..."],
  "customerSentiment": "Tích cực / Trung lập / Tiêu cực (đánh giá chung)",
  "businessAdvice": ["Đề xuất chiến lược kinh doanh 1", "..."]
}`;

  const userPrompt = `Dưới đây là ${sessions.length} tin nhắn khách hàng gửi đến chatbot BookBee:\n\n${chatDataText}`;

  // ── BƯỚC 4: GỌI GEMINI – Xoay vòng model nếu quota exceeded ────────────
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rawResponse = null;

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    try {
      console.log(`🤖 [ANALYTICS] Calling ${model}...`);

      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      rawResponse = response.text?.trim();
      console.log(`✅ [ANALYTICS] ${model} responded successfully`);
      break;
    } catch (error) {
      const isQuotaError =
        error.status === 429 ||
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuotaError && i < GEMINI_MODELS.length - 1) {
        console.warn(`⚠️ [ANALYTICS] ${model} quota exceeded, waiting 5s...`);
        await delay(5000);
        continue;
      }
      throw error;
    }
  }

  if (!rawResponse) {
    throw new Error("Không thể nhận phản hồi từ Gemini API.");
  }

  // ── BƯỚC 5: PARSE JSON – Xử lý an toàn ─────────────────────────────────
  let insights;
  try {
    // Loại bỏ markdown code block nếu Gemini vẫn wrap bằng ```json ... ```
    const cleaned = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    insights = JSON.parse(cleaned);
  } catch (parseError) {
    console.error("❌ [ANALYTICS] JSON parse failed. Raw:", rawResponse);

    // Fallback: trích xuất JSON từ response text bằng regex
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        insights = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("Gemini trả về dữ liệu không đúng format JSON.");
      }
    } else {
      throw new Error("Gemini trả về dữ liệu không đúng format JSON.");
    }
  }

  // ── BƯỚC 6: VALIDATE – Đảm bảo cấu trúc đầy đủ ────────────────────────
  const defaultInsights = {
    totalMessagesAnalyzed: sessions.length,
    topRequestedMissingBooks: ["Chưa đủ dữ liệu"],
    popularCategories: ["Chưa đủ dữ liệu"],
    commonIssues: ["Chưa đủ dữ liệu"],
    customerSentiment: "Chưa đánh giá",
    businessAdvice: ["Chưa đủ dữ liệu"],
  };

  const result = { ...defaultInsights, ...insights };
  result.totalMessagesAnalyzed = sessions.length; // Luôn dùng số thực từ DB

  console.log(`📊 [ANALYTICS] Insights generated successfully:`, Object.keys(result));

  return {
    insights: result,
    meta: {
      period: `${days} ngày`,
      messagesAnalyzed: sessions.length,
      generatedAt: new Date().toISOString(),
    },
  };
};

export { analyzeChatInsights };
