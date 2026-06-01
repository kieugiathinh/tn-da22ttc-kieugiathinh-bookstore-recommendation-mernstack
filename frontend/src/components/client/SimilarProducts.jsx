import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaRobot, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { publicRequest } from "../../requestMethods";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// ─── Slider Arrows ────────────────────────────────────────────────────────────

const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-1/2 -right-4 -translate-y-1/2 z-10
               bg-white text-slate-500 hover:text-violet-600
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-violet-200 hover:scale-110 hover:shadow-violet-100
               transition-all duration-200 flex items-center justify-center"
  >
    <FaChevronRight size={12} />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-1/2 -left-4 -translate-y-1/2 z-10
               bg-white text-slate-500 hover:text-violet-600
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-violet-200 hover:scale-110 hover:shadow-violet-100
               transition-all duration-200 flex items-center justify-center"
  >
    <FaChevronLeft size={12} />
  </button>
);

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="px-2 pb-2 pt-2">
    <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
      <div className="h-48 bg-slate-100 rounded-xl mb-3" />
      <div className="h-3 bg-slate-100 rounded-full mb-2" />
      <div className="h-3 bg-slate-100 rounded-full w-2/3 mb-3" />
      <div className="h-4 bg-slate-200 rounded-full w-1/2" />
    </div>
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
 * Props:
 *   productId (string) — _id của sản phẩm hiện tại
 *   topK (number)      — Số gợi ý tối đa (default: 6)
 */
const SimilarProducts = ({ productId, topK = 6 }) => {
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

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 400,
    slidesToShow: Math.min(products.length, 5),
    slidesToScroll: 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 4, slidesToScroll: 2 } },
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 640,  settings: { slidesToShow: 2, slidesToScroll: 1 } },
    ],
  };

  // Không render khi không có data và không đang loading
  if (!loading && products.length === 0 && !error) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm mb-8 border border-violet-100 overflow-hidden">
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
            <FaRobot size={10} /> AI Powered
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 px-7 relative">
        {loading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-6">{error}</p>
        ) : (
          <Slider {...sliderSettings}>
            {products.map((product, index) => (
              <div key={product._id} className="px-2 pb-2 pt-2 h-full">
                <SimilarCard product={product} rank={product._aiMeta?.rank ?? index + 1} />
              </div>
            ))}
          </Slider>
        )}
      </div>
    </section>
  );
};

export default SimilarProducts;
