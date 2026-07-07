import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import StatsPageHeader from "../../components/admin/StatsPageHeader";
import StatCard from "../../components/admin/StatCard";
import ChartCard from "../../components/admin/ChartCard";
import DataTableCard from "../../components/admin/DataTableCard";
import EmptyState from "../../components/admin/EmptyState";
import { userRequest } from "../../requestMethods";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  FaFire, FaTrophy, FaFrown, FaWarehouse, FaMoneyBillWave,
  FaPercent, FaBoxes, FaChartBar
} from "react-icons/fa";

const SELL_COLORS = ["#f97316", "#94a3b8"];

const FlashSaleStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        let url = `/stats/flashsale-analytics?type=${timeRange}`;
        if (status) url += `&status=${status}`;
        
        const res = await userRequest.get(url);
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch flash sale stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeRange, status]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;

  if (!stats) return <EmptyState message="Lỗi tải dữ liệu" />;

  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(v);

  const topBarData = (stats.topSoldProducts ?? []).map(p => ({
    name: p.title?.length > 20 ? p.title.slice(0, 20) + "..." : p.title,
    fullTitle: p.title,
    "Đã bán": p.soldCount,
    "Doanh thu": p.revenue,
  }));

  const sellDonut = [
    { name: "Đã bán", value: Number(stats.totalSoldQty) || 0 },
    { name: "Chưa bán", value: Math.max(0, (Number(stats.totalQuota) || 0) - (Number(stats.totalSoldQty) || 0)) },
  ];

  const rightContent = (
    <select 
      className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-orange-500"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
    >
      <option value="">Tất cả trạng thái</option>
      <option value="active">Đang diễn ra</option>
      <option value="upcoming">Sắp diễn ra</option>
      <option value="ended">Đã kết thúc</option>
    </select>
  );

  return (
    <div className="space-y-6">
      <StatsPageHeader 
        title="Thống kê Flash Sale & Khuyến Mãi" 
        subtitle="Phân tích hiệu quả chiến dịch giảm giá và đề xuất kho"
        timeFilter={timeRange}
        onTimeFilterChange={setTimeRange}
        rightContent={rightContent}
      />

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Tổng Chiến Dịch"
          value={stats.totalCampaigns || 0}
          icon={FaFire}
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
          subtitle={`${stats.totalFlashSaleProducts ?? 0} sản phẩm tham gia`}
        />
        <StatCard
          title="Tổng Doanh Thu"
          value={`${formatCurrency(stats.totalRevenue || 0)} ₫`}
          icon={FaMoneyBillWave}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-50"
          subtitle="Từ chiến dịch đang lọc"
        />
        <StatCard
          title="Tổng Đã Bán"
          value={stats.totalSoldQty ?? 0}
          icon={FaBoxes}
          colorClass="text-blue-500"
          bgClass="bg-blue-50"
          subtitle={`/ ${stats.totalQuota ?? 0} chỉ tiêu`}
        />
        <StatCard
          title="Tỷ Lệ Chốt Đơn"
          value={stats.avgSellThroughRate ?? 0}
          suffix="%"
          icon={FaPercent}
          colorClass="text-violet-500"
          bgClass="bg-violet-50"
          subtitle="Đã bán / tổng chỉ tiêu"
        />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard className="xl:col-span-2" title="Top 10 sản phẩm bán chạy nhất" icon={FaChartBar} subtitle="Trong các chiến dịch Flash Sale">
          {topBarData.length > 0 ? (
            <div className="h-[280px] min-h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={100}>
                <BarChart data={topBarData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} width={120} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [name === 'Doanh thu' ? `${formatCurrency(value)} ₫` : value, name]} />
                  <Bar dataKey="Đã bán" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          ) : (
            <EmptyState icon={FaChartBar} />
          )}
        </ChartCard>

        <ChartCard title="Tỷ lệ bán / tồn" icon={FaPercent} subtitle="Sell-through Rate">
          <div className="flex-1 flex flex-col items-center justify-center mt-4 h-[280px]">
            <div className="h-[200px] w-full min-h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={100}>
                <PieChart>
                  <Pie data={sellDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {sellDonut.map((entry, index) => <Cell key={index} fill={SELL_COLORS[index]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-orange-600">{stats.avgSellThroughRate ?? 0}%</span>
              </div>
            </div>
            <div className="flex gap-6 mt-4">
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
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DataTableCard 
          title="Top Bán Chạy Nhất" 
          icon={FaTrophy}
          headers={[{label: "Hạng"}, {label: "Sản phẩm"}, {label: "Đã bán", className: "text-right"}]}
        >
          {stats.topSoldProducts?.length > 0 ? (
            stats.topSoldProducts.map((p, idx) => (
              <tr key={p._id} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-3 text-center w-16">
                  <span className={`inline-flex items-center justify-center font-black shadow-sm ${
                    idx < 3 ? "w-8 h-8 rounded-full text-sm" : "w-7 h-7 rounded-lg text-xs"
                  } ${
                    idx === 0 ? "bg-amber-100 text-amber-600" : idx === 1 ? "bg-gray-200 text-gray-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                  }`}>{idx < 3 ? ["🥇","🥈","🥉"][idx] : idx + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm border border-gray-200" />
                    <div>
                      <p className="font-bold text-gray-800 text-[13px] line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Giá: {p.originalPrice?.toLocaleString()} ₫</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-black text-orange-600 text-base">{p.soldCount}</p>
                  <p className="text-[11px] text-gray-400 font-semibold">{formatCurrency(p.revenue)} ₫</p>
                </td>
              </tr>
            ))
          ) : <tr><td colSpan="3"><EmptyState message="Chưa có dữ liệu" /></td></tr>}
        </DataTableCard>

        <DataTableCard 
          title="Bán Kém (Cân nhắc loại bỏ)" 
          icon={FaFrown}
          headers={[{label: "Sản phẩm"}, {label: "Tỷ lệ chốt", className: "text-right"}]}
        >
          {stats.slowSellingProducts?.length > 0 ? (
            stats.slowSellingProducts.map((p, idx) => (
              <tr key={p._id} className="hover:bg-rose-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm border border-gray-200" />
                    <div>
                      <p className="font-bold text-gray-800 text-[13px] line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Chỉ tiêu: {p.quantityLimit}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-black text-red-500">{p.soldCount} <span className="text-[10px] text-gray-400">đã bán</span></p>
                  <p className="text-[11px] font-black text-red-400 mt-0.5">{Number(p.sellThroughRate || 0).toFixed(1)}%</p>
                </td>
              </tr>
            ))
          ) : <tr><td colSpan="2"><EmptyState message="Chưa có dữ liệu" /></td></tr>}
        </DataTableCard>
      </div>

      <DataTableCard 
        title="AI Đề Xuất Xả Kho" 
        icon={FaWarehouse}
        rightContent={<span className="text-[10px] font-black text-orange-600 uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm">Có thể đưa vào đợt Sale sau</span>}
        headers={[{label: "Sách"}, {label: "Giá Gốc"}, {label: "Tồn Kho", className: "text-center"}, {label: "Đã Bán lũy kế", className: "text-center"}]}
      >
        {stats.recommendedForSale?.length > 0 ? (
          stats.recommendedForSale.map(p => (
            <tr key={p._id} className="hover:bg-orange-50/30 transition-colors">
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <img src={p.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded-lg shadow-sm border border-gray-200" />
                  <div>
                    <p className="font-bold text-gray-800 text-[13px] line-clamp-1">{p.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">ID: {p._id.slice(-6)}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500 font-bold text-xs">{p.originalPrice?.toLocaleString()} ₫</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-black text-sm border border-red-100 shadow-sm">{p.countInStock}</span>
              </td>
              <td className="px-4 py-3 text-center font-bold text-gray-700">{p.sold}</td>
            </tr>
          ))
        ) : <tr><td colSpan="4"><EmptyState message="Kho hàng khỏe mạnh!" /></td></tr>}
      </DataTableCard>
    </div>
  );
};

export default FlashSaleStats;
