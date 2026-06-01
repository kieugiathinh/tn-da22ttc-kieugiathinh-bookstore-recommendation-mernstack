import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaStar, FaRobot, FaChevronLeft, FaChevronRight, FaTrophy } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { MdAutoAwesome } from "react-icons/md";
import { userRequest } from "../../requestMethods";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// ─── Slider Arrows ────────────────────────────────────────────────────────────

const NextArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-1/2 -right-4 -translate-y-1/2 z-10
               bg-white text-slate-500 hover:text-indigo-600
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-indigo-200 hover:scale-110 hover:shadow-indigo-100
               transition-all duration-200 flex items-center justify-center"
  >
    <FaChevronRight size={12} />
  </button>
);

const PrevArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    className="absolute top-1/2 -left-4 -translate-y-1/2 z-10
               bg-white text-slate-500 hover:text-indigo-600
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-indigo-200 hover:scale-110 hover:shadow-indigo-100
               transition-all duration-200 flex items-center justify-center"
  >
    <FaChevronLeft size={12} />
  </button>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="px-2 pb-2 pt-2">
    <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
      <div className="h-52 bg-gradient-to-b from-slate-100 to-slate-50 rounded-xl mb-3" />
      <div className="h-3 bg-slate-100 rounded-full mb-2" />
      <div className="h-3 bg-slate-100 rounded-full w-3/4 mb-3" />
      <div className="h-4 bg-indigo-50 rounded-full w-1/2" />
    </div>
  </div>
);

// ─── Recommendation Card ──────────────────────────────────────────────────────

const RecommendCard = ({ product, isColdStart }) => {
  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100)
    : 0;

  const predictedRating = product._aiMeta?.predictedRating;

  return (
    <Link
      to={`/product/${product._id}`}
      className="block bg-white p-3 rounded-2xl border border-slate-100 cursor-pointer
                 relative group h-full flex flex-col
                 transition-all duration-300
                 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-200/50
                 hover:border-indigo-100"
    >
      {/* Predicted Rating badge (chỉ hiện khi có CF data) */}
      {predictedRating && !isColdStart && (
        <span className="absolute top-2 left-2 z-10 flex items-center gap-1
                         bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full
                         shadow-sm shadow-indigo-300/50">
          <MdAutoAwesome size={9} />
          {predictedRating.toFixed(1)}★ dự đoán
        </span>
      )}

      {/* Bestseller badge khi fallback */}
      {isColdStart && (
        <span className="absolute top-2 left-2 z-10 flex items-center gap-1
                         bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
          <FaTrophy size={8} /> Hot
        </span>
      )}

      {discountPct > 0 && (
        <span className="absolute top-2 right-2 z-10 bg-rose-100 text-rose-600
                         font-bold text-[11px] px-2 py-0.5 rounded-full">
          -{discountPct}%
        </span>
      )}

      {/* Book cover */}
      <div className="h-52 w-full flex items-center justify-center overflow-hidden
                      mb-3 rounded-xl bg-gradient-to-b from-slate-50 to-indigo-50/30">
        <img
          src={product.img}
          alt={product.title}
          className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-slate-700 line-clamp-2 mb-1 min-h-[40px]
                     group-hover:text-indigo-700 transition-colors duration-200">
        {product.title}
      </h3>

      {/* Author */}
      {product.author && (
        <p className="text-xs text-slate-400 mb-2 truncate">{product.author}</p>
      )}

      <div className="mt-auto">
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
 * RecommendedForYou — Hiển thị trang chủ cho user đã đăng nhập.
 * - Dùng Redux state để lấy thông tin user.
 * - Cold Start: Hiển thị Best Sellers với badge khác nhau.
 * - Chưa đăng nhập: Ẩn component hoàn toàn.
 * Props:
 *   topK (number) — Số gợi ý (default: 6)
 */
const RecommendedForYou = ({ topK = 6 }) => {
  const { currentUser } = useSelector((state) => state.user);

  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [isColdStart, setIsColdStart] = useState(false);
  const [algorithm, setAlgorithm]   = useState("");

  useEffect(() => {
    if (!currentUser) return; // Không fetch khi chưa đăng nhập

    const fetchForYou = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userRequest.get("/recommend/for-you", {
          params: { top_k: topK },
          withCredentials: true,
        });
        setProducts(res.data.products ?? []);
        setIsColdStart(res.data.isColdStart ?? false);
        setAlgorithm(res.data.algorithm ?? "");
      } catch (err) {
        if (err.response?.status !== 401) {
          setError("Không thể tải gợi ý lúc này.");
        }
        console.error("[RecommendedForYou]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForYou();
  }, [currentUser, topK]);

  // Ẩn hoàn toàn nếu chưa đăng nhập
  if (!currentUser) return null;

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

  const isFallback = isColdStart || algorithm === "bestseller-fallback" || algorithm === "category-fallback";

  return (
    <section className="bg-white rounded-2xl shadow-sm mb-8 border border-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-indigo-100 flex items-center justify-between
                      bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center uppercase tracking-wide
                         border-l-4 border-indigo-500 pl-3">
            <HiSparkles className="mr-2 text-indigo-500 text-2xl" />
            {isFallback ? "Gợi Ý Hôm Nay" : `Dành Riêng Cho ${currentUser.username ?? "Bạn"}`}
          </h2>
          {isFallback && !loading && (
            <p className="text-xs text-slate-400 mt-1 pl-3">
              Hãy đánh giá thêm sách để nhận gợi ý cá nhân hóa chính xác hơn!
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {!isFallback && !loading && (
            <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold
                             bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
              <FaRobot size={10} /> Cá nhân hóa bởi AI
            </span>
          )}
          {isFallback && !loading && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold
                             bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
              <FaTrophy size={10} /> Bán chạy nhất
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 px-7 relative">
        {loading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-6">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">
            Chưa có gợi ý nào. Hãy đọc và đánh giá một vài cuốn sách để bắt đầu!
          </p>
        ) : (
          <Slider {...sliderSettings}>
            {products.map((product) => (
              <div key={product._id} className="px-2 pb-2 pt-2 h-full">
                <RecommendCard product={product} isColdStart={isColdStart} />
              </div>
            ))}
          </Slider>
        )}
      </div>
    </section>
  );
};

export default RecommendedForYou;
