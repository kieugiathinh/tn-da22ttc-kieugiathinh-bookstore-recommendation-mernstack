import { useState, useEffect } from "react";
import { userRequest } from "../../requestMethods";
import {
  FaRobot, FaSync, FaComments, FaCommentDots, FaUsers, FaCircleNotch,
  FaArrowUp, FaArrowDown, FaBookOpen, FaLightbulb, FaExclamationTriangle,
  FaChartLine, FaFilter, FaShoppingCart, FaMousePointer, FaEye
} from "react-icons/fa";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { toast } from "sonner";
import moment from "moment";

const PERIOD_OPTIONS = [
  { label: "3 ngày", value: 3 },
  { label: "7 ngày", value: 7 },
  { label: "14 ngày", value: 14 },
  { label: "30 ngày", value: 30 },
];

const COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Tích cực, Trung lập, Tiêu cực

// ── TREND INDICATOR COMPONENT ──
const TrendIndicator = ({ value }) => {
  if (value === undefined || value === null) return null;
  const isPositive = value >= 0;
  return (
    <div className={`flex items-center gap-1 text-[11px] font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
      {isPositive ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
      {Math.abs(value)}%
    </div>
  );
};

const ChatAnalytics = () => {
  const [days, setDays] = useState(7);
  
  // Real-time Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // AI Insights
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch real-time stats automatically when days change
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await userRequest.get(`/analytics/chatbot-stats?days=${days}`);
        setStats(res.data);
      } catch (err) {
        toast.error("Không thể tải số liệu thống kê");
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [days]);

  // Fetch AI Insights manually
  const handleAnalyze = async () => {
    setLoadingInsights(true);
    try {
      const res = await userRequest.get(`/analytics/chat-insights?days=${days}`);
      setInsights(res.data.insights);
      toast.success("Phân tích dữ liệu thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi phân tích AI");
    } finally {
      setLoadingInsights(false);
    }
  };

  const getPriorityColor = (priority) => {
    const p = priority?.toLowerCase() || "";
    if (p.includes("cao")) return { bg: "bg-red-50", text: "text-red-600", icon: "🔥" };
    if (p.includes("trung")) return { bg: "bg-amber-50", text: "text-amber-600", icon: "🟡" };
    return { bg: "bg-emerald-50", text: "text-emerald-600", icon: "🟢" };
  };

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
            <FaRobot className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Dashboard Chatbot</h1>
            <p className="text-sm text-gray-500">Giám sát hiệu quả và phân tích hành vi khách hàng bằng AI</p>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                days === opt.value
                  ? "bg-orange-50 text-orange-600 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── REAL-TIME STATS CARDS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <FaComments size={18} />
            </div>
            <TrendIndicator value={stats?.trend?.totalSessions} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng phiên chat</p>
          <h3 className="mt-1 text-2xl font-black text-gray-900">
            {loadingStats ? "..." : stats?.current?.totalSessions?.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <FaCircleNotch size={18} className={stats?.current?.activeSessions > 0 ? "animate-spin" : ""} />
            </div>
            <TrendIndicator value={stats?.trend?.activeSessions} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Đang hoạt động</p>
          <h3 className="mt-1 text-2xl font-black text-gray-900">
            {loadingStats ? "..." : stats?.current?.activeSessions?.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <FaCommentDots size={18} />
            </div>
            <TrendIndicator value={stats?.trend?.totalMessages} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng tin nhắn</p>
          <h3 className="mt-1 text-2xl font-black text-gray-900">
            {loadingStats ? "..." : stats?.current?.totalMessages?.toLocaleString()}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FaUsers size={18} />
            </div>
            <TrendIndicator value={stats?.trend?.totalUsers} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Khách đăng nhập</p>
          <h3 className="mt-1 text-2xl font-black text-gray-900">
            {loadingStats ? "..." : stats?.current?.totalUsers?.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LINE CHART: TIN NHẮN THEO THỜI GIAN ── */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Lưu lượng tin nhắn</h3>
          <div className="h-[250px] w-full">
            {loadingStats ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Đang tải biểu đồ...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => moment(v).format('DD/MM')} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    labelFormatter={(v) => moment(v).format('DD/MM/YYYY')}
                  />
                  <Line type="monotone" dataKey="messages" name="Tin nhắn" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── FUNNEL CHART ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4">Hiệu quả tư vấn (Funnel)</h3>
          <div className="flex-1 flex flex-col justify-center gap-3">
            {loadingStats ? (
              <div className="text-center text-gray-400">Đang tải...</div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><FaRobot /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-1"><span>Chatbot đề xuất</span><span className="text-orange-500">{stats?.funnel?.recommendations || 0}</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-orange-300 h-2.5 rounded-full w-full"></div></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><FaMousePointer /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-1"><span>Khách Click xem</span><span className="text-orange-600">{stats?.funnel?.clicks || 0}</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-orange-400 h-2.5 rounded-full" style={{width: `${(stats?.funnel?.clicks / (stats?.funnel?.recommendations || 1)) * 100}%`}}></div></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0"><FaShoppingCart /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-1"><span>Thêm vào giỏ</span><span className="text-orange-500">{stats?.funnel?.addToCart || 0}</span></div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-orange-500 h-2.5 rounded-full" style={{width: `${(stats?.funnel?.addToCart / (stats?.funnel?.recommendations || 1)) * 100}%`}}></div></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── TOP SÁCH CHATBOT ĐỀ XUẤT ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FaBookOpen className="text-orange-500" /> Top Sách Chatbot Đề Xuất</h3>
          <ul className="space-y-3">
            {loadingStats ? <li className="text-sm text-gray-400">Đang tải...</li> : 
              stats?.topRecommendedBooks?.length > 0 ? stats.topRecommendedBooks.map((b, i) => (
              <li key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                <span className="font-medium text-gray-700">{b.title}</span>
                <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">{b.count} lần</span>
              </li>
            )) : <li className="text-sm text-gray-400">Chưa có đề xuất nào</li>}
          </ul>
        </div>

        {/* ── TOP SÁCH KHÁCH TÌM NHƯNG THIẾU ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FaExclamationTriangle className="text-red-500" /> Sách Khách Tìm Nhưng Thiếu</h3>
          {insights ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr><th className="py-2 px-3">Tên sách / Chủ đề</th><th className="py-2 px-3 text-right">Lượt hỏi</th></tr>
              </thead>
              <tbody>
                {insights.topRequestedMissingBooks?.map((b, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 px-3 font-medium">{b.bookName || b}</td>
                    <td className="py-2 px-3 text-right font-bold text-red-500">{b.count || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="h-full flex items-center justify-center pb-4"><p className="text-sm text-gray-400">Vui lòng chạy Phân tích AI để xem dữ liệu</p></div>
          )}
        </div>
      </div>

      {/* ── AI INSIGHTS BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-md">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-xl font-bold flex items-center gap-2"><FaLightbulb className="text-yellow-200" /> Phân tích Chuyên sâu (AI)</h2>
          <p className="text-sm text-orange-50 mt-1">Sử dụng Gemini AI để đọc hiểu hàng trăm tin nhắn và đưa ra chiến lược.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loadingInsights}
          className="bg-white text-orange-600 px-6 py-2.5 rounded-xl font-bold hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:scale-100 shadow-sm"
        >
          {loadingInsights ? <FaSync className="animate-spin" /> : <FaRobot />}
          {loadingInsights ? "Đang xử lý..." : "Chạy Phân tích AI"}
        </button>
      </div>

      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* PIE CHART SENTIMENT */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col items-center">
            <h3 className="font-bold text-gray-900 mb-2 w-full">Cảm xúc khách hàng</h3>
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Tích cực', value: insights.sentimentDistribution?.positive || 0 },
                      { name: 'Trung lập', value: insights.sentimentDistribution?.neutral || 0 },
                      { name: 'Tiêu cực', value: insights.sentimentDistribution?.negative || 0 }
                    ]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-[11px] font-bold mt-2">
              <span className="text-emerald-500">😊 {insights.sentimentDistribution?.positive || 0}%</span>
              <span className="text-amber-500">😐 {insights.sentimentDistribution?.neutral || 0}%</span>
              <span className="text-red-500">😞 {insights.sentimentDistribution?.negative || 0}%</span>
            </div>
          </div>

          {/* ĐIỂM NGHẼN */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Điểm nghẽn & Vấn đề</h3>
            <ul className="space-y-3">
              {insights.commonIssues?.map((issue, i) => {
                const style = getPriorityColor(issue.priority);
                return (
                  <li key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-lg">{style.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800">{issue.issue}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white mt-1 inline-block ${style.bg.replace('50', '500')}`}>
                        Ưu tiên {issue.priority}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* THỂ LOẠI HỎI NHIỀU (BAR CHART) */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-gray-900 mb-4">Thể loại được hỏi nhiều</h3>
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.popularCategories || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#475569'}} width={100} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHIẾN LƯỢC */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">AI Đề xuất Chiến lược</h3>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-200">
              {insights.businessAdvice?.map((adv, i) => (
                <div key={i} className="p-3 rounded-xl border border-orange-100 bg-orange-50/50">
                  <h4 className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mb-1">{adv.category}</h4>
                  <p className="text-sm text-gray-700">{adv.advice}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAnalytics;
