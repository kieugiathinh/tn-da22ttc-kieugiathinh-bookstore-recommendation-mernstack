import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from "recharts";
import {
  FaShoppingBag, FaCheckDouble, FaTimesCircle, FaClock,
  FaMoneyBillWave, FaChartLine, FaSync, FaCrown, FaPercent
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";

const TIME_FILTERS = [
  { label: "Hôm nay",   value: "day"   },
  { label: "Tuần này",  value: "week"  },
  { label: "Tháng này", value: "month" },
  { label: "Năm nay",   value: "year"  },
  { label: "Tất cả",    value: "all"   },
];

const STATUS_LABELS = {
  0: "Chờ xác nhận", 1: "Đã xác nhận", 2: "Đang chuẩn bị",
  3: "Đang giao", 4: "Đã giao", 5: "Đã hủy",
};
const STATUS_COLORS_MAP = {
  0: "#f59e0b", 1: "#3b82f6", 2: "#8b5cf6",
  3: "#6366f1", 4: "#10b981", 5: "#ef4444",
};

const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle, suffix }) => (
  <div className={`rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${bgGradient} text-white relative overflow-hidden group`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{title}</p>
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
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
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
          title="Doanh Thu Thực Tế"
          value={`${formatCurrency(data?.revenue ?? 0)} ₫`}
          icon={FaMoneyBillWave}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-500"
          subtitle={`${data?.deliveredOrders ?? 0} đơn đã giao thành công`}
        />
        <MetricCard
          title="Tổng Đơn Hàng"
          value={(data?.totalOrders ?? 0).toLocaleString()}
          icon={FaShoppingBag}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          subtitle={`${data?.processingOrders ?? 0} đang xử lý`}
        />
        <MetricCard
          title="Giá Trị Trung Bình"
          value={`${formatCurrency(data?.avgOrderValue ?? 0)} ₫`}
          icon={FaChartLine}
          bgGradient="bg-gradient-to-br from-violet-500 to-purple-500"
          subtitle="Mỗi đơn hàng thành công"
        />
        <MetricCard
          title="Tỷ Lệ Hủy Đơn"
          value={data?.cancelRate ?? 0}
          suffix="%"
          icon={FaTimesCircle}
          bgGradient="bg-gradient-to-br from-rose-500 to-pink-500"
          subtitle={`${data?.canceledOrders ?? 0} đơn bị hủy`}
        />
      </div>

      {/* ── BIỂU ĐỒ DOANH THU 30 NGÀY ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <FaChartLine className="text-orange-500" /> Doanh thu 30 ngày gần nhất
          </h3>
          <p className="text-xs text-gray-400 mt-1 font-semibold uppercase tracking-wider">Chỉ tính đơn hàng giao thành công · Đơn vị: VNĐ</p>
        </div>
        <div className="h-[300px]">
          {data?.revenueByDay && data.revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrderRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} />
                <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} formatter={(value, name) => [name === "Doanh thu (₫)" ? `${formatCurrency(value)} ₫` : value, name]} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu (₫)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorOrderRev)" activeDot={{r: 6, strokeWidth: 0, fill: '#f97316'}} />
                <Area yAxisId="right" type="monotone" dataKey="orders" name="Đơn hàng" stroke="#3b82f6" strokeWidth={2} fill="none" activeDot={{r: 5, strokeWidth: 0, fill: '#3b82f6'}} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* ── CHARTS: Trạng thái + Thanh toán ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut trạng thái đơn */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <FaClock className="text-amber-500" /> Phân bố theo trạng thái
          </h3>
          {statusPieData.length > 0 ? (
            <div className="flex gap-6 items-center flex-col sm:flex-row">
              <div className="h-[180px] w-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {statusPieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 flex-1 w-full">
                {statusPieData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: s.color }} />
                      <span className="text-xs font-bold text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-black text-gray-900 text-sm">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Bar Chart thanh toán */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-emerald-500" /> Phương thức thanh toán
          </h3>
          {paymentBarData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#475569', fontWeight: 700}} width={100} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(v, name) => [name === "revenue" ? `${formatCurrency(v)} ₫` : `${v} đơn`, name === "revenue" ? "Doanh thu" : "Số đơn"]} />
                    <Bar dataKey="count" fill="#f97316" radius={[0, 6, 6, 0]} barSize={22} name="Số đơn" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {(data?.paymentDistribution ?? []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-bold text-gray-700">{p._id}</span>
                    <div className="flex gap-4">
                      <span className="text-gray-500 font-semibold">{p.count} đơn</span>
                      <span className="font-black text-emerald-600">{formatCurrency(p.revenue)} ₫</span>
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

      {/* ── TOP SẢN PHẨM ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg"><FaCrown className="text-amber-500 text-lg" /></div>
            <h3 className="font-extrabold text-gray-900">Top sản phẩm được đặt nhiều nhất</h3>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1 shadow-sm">
            {TIME_FILTERS.find(t => t.value === timeRange)?.label}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3">#</th>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3 text-right">Đã bán</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.topProducts ?? []).map((p, i) => (
                <tr key={i} className="hover:bg-orange-50/30 transition-colors group">
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shadow-sm ${
                      i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-gray-200 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                    }`}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={p.img || "https://placehold.co/40x40?text=Book"} alt={p.title} className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm" />
                      <span className="font-bold text-gray-800 truncate max-w-[200px] group-hover:text-orange-600 transition-colors">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-orange-600 text-base">{p.totalQty}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-600">{formatCurrency(p.totalRevenue ?? 0)} ₫</td>
                </tr>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <tr><td colSpan={4} className="py-10 text-center text-sm font-medium text-gray-400">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderStats;
