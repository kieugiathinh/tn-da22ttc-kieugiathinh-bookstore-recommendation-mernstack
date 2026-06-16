import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaStar, FaRobot, FaTrophy, FaChevronLeft } from "react-icons/fa";
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
                 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-200/50
                 hover:border-emerald-100"
    >




      {discountPct > 0 && (
        <span className="absolute top-2 right-2 z-10 bg-rose-100 text-rose-600
                         font-bold text-[11px] px-2 py-0.5 rounded-full">
          -{discountPct}%
        </span>
      )}

      <div className="h-52 w-full flex items-center justify-center overflow-hidden
                      mb-3 rounded-xl bg-gradient-to-b from-slate-50 to-emerald-50/30">
        <img
          src={product.img}
          alt={product.title}
          className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <h3 className="text-sm font-medium text-slate-700 line-clamp-2 mb-1 min-h-[40px]
                     group-hover:text-emerald-700 transition-colors duration-200">
        {product.title}
      </h3>

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

// ─── Daily Suggestion Page ────────────────────────────────────────────────────

/**
 * Recommendations — Trang riêng cho gợi ý cá nhân hóa.
 * Hiển thị tất cả sản phẩm gợi ý với grid lớn, topK cao.
 * Yêu cầu đăng nhập.
 */
const Recommendations = () => {
  const { currentUser } = useSelector((state) => state.user);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isColdStart, setIsColdStart] = useState(false);
  const [algorithm, setAlgorithm] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userRequest.get("/recommend/for-you", {
          params: { top_k: 20 },
          withCredentials: true,
        });
        setProducts(res.data.products ?? []);
        setIsColdStart(res.data.isColdStart ?? false);
        setAlgorithm(res.data.algorithm ?? "");
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Vui lòng đăng nhập để xem gợi ý cá nhân hóa.");
        } else {
          setError("Không thể tải gợi ý lúc này. Vui lòng thử lại sau.");
        }
        console.error("[Recommendations]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

  const isFallback = isColdStart || algorithm === "bestseller-fallback" || algorithm === "category-fallback";

  // Chưa đăng nhập
  if (!currentUser) {
    return (
      <div className="bg-slate-50 min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Đăng nhập để xem gợi ý</h2>
            <p className="text-slate-500 mb-6">
              Hệ thống AI cần biết bạn là ai để gợi ý sách phù hợp nhất.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl
                         bg-gradient-to-r from-indigo-500 to-violet-500
                         text-white font-bold text-sm uppercase tracking-wide
                         shadow-lg shadow-indigo-300/40
                         hover:from-indigo-600 hover:to-violet-600
                         transition-all duration-200"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-indigo-600 transition-colors">
            <FaChevronLeft size={10} className="inline mr-1" />
            Trang chủ
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Gợi ý cho bạn</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-emerald-100
                          bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <h1 className="text-2xl font-extrabold text-slate-800 uppercase tracking-wide flex justify-center items-center gap-2">
                  <HiSparkles className="text-emerald-500 text-3xl" />
                  Gợi ý cho bạn
                  <HiSparkles className="text-emerald-500 text-3xl" />
                </h1>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">😕</div>
                <p className="text-slate-500 text-lg">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có gợi ý nào</h3>
                <p className="text-slate-500">
                  Hãy đọc và đánh giá một vài cuốn sách để hệ thống AI bắt đầu học sở thích của bạn!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <RecommendCard key={product._id} product={product} isColdStart={isColdStart} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
