import { useState, useEffect } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  FaShoppingBag, FaCheckDouble, FaTimesCircle, FaClock,
  FaMoneyBillWave, FaChartLine, FaSync, FaCrown, FaPercent
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import PageHeader from "../../components/admin/PageHeader";

const TIME_FILTERS = [
  { label: "Hôm nay",   value: "day"   },
  { label: "Tuần này",  value: "week"  },
  { label: "Tháng này", value: "month" },
  { label: "Năm nay",   value: "year"  },
  { label: "Tất cả",    value: "all"   },
];

const STATUS_LABELS = {
  0: "Chờ xác nhận",
  1: "Đã xác nhận",
  2: "Đang chuẩn bị",
  3: "Đang giao",
  4: "Đã giao",
  5: "Đã hủy",
};

const STATUS_COLORS = {
  0: "#f59e0b",
  1: "#3b82f6",
  2: "#8b5cf6",
  3: "#6366f1",
  4: "#22c55e",
  5: "#ef4444",
};

// ─── KPI CARD ──────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon: Icon, iconBg, iconColor, subtitle, suffix }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{title}</p>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <h3 className="text-2xl font-black text-gray-900 leading-none">{value}</h3>
          {suffix && <span className="text-sm font-semibold text-gray-500">{suffix}</span>}
        </div>
        {subtitle && <p className="mt-1.5 text-xs text-gray-400 font-medium">{subtitle}</p>}
      </div>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className={`text-xl ${iconColor}`} />
      </div>
    </div>
  </div>
);

