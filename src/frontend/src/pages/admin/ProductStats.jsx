import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import StatsPageHeader from "../../components/admin/StatsPageHeader";
import StatCard from "../../components/admin/StatCard";
import ChartCard from "../../components/admin/ChartCard";
import EmptyState from "../../components/admin/EmptyState";
import { userRequest } from "../../requestMethods";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import {
  FaBook, FaBoxOpen, FaFire, FaSnowflake,
  FaExclamationTriangle, FaStar, FaLayerGroup,
  FaEye, FaArrowDown
} from "react-icons/fa";

const STOCK_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const ProductRow = ({ p, rank, showStock = true, showSold = true, showRating = false }) => {
  const price = p.discountedPrice > 0 ? p.discountedPrice : p.originalPrice;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-orange-50/30 transition-colors border-b border-gray-50 last:border-0 group">
      <span className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-sm ${rank === 1 ? "bg-amber-100 text-amber-600" : rank === 2 ? "bg-gray-200 text-gray-600" : rank === 3 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400 text-[11px]"
        }`}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
      </span>
      <img src={p.img || "https://placehold.co/32x44?text=B"} onError={e => { e.target.src = "https://placehold.co/32x44?text=B"; }} alt={p.title} className="w-9 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform" />
      <div className="flex-1 min-w-0">
        <Link to={`/admin/product/${p._id}`}>
          <p className="text-[13px] font-bold text-gray-800 truncate group-hover:text-orange-600 transition-colors">{p.title}</p>
        </Link>
        <p className="text-[11px] text-gray-400 italic truncate">{p.author}</p>
        {p.category?.name && (
          <span className="inline-block text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded px-1.5 py-0.5 mt-0.5 font-bold">{p.category.name}</span>
        )}
      </div>
      <div className="flex-shrink-0 text-right space-y-1">
        {showSold && <p className="text-sm font-black text-orange-600">{p.sold ?? 0} bán</p>}
        {showStock && (
          <p className={`text-xs font-bold ${(p.countInStock ?? 0) === 0 ? "text-red-500" : (p.countInStock ?? 0) <= 10 ? "text-amber-600" : "text-emerald-600"}`}>{p.countInStock ?? 0} tồn</p>
        )}
        {showRating && (
          <div className="flex items-center justify-end gap-1">
            <FaStar size={10} className="text-amber-400" />
            <span className="text-xs font-black text-gray-700">{(p.rating ?? 0).toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({p.numReviews ?? 0})</span>
          </div>
        )}
        <p className="text-[11px] text-gray-400 font-medium">{price?.toLocaleString("vi-VN")} ₫</p>
      </div>
    </div>
  );
};

const SectionCard = ({ icon: Icon, iconClass, title, badge, bgHeader = "bg-gradient-to-r from-gray-50 to-white", children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${bgHeader}`}>
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-lg ${iconClass.includes("red") ? "bg-red-100" : iconClass.includes("amber") ? "bg-amber-100" : iconClass.includes("blue") ? "bg-blue-100" : iconClass.includes("indigo") ? "bg-indigo-100" : iconClass.includes("cyan") ? "bg-cyan-100" : "bg-gray-100"}`}>
          <Icon className={iconClass + " text-lg"} />
        </div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {badge && <span className="text-[11px] font-bold rounded-lg px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200 shadow-sm">{badge}</span>}
    </div>
    <div className="divide-y divide-gray-50">{children}</div>
  </div>
);

const ProductStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");

  const fetchData = async (type) => {
    try {
      setLoading(true);
      const res = await userRequest.get(`/stats/product-stats?type=${type}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(timeRange); }, [timeRange]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;

  const stockDonut = [
    { name: "Còn hàng tốt", value: data?.inStock ?? 0 },
    { name: "Tồn kho thấp", value: data?.lowStock ?? 0 },
    { name: "Hết hàng", value: data?.outOfStock ?? 0 },
  ];

  const catBarData = (data?.categoryDistribution ?? []).map(c => ({
    name: c._id || "Khác",
    "Đầu sách": c.count,
    "Đã bán": c.totalSold,
  }));

  return (
    <div className="space-y-6">
      <StatsPageHeader
        title="Thống kê Sách"
        subtitle="Tổng quan hiệu suất và tình trạng kho sách"
        timeFilter={timeRange}
        onTimeFilterChange={setTimeRange}
      />

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Tổng Đầu Sách" value={(data?.totalProducts ?? 0).toLocaleString()} icon={FaBook} colorClass="text-blue-500" bgClass="bg-blue-50" subtitle={`${data?.totalSold ?? 0} cuốn đã bán lũy kế`} />
        <StatCard title="Còn Hàng Tốt" value={data?.inStock ?? 0} icon={FaBoxOpen} colorClass="text-emerald-500" bgClass="bg-emerald-50" subtitle={`${(data?.totalStock ?? 0).toLocaleString()} cuốn trong kho`} />
        <StatCard title="Tồn Kho Thấp" value={data?.lowStock ?? 0} icon={FaExclamationTriangle} colorClass="text-amber-500" bgClass="bg-amber-50" subtitle="Cần nhập thêm hàng" />
        <StatCard title="Hết Hàng" value={data?.outOfStock ?? 0} icon={FaSnowflake} colorClass="text-rose-500" bgClass="bg-rose-50" subtitle="Cần nhập ngay!" />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard className="xl:col-span-2" title="Phân bố danh mục & Hiệu suất bán" icon={FaLayerGroup} subtitle="Trong thời gian tương ứng">
          {catBarData.length > 0 ? (
            <div className="h-[280px] min-h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={100}>
                <BarChart data={catBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                  <Bar dataKey="Đầu sách" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Đã bán" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>

          ) : (
            <EmptyState icon={FaLayerGroup} />
          )}
        </ChartCard>

        <ChartCard title="Tình trạng kho" icon={FaBoxOpen} subtitle="Lũy kế tại thời điểm hiện tại">
          <div className="flex-1 flex flex-col items-center justify-center mt-4">
            <div className="h-[200px] w-full min-h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={100}>
                <PieChart>
                  <Pie data={stockDonut} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {stockDonut.map((entry, index) => <Cell key={index} fill={STOCK_COLORS[index]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {stockDonut.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: STOCK_COLORS[i] }} />
                  <span className="text-xs font-bold text-gray-600">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="mt-8 mb-4 border-b border-gray-100 pb-2">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-orange-500" /> Nhóm 1: Hiệu Suất Bán Hàng
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={FaFire} iconClass="text-orange-500" title="Top bán chạy (Trong kỳ)" badge={`Top ${data?.topSelling?.length ?? 0}`} bgHeader="bg-white">
          {data?.topSelling?.length > 0 ? data.topSelling.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold />) : <div className="py-10 text-center"><EmptyState /></div>}
        </SectionCard>
        <SectionCard icon={FaSnowflake} iconClass="text-blue-500" title="Sách bán chậm" badge="Thêm > 30 ngày, sold = 0" bgHeader="bg-white">
          {data?.slowMoving?.length > 0 ? data.slowMoving.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold={false} />) : <div className="py-10 text-center"><EmptyState message="Tất cả sách đã bán được" /></div>}
        </SectionCard>
      </div>

      <div className="mt-8 mb-4 border-b border-gray-100 pb-2">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-emerald-500" /> Nhóm 2: Quản Trị Kho Hàng
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={FaExclamationTriangle} iconClass="text-amber-500" title="Cần nhập thêm hàng (Sắp hết)" badge={`${data?.needRestock?.length ?? 0} đầu sách`} bgHeader="bg-white">
          {data?.needRestock?.length > 0 ? data.needRestock.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold />) : <div className="py-10 text-center"><EmptyState message="Kho hàng ổn định" /></div>}
        </SectionCard>
        <SectionCard icon={FaArrowDown} iconClass="text-indigo-500" title="Đề xuất nhập gấp" badge={`${data?.restockRecommended?.length ?? 0} sách`} bgHeader="bg-white">
          {data?.restockRecommended?.length > 0 ? data.restockRecommended.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold showRating />) : <div className="py-10 text-center"><EmptyState message="Chưa có đề xuất" /></div>}
        </SectionCard>
      </div>

      <div className="mt-8 mb-4 border-b border-gray-100 pb-2">
        <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-purple-500" /> Nhóm 3: Chất Lượng & Chuyển Đổi
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={FaEye} iconClass="text-cyan-500" title="View Cao / Mua Thấp (Trong kỳ)" badge="Tỉ lệ < 5%" bgHeader="bg-white">
          {data?.lowConversionProducts?.length > 0 ? (
            data.lowConversionProducts.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-cyan-50/30 transition-colors border-b border-gray-50 last:border-0">
                <span className="text-[11px] font-black text-cyan-600 w-6">#{i + 1}</span>
                <img src={p.img} alt="" className="w-9 h-12 rounded object-cover border border-gray-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800 truncate">{p.title}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">👁️ {p.viewCount} view</span>
                    <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{p.sold} mua</span>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">CR: {p.conversionRate}%</span>
                  </div>
                </div>
              </div>
            ))
          ) : <div className="py-10 text-center"><EmptyState message="Chuyển đổi tốt" /></div>}
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard icon={FaStar} iconClass="text-amber-400" title="Sách đánh giá cao" badge="Rating ≥ 4⭐" bgHeader="bg-white">
            {data?.topRated?.length > 0 ? data.topRated.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold showRating />) : <div className="py-10 text-center"><EmptyState message="Chưa có đánh giá" /></div>}
          </SectionCard>

          <SectionCard icon={FaStar} iconClass="text-gray-400" title="Sách bị đánh giá thấp" badge="Rating < 3.5⭐" bgHeader="bg-white">
            {data?.lowRatedProducts?.length > 0 ? data.lowRatedProducts.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold showRating />) : <div className="py-10 text-center"><EmptyState message="Chưa có sách bị vote kém" /></div>}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ProductStats;
