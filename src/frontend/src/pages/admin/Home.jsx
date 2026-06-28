import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from "recharts";
import {
  FaMoneyBillWave,
  FaShoppingBag,
  FaUserFriends,
  FaCube,
  FaCrown,
  FaExclamationCircle,
  FaSync,
  FaBoxOpen,
  FaChartPie,
  FaLayerGroup,
  FaClipboardList
} from "react-icons/fa";

// ─── COMPONENT ──────────────────────────────────────────────────────────────
const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle, textColor = "text-white" }) => (
  <div className={`rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${bgGradient} ${textColor} relative overflow-hidden group`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
          {title}
        </p>
        <h3 className="text-3xl font-black tracking-tight leading-none drop-shadow-sm">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-2 text-sm font-medium opacity-90">{subtitle}</p>
        )}
      </div>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="text-2xl" />
      </div>
    </div>
    {/* Decorative background circle */}
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
  </div>
);

const Badge = ({ children, color = "gray" }) => {
  const map = {
    yellow: "bg-amber-100 text-amber-700 border-amber-200",
    blue:   "bg-blue-100 text-blue-700 border-blue-200",
    green:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    red:    "bg-rose-100 text-rose-700 border-rose-200",
    gray:   "bg-gray-100 text-gray-700 border-gray-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold shadow-sm ${map[color]}`}>
      {children}
    </span>
  );
};

const TIME_FILTERS = [
  { label: "Hôm nay", value: "day" },
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" },
  { label: "Năm nay", value: "year" },
  { label: "Tất cả", value: "all" },
];

