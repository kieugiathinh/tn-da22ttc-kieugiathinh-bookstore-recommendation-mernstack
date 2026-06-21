import { useState, useEffect } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  FaUsers, FaUserPlus, FaUserSlash, FaRedo,
  FaSync, FaCrown, FaEnvelope, FaChartBar
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import PageHeader from "../../components/admin/PageHeader";

const TIME_FILTERS = [
  { label: "Hôm nay", value: "day" },
  { label: "Tuần này", value: "week" },
  { label: "Tháng này", value: "month" },
  { label: "Năm nay", value: "year" },
  { label: "Tất cả", value: "all" },
];

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon: Icon, iconBg, iconColor, subtitle, suffix }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-black text-gray-900 leading-none">{value}</h3>
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
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <FaSync className="animate-spin text-primary text-2xl" />
        <span className="font-semibold text-gray-600">Đang tải thống kê khách hàng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Thống kê Khách hàng"
          subtitle="Phân tích hành vi và giá trị khách hàng"
        />
        {/* Bộ lọc thời gian */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-100 bg-gray-50 p-1 self-start">
          {TIME_FILTERS.map((t) => (
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="Tổng Khách Hàng"
          value={data?.totalUsers?.toLocaleString() ?? 0}
          icon={FaUsers}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          subtitle={`${data?.totalBuyers ?? 0} đã từng mua hàng`}
        />
        <KpiCard
          title="Khách Hàng Mới"
          value={data?.newUsers ?? 0}
          icon={FaUserPlus}
          iconBg="bg-orange-50"
          iconColor="text-primary"
          subtitle={`Trong ${TIME_FILTERS.find(t => t.value === timeRange)?.label.toLowerCase()}`}
        />
        <KpiCard
          title="Chưa Mua Hàng"
          value={data?.neverBought ?? 0}
          icon={FaUserSlash}
          iconBg="bg-red-50"
          iconColor="text-red-400"
          subtitle={`${data?.totalUsers ? Math.round((data.neverBought / data.totalUsers) * 100) : 0}% tổng khách`}
        />
        <KpiCard
          title="Tỷ Lệ Quay Lại"
          value={data?.returnRate ?? 0}
          suffix="%"
          icon={FaRedo}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          subtitle={`${data?.repeatCount ?? 0} khách mua ≥ 2 lần`}
        />
      </div>

      {/* ── CHARTS + VIP TABLE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Biểu đồ KH mới theo tháng */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FaChartBar className="text-primary" />
            <h3 className="font-bold text-gray-900">Khách hàng mới theo tháng</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Số tài khoản đăng ký mới trong năm {new Date().getFullYear()}</p>
          <div className="h-[260px]">
            {data?.newUsersByMonth && (
              <BarChart
                series={[{
                  data: data.newUsersByMonth.map(m => m.count),
                  label: "Khách mới",
                  color: "#f97316",
                  highlightScope: { highlighted: "item", faded: "global" },
                }]}
                xAxis={[{
                  scaleType: "band",
                  data: data.newUsersByMonth.map(m => m.month),
                  tickLabelStyle: { fontSize: 11 },
                }]}
                margin={{ top: 16, bottom: 30, left: 40, right: 10 }}
                borderRadius={6}
                slotProps={{
                  legend: { hidden: true },
                }}
              />
            )}
          </div>
        </div>

        {/* Top 5 KH VIP */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
            <FaCrown className="text-amber-400" />
            <h3 className="font-bold text-gray-900">Top Khách hàng VIP</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.topCustomers?.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white ${
                    i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                    i === 1 ? "bg-gradient-to-br from-gray-400 to-gray-500" :
                    i === 2 ? "bg-gradient-to-br from-orange-700 to-orange-800" :
                    "bg-gradient-to-br from-primary to-orange-400"
                  }`}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name || "Khách vãng lai"}</p>
                    <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right ml-3">
                  <p className="text-sm font-black text-emerald-600">{c.totalSpent.toLocaleString("vi-VN")}₫</p>
                  <p className="text-[11px] text-gray-400">{c.orderCount} đơn</p>
                </div>
              </div>
            ))}
            {(!data?.topCustomers || data.topCustomers.length === 0) && (
              <div className="py-10 text-center text-sm text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* ── BẢNG KHÁCH CHƯA MUA ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FaUserSlash className="text-red-400" />
            <div>
              <h3 className="font-bold text-gray-900">Khách hàng chưa mua hàng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Đã đăng ký nhưng chưa đặt đơn nào</p>
            </div>
          </div>
          <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-full px-3 py-1">
            {data?.neverBought ?? 0} người
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3">Khách hàng</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Ngày đăng ký</th>
                <th className="px-5 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.neverBoughtList?.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {u.fullname?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-semibold text-gray-800">{u.fullname}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-sm">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-sm">
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <a
                      href={`mailto:${u.email}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <FaEnvelope size={11} />
                      Gửi email
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
