import { GoogleGenAI } from "@google/genai";
import ChatSession from "../models/chatSessionModel.js";
import Product from "../models/productModel.js";
import UserInteraction from "../models/userInteractionModel.js";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

// ═══════════════════════════════════════════════════════════════════════════════
// analyzeChatInsights – Gom data ChatSession → Gemini phân tích → JSON Insights
// ═══════════════════════════════════════════════════════════════════════════════

const analyzeChatInsights = async (days = 7) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong file .env");
  }

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const sessions = await ChatSession.aggregate([
    { $match: { updatedAt: { $gte: dateThreshold } } },
    { $unwind: "$messages" },
    { $match: { "messages.role": "user" } },
    {
      $project: {
        _id: 0,
        text: { $arrayElemAt: ["$messages.parts.text", 0] },
        timestamp: "$messages.timestamp",
      },
    },
    { $sort: { timestamp: -1 } },
    { $limit: 200 },
  ]);

  if (sessions.length === 0) {
    throw new Error(`Không đủ dữ liệu chat trong ${days} ngày qua để phân tích.`);
  }

  const chatDataText = sessions
    .map((s, i) => `${i + 1}. "${s.text}"`)
    .join("\n");

  const systemPrompt = `Bạn là Giám đốc Kinh doanh (Chief Business Officer) của nhà sách BookBee.
Nhiệm vụ: Đọc toàn bộ dữ liệu tin nhắn của khách hàng gửi đến chatbot trong ${days} ngày qua, phân tích và trả về KẾT QUẢ DƯỚI DẠNG JSON THUẦN TÚY.

QUY TẮC:
1. CHỈ trả về JSON, KHÔNG thêm markdown, KHÔNG thêm giải thích bên ngoài.
2. Với các mảng, nếu không đủ data, hãy tự tổng hợp thành 1 object báo lỗi (ví dụ: title: "Chưa đủ dữ liệu", count: 0).
3. "count" (số lần) là do AI TỰ ƯỚC TÍNH dựa trên tần suất từ khóa xuất hiện.

FORMAT JSON BẮT BUỘC:
{
  "topQuestions": [
    { "question": "Sách phát triển bản thân", "count": 28 }
  ],
  "topRequestedMissingBooks": [
    { "bookName": "Tư duy ngược", "count": 15 }
  ],
  "commonIssues": [
    { "issue": "Phí ship cao", "priority": "Cao" } // priority chỉ có: Cao, Trung bình, Thấp
  ],
  "businessAdvice": [
    { "category": "Tăng doanh thu", "advice": "Nổi bật danh mục sách bán chạy" }
  ],
  "popularCategories": [
    { "category": "Tâm lý học", "count": 45 }
  ],
  "sentimentDistribution": {
    "positive": 65,
    "neutral": 25,
    "negative": 10
  }
}`;

  const userPrompt = `Dưới đây là ${sessions.length} tin nhắn khách hàng gửi đến chatbot BookBee:\n\n${chatDataText}`;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let rawResponse = null;

  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      rawResponse = response.text?.trim();
      break;
    } catch (error) {
      const isQuotaError =
        error.status === 429 ||
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuotaError && i < GEMINI_MODELS.length - 1) {
        await delay(5000);
        continue;
      }
      throw error;
    }
  }

  if (!rawResponse) {
    throw new Error("Không thể nhận phản hồi từ Gemini API.");
  }

  let insights;
  try {
    const cleaned = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    insights = JSON.parse(cleaned);
  } catch (parseError) {
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

  const defaultInsights = {
    topQuestions: [],
    topRequestedMissingBooks: [],
    commonIssues: [],
    businessAdvice: [],
    popularCategories: [],
    sentimentDistribution: { positive: 0, neutral: 0, negative: 0 }
  };

  const result = { ...defaultInsights, ...insights };

  return {
    insights: result,
    meta: {
      period: `${days} ngày`,
      messagesAnalyzed: sessions.length,
      generatedAt: new Date().toISOString(),
    },
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// getChatbotBasicStats – Đếm số liệu định lượng (Dashboard Cards & Time Series Chart)
// ═══════════════════════════════════════════════════════════════════════════════

const getChatbotBasicStats = async (days = 7) => {
  const now = new Date();
  
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);
  
  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - days);

  const getStatsForPeriod = async (start, end) => {
    const [sessionStats, userStats] = await Promise.all([
      ChatSession.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
            totalMessages: { $sum: { $size: "$messages" } },
          },
        },
      ]),
      ChatSession.distinct("userId", { createdAt: { $gte: start, $lte: end }, userId: { $ne: null } }),
    ]);

    const stats = sessionStats[0] || { totalSessions: 0, activeSessions: 0, totalMessages: 0 };
    return {
      totalSessions: stats.totalSessions,
      activeSessions: stats.activeSessions,
      totalMessages: stats.totalMessages,
      totalUsers: userStats.length,
    };
  };

  const [currentStats, prevStats] = await Promise.all([
    getStatsForPeriod(currentStart, now),
    getStatsForPeriod(prevStart, currentStart)
  ]);

  const calcTrend = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Lấy dữ liệu tin nhắn theo ngày (Line Chart)
  const messagesOverTime = await ChatSession.aggregate([
    { $match: { updatedAt: { $gte: currentStart, $lte: now } } },
    { $unwind: "$messages" },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$messages.timestamp" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    current: currentStats,
    trend: {
      totalSessions: calcTrend(currentStats.totalSessions, prevStats.totalSessions),
      activeSessions: calcTrend(currentStats.activeSessions, prevStats.activeSessions),
      totalMessages: calcTrend(currentStats.totalMessages, prevStats.totalMessages),
      totalUsers: calcTrend(currentStats.totalUsers, prevStats.totalUsers),
    },
    chartData: messagesOverTime.map(d => ({ date: d._id, messages: d.count }))
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// getChatbotFunnelStats – Funnel & Top Recommendations
// ═══════════════════════════════════════════════════════════════════════════════

const getChatbotFunnelStats = async (days = 7) => {
  const currentStart = new Date();
  currentStart.setDate(currentStart.getDate() - days);

  // 1. Phân tích số lần Đề xuất (Model messages)
  const recommendations = await ChatSession.aggregate([
    { $match: { updatedAt: { $gte: currentStart } } },
    { $unwind: "$messages" },
    { $match: { "messages.role": "model" } },
  ]);

  let totalRecommendations = 0;
  const bookCounts = {};
  
  // Trích xuất [BOOKID: xxx]
  const regex = /\[BOOKID:\s*([a-fA-F0-9]{24})\]/g;
  recommendations.forEach(session => {
    const text = session.messages.parts?.[0]?.text || "";
    let match;
    while ((match = regex.exec(text)) !== null) {
      totalRecommendations++;
      const id = match[1];
      bookCounts[id] = (bookCounts[id] || 0) + 1;
    }
  });

  // Top Sách Đề xuất
  const topBookIds = Object.keys(bookCounts).sort((a, b) => bookCounts[b] - bookCounts[a]).slice(0, 10);
  const topBooksData = await Product.find({ _id: { $in: topBookIds } }).select("title img").lean();
  
  const topRecommendedBooks = topBookIds.map(id => {
    const book = topBooksData.find(b => b._id.toString() === id);
    return {
      title: book ? book.title : "Sách không xác định",
      count: bookCounts[id]
    };
  });

  // 2. Funnel Interactions
  const interactions = await UserInteraction.aggregate([
    { $match: { createdAt: { $gte: currentStart }, source: "chatbot" } },
    {
      $group: {
        _id: "$interactionType",
        count: { $sum: 1 }
      }
    }
  ]);

  let totalClicks = 0;
  let totalAddCart = 0;
  let totalPurchases = 0;

  interactions.forEach(i => {
    if (i._id === "search_click" || i._id === "view") totalClicks += i.count;
    if (i._id === "add_to_cart") totalAddCart += i.count;
    if (i._id === "purchase") totalPurchases += i.count;
  });

  return {
    funnel: {
      recommendations: totalRecommendations,
      clicks: totalClicks,
      addToCart: totalAddCart,
      purchases: totalPurchases
    },
    topRecommendedBooks
  };
};

export { analyzeChatInsights, getChatbotBasicStats, getChatbotFunnelStats };
