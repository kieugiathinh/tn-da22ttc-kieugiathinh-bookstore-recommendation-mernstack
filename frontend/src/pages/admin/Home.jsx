import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  FaMoneyBillWave,
  FaShoppingBag,
  FaUserFriends,
  FaCube,
  FaCrown,
  FaExclamationCircle,
  FaSync,
  FaChevronDown,
  FaArrowUp,
  FaBoxOpen,
  FaBan,
} from "react-icons/fa";

// ─── KPI CARD COMPONENT ──────────────────────────────────────────────────────
const MetricCard = ({ title, value, icon: Icon, iconBg, iconColor, subtitle }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          {title}
        </p>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
          {value}
        </h3>
        {subtitle && (
          <p className="mt-1.5 text-xs text-gray-400 font-medium">{subtitle}</p>
        )}
      </div>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`text-xl ${iconColor}`} />
      </div>
    </div>
  </div>
);

// ─── BADGE COMPONENT ─────────────────────────────────────────────────────────
const Badge = ({ children, color = "gray" }) => {
  const map = {
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    green:  "bg-green-50 text-green-700 border-green-200",
    red:    "bg-red-50 text-red-700 border-red-200",
    gray:   "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[color]}`}>
      {children}
    </span>
  );
};

// ─── TIME FILTER BAR ──────────────────────────────────────────────────────────
const TIME_FILTERS = [
  { label: "Hôm nay", value: "day" },
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" },
  { label: "Năm nay", value: "year" },
  { label: "Tất cả", value: "all" },
];

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
  const [loading, setLoading]           = useState(true);
  const [isCompare, setIsCompare]       = useState(false);
  const [year1, setYear1]               = useState(new Date().getFullYear());
  const [year2, setYear2]               = useState(new Date().getFullYear() - 1);

  // 1. KPI theo filter thời gian
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

  // 2. Charts & Tables (1 lần khi mount)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRev, resCat, resStatus, resProd, resCus] = await Promise.all([
          userRequest.get("/stats/revenue-chart"),
          userRequest.get("/stats/categories"),
          userRequest.get("/stats/order-status"),
          userRequest.get("/stats/products-analytics"),
          userRequest.get("/stats/top-customers"),
        ]);

        setRevenueChart(resRev.data);

        setCategoryData(
          resCat.data.map((i, idx) => ({ id: idx, value: i.value, label: i.name }))
        );

        const statusMap  = ["Chờ xác nhận", "Đang giao", "Hoàn thành", "Đã hủy"];
        const colorMap   = ["#fbbf24", "#3b82f6", "#22c55e", "#ef4444"];
        setStatusData(
          resStatus.data.map((i, idx) => ({
            id: idx,
            value: i.value,
            label: statusMap[i._id] || "Khác",
            color: colorMap[i._id] || "#94a3b8",
          }))
        );

        setProdStats(resProd.data);
        setCustomers(resCus.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu chi tiết:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. So sánh doanh thu theo năm
  useEffect(() => {
    if (!isCompare) return;
    const fetchCompare = async () => {
      try {
        const res = await userRequest.get(
          `/stats/revenue-comparison?year1=${year1}&year2=${year2}`
        );
        setCompareData({
          y1: res.data.year1.map((v) => v / 1_000_000),
          y2: res.data.year2.map((v) => v / 1_000_000),
        });
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

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <FaSync className="animate-spin text-brand-500" />
        <span className="font-medium">Đang tải Dashboard...</span>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Tổng quan tình hình kinh doanh GTBooks
          </p>
        </div>

        {/* Bộ lọc thời gian */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1">
          {TIME_FILTERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTimeRange(t.value)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                timeRange === t.value
                  ? "bg-white text-brand-700 shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          title="Doanh Thu"
          value={`${(kpi?.revenue || 0).toLocaleString("vi-VN")} ₫`}
          icon={FaMoneyBillWave}
          iconBg="bg-brand-50"
          iconColor="text-brand-600"
          subtitle={`${kpi?.orders || 0} đơn hàng`}
        />
        <MetricCard
          title="Đơn Hàng"
          value={kpi?.orders || 0}
          icon={FaShoppingBag}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          subtitle={`${kpi?.canceled || 0} đơn đã hủy`}
        />
        <MetricCard
          title="Giá Trị Trung Bình"
          value={`${(kpi?.avgOrder || 0).toLocaleString("vi-VN")} ₫`}
          icon={FaCrown}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subtitle="mỗi đơn hàng"
        />
        <MetricCard
          title="Sản Phẩm"
          value={kpi?.products || 0}
          icon={FaCube}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subtitle={`${kpi?.users || 0} khách hàng`}
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Revenue Chart (chiếm 2 cột) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Phân tích doanh thu</h3>
              <p className="text-xs text-gray-400 mt-0.5">Đơn vị: Triệu VNĐ</p>
            </div>

            {/* Toggle so sánh năm */}
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => setIsCompare(!isCompare)}
                className="flex items-center gap-2 text-xs font-semibold"
              >
                <span className={isCompare ? "text-brand-600" : "text-gray-400"}>
                  So sánh năm
                </span>
                <div
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    isCompare ? "bg-brand-600" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isCompare ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </button>

              {isCompare && (
                <div className="flex items-center gap-2">
                  {[
                    { value: year1, onChange: setYear1, options: [2023, 2024, 2025, 2026] },
                    { value: year2, onChange: setYear2, options: [2021, 2022, 2023, 2024] },
                  ].map((sel, i) => (
                    <select
                      key={i}
                      value={sel.value}
                      onChange={(e) => sel.onChange(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold outline-none"
                    >
                      {sel.options.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[280px] w-full">
            {isCompare && compareData ? (
              <BarChart
                series={[
                  { data: compareData.y1, label: `Năm ${year1}`, color: "#7c3aed" },
                  { data: compareData.y2, label: `Năm ${year2}`, color: "#e2d9f3" },
                ]}
                xAxis={[{ scaleType: "band", data: Array.from({ length: 12 }, (_, i) => `T${i + 1}`) }]}
                margin={{ top: 20, bottom: 30, left: 45, right: 10 }}
                borderRadius={4}
              />
            ) : (
              <LineChart
                series={[
                  { data: revenueChart.map((i) => i.revenue / 1_000_000), label: "Doanh thu", color: "#7c3aed", area: true, showMark: false, curve: "monotone" },
                  { data: revenueChart.map((i) => i.orders), label: "Đơn hàng", color: "#f59e0b", yAxisKey: "orders", showMark: true },
                ]}
                xAxis={[{ scaleType: "point", data: revenueChart.map((i) => i.month) }]}
                yAxis={[{ id: "default" }, { id: "orders", position: "right" }]}
                rightAxis="orders"
                margin={{ top: 20, bottom: 30, left: 45, right: 45 }}
              />
            )}
          </div>
        </div>

        {/* Pie Charts Stack */}
        <div className="flex flex-col gap-4">
          {/* Danh mục */}
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-gray-900">Tỷ trọng danh mục</h3>
            <div className="flex min-h-[140px] items-center justify-center">
              {categoryData.length > 0 ? (
                <PieChart
                  series={[{ data: categoryData, innerRadius: 0, outerRadius: 65, paddingAngle: 0 }]}
                  slotProps={{ legend: { hidden: true } }}
                  margin={{ top: 5, bottom: 5, left: 5, right: 5 }}
                />
              ) : (
                <span className="text-xs text-gray-400">Chưa có dữ liệu</span>
              )}
            </div>
            <div className="mt-2 max-h-[90px] space-y-1 overflow-y-auto">
              {categoryData.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ["#02b2af","#2e96ff","#b800d8","#60009b","#2731c8","#ef4444"][i % 6] }}
                    />
                    <span className="truncate max-w-[100px] text-gray-600">{c.label}</span>
                  </div>
                  <span className="font-bold text-gray-700">{c.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trạng thái đơn */}
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-gray-900">Trạng thái đơn hàng</h3>
            <div className="flex min-h-[140px] items-center justify-center">
              {statusData.length > 0 ? (
                <PieChart
                  series={[{ data: statusData, innerRadius: 35, outerRadius: 65, paddingAngle: 2, cornerRadius: 3 }]}
                  slotProps={{ legend: { hidden: true } }}
                  margin={{ top: 5, bottom: 5, left: 5, right: 5 }}
                />
              ) : (
                <span className="text-xs text-gray-400">Chưa có dữ liệu</span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {statusData.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  {s.label} ({s.value})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM TABLES ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sản phẩm bán chạy */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
            <FaCrown className="text-amber-400" />
            <h3 className="font-bold text-gray-900">Sản phẩm bán chạy</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3 rounded-tl-none">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">Đã bán</th>
                  <th className="px-4 py-3 text-right rounded-tr-none">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prodStats.topSelling.length > 0 ? (
                  prodStats.topSelling.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors group">
                      <td className="flex items-center gap-3 px-5 py-3">
                        <span
                          className={`flex h-5 w-6 flex-shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                            i < 3 ? "bg-brand-50 text-brand-700" : "text-gray-400"
                          }`}
                        >
                          #{i + 1}
                        </span>
                        <img
                          src={p.img}
                          onError={handleImgError}
                          className="h-9 w-9 flex-shrink-0 rounded-lg object-cover border border-gray-100 group-hover:scale-105 transition-transform"
                          alt=""
                        />
                        <span className="truncate max-w-[140px] font-medium text-gray-700" title={p.title}>
                          {p.title}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-brand-600">
                        {p.sold}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-medium">
                        {(getProductPrice(p) * p.sold).toLocaleString("vi-VN")} ₫
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-sm text-gray-400">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cột phải: Cảnh báo tồn kho + Khách VIP */}
        <div className="flex flex-col gap-4">
          {/* Low Stock Alert */}
          <div className="rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-red-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <FaExclamationCircle className="text-red-500" />
                <h3 className="font-bold text-gray-900">Cảnh báo tồn kho</h3>
              </div>
              <Badge color="red">Critical</Badge>
            </div>
            <div className="max-h-[200px] space-y-2 overflow-y-auto p-4">
              {prodStats.lowStock.length > 0 ? (
                prodStats.lowStock.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-red-50/60 px-3 py-2.5 hover:bg-red-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.img}
                        onError={handleImgError}
                        className="h-9 w-9 rounded-lg object-cover mix-blend-multiply"
                        alt=""
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[150px]">{p.title}</p>
                        <p className="text-[11px] font-semibold text-red-500">
                          Còn lại: {p.countInStock} cuốn
                        </p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white transition-colors">
                      Nhập
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-6">
                  <FaBoxOpen className="text-3xl text-green-400" />
                  <p className="text-sm font-semibold text-green-600">Kho hàng ổn định ✅</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Customers */}
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <FaUserFriends className="text-blue-500" />
              <h3 className="font-bold text-gray-900">Khách hàng thân thiết</h3>
            </div>
            <div className="space-y-1 p-3">
              {customers.length > 0 ? (
                customers.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar chữ cái */}
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-brand-400 to-blue-500 text-sm font-bold text-white shadow-sm">
                        {c.name ? c.name.charAt(0).toUpperCase() : "K"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                          {c.name || "Khách vãng lai"}
                        </p>
                        <p className="text-[11px] text-gray-400">{c.count} đơn hàng</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                      +{c.total.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-gray-400">
                  Chưa có dữ liệu khách hàng
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
