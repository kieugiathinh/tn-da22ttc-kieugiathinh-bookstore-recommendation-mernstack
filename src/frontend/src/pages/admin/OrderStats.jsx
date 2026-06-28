import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, ComposedChart, Legend
} from "recharts";
import {
  FaShoppingBag, FaCheckDouble, FaTimesCircle, FaClock,
  FaMoneyBillWave, FaChartLine, FaSync, FaCrown, FaPercent
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";

const TIME_FILTERS = [
  { label: "Hôm nay", value: "day" },
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" },
  { label: "Năm nay", value: "year" },
  { label: "Tất cả", value: "all" },
];

const STATUS_LABELS = {
  0: "Chờ xác nhận", 1: "Đã xác nhận", 2: "Đang chuẩn bị",
  3: "Đang giao", 4: "Đã giao", 5: "Đã hủy",
};
const STATUS_COLORS_MAP = {
  0: "#f59e0b", 1: "#3b82f6", 2: "#8b5cf6",
  3: "#6366f1", 4: "#10b981", 5: "#ef4444",
};

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
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <h3 className="text-2xl font-black tracking-tight leading-none drop-shadow-sm">{value}</h3>
          {suffix && <span className="text-sm font-bold opacity-90">{suffix}</span>}
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

const OrderStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  const fetchData = async (type) => {
    try {
      setLoading(true);
      const res = await userRequest.get(`/stats/order-analytics?type=${type}`);
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(timeRange); }, [timeRange]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-orange-500">
        <FaSync className="animate-spin text-3xl" />
        <span className="font-bold text-lg">Đang tải thống kê đơn hàng...</span>
      </div>
    );
  }

  const statusPieData = (data?.statusDistribution ?? []).map((s) => ({
    name: STATUS_LABELS[s._id] ?? `Trạng thái ${s._id}`,
    value: s.count,
    color: STATUS_COLORS_MAP[s._id] ?? "#94a3b8",
  }));

  const paymentBarData = (data?.paymentDistribution ?? []).map((p, idx) => ({
    name: p._id,
    count: p.count,
    revenue: p.revenue,
    color: ["#f97316", "#8b5cf6", "#06b6d4"][idx % 3],
  }));

  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(v);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
            Thống kê Đơn hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">Phân tích hiệu suất bán hàng và xu hướng đơn hàng</p>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1.5 shadow-inner">
          {TIME_FILTERS.map(t => (
            <button
              key={t.value}
              onClick={() => setTimeRange(t.value)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${timeRange === t.value
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
          title="Doanh Thu Thực Tế"
          value={`${formatCurrency(data?.revenue ?? 0)} ₫`}
          change={data?.changes?.revenue}
          icon={FaMoneyBillWave}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-500"
          subtitle={`${data?.deliveredOrders ?? 0} đơn đã giao thành công`}
        />
        <MetricCard
          title="Tổng Đơn Hàng"
          value={(data?.totalOrders ?? 0).toLocaleString()}
          change={data?.changes?.totalOrders}
          icon={FaShoppingBag}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          subtitle={`${data?.processingOrders ?? 0} đang xử lý`}
        />
        <MetricCard
          title="Giá Trị Trung Bình"
          value={`${formatCurrency(data?.avgOrderValue ?? 0)} ₫`}
          change={data?.changes?.avgOrderValue}
          icon={FaChartLine}
          bgGradient="bg-gradient-to-br from-violet-500 to-purple-500"
          subtitle="Mỗi đơn hàng thành công"
        />
        <MetricCard
          title="Tỷ Lệ Hủy Đơn"
          value={data?.cancelRate ?? 0}
          change={data?.changes?.cancelRate}
          suffix="%"
          icon={FaTimesCircle}
          bgGradient="bg-gradient-to-br from-rose-500 to-pink-500"
          subtitle={`${data?.canceledOrders ?? 0} đơn bị hủy`}
        />
      </div>

      {/* ── BIỂU ĐỒ DOANH THU VÀ SỐ ĐƠN (COMPOSED CHART) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <FaChartLine className="text-orange-500" /> Doanh thu và Số đơn hàng
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">Theo thời gian thực tế</p>
        </div>
        <div className="h-[300px]">
          {data?.revenueOverTime && data.revenueOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.revenueOverTime} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrderRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [name === "Doanh thu (₫)" ? `${formatCurrency(value)} ₫` : value, name]} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu (₫)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorOrderRev)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }} />
                <Bar yAxisId="right" dataKey="orders" name="Đơn hàng" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* ── CHARTS: Trạng thái + Thanh toán ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-6">

        {/* Stacked Bar Chart: Trạng thái theo thời gian */}
        <div className="xl:col-span-2 lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <FaClock className="text-amber-500" /> Trạng thái xử lý theo thời gian
          </h3>
          <div className="h-[250px]">
            {data?.statusByTime && data.statusByTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.statusByTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <Bar dataKey="delivered" name="Đã giao" stackId="a" fill="#10b981" />
                  <Bar dataKey="processing" name="Đang xử lý" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="canceled" name="Đã hủy" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Donut Chart: Hiệu suất xử lý đơn */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <FaCheckDouble className="text-blue-500" /> Hiệu suất xử lý đơn
          </h3>
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider text-center">Tỷ lệ theo trạng thái tổng quát</p>
          {data ? (
            <div className="flex flex-col gap-4">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Đã giao", value: data.deliveredOrders, color: "#10b981" },
                        { name: "Đang xử lý", value: data.processingOrders, color: "#3b82f6" },
                        { name: "Đã hủy", value: data.canceledOrders, color: "#ef4444" }
                      ]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none"
                    >
                      {[
                        { color: "#10b981" }, { color: "#3b82f6" }, { color: "#ef4444" }
                      ].map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`${v} đơn`, "Số lượng"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { name: "Thành công", value: data.deliveredOrders, color: "#10b981", percent: data.totalOrders ? Math.round((data.deliveredOrders / data.totalOrders) * 100) : 0 },
                  { name: "Đang xử lý", value: data.processingOrders, color: "#3b82f6", percent: data.totalOrders ? Math.round((data.processingOrders / data.totalOrders) * 100) : 0 },
                  { name: "Đã hủy", value: data.canceledOrders, color: "#ef4444", percent: data.totalOrders ? Math.round((data.canceledOrders / data.totalOrders) * 100) : 0 },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: s.color }} />
                      <span className="text-xs font-bold text-gray-600">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-gray-900 text-sm">{s.percent}%</span>
                      <span className="text-[10px] text-gray-400 font-semibold block leading-none mt-1">{s.value} đơn</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Donut Chart: Phương thức thanh toán */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-emerald-500" /> Phương thức thanh toán
          </h3>
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider text-center">Đơn đã giao thành công</p>
          {paymentBarData.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentBarData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="revenue" stroke="none">
                      {paymentBarData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v, n) => [`${formatCurrency(v)} ₫`, "Doanh thu"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {paymentBarData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: p.color }} />
                      <span className="text-xs font-bold text-gray-600">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-sm block leading-none">{formatCurrency(p.revenue)} ₫</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{p.count} đơn</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default OrderStats;