const CATEGORY_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b"];

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [timeRange, setTimeRange]       = useState("month");
  const [kpi, setKpi]                   = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [compareData, setCompareData]   = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData]     = useState([]);
  const [prodStats, setProdStats]       = useState({ lowStock: [], topSelling: [] });
  const [customers, setCustomers]       = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [isCompare, setIsCompare]       = useState(false);
  const [year1, setYear1]               = useState(new Date().getFullYear());
  const [year2, setYear2]               = useState(new Date().getFullYear() - 1);

  useEffect(() => {
    const fetchKPI = async () => {
      try {
        const res = await userRequest.get(`/stats/summary?type=${timeRange}`);
        setKpi(res.data);
      } catch (err) {
        console.error("Lỗi tải KPI:", err);
      }
    };
    fetchKPI();
  }, [timeRange]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRev, resCat, resStatus, resProd, resCus, resLatest] = await Promise.all([
          userRequest.get("/stats/revenue-chart"),
          userRequest.get("/stats/categories"),
          userRequest.get("/stats/order-status"),
          userRequest.get("/stats/products-analytics"),
          userRequest.get("/stats/top-customers"),
          userRequest.get("/stats/latest-orders"),
        ]);

        setRevenueChart(resRev.data.map(item => ({
          ...item,
          revenue: item.revenue / 1000000 // Convert to millions
        })));

        setCategoryData(
          resCat.data.map((i, idx) => ({ name: i.name, value: i.value, color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }))
        );

        const statusMap  = ["Chờ xác nhận", "Đang giao", "Hoàn thành", "Đã hủy"];
        const colorMap   = ["#fbbf24", "#3b82f6", "#10b981", "#ef4444"]; // amber, blue, emerald, red
        setStatusData(
          resStatus.data.map((i, idx) => ({
            name: statusMap[i._id] || "Khác",
            value: i.value,
            color: colorMap[i._id] || "#94a3b8",
          }))
        );

        setProdStats(resProd.data);
        setCustomers(resCus.data);
        setLatestOrders(resLatest.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu chi tiết:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isCompare) return;
    const fetchCompare = async () => {
      try {
        const res = await userRequest.get(
          `/stats/revenue-comparison?year1=${year1}&year2=${year2}`
        );
        
        // Format for Recharts BarChart
        const formatted = Array.from({ length: 12 }, (_, i) => ({
          month: `T${i + 1}`,
          year1: res.data.year1[i] / 1000000,
          year2: res.data.year2[i] / 1000000
        }));
        setCompareData(formatted);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompare();
  }, [isCompare, year1, year2]);

  const getProductPrice = (p) =>
    p.discountedPrice > 0 ? p.discountedPrice : p.originalPrice || 0;

  const handleImgError = (e) => {
    e.target.src = "https://placehold.co/40x40?text=Book";
  };

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(value);

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-orange-500">
        <FaSync className="animate-spin text-3xl" />
        <span className="font-bold text-lg">Đang tải Dashboard...</span>
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
            Tổng quan kinh doanh
          </h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Phân tích số liệu và theo dõi hiệu suất hệ thống BookBee
          </p>
        </div>

        {/* Bộ lọc thời gian */}
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Doanh Thu"
          value={`${formatCurrency(kpi?.revenue || 0)} ₫`}
          icon={FaMoneyBillWave}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-500"
          subtitle={`${formatCurrency(kpi?.orders || 0)} đơn hàng thành công`}
        />
        <MetricCard
          title="Đơn Hàng"
          value={formatCurrency(kpi?.orders || 0)}
          icon={FaShoppingBag}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          subtitle={`${kpi?.canceled || 0} đơn đã bị hủy`}
        />
        <MetricCard
          title="Giá Trị Trung Bình"
          value={`${formatCurrency(kpi?.avgOrder || 0)} ₫`}
          icon={FaCrown}
          bgGradient="bg-gradient-to-br from-violet-500 to-purple-500"
          subtitle="Doanh thu bình quân mỗi đơn"
        />
        <MetricCard
          title="Tổng Sản Phẩm"
          value={formatCurrency(kpi?.products || 0)}
          icon={FaCube}
          bgGradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          subtitle={`${kpi?.users || 0} khách hàng hệ thống`}
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Revenue Chart (chiếm 2 cột) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2 relative overflow-hidden">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                <FaChartPie className="text-orange-500" /> Phân tích doanh thu
              </h3>
              <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Đơn vị: Triệu VNĐ</p>
            </div>

            {/* Toggle so sánh năm */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setIsCompare(!isCompare)}
                className="flex items-center gap-2 text-xs font-bold"
              >
                <span className={isCompare ? "text-orange-600" : "text-gray-400"}>
                  Chế độ so sánh năm
                </span>
                <div
                  className={`relative h-6 w-11 rounded-full transition-colors shadow-inner ${
                    isCompare ? "bg-orange-500" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
                      isCompare ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </button>

              {isCompare && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  {[
                    { value: year1, onChange: setYear1, options: [2023, 2024, 2025, 2026], color: "text-orange-600" },
                    { value: year2, onChange: setYear2, options: [2021, 2022, 2023, 2024], color: "text-blue-600" },
                  ].map((sel, i) => (
                    <select
                      key={i}
                      value={sel.value}
                      onChange={(e) => sel.onChange(e.target.value)}
                      className={`rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold outline-none shadow-sm focus:ring-2 focus:ring-orange-200 ${sel.color}`}
                    >
                      {sel.options.map((y) => (
                        <option key={y} value={y}>Năm {y}</option>
                      ))}
                    </select>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[300px] w-full">
            {isCompare && compareData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 600, paddingTop: '10px'}} />
                  <Bar dataKey="year1" name={`Năm ${year1}`} fill="#f97316" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="year2" name={`Năm ${year2}`} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 600, paddingTop: '10px'}} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Doanh thu (Tr)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{r: 6, strokeWidth: 0, fill: '#f97316'}} />
                  <Area yAxisId="right" type="monotone" dataKey="orders" name="Đơn hàng" stroke="#3b82f6" strokeWidth={3} fill="none" activeDot={{r: 6, strokeWidth: 0, fill: '#3b82f6'}} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Charts Stack */}
        <div className="flex flex-col gap-6">
          {/* Tỷ trọng danh mục */}
          <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="mb-4 text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <FaLayerGroup className="text-violet-500" /> Tỷ trọng thể loại sách
            </h3>
            <div className="flex flex-col items-center">
              <div className="h-[160px] w-full">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">Chưa có dữ liệu</div>
                )}
              </div>
              <div className="mt-2 w-full max-h-[90px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {categoryData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-md flex-shrink-0 shadow-sm" style={{ backgroundColor: c.color }} />
                      <span className="truncate max-w-[120px] text-xs font-semibold text-gray-600">{c.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 text-xs">{formatCurrency(c.value)} ₫</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trạng thái đơn hàng */}
          <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="mb-4 text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <FaBoxOpen className="text-emerald-500" /> Tình trạng đơn hàng
            </h3>
            <div className="flex items-center gap-4">
              <div className="h-[120px] w-[120px] flex-shrink-0">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={0} outerRadius={55} dataKey="value" stroke="none">
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">Chưa có dữ liệu</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                {statusData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: s.color }} />
                      <span className="text-[11px] font-bold text-gray-600">{s.name}</span>
                    </div>
                    <span className="text-[11px] font-black text-gray-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sản phẩm bán chạy */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg"><FaCrown className="text-orange-500 text-lg" /></div>
              <h3 className="font-extrabold text-gray-900">Sản phẩm bán chạy nhất</h3>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">Đã bán</th>
                  <th className="px-4 py-3 text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prodStats.topSelling.length > 0 ? (
                  prodStats.topSelling.map((p, i) => (
                    <tr key={i} className="hover:bg-orange-50/50 transition-colors group">
                      <td className="flex items-center gap-3 px-4 py-3">
                        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-black shadow-sm ${
                            i === 0 ? "bg-amber-100 text-amber-600" : 
                            i === 1 ? "bg-gray-200 text-gray-600" :
                            i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <img src={p.img} onError={handleImgError} className="h-10 w-10 flex-shrink-0 rounded-lg object-cover border border-gray-200 group-hover:scale-110 transition-transform shadow-sm" alt="" />
                        <span className="truncate max-w-[180px] font-bold text-gray-700 group-hover:text-orange-600 transition-colors" title={p.title}>
                          {p.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-orange-600 text-base">
                        {p.sold}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-bold">
                        {formatCurrency(getProductPrice(p) * p.sold)} ₫
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="py-10 text-center text-sm font-medium text-gray-400">Chưa có dữ liệu giao dịch</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột phải */}
        <div className="flex flex-col gap-6">
          
          {/* Low Stock Alert */}
          <div className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-red-50 bg-rose-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-2 rounded-lg"><FaExclamationCircle className="text-red-600 text-lg" /></div>
                <h3 className="font-extrabold text-gray-900">Cảnh báo tồn kho</h3>
              </div>
              <Badge color="red">Cần nhập hàng</Badge>
            </div>
            <div className="flex-1 max-h-[220px] overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-red-200">
              {prodStats.lowStock.length > 0 ? (
                prodStats.lowStock.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-red-100 p-3 shadow-sm hover:shadow-md hover:border-red-300 transition-all group">
                    <div className="flex items-center gap-3">
                      <img src={p.img} onError={handleImgError} className="h-10 w-10 rounded-lg object-cover border border-gray-100 group-hover:scale-105 transition-transform" alt="" />
                      <div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[200px]">{p.title}</p>
                        <p className="text-[11px] font-black text-red-500 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Còn lại: {p.countInStock} cuốn
                        </p>
                      </div>
                    </div>
                    <button className="rounded-lg border-2 border-red-100 bg-red-50 px-4 py-1.5 text-xs font-black text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
                      Nhập thêm
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 h-full">
                  <div className="bg-emerald-100 p-3 rounded-full mb-2"><FaBoxOpen className="text-3xl text-emerald-500" /></div>
                  <p className="text-sm font-black text-emerald-600">Tuyệt vời! Kho hàng đang ổn định.</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Customers */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg"><FaUserFriends className="text-blue-600 text-lg" /></div>
                <h3 className="font-extrabold text-gray-900">Khách hàng VIP</h3>
              </div>
              <Badge color="blue">Top chi tiêu</Badge>
            </div>
            <div className="flex-1 space-y-2 p-4 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200">
              {customers.length > 0 ? (
                customers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white shadow-md group-hover:scale-110 transition-transform">
                        {c.name ? c.name.charAt(0).toUpperCase() : "K"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {c.name || "Khách vãng lai"}
                        </p>
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{c.count} đơn hàng thành công</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-600 border border-emerald-100 shadow-sm">
                      {formatCurrency(c.total)} ₫
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center"><p className="text-sm font-medium text-gray-400">Chưa có dữ liệu khách hàng</p></div>
              )}
            </div>
          </div>

        </div>
    </div>

      {/* ── ĐƠN HÀNG GẦN ĐÂY ── */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg"><FaClipboardList className="text-amber-600 text-lg" /></div>
            <h3 className="font-extrabold text-gray-900">Đơn hàng gần đây</h3>
          </div>
          <Badge color="orange">Mới nhất</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3 text-right">Tổng tiền</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {latestOrders.length > 0 ? latestOrders.map((order, i) => {
                const statusLabels = ["Chờ xác nhận", "Đã xác nhận", "Đang chuẩn bị", "Đang giao", "Đã giao", "Đã hủy"];
                const statusColors = ["bg-amber-100 text-amber-700", "bg-blue-100 text-blue-700", "bg-violet-100 text-violet-700", "bg-indigo-100 text-indigo-700", "bg-emerald-100 text-emerald-700", "bg-red-100 text-red-700"];
                return (
                  <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-gray-500">#{order._id?.slice(-6).toUpperCase()}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{order.name || "Khách"}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(order.total || 0)} ₫</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${statusColors[order.status] || statusColors[0]}`}>
                        {statusLabels[order.status] || "Không rõ"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")} {new Date(order.createdAt).toLocaleTimeString("vi-VN", {hour: '2-digit', minute: '2-digit'})}
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5} className="py-10 text-center text-sm font-medium text-gray-400">Chưa có đơn hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
