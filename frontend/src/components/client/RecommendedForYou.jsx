import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaStar, FaRobot, FaTrophy, FaChevronRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { MdAutoAwesome } from "react-icons/md";
import { userRequest } from "../../requestMethods";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
    <div className="h-52 bg-gradient-to-b from-slate-100 to-slate-50 rounded-xl mb-3" />
    <div className="h-3 bg-slate-100 rounded-full mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-3/4 mb-3" />
    <div className="h-4 bg-indigo-50 rounded-full w-1/2" />
  </div>
);

// ─── Recommendation Card (Fahasa-style) ───────────────────────────────────────

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
                 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-200/50
                 hover:border-emerald-100"
    >
      {/* Predicted Rating badge (chỉ hiện khi có CF data) */}
      {predictedRating && !isColdStart && (
        <span className="absolute top-2 left-2 z-10 flex items-center gap-1
                         bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full
                         shadow-sm shadow-emerald-300/50">
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
                      mb-3 rounded-xl bg-gradient-to-b from-slate-50 to-emerald-50/30">
        <img
          src={product.img}
          alt={product.title}
          className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-slate-700 line-clamp-2 mb-1 min-h-[40px]
                     group-hover:text-emerald-700 transition-colors duration-200">
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
 * RecommendedForYou — Hiển thị cuối trang chủ cho user đã đăng nhập.
 * - Grid layout giống Fahasa.com (không dùng slider).
 * - Có nút "Xem tất cả" dẫn đến trang riêng /daily-suggestion.
 * - Tự động refetch khi user quay lại từ trang chi tiết sản phẩm.
 * Props:
 *   topK (number) — Số gợi ý (default: 20)
 */
const RecommendedForYou = ({ topK = 20 }) => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();

  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [isColdStart, setIsColdStart] = useState(false);
  const [algorithm, setAlgorithm]   = useState("");

  useEffect(() => {
    if (!currentUser) return; // Không fetch khi chưa đăng nhập

    const fetchForYou = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      if (!isBackground) setError(null);
      try {
        const res = await userRequest.get("/recommend/for-you", {
          params: { top_k: topK },
          withCredentials: true,
        });
        setProducts(res.data.products ?? []);
        setIsColdStart(res.data.isColdStart ?? false);
        setAlgorithm(res.data.algorithm ?? "");
      } catch (err) {
        if (err.response?.status !== 401 && !isBackground) {
          setError("Không thể tải gợi ý lúc này.");
        }
        console.error("[RecommendedForYou]", err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    // Lần 1: Fetch ngay lập tức khi load trang
    fetchForYou();

    // Lần 2: Tự động refetch ngầm sau 5 giây.
    const timerId = setTimeout(() => {
      fetchForYou(true);
    }, 5000);

    return () => clearTimeout(timerId);
  }, [currentUser, topK, location.key]);

  // Ẩn hoàn toàn nếu chưa đăng nhập
  if (!currentUser) return null;

  const isFallback = isColdStart || algorithm === "bestseller-fallback" || algorithm === "category-fallback";

  return (
    <section className="bg-white rounded-2xl shadow-sm mb-8 border border-emerald-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between
                      bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center uppercase tracking-wide
                         border-l-4 border-emerald-500 pl-3">
            <HiSparkles className="mr-2 text-emerald-500 text-2xl" />
            {isFallback ? "Gợi Ý Cho Bạn" : `Gợi Ý Cho ${currentUser.fullname ?? currentUser.username ?? "Bạn"}`}
          </h2>
          {isFallback && !loading && (
            <p className="text-xs text-slate-400 mt-1 pl-3">
              Hãy đánh giá thêm sách để nhận gợi ý cá nhân hóa chính xác hơn!
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isFallback && !loading && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold
                             bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              <FaRobot size={10} /> AI Lọc Cộng Tác (Collaborative)
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

      {/* Content — Grid Layout (Fahasa-style) */}
      <div className="p-5 px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-6">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">
            Chưa có gợi ý nào. Hãy đọc và đánh giá một vài cuốn sách để bắt đầu!
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <RecommendCard key={product._id} product={product} isColdStart={isColdStart} />
              ))}
            </div>

            {/* Nút "Xem tất cả" — dẫn đến trang riêng /recommendations */}
            <div className="flex justify-center mt-6">
              <Link
                to="/recommendations"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl
                           bg-gradient-to-r from-emerald-500 to-teal-500
                           text-white font-bold text-sm uppercase tracking-wide
                           shadow-lg shadow-emerald-300/40
                           hover:from-emerald-600 hover:to-teal-600
                           hover:shadow-xl hover:shadow-emerald-400/40
                           hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200"
              >
                Xem tất cả gợi ý
                <FaChevronRight size={10} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default RecommendedForYou;
