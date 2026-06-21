import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  FaUsers, FaUserPlus, FaUserSlash, FaRedo,
  FaSync, FaCrown, FaEnvelope, FaChartBar
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";

const TIME_FILTERS = [
  { label: "Hôm nay", value: "day" },
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" },
  { label: "Năm nay", value: "year" },
  { label: "Tất cả", value: "all" },
];

const DONUT_COLORS = ["#f97316", "#94a3b8"]; // Cam = đã mua, Xám = chưa mua

// ─── KPI CARD GRADIENT ────────────────────────────────────────────────────────
const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle, suffix, change }) => (
  <div className={`rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${bgGradient} text-white relative overflow-hidden group`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">{title}</p>
          {change !== undefined && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${change > 0 ? "bg-white/20 text-green-100" : change < 0 ? "bg-black/20 text-red-100" : "bg-white/10 text-gray-100"}`}>
              {change > 0 ? "↑" : change < 0 ? "↓" : "−"} {Math.abs(change)}%
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-black tracking-tight leading-none drop-shadow-sm">{value}</h3>
          {suffix && <span className="text-lg font-bold opacity-90">{suffix}</span>}
        </div>
        {subtitle && <p className="mt-2 text-sm font-medium opacity-90">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="text-2xl" />
      </div>
    </div>
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const UserStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  const fetchData = async (type) => {
    try {
      setLoading(true);
      const res = await userRequest.get(`/stats/user-analytics?type=${type}`);
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(timeRange); }, [timeRange]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-orange-500">
        <FaSync className="animate-spin text-3xl" />
        <span className="font-bold text-lg">Đang tải thống kê khách hàng...</span>
      </div>
    );
  }

  const donutData = [
    { name: "Đã mua hàng", value: data?.totalBuyers ?? 0 },
    { name: "Chưa mua hàng", value: data?.neverBought ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
            Thống kê Khách hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Phân tích hành vi và giá trị khách hàng</p>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1.5 shadow-inner">
          {TIME_FILTERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTimeRange(t.value)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                timeRange === t.value
                  ? "bg-white text-orange-600 shadow-md ring-1 ring-orange-200"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Tổng Khách Hàng"
          value={data?.totalUsers?.toLocaleString() ?? 0}
          change={data?.changes?.totalUsers}
          icon={FaUsers}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          subtitle={`${data?.totalBuyers ?? 0} đã từng mua hàng`}
        />
        <MetricCard
          title="Khách Hàng Mới"
          value={data?.newUsers ?? 0}
          change={data?.changes?.newUsers}
          icon={FaUserPlus}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-500"
          subtitle={`Trong ${TIME_FILTERS.find(t => t.value === timeRange)?.label.toLowerCase()}`}
        />
        <MetricCard
          title="Chưa Mua Hàng"
          value={data?.neverBought ?? 0}
          change={data?.changes?.neverBought}
          icon={FaUserSlash}
          bgGradient="bg-gradient-to-br from-rose-500 to-pink-500"
          subtitle={`${data?.totalUsers ? Math.round((data.neverBought / data.totalUsers) * 100) : 0}% tổng khách`}
        />
        <MetricCard
          title="Tỷ Lệ Quay Lại"
          value={data?.returnRate ?? 0}
          change={data?.changes?.returnRate}
          suffix="%"
          icon={FaRedo}
          bgGradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          subtitle={`${data?.repeatCount ?? 0} khách mua ≥ 2 lần trong kỳ`}
        />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Bar Chart KH mới & KH quay lại */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaChartBar className="text-orange-500" />
              <h3 className="font-extrabold text-gray-900">Phân tích lượng khách mua sắm</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500"></span><span className="text-xs font-bold text-gray-500">Khách mua mới</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500"></span><span className="text-xs font-bold text-gray-500">Khách quay lại</span></div>
            </div>
          </div>
          <div className="h-[280px]">
            {data?.timeChartData && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="newBuyers" name="Khách mua mới" stackId="1" stroke="#f97316" strokeWidth={2} fill="url(#colorNew)" />
                  <Area type="monotone" dataKey="returning" name="Khách quay lại" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRet)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut Chart: Đã mua vs Chưa mua */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <h3 className="font-extrabold text-gray-900 mb-4">Phân bố khách hàng</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></span>
                <span className="text-xs font-bold text-gray-600">Đã mua ({data?.totalBuyers ?? 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400 shadow-sm"></span>
                <span className="text-xs font-bold text-gray-600">Chưa mua ({data?.neverBought ?? 0})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP KH VIP ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg"><FaCrown className="text-amber-500 text-lg" /></div>
            <h3 className="font-extrabold text-gray-900">Top Khách hàng VIP</h3>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1 shadow-sm">Top {data?.topCustomers?.length ?? 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3">#</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3 text-right">Tổng chi tiêu</th>
                <th className="px-4 py-3 text-right">Số đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.topCustomers?.map((c, i) => (
                <tr key={i} className="hover:bg-orange-50/30 transition-colors group">
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center justify-center font-black shadow-sm ${
                      i < 3 ? "w-8 h-8 rounded-full text-sm" : "w-7 h-7 rounded-lg text-xs"
                    } ${
                      i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-gray-200 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                    }`}>
                      {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-black text-white shadow-md group-hover:scale-110 transition-transform">
                        {c.name?.charAt(0)?.toUpperCase() || "K"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors flex items-center gap-2">
                          {c.name || "Khách vãng lai"}
                          <span className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full uppercase">VIP</span>
                        </p>
                        <p className="text-[11px] text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="font-black text-emerald-600">{c.totalSpent?.toLocaleString("vi-VN")} ₫</div>
                    <div className="text-[10px] text-gray-400 font-semibold mt-0.5">TB: {c.avgOrder?.toLocaleString("vi-VN")} ₫</div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="font-bold text-gray-600">{c.orderCount}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{new Date(c.lastOrder).toLocaleDateString('vi-VN')}</div>
                  </td>
                </tr>
              ))}
              {(!data?.topCustomers || data.topCustomers.length === 0) && (
                <tr><td colSpan={4} className="py-10 text-center text-sm text-gray-400">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BẢNG KHÁCH CHƯA MUA ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
          <div className="flex items-center gap-2">
            <div className="bg-rose-100 p-2 rounded-lg"><FaUserSlash className="text-rose-500 text-lg" /></div>
            <div>
              <h3 className="font-extrabold text-gray-900">Khách hàng chưa mua hàng</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Đã đăng ký nhưng chưa đặt đơn nào</p>
            </div>
          </div>
          <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1 shadow-sm">
            {data?.neverBought ?? 0} người
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3">Khách hàng</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ngày đăng ký</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.neverBoughtList?.map((u, i) => (
                <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-sm font-black text-white shadow-md flex-shrink-0">
                        {u.fullname?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-bold text-gray-800">{u.fullname}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3.5 text-gray-500">
                    <div className="font-medium">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</div>
                    <div className="text-[10px] bg-gray-100 text-gray-500 inline-block px-1.5 py-0.5 rounded mt-1">Đã {u.daysSinceRegister} ngày</div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <a
                      href={`mailto:${u.email}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg px-3 py-1.5 transition-colors shadow-sm"
                    >
                      <FaEnvelope size={11} />
                      Email
                    </a>
                  </td>
                </tr>
              ))}
              {(!data?.neverBoughtList || data.neverBoughtList.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                    🎉 Tất cả khách hàng đã từng mua hàng!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
