import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaRobot } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { publicRequest } from "../../requestMethods";

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
    <div className="h-48 bg-slate-100 rounded-xl mb-3" />
    <div className="h-3 bg-slate-100 rounded-full mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-2/3 mb-3" />
    <div className="h-4 bg-slate-200 rounded-full w-1/2" />
  </div>
);

// ─── Mini Product Card (inline — không dùng ProductCard gốc để tránh coupling) ──

const SimilarCard = ({ product, rank }) => {
  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)
    : 0;

  return (
    <Link
      to={`/product/${product._id}`}
      className="block bg-white p-3 rounded-2xl border border-slate-100 cursor-pointer
                 relative group h-full flex flex-col
                 transition-all duration-300
                 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-violet-200/50
                 hover:border-violet-100"
    >
      {/* AI rank badge */}
      {rank <= 3 && (
        <span
          className={`absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full
            ${rank === 1 ? "bg-violet-100 text-violet-700"
              : rank === 2 ? "bg-indigo-100 text-indigo-700"
              : "bg-sky-100 text-sky-700"
            }`}
        >
          #{rank} AI Pick
        </span>
      )}

      {discountPct > 0 && (
        <span className="absolute top-2 right-2 z-10 bg-rose-100 text-rose-600
                         font-bold text-[11px] px-2 py-0.5 rounded-full">
          -{discountPct}%
        </span>
      )}

      {/* Book cover */}
      <div className="h-48 w-full flex items-center justify-center overflow-hidden mb-3 rounded-xl bg-slate-50">
        <img
          src={product.img}
          alt={product.title}
          className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-slate-700 line-clamp-2 mb-2 min-h-[40px]
                     group-hover:text-violet-700 transition-colors duration-200">
        {product.title}
      </h3>

      <div className="mt-auto">
        {/* Price */}
        <div className="flex items-end gap-2 mb-1">
          <span className="text-amber-600 font-bold text-lg leading-none">
            {product.discountedPrice?.toLocaleString("vi-VN")}đ
          </span>
          {discountPct > 0 && (
            <span className="text-slate-400 text-xs line-through mb-0.5">
              {product.originalPrice?.toLocaleString("vi-VN")}đ
            </span>
          )}
        </div>

        {/* Rating + sold */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1 text-amber-400">
            <FaStar size={11} />
            <span className="text-slate-500 font-medium">
              {product.rating?.toFixed(1) ?? "0.0"}
            </span>
          </div>
          <span>Đã bán {product.sold ?? 0}</span>
        </div>
      </div>
    </Link>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * SimilarProducts — Hiển thị cuối trang chi tiết sản phẩm.
 * Grid layout giống Fahasa.com (không dùng slider).
 * Props:
 *   productId (string) — _id của sản phẩm hiện tại
 *   topK (number)      — Số gợi ý tối đa (default: 10)
 */
const SimilarProducts = ({ productId, topK = 10 }) => {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const fetchSimilar = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await publicRequest.get(
          `/recommend/similar/${productId}`,
          { params: { top_k: topK } }
        );
        setProducts(res.data.products ?? []);
        setIsFallback(res.data.isFallback ?? false);
      } catch (err) {
        setError("Không thể tải gợi ý lúc này.");
        console.error("[SimilarProducts]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [productId, topK]);

  // Không render khi không có data và không đang loading
  if (!loading && products.length === 0 && !error) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm mb-8 border border-violet-100 overflow-hidden mt-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-violet-100 flex items-center justify-between
                      bg-gradient-to-r from-violet-50 via-indigo-50 to-purple-50">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center uppercase tracking-wide
                       border-l-4 border-violet-500 pl-3">
          <HiSparkles className="mr-2 text-violet-500 text-2xl" />
          Có Thể Bạn Thích
          {isFallback && (
            <span className="ml-2 text-xs font-normal normal-case text-slate-400 tracking-normal">
              (gợi ý theo danh mục)
            </span>
          )}
        </h2>
        {!isFallback && (
          <span className="flex items-center gap-1 text-xs text-violet-500 font-semibold
                           bg-violet-50 px-2 py-1 rounded-full border border-violet-100">
            <FaRobot size={10} /> AI Lọc Nội Dung (Content-Based)
          </span>
        )}
      </div>

      {/* Content — Grid Layout (Fahasa-style) */}
      <div className="p-5 px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-6">{error}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product, index) => (
              <SimilarCard
                key={product._id}
                product={product}
                rank={product._aiMeta?.rank ?? index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SimilarProducts;
