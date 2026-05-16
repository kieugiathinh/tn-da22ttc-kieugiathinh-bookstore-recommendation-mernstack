import { useState } from "react";
import { userRequest } from "../../requestMethods";
import {
  FaRobot,
  FaBookOpen,
  FaExclamationTriangle,
  FaLightbulb,
  FaChartLine,
  FaSmile,
  FaFolderOpen,
  FaSync,
} from "react-icons/fa";

// ── PERIOD OPTIONS ────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: "3 ngày", value: 3 },
  { label: "7 ngày", value: 7 },
  { label: "14 ngày", value: 14 },
  { label: "30 ngày", value: 30 },
];

// ── INSIGHT CARD ──────────────────────────────────────────────────────────────
const InsightCard = ({ icon: Icon, title, items, borderColor, iconBg, iconColor, emptyText }) => (
  <div className={`rounded-2xl border-2 bg-white shadow-sm hover:shadow-md transition-shadow ${borderColor}`}>
    {/* Header */}
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`text-lg ${iconColor}`} />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
    {/* Body */}
    <div className="p-5">
      {items && items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${iconBg} ${iconColor}`}>
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-gray-400">{emptyText || "Chưa có dữ liệu"}</p>
      )}
    </div>
  </div>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const ChatAnalytics = () => {
  const [days, setDays] = useState(7);
  const [insights, setInsights] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    setMeta(null);

    try {
      const res = await userRequest.get(`/analytics/chat-insights?days=${days}`);
      setInsights(res.data.insights);
      setMeta(res.data.meta);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không thể phân tích dữ liệu. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Sentiment badge color
  const sentimentStyle = (sentiment) => {
    if (!sentiment) return "bg-gray-100 text-gray-500";
    const s = sentiment.toLowerCase();
    if (s.includes("tích cực")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s.includes("tiêu cực")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
              <FaRobot className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                AI Chat Insights
              </h1>
              <p className="text-sm text-gray-500">
                Phân tích hành vi khách hàng từ dữ liệu chatbot
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTROL BAR ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Period Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600">Phân tích trong:</span>
          <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                disabled={isLoading}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  days === opt.value
                    ? "bg-white text-primary-hover shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-800"
                } disabled:opacity-50`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Run Button */}
        <button
          id="btn-run-analysis"
          onClick={handleAnalyze}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:from-violet-700 hover:to-purple-700 active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <FaSync className="animate-spin" />
              <span>Đang phân tích... (có thể mất 15-30s)</span>
            </>
          ) : (
            <>
              <FaChartLine />
              <span>Chạy Phân Tích ({days} Ngày Qua)</span>
            </>
          )}
        </button>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <FaExclamationTriangle className="text-red-500 flex-shrink-0" />
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* ── LOADING STATE ── */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white py-16 shadow-sm">
          {/* Animated AI brain */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <FaRobot className="text-3xl text-violet-600 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-violet-300 border-t-transparent animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">Gemini đang phân tích...</p>
            <p className="mt-1 text-sm text-gray-400">
              Đang gom {days} ngày dữ liệu chat và tạo báo cáo thông minh
            </p>
          </div>
        </div>
      )}

      {/* ── RESULTS ── */}
      {insights && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Meta Info Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaChartLine className="text-violet-500" />
              <span className="font-semibold">{meta?.messagesAnalyzed || 0}</span> tin nhắn đã phân tích
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaFolderOpen className="text-blue-500" />
              Giai đoạn: <span className="font-semibold">{meta?.period}</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-2 text-sm">
              <FaSmile className="text-amber-500" />
              <span className="text-gray-600">Sentiment:</span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${sentimentStyle(insights.customerSentiment)}`}>
                {insights.customerSentiment || "N/A"}
              </span>
            </div>
          </div>

          {/* 3 Insight Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Card 1: Sách Khách Tìm Nhưng Hết Hàng */}
            <InsightCard
              icon={FaBookOpen}
              title="Sách Khách Tìm Nhưng Thiếu"
              items={insights.topRequestedMissingBooks}
              borderColor="border-primary/30"
              iconBg="bg-primary-light"
              iconColor="text-primary"
              emptyText="Khách chưa tìm sách nào đặc biệt"
            />

            {/* Card 2: Vấn Đề Thường Gặp */}
            <InsightCard
              icon={FaExclamationTriangle}
              title="Điểm Nghẽn & Vấn Đề"
              items={insights.commonIssues}
              borderColor="border-amber-300/50"
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              emptyText="Không phát hiện vấn đề nào"
            />

            {/* Card 3: Đề Xuất Chiến Lược */}
            <InsightCard
              icon={FaLightbulb}
              title="Đề Xuất Chiến Lược Từ AI"
              items={insights.businessAdvice}
              borderColor="border-emerald-300/50"
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              emptyText="Chưa có đề xuất"
            />
          </div>

          {/* Popular Categories (Optional extra card) */}
          {insights.popularCategories && insights.popularCategories.length > 0 && (
            <div className="rounded-2xl border border-blue-200/50 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <FaFolderOpen className="text-lg text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900">Thể Loại Được Hỏi Nhiều</h3>
              </div>
              <div className="flex flex-wrap gap-2 p-5">
                {insights.popularCategories.map((cat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EMPTY STATE (chưa chạy phân tích) ── */}
      {!insights && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-20">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
            <FaRobot className="text-2xl text-violet-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-600">Sẵn sàng phân tích</p>
            <p className="mt-1 max-w-md text-sm text-gray-400">
              Nhấn nút <strong>"Chạy Phân Tích"</strong> để AI phân tích dữ liệu chat
              và đưa ra insights kinh doanh cho bạn.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAnalytics;