// ─── MAIN ──────────────────────────────────────────────────────────────────────
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
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <FaSync className="animate-spin text-primary text-2xl" />
        <span className="font-semibold text-gray-600">Đang tải thống kê đơn hàng...</span>
      </div>
    );
  }

  // Pie chart data cho trạng thái đơn
  const statusPieData = (data?.statusDistribution ?? []).map((s, idx) => ({
    id: idx,
    value: s.count,
    label: STATUS_LABELS[s._id] ?? `Trạng thái ${s._id}`,
    color: STATUS_COLORS[s._id] ?? "#94a3b8",
  }));

  // Pie chart data cho thanh toán
  const paymentPieData = (data?.paymentDistribution ?? []).map((p, idx) => ({
    id: idx,
    value: p.count,
    label: p._id,
    color: ["#f97316", "#8b5cf6", "#06b6d4"][idx % 3],
  }));

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Thống kê Đơn hàng"
          subtitle="Phân tích hiệu suất bán hàng và xu hướng đơn hàng"
        />
        {/* Bộ lọc thời gian */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 self-start">
          {TIME_FILTERS.map(t => (
            <button
              key={t.value}
              onClick={() => setTimeRange(t.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                timeRange === t.value
                  ? "bg-white text-primary shadow-sm border border-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Tổng Đơn Hàng"
          value={(data?.totalOrders ?? 0).toLocaleString()}
          icon={FaShoppingBag}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          subtitle={`${data?.processingOrders ?? 0} đang xử lý`}
        />
        <KpiCard
          title="Doanh Thu Thực Tế"
          value={(data?.revenue ?? 0).toLocaleString("vi-VN")}
          suffix="₫"
          icon={FaMoneyBillWave}
          iconBg="bg-orange-50"
          iconColor="text-primary"
          subtitle={`${data?.deliveredOrders ?? 0} đơn đã giao thành công`}
        />
        <KpiCard
          title="Giá Trị Trung Bình"
          value={(data?.avgOrderValue ?? 0).toLocaleString("vi-VN")}
          suffix="₫"
          icon={FaChartLine}
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          subtitle="Mỗi đơn hàng thành công"
        />
        <KpiCard
          title="Tỷ Lệ Hủy Đơn"
          value={data?.cancelRate ?? 0}
          suffix="%"
          icon={FaTimesCircle}
          iconBg="bg-red-50"
          iconColor="text-red-400"
          subtitle={`${data?.canceledOrders ?? 0} đơn bị hủy`}
        />
      </div>

      {/* ── BIỂU ĐỒ DOANH THU 30 NGÀY ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FaChartLine className="text-primary" size={16} />
            Doanh thu 30 ngày gần nhất
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Chỉ tính đơn hàng giao thành công (Đã giao) · Đơn vị: VNĐ</p>
        </div>
        <div className="h-[260px]">
          {data?.revenueByDay && data.revenueByDay.length > 0 ? (
            <LineChart
              series={[
                {
                  data: data.revenueByDay.map(d => d.revenue),
                  label: "Doanh thu (₫)",
                  color: "#f97316",
                  area: true,
                  showMark: false,
                  curve: "monotone",
                },
                {
                  data: data.revenueByDay.map(d => d.orders),
                  label: "Đơn hàng",
                  color: "#6366f1",
                  yAxisKey: "orders",
                  showMark: false,
                  curve: "monotone",
                },
              ]}
              xAxis={[{
                scaleType: "point",
                data: data.revenueByDay.map(d => d.date),
                tickLabelStyle: { fontSize: 10 },
                tickMinStep: 5,
              }]}
              yAxis={[{ id: "default" }, { id: "orders", position: "right" }]}
              rightAxis="orders"
              margin={{ top: 20, bottom: 30, left: 55, right: 45 }}
              slotProps={{ legend: { position: { vertical: "top", horizontal: "right" }, itemMarkWidth: 12, itemMarkHeight: 12, labelStyle: { fontSize: 11 } } }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* ── CHARTS: Trạng thái + Thanh toán ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Phân bố trạng thái đơn */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaClock className="text-amber-400" size={15} />
            Phân bố theo trạng thái
          </h3>
          {statusPieData.length > 0 ? (
            <div className="flex gap-4 items-center flex-col sm:flex-row">
              <div className="flex-shrink-0">
                <PieChart
                  series={[{ data: statusPieData, innerRadius: 40, outerRadius: 75, paddingAngle: 2, cornerRadius: 4 }]}
                  width={170}
                  height={170}
                  slotProps={{ legend: { hidden: true } }}
                  margin={{ top: 5, bottom: 5, left: 5, right: 5 }}
                />
              </div>
              <div className="flex flex-col gap-2 flex-1 w-full">
                {statusPieData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-gray-600 truncate">{s.label}</span>
                    </div>
                    <span className="font-bold text-gray-800 flex-shrink-0">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Phân bố phương thức thanh toán */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaMoneyBillWave className="text-emerald-400" size={15} />
            Phương thức thanh toán
          </h3>
          {paymentPieData.length > 0 ? (
            <div className="flex gap-4 items-center flex-col sm:flex-row">
              <div className="flex-shrink-0">
                <PieChart
                  series={[{ data: paymentPieData, innerRadius: 40, outerRadius: 75, paddingAngle: 2, cornerRadius: 4 }]}
                  width={170}
                  height={170}
                  slotProps={{ legend: { hidden: true } }}
                  margin={{ top: 5, bottom: 5, left: 5, right: 5 }}
                />
              </div>
              <div className="flex flex-col gap-3 flex-1 w-full">
                {(data?.paymentDistribution ?? []).map((p, i) => (
                  <div key={i} className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: paymentPieData[i]?.color }} />
                        <span className="font-semibold text-gray-700">{p._id}</span>
                      </div>
                      <span className="text-gray-500 font-medium">{p.count} đơn</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${data?.totalOrders ? Math.round((p.count / data.totalOrders) * 100) : 0}%`,
                          background: paymentPieData[i]?.color,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                      {data?.totalOrders ? Math.round((p.count / data.totalOrders) * 100) : 0}% · {p.revenue.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* ── TOP SẢN PHẨM ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <FaCrown className="text-amber-400" />
          <h3 className="font-bold text-gray-900">Top sản phẩm được đặt nhiều nhất</h3>
          <span className="ml-auto text-xs text-gray-400">
            {TIME_FILTERS.find(t => t.value === timeRange)?.label}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">#</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Sản phẩm</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Đã bán (SL)</th>
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.topProducts ?? []).map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-400"
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.img || "https://placehold.co/40x40?text=Book"}
                        alt={p.title}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                      />
                      <span className="font-medium text-gray-800 truncate max-w-[200px]">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-bold text-primary">{p.totalQty}</span>
                    <span className="text-gray-400 text-xs ml-1">cuốn</span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">
                    {(p.totalRevenue ?? 0).toLocaleString("vi-VN")}₫
                  </td>
                </tr>
              ))}
              {(!data?.topProducts || data.topProducts.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-gray-400">Chưa có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderStats;
