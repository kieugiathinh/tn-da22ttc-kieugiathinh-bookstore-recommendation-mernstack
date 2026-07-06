import LoadingSpinner from "../../components/admin/LoadingSpinner";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import {
  FaBook, FaBoxOpen, FaFire, FaSnowflake,
  FaExclamationTriangle, FaStar, FaSync, FaCrown, FaLayerGroup,
  FaEye, FaTag, FaArrowDown
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import { Link } from "react-router-dom";

const STOCK_COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // Còn hàng, Tồn thấp, Hết hàng

const MetricCard = ({ title, value, icon: Icon, bgGradient, subtitle }) => (
  <div className={`rounded-2xl p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 ${bgGradient} text-white relative overflow-hidden group`}>
    <div className="relative z-10 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight leading-none drop-shadow-sm">{value}</h3>
        {subtitle && <p className="mt-2 text-sm font-medium opacity-90">{subtitle}</p>}
      </div>
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="text-2xl" />
      </div>
    </div>
    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
  </div>
);

const ProductRow = ({ p, rank, showStock = true, showSold = true, showRating = false }) => {
  const price = p.discountedPrice > 0 ? p.discountedPrice : p.originalPrice;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-orange-50/30 transition-colors border-b border-gray-50 last:border-0 group">
      <span className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black shadow-sm ${
        rank === 1 ? "bg-amber-100 text-amber-600" : rank === 2 ? "bg-gray-200 text-gray-600" : rank === 3 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400 text-[11px]"
      }`}>
        {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : `#${rank}`}
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
        <div className={`p-2 rounded-lg ${iconClass.includes("red") ? "bg-red-100" : iconClass.includes("amber") ? "bg-amber-100" : iconClass.includes("blue") ? "bg-blue-100" : "bg-gray-100"}`}>
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
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userRequest.get("/stats/product-stats")
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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
      {/* ── HEADER ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
          Thống kê Sách
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-medium">Tổng quan hiệu suất và tình trạng kho sách</p>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard title="Tổng Đầu Sách" value={(data?.totalProducts ?? 0).toLocaleString()} icon={FaBook} bgGradient="bg-gradient-to-br from-orange-500 to-amber-500" subtitle={`${data?.totalSold ?? 0} cuốn đã bán`} />
        <MetricCard title="Còn Hàng Tốt" value={data?.inStock ?? 0} icon={FaBoxOpen} bgGradient="bg-gradient-to-br from-emerald-500 to-teal-500" subtitle={`${(data?.totalStock ?? 0).toLocaleString()} cuốn trong kho`} />
        <MetricCard title="Tồn Kho Thấp" value={data?.lowStock ?? 0} icon={FaExclamationTriangle} bgGradient="bg-gradient-to-br from-amber-500 to-yellow-500" subtitle="Cần nhập thêm hàng" />
        <MetricCard title="Hết Hàng" value={data?.outOfStock ?? 0} icon={FaSnowflake} bgGradient="bg-gradient-to-br from-rose-500 to-pink-500" subtitle="Cần nhập ngay!" />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart thể loại */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <FaLayerGroup className="text-violet-500" />
            <h3 className="font-bold text-gray-900">Phân bố theo thể loại</h3>
          </div>
          <p className="text-xs text-gray-400 font-semibold mb-4 uppercase tracking-wider">Số đầu sách và tổng cuốn đã bán theo thể loại</p>
          {catBarData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 600, paddingTop: '10px'}} />
                  <Bar dataKey="Đầu sách" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Đã bán" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm font-medium">Chưa có dữ liệu</div>
          )}
        </div>

        {/* Donut tình trạng kho */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaBoxOpen className="text-emerald-500" /> Tình trạng kho
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockDonut} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {stockDonut.map((entry, index) => <Cell key={index} fill={STOCK_COLORS[index]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              {stockDonut.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: STOCK_COLORS[i]}} />
                  <span className="text-xs font-bold text-gray-600">{s.name} ({s.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 BẢNG GỐC ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard icon={FaFire} iconClass="text-red-500" title="Top bán chạy" badge={`Top ${data?.topSelling?.length ?? 0}`} bgHeader="bg-gradient-to-r from-red-50 to-white">
          {data?.topSelling?.length > 0 ? data.topSelling.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold />) : <div className="py-10 text-center text-sm text-gray-400">Chưa có dữ liệu</div>}
        </SectionCard>
        <SectionCard icon={FaExclamationTriangle} iconClass="text-amber-500" title="Cần nhập thêm hàng" badge={`${data?.needRestock?.length ?? 0} đầu sách`} bgHeader="bg-gradient-to-r from-amber-50 to-white">
          {data?.needRestock?.length > 0 ? data.needRestock.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold />) : <div className="py-10 text-center text-sm text-emerald-500 font-bold">🎉 Kho hàng ổn định!</div>}
        </SectionCard>
        <SectionCard icon={FaSnowflake} iconClass="text-blue-500" title="Sách chưa bán được" badge="Thêm > 30 ngày, sold = 0" bgHeader="bg-gradient-to-r from-blue-50 to-white">
          {data?.slowMoving?.length > 0 ? data.slowMoving.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold={false} />) : <div className="py-10 text-center text-sm text-emerald-500 font-bold">🎉 Tất cả sách đã được bán!</div>}
        </SectionCard>
        <SectionCard icon={FaStar} iconClass="text-amber-400" title="Sách đánh giá cao nhất" badge="Rating ≥ 4⭐" bgHeader="bg-gradient-to-r from-yellow-50 to-white">
          {data?.topRated?.length > 0 ? data.topRated.map((p, i) => <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold showRating />) : <div className="py-10 text-center text-sm text-gray-400">Chưa có đánh giá</div>}
        </SectionCard>
      </div>

      {/* ── 4 NHÓM THÔNG MINH MỚI (P1) ── */}
      <div className="mt-2">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" />
          Phân tích Thông Minh (Smart Insights)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Nhóm 1: Cần nhập ngay - Sold cao + tồn thấp + rating tốt */}
          <SectionCard icon={FaArrowDown} iconClass="text-indigo-500" title="📦 Xuất nhập thêm ngay" badge={`${data?.restockRecommended?.length ?? 0} sách`} bgHeader="bg-gradient-to-r from-indigo-50 to-white">
            {data?.restockRecommended?.length > 0 ? (
              data.restockRecommended.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-[11px] font-black text-indigo-600 w-6">#{i+1}</span>
                  <img src={p.img} alt="" className="w-9 h-12 rounded object-cover border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 truncate">{p.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">🔥 {p.sold} bán</span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">⏰ Tồn: {p.countInStock}</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">⭐ {p.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : <div className="py-10 text-center text-sm text-emerald-500 font-bold">📫 Kho hàng đang ổn!</div>}
          </SectionCard>

          {/* Nhóm 2: View cao nhưng bán thấp */}
          <SectionCard icon={FaEye} iconClass="text-cyan-500" title="👁️ View Cao / Mua Thấp" badge="Tỉ lệ < 5%" bgHeader="bg-gradient-to-r from-cyan-50 to-white">
            {data?.lowConversionProducts?.length > 0 ? (
              data.lowConversionProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-cyan-50/30 transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-[11px] font-black text-cyan-600 w-6">#{i+1}</span>
                  <img src={p.img} alt="" className="w-9 h-12 rounded object-cover border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 truncate">{p.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">👁️ {p.viewCount} lượt xem</span>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{p.sold} mua</span>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">CR: {p.conversionRate}%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 italic">Gợi ý: Kiểm tra giá, ảnh, mô tả hoặc review</p>
                  </div>
                </div>
              ))
            ) : <div className="py-10 text-center text-sm text-emerald-500 font-bold">🎉 Tất cả đếu chuyển đổi tốt!</div>}
          </SectionCard>

          {/* Nhóm 3: Đề xuất Flash Sale */}
          <SectionCard icon={FaTag} iconClass="text-rose-500" title="🔥 Đề Xuất Flash Sale" badge="Tồn cao, bán chậm" bgHeader="bg-gradient-to-r from-rose-50 to-white">
            {data?.flashSaleRecommended?.length > 0 ? (
              data.flashSaleRecommended.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-rose-50/30 transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-[11px] font-black text-rose-600 w-6">#{i+1}</span>
                  <img src={p.img} alt="" className="w-9 h-12 rounded object-cover border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 truncate">{p.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">📦 Tồn: {p.countInStock}</span>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{p.sold} bán</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">⭐ {p.rating?.toFixed(1)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5 italic">Nên xả kho để thu hồi vốn</p>
                  </div>
                </div>
              ))
            ) : <div className="py-10 text-center text-sm text-emerald-500 font-bold">🎉 Không có sách cần xả kho!</div>}
          </SectionCard>

          {/* Nhóm 4: Sách rating thấp */}
          <SectionCard icon={FaExclamationTriangle} iconClass="text-red-500" title="⚠️ Sách Cần Kiểm Tra" badge="Rating < 3.5⭐" bgHeader="bg-gradient-to-r from-red-50 to-white">
            {data?.lowRatedProducts?.length > 0 ? (
              data.lowRatedProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/30 transition-colors border-b border-gray-50 last:border-0">
                  <span className="text-[11px] font-black text-red-600 w-6">#{i+1}</span>
                  <img src={p.img} alt="" className="w-9 h-12 rounded object-cover border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 truncate">{p.title}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">⭐ {p.rating?.toFixed(1)}/5</span>
                      <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{p.numReviews} review</span>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{p.sold} bán</span>
                    </div>
                    <p className="text-[10px] text-red-400 mt-0.5 italic">Cần kiểm tra đánh giá xấu</p>
                  </div>
                </div>
              ))
            ) : <div className="py-10 text-center text-sm text-emerald-500 font-bold">🎉 Tất cả sách có rating tốt!</div>}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default ProductStats;
