import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { HiSparkles } from "react-icons/hi2";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
    <div className="h-48 bg-slate-100 rounded-xl mb-3" />
    <div className="h-3 bg-slate-100 rounded-full mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-2/3 mb-3" />
    <div className="h-4 bg-slate-200 rounded-full w-1/2" />
  </div>
);

/**
 * CartRecommendations — Lọc Cộng Tác (CF) gợi ý thêm trong Giỏ hàng
 * Hiển thị các sản phẩm cá nhân hóa giúp Upsell trước khi thanh toán.
 */
const CartRecommendations = ({ topK = 10 }) => {
  const { currentUser } = useSelector((state) => state.user);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) return; // Chỉ hiển thị CF khi đã đăng nhập

    const fetchCFRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userRequest.get("/recommend/for-you", {
          params: { top_k: topK },
          withCredentials: true,
        });
        setProducts(res.data.products ?? []);
      } catch (err) {
        setError("Không thể tải gợi ý lúc này.");
        console.error("[CartRecommendations]", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCFRecommendations();
  }, [currentUser, topK]);

  // Nếu chưa đăng nhập hoặc không có data thì không render gì cả để giỏ hàng gọn gàng
  if (!currentUser || (!loading && products.length === 0 && !error)) return null;

  return (
    <div className="mt-12 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-emerald-100 flex items-center justify-between
                      bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center uppercase tracking-wide
                       border-l-4 border-emerald-500 pl-3">
          <HiSparkles className="mr-2 text-emerald-500 text-2xl" />
          Có thể bạn sẽ thích
        </h2>
        <span className="text-sm font-medium text-slate-500 italic">Dành riêng cho bạn</span>
      </div>

      {/* Content */}
      <div className="p-5 px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-6">{error}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.slice(0, 5).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartRecommendations;
