import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaChevronRight } from "react-icons/fa";
import { HiSparkles } from "react-icons/hi2";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
    <div className="h-48 bg-slate-100 rounded-xl mb-3" />
    <div className="h-3 bg-slate-100 rounded-full mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-3/4 mb-3" />
    <div className="h-4 bg-emerald-50 rounded-full w-1/2" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const RecommendedForYou = ({ topK = 20 }) => {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Luôn luôn fetch, vì Hybrid hỗ trợ cả guest (trả về Popularity)
    const fetchHybrid = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      if (!isBackground) setError(null);
      try {
        const res = await userRequest.get("/recommend/hybrid", {
          params: { top_k: topK },
          withCredentials: true,
        });
        setProducts(res.data.products ?? []);
      } catch (err) {
        if (!isBackground) {
          setError("Không thể tải gợi ý lúc này.");
        }
        console.error("[RecommendedForYou]", err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    fetchHybrid();

    const timerId = setTimeout(() => {
      fetchHybrid(true);
    }, 5000);

    return () => clearTimeout(timerId);
  }, [currentUser, topK, location.key]);

  if (!loading && products.length === 0 && !error) return null;

  return (
    <section className="bg-white rounded-2xl shadow-sm mb-8 border border-emerald-100 overflow-hidden">
      {/* Header — Emerald Gradient */}
      <div className="px-6 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-wider">
          <HiSparkles className="text-white text-2xl animate-pulse" />
          Dành Riêng Cho Bạn
          <HiSparkles className="text-white text-2xl animate-pulse" />
        </h2>
        {currentUser && (
          <span className="text-emerald-100 text-sm font-medium italic hidden sm:block">
            Được cá nhân hóa bởi AI
          </span>
        )}
      </div>

      {/* Content — Grid Layout */}
      <div className="p-5 px-6 bg-gradient-to-b from-emerald-50/30 to-white">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-6">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Nút Xem tất cả */}
            <div className="flex justify-center mt-8">
              <Link
                to="/recommendations"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full
                           bg-white border-2 border-emerald-500 text-emerald-600
                           font-bold text-sm uppercase tracking-wide
                           hover:bg-emerald-500 hover:text-white
                           hover:shadow-lg hover:shadow-emerald-200
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-300"
              >
                Xem Thêm Khám Phá
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
