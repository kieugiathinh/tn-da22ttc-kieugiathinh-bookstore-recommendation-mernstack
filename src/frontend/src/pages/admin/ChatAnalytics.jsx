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
    <div className={`flex items-center gap-1 text-[11px] font-bold ${isPositive ? 'text-emerald-100' : 'text-red-100'}`}>
      {isPositive ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
      {Math.abs(value)}%
    </div>
  );
};

// ── METRIC CARD COMPONENT ──
const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle, trendValue }) => (
  <div className={`rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${bgGradient} text-white relative overflow-hidden group`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</p>
          <TrendIndicator value={trendValue} />
        </div>
        <h3 className="text-3xl font-bold tracking-tight leading-none drop-shadow-sm">{value}</h3>
        {subtitle && <p className="mt-2 text-sm font-medium opacity-90">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="text-2xl" />
      </div>
    </div>
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
  </div>
);

const ChatAnalytics = () => {
  const [days, setDays] = useState(7);
  
  // Real-time Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // AI Insights
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
            <FaRobot className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">Dashboard Chatbot</h1>
            <p className="text-sm text-gray-500 font-medium">Giám sát hiệu quả và phân tích hành vi khách hàng bằng AI</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1.5 shadow-inner">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                days === opt.value
                  ? "bg-white text-orange-600 shadow-md ring-1 ring-orange-200"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── REAL-TIME STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Tổng phiên chat"
          value={loadingStats ? "..." : stats?.current?.totalSessions?.toLocaleString()}
          icon={FaComments}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-500"
          trendValue={stats?.trend?.totalSessions}
        />
        <MetricCard
          title="Đang hoạt động"
          value={loadingStats ? "..." : stats?.current?.activeSessions?.toLocaleString()}
          icon={FaCircleNotch}
          bgGradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          trendValue={stats?.trend?.activeSessions}
        />
        <MetricCard
          title="Tổng tin nhắn"
          value={loadingStats ? "..." : stats?.current?.totalMessages?.toLocaleString()}
          icon={FaCommentDots}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          trendValue={stats?.trend?.totalMessages}
        />
        <MetricCard
          title="Khách đăng nhập"
          value={loadingStats ? "..." : stats?.current?.totalUsers?.toLocaleString()}
          icon={FaUsers}
          bgGradient="bg-gradient-to-br from-violet-500 to-purple-500"
          trendValue={stats?.trend?.totalUsers}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LINE CHART: TIN NHẮN THEO THỜI GIAN ── */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FaChartLine className="text-orange-500" />
            <h3 className="font-bold text-gray-900">Lưu lượng tin nhắn</h3>
          </div>
          <div className="h-[250px] w-full">
            {loadingStats ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">Đang tải biểu đồ...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} tickFormatter={(v) => moment(v).format('DD/MM')} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    labelFormatter={(v) => moment(v).format('DD/MM/YYYY')}
                  />
                  <Line type="monotone" dataKey="messages" name="Tin nhắn" stroke="#f97316" strokeWidth={3} dot={{r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── FUNNEL CHART ── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-emerald-500" />
            <h3 className="font-bold text-gray-900">Hiệu quả tư vấn (Funnel)</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {loadingStats ? (
              <div className="text-center text-gray-400 font-medium">Đang tải...</div>
            ) : (
              <>
                <div className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform"><FaRobot size={18} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-1.5"><span className="text-gray-700">Chatbot đề xuất</span><span className="text-orange-600 font-black">{stats?.funnel?.recommendations || 0}</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-orange-300 h-3 rounded-full w-full"></div></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform"><FaMousePointer size={18} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-1.5"><span className="text-gray-700">Khách Click xem</span><span className="text-orange-600 font-black">{stats?.funnel?.clicks || 0}</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-orange-400 h-3 rounded-full" style={{width: `${(stats?.funnel?.clicks / (stats?.funnel?.recommendations || 1)) * 100}%`}}></div></div>
                  </div>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform"><FaShoppingCart size={18} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-bold mb-1.5"><span className="text-gray-700">Thêm vào giỏ</span><span className="text-orange-600 font-black">{stats?.funnel?.addToCart || 0}</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-3"><div className="bg-orange-500 h-3 rounded-full shadow-sm" style={{width: `${(stats?.funnel?.addToCart / (stats?.funnel?.recommendations || 1)) * 100}%`}}></div></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── TOP SÁCH CHATBOT ĐỀ XUẤT ── */}
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white px-6 py-4">
            <div className="bg-orange-100 p-2 rounded-lg"><FaBookOpen className="text-orange-600" /></div>
            <h3 className="font-bold text-gray-900">Top Sách Chatbot Đề Xuất</h3>
          </div>
          <ul className="p-4 space-y-2">
            {loadingStats ? <li className="text-sm text-gray-400 font-medium text-center py-4">Đang tải...</li> : 
              stats?.topRecommendedBooks?.length > 0 ? stats.topRecommendedBooks.map((b, i) => (
              <li key={i} className="flex justify-between items-center text-sm p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                <span className="font-bold text-gray-700">{b.title}</span>
                <span className="font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-1 rounded-md">{b.count} lần</span>
              </li>
            )) : <li className="text-sm text-gray-400 text-center py-4 font-medium">Chưa có đề xuất nào</li>}
          </ul>
        </div>

        {/* ── TOP SÁCH KHÁCH TÌM NHƯNG THIẾU ── */}
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white px-6 py-4">
            <div className="bg-rose-100 p-2 rounded-lg"><FaExclamationTriangle className="text-rose-600" /></div>
            <h3 className="font-bold text-gray-900">Sách Khách Tìm Nhưng Thiếu</h3>
          </div>
          {insights ? (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                    <th className="py-2 px-3">Tên sách / Chủ đề</th>
                    <th className="py-2 px-3 text-right">Lượt hỏi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {insights.topRequestedMissingBooks?.map((b, i) => (
                    <tr key={i} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-gray-700">{b.bookName || b}</td>
                      <td className="py-3 px-3 text-right font-black text-rose-500">{b.count || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center p-4">
              <p className="text-sm text-gray-400 font-medium bg-gray-50 px-4 py-2 rounded-lg">Vui lòng chạy Phân tích AI để xem dữ liệu</p>
            </div>
          )}
        </div>
      </div>

      {/* ── AI INSIGHTS BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-md">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-xl font-bold flex items-center gap-2"><FaLightbulb className="text-yellow-200" /> Phân tích Chuyên sâu (AI)</h2>
          <p className="text-sm text-orange-50 mt-1 font-medium">Sử dụng Gemini AI để đọc hiểu hàng trăm tin nhắn và đưa ra chiến lược.</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loadingInsights}
          className="bg-white text-orange-600 px-6 py-2.5 rounded-xl font-black tracking-wide hover:bg-orange-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:scale-100 shadow-sm"
        >
          {loadingInsights ? <FaSync className="animate-spin" /> : <FaRobot />}
          {loadingInsights ? "ĐANG XỬ LÝ..." : "CHẠY PHÂN TÍCH AI"}
        </button>
      </div>

      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* PIE CHART SENTIMENT */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center">
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
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none"
                  >
                    {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 text-xs font-bold mt-2">
              <span className="text-emerald-500">😊 {insights.sentimentDistribution?.positive || 0}%</span>
              <span className="text-amber-500">😐 {insights.sentimentDistribution?.neutral || 0}%</span>
              <span className="text-red-500">😞 {insights.sentimentDistribution?.negative || 0}%</span>
            </div>
          </div>

          {/* ĐIỂM NGHẼN */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Điểm nghẽn & Vấn đề</h3>
            <ul className="space-y-3">
              {insights.commonIssues?.map((issue, i) => {
                const style = getPriorityColor(issue.priority);
                return (
                  <li key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
                    <span className="text-xl">{style.icon}</span>
                    <div>
                      <p className="font-bold text-gray-800">{issue.issue}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg text-white mt-1.5 inline-block shadow-sm ${style.bg.replace('50', '500')}`}>
                        Ưu tiên {issue.priority}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* CHIẾN LƯỢC */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-3 xl:col-span-1">
            <h3 className="font-bold text-gray-900 mb-4">AI Đề xuất Chiến lược</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {insights.businessAdvice?.map((adv, i) => (
                <div key={i} className="p-4 rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
                  <h4 className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-1.5">{adv.category}</h4>
                  <p className="text-sm text-gray-800 font-medium leading-relaxed">{adv.advice}</p>
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
