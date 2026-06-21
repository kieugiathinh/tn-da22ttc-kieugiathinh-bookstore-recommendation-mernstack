import { useState, useEffect } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  FaBook, FaBoxOpen, FaFire, FaSnowflake,
  FaExclamationTriangle, FaStar, FaSync, FaCrown, FaLayerGroup
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import PageHeader from "../../components/admin/PageHeader";
import { Link } from "react-router-dom";

// ─── KPI CARD ──────────────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon: Icon, iconBg, iconColor, subtitle }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 leading-none">{value}</h3>
        {subtitle && <p className="mt-1.5 text-xs text-gray-400 font-medium">{subtitle}</p>}
      </div>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className={`text-xl ${iconColor}`} />
      </div>
    </div>
  </div>
);

// ─── PRODUCT ROW ───────────────────────────────────────────────────────────────
const ProductRow = ({ p, rank, showStock = true, showSold = true, showRating = false }) => {
  const price = p.discountedPrice > 0 ? p.discountedPrice : p.originalPrice;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-orange-50/30 transition-colors border-b border-gray-50 last:border-0">
      {/* Rank */}
      <span className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black ${
        rank === 1 ? "bg-amber-100 text-amber-700" :
        rank === 2 ? "bg-gray-100 text-gray-600" :
        rank === 3 ? "bg-orange-100 text-orange-700" :
        "bg-gray-50 text-gray-400 text-[11px]"
      }`}>
        {rank <= 3 ? ["🥇","🥈","🥉"][rank - 1] : `#${rank}`}
      </span>

      {/* Cover */}
      <img
        src={p.img || "https://placehold.co/32x44?text=B"}
        onError={e => { e.target.src = "https://placehold.co/32x44?text=B"; }}
        alt={p.title}
        className="w-8 h-11 rounded-md object-cover border border-gray-100 flex-shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/admin/product/${p._id}`}>
          <p className="text-[13px] font-semibold text-gray-800 truncate hover:text-primary transition-colors">{p.title}</p>
        </Link>
        <p className="text-[11px] text-gray-400 italic truncate">{p.author}</p>
        {p.category?.name && (
          <span className="inline-block text-[10px] bg-orange-50 text-primary border border-orange-100 rounded px-1.5 py-0.5 mt-0.5 font-semibold">
            {p.category.name}
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="flex-shrink-0 text-right space-y-1">
        {showSold && (
          <p className="text-sm font-bold text-primary">{p.sold ?? 0} bán</p>
        )}
        {showStock && (
          <p className={`text-xs font-semibold ${
            (p.countInStock ?? 0) === 0 ? "text-red-500" :
            (p.countInStock ?? 0) <= 10 ? "text-yellow-600" : "text-emerald-600"
          }`}>{p.countInStock ?? 0} tồn</p>
        )}
        {showRating && (
          <div className="flex items-center justify-end gap-1">
            <FaStar size={10} className="text-amber-400" />
            <span className="text-xs font-bold text-gray-700">{(p.rating ?? 0).toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({p.numReviews ?? 0})</span>
          </div>
        )}
        <p className="text-[11px] text-gray-400">{price?.toLocaleString("vi-VN")}₫</p>
      </div>
    </div>
  );
};

// ─── SECTION CARD ──────────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, iconClass, title, badge, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <Icon className={iconClass} size={16} />
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {badge && (
        <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-gray-100 text-gray-500">{badge}</span>
      )}
    </div>
    <div className="divide-y divide-gray-50">{children}</div>
  </div>
);

// ─── MAIN ──────────────────────────────────────────────────────────────────────
const ProductStats = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userRequest.get("/stats/product-stats")
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <FaSync className="animate-spin text-primary text-2xl" />
        <span className="font-semibold">Đang tải thống kê sách...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <PageHeader
        title="Thống kê Sách"
        subtitle="Tổng quan hiệu suất và tình trạng kho sách"
      />

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Tổng Đầu Sách"
          value={(data?.totalProducts ?? 0).toLocaleString()}
          icon={FaBook}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          subtitle={`${data?.totalSold ?? 0} cuốn đã bán tổng cộng`}
        />
        <KpiCard
          title="Còn Hàng Tốt"
          value={data?.inStock ?? 0}
          icon={FaBoxOpen}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          subtitle={`${(data?.totalStock ?? 0).toLocaleString()} cuốn trong kho`}
        />
        <KpiCard
          title="Tồn Kho Thấp"
          value={data?.lowStock ?? 0}
          icon={FaExclamationTriangle}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
          subtitle="Cần nhập thêm hàng sớm"
        />
        <KpiCard
          title="Hết Hàng"
          value={data?.outOfStock ?? 0}
          icon={FaSnowflake}
          iconBg="bg-red-50"
          iconColor="text-red-400"
          subtitle="Cần nhập ngay!"
        />
      </div>

      {/* ── BIỂU ĐỒ THỂ LOẠI ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <FaLayerGroup className="text-primary" size={15} />
          <h3 className="font-bold text-gray-900">Phân bố theo thể loại</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Số đầu sách và tổng cuốn đã bán theo từng thể loại</p>
        {data?.categoryDistribution?.length > 0 ? (
          <div className="h-[240px]">
            <BarChart
              series={[
                {
                  data: data.categoryDistribution.map(c => c.count),
                  label: "Số đầu sách",
                  color: "#f97316",
                },
                {
                  data: data.categoryDistribution.map(c => c.totalSold),
                  label: "Đã bán",
                  color: "#6366f1",
                },
              ]}
              xAxis={[{
                scaleType: "band",
                data: data.categoryDistribution.map(c => c._id || "Khác"),
                tickLabelStyle: { fontSize: 10 },
              }]}
              margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
              borderRadius={5}
              slotProps={{
                legend: { position: { vertical: "top", horizontal: "right" }, itemMarkWidth: 12, itemMarkHeight: 12, labelStyle: { fontSize: 11 } }
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Chưa có dữ liệu</div>
        )}
      </div>

      {/* ── 4 BẢNG ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top bán chạy */}
        <SectionCard icon={FaFire} iconClass="text-red-400" title="Top bán chạy" badge={`Top ${data?.topSelling?.length ?? 0}`}>
          {data?.topSelling?.length > 0 ? (
            data.topSelling.map((p, i) => (
              <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold />
            ))
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">Chưa có dữ liệu</div>
          )}
        </SectionCard>

        {/* Cần nhập hàng */}
        <SectionCard icon={FaExclamationTriangle} iconClass="text-yellow-500" title="Cần nhập thêm hàng" badge={`${data?.needRestock?.length ?? 0} đầu sách`}>
          {data?.needRestock?.length > 0 ? (
            data.needRestock.map((p, i) => (
              <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold />
            ))
          ) : (
            <div className="py-10 text-center text-sm text-emerald-500 font-semibold">🎉 Kho hàng ổn định!</div>
          )}
        </SectionCard>

        {/* Sách bán ế */}
        <SectionCard icon={FaSnowflake} iconClass="text-blue-400" title="Sách chưa bán được" badge="Thêm > 30 ngày, sold = 0">
          {data?.slowMoving?.length > 0 ? (
            data.slowMoving.map((p, i) => (
              <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold={false} />
            ))
          ) : (
            <div className="py-10 text-center text-sm text-emerald-500 font-semibold">🎉 Tất cả sách đã được bán!</div>
          )}
        </SectionCard>

        {/* Top rated */}
        <SectionCard icon={FaStar} iconClass="text-amber-400" title="Sách đánh giá cao nhất" badge="Rating ≥ 4⭐">
          {data?.topRated?.length > 0 ? (
            data.topRated.map((p, i) => (
              <ProductRow key={p._id} p={p} rank={i + 1} showStock showSold showRating />
            ))
          ) : (
            <div className="py-10 text-center text-sm text-gray-400">Chưa có đánh giá</div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default ProductStats;
