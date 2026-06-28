import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaChevronLeft, FaRobot } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { userRequest } from "../../requestMethods";
import ProductCard from "../../components/client/ProductCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
    <div className="h-48 bg-slate-100 rounded-xl mb-3" />
    <div className="h-3 bg-slate-100 rounded-full mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-3/4 mb-3" />
    <div className="h-4 bg-emerald-50 rounded-full w-1/2" />
  </div>
);

// ─── Daily Suggestion Page ────────────────────────────────────────────────────

/**
 * Recommendations — Trang riêng cho gợi ý cá nhân hóa (Hybrid).
 * Hiển thị tất cả sản phẩm gợi ý với grid lớn, topK cao.
 */
const Recommendations = () => {
  const { currentUser } = useSelector((state) => state.user);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userRequest.get("/recommend/hybrid", {
          params: { top_k: 40 }, // Lấy nhiều hơn cho trang riêng
          withCredentials: true,
        });
        setProducts(res.data.products ?? []);
      } catch (err) {
        setError("Không thể tải gợi ý lúc này. Vui lòng thử lại sau.");
        console.error("[Recommendations]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link to="/" className="hover:text-emerald-600 transition-colors">
            <FaChevronLeft size={10} className="inline mr-1" />
            Trang chủ
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-medium">Khám phá dành cho bạn</span>
        </div>

        {/* Chưa đăng nhập Alert */}
        {!currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaRobot className="text-amber-500 text-2xl" />
              <div>
                <h3 className="font-bold text-amber-800 text-sm">Gợi ý đang dùng chế độ chung</h3>
                <p className="text-amber-700 text-xs mt-0.5">Hệ thống AI cần biết bạn là ai để đưa ra các gợi ý chính xác nhất dựa trên sở thích.</p>
              </div>
            </div>
            <Link
              to="/login"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-lg shadow transition-colors whitespace-nowrap ml-4"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-2xl shadow-sm border border-emerald-100 overflow-hidden bg-gradient-to-b from-emerald-500 to-white">
          {/* Header */}
          <div className="px-6 py-10 border-b border-white/20">
            <div className="text-center w-full">
              <h1 className="text-3xl font-extrabold text-white uppercase tracking-wide flex justify-center items-center gap-3 mb-3">
                <HiSparkles className="text-white text-4xl animate-pulse drop-shadow-sm" />
                <span className="drop-shadow-sm">Khám Phá Sách Dành Riêng Cho Bạn</span>
                <HiSparkles className="text-white text-4xl animate-pulse drop-shadow-sm" />
              </h1>
              <p className="text-white/90 text-sm font-medium drop-shadow-sm max-w-2xl mx-auto">
                Tuyển tập những tựa sách được AI tổng hợp từ sở thích, lịch sử mua sắm và xu hướng mới nhất.
              </p>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-6 min-h-[500px]">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 text-emerald-300">😕</div>
                <p className="text-slate-500 text-lg">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 text-emerald-300">📚</div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có gợi ý nào</h3>
                <p className="text-slate-500">
                  Hãy đọc và đánh giá một vài cuốn sách để hệ thống AI bắt đầu học sở thích của bạn!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
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
