import LoadingSpinner from "../../components/admin/LoadingSpinner";
import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  FaFire, FaTrophy, FaFrown, FaWarehouse, FaMoneyBillWave,
  FaSync, FaPercent, FaBoxes, FaChartBar
} from "react-icons/fa";

const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle, suffix }) => (
  <div className={`rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${bgGradient} text-white relative overflow-hidden group`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-bold tracking-tight leading-none drop-shadow-sm">{value}</h3>
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

const SELL_COLORS = ["#f97316", "#94a3b8"]; // Cam = đã bán, Xám = chưa bán

const FlashSaleStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await userRequest.get("/stats/flashsale-analytics");
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch flash sale stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;


  if (!stats) return <div className="text-center p-10 text-gray-500 font-medium">Lỗi tải dữ liệu</div>;

  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(v);

  // Bar chart data cho top bán chạy
  const topBarData = (stats.topSoldProducts ?? []).map(p => ({
    name: p.title?.length > 15 ? p.title.slice(0, 15) + "..." : p.title,
    "Đã bán": p.soldCount,
    "Doanh thu": p.revenue,
  }));

  // Donut data cho sell-through rate
  const sellDonut = [
    { name: "Đã bán", value: stats.totalSoldQty ?? 0 },
    { name: "Chưa bán", value: Math.max(0, (stats.totalQuota ?? 0) - (stats.totalSoldQty ?? 0)) },
  ];

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
          Thống kê Flash Sale & Đề Xuất Xả Kho
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-medium">Phân tích hiệu quả chiến dịch giảm giá</p>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Tổng Chiến Dịch"
          value={stats.totalCampaigns}
          icon={FaFire}
          bgGradient="bg-gradient-to-br from-orange-500 to-amber-500"
          subtitle={`${stats.totalFlashSaleProducts ?? 0} sản phẩm tham gia`}
        />
        <MetricCard
          title="Tổng Doanh Thu"
          value={`${formatCurrency(stats.totalRevenue)} ₫`}
          icon={FaMoneyBillWave}
          bgGradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          subtitle="Từ tất cả chiến dịch"
        />
        <MetricCard
          title="Tổng Đã Bán"
          value={stats.totalSoldQty ?? 0}
          icon={FaBoxes}
          bgGradient="bg-gradient-to-br from-blue-500 to-cyan-500"
          subtitle={`/ ${stats.totalQuota ?? 0} quota`}
        />
        <MetricCard
          title="Tỷ Lệ Chuyển Đổi"
          value={stats.avgSellThroughRate ?? 0}
          suffix="%"
          icon={FaPercent}
          bgGradient="bg-gradient-to-br from-violet-500 to-purple-500"
          subtitle="Trung bình đã bán / quota"
        />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart Top bán chạy */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
            <FaChartBar className="text-orange-500" /> Top 5 sản phẩm bán chạy nhất
          </h3>
          <p className="text-xs text-gray-400 font-semibold mb-4 uppercase tracking-wider">Trong tất cả chiến dịch Flash Sale</p>
          {topBarData.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="Đã bán" fill="#f97316" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Donut Sell-through */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaPercent className="text-violet-500" /> Tỷ lệ chốt đơn
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sellDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {sellDonut.map((entry, index) => <Cell key={index} fill={SELL_COLORS[index]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-orange-600">{stats.avgSellThroughRate ?? 0}%</span>
              </div>
            </div>
            <div className="flex gap-6 mt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></span>
                <span className="text-xs font-bold text-gray-600">Đã bán ({stats.totalSoldQty ?? 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400 shadow-sm"></span>
                <span className="text-xs font-bold text-gray-600">Còn lại ({Math.max(0, (stats.totalQuota ?? 0) - (stats.totalSoldQty ?? 0))})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOP BÁN CHẠY + BÁN Ế ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* TOP BÁN CHẠY */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="bg-amber-100 p-2 rounded-lg"><FaTrophy className="text-amber-500 text-lg" /></div>
            <h3 className="font-bold text-gray-900">Top Bán Chạy Nhất</h3>
          </div>
          <div className="p-4 space-y-3">
            {stats.topSoldProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-5 font-medium">Chưa có dữ liệu.</p>
            ) : (
              stats.topSoldProducts.map((p, idx) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-sm ${
                      idx === 0 ? "bg-amber-100 text-amber-600" : idx === 1 ? "bg-gray-200 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                    }`}>{idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}</span>
                    <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm border border-gray-200 group-hover:scale-105 transition-transform" />
                    <div>
                      <p className="font-bold text-gray-800 text-[13px] line-clamp-1 group-hover:text-orange-600 transition-colors">{p.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Giá gốc: {p.originalPrice?.toLocaleString()} ₫</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-black text-orange-600 text-base">{p.soldCount}</p>
                    <p className="text-[11px] text-gray-400 font-semibold">{formatCurrency(p.revenue)} ₫</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BÁN Ế */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-white">
            <div className="bg-rose-100 p-2 rounded-lg"><FaFrown className="text-rose-500 text-lg" /></div>
            <h3 className="font-bold text-gray-900">Bán Kém Trong Flash Sale</h3>
          </div>
          <div className="p-4 space-y-3">
            {stats.slowSellingProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-5 font-medium">Chưa có dữ liệu.</p>
            ) : (
              stats.slowSellingProducts.map((p, idx) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl border border-red-50 bg-rose-50/20 shadow-sm hover:shadow-md hover:border-red-200 transition-all group">
                  <div className="flex items-center gap-3">
                    <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm border border-gray-200 group-hover:scale-105 transition-transform" />
                    <div>
                      <p className="font-bold text-gray-800 text-[13px] line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Quota: {p.quantityLimit} quyển</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="font-black text-red-500">{p.soldCount} <span className="text-[10px] font-bold text-gray-400">đã bán</span></p>
                    <p className="text-[11px] font-black text-red-400 mt-0.5">{p.sellThroughRate.toFixed(1)}% chốt</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── ĐỀ XUẤT XẢ KHO ── */}
      <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg"><FaWarehouse className="text-orange-600 text-lg" /></div>
            <h3 className="font-bold text-gray-900">AI Đề Xuất Xả Kho</h3>
          </div>
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">Có thể thêm vào Sale tiếp theo</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="px-6 py-3.5">Sách</th>
                <th className="px-4 py-3.5">Giá Gốc</th>
                <th className="px-4 py-3.5 text-center">Tồn Kho</th>
                <th className="px-4 py-3.5 text-center">Đã Bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recommendedForSale.map(p => (
                <tr key={p._id} className="hover:bg-orange-50/30 transition-colors group">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm border border-gray-200 group-hover:scale-105 transition-transform" />
                      <div>
                        <p className="font-bold text-gray-800 text-[13px] line-clamp-1 max-w-[300px] group-hover:text-orange-600 transition-colors">{p.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">ID: {p._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 font-bold text-xs">{p.originalPrice?.toLocaleString()} ₫</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-black text-sm border border-red-100 shadow-sm">{p.countInStock}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-gray-700">{p.sold}</td>
                </tr>
              ))}
              {stats.recommendedForSale.length === 0 && (
                <tr><td colSpan="4" className="text-center py-10 text-gray-400 text-sm font-medium">🎉 Kho hàng khỏe mạnh!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleStats;
