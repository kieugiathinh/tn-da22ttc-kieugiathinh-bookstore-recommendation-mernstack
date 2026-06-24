import { useEffect, useState } from "react";
import { HiSparkles } from "react-icons/hi2";
import { publicRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-3 animate-pulse">
    <div className="h-48 bg-slate-100 rounded-xl mb-3" />
    <div className="h-3 bg-slate-100 rounded-full mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-2/3 mb-3" />
    <div className="h-4 bg-slate-200 rounded-full w-1/2" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * SimilarProducts — Hiển thị cuối trang chi tiết sản phẩm.
 * Sử dụng chung ProductCard để đồng bộ giao diện toàn hệ thống.
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
    <section className="bg-white rounded-2xl shadow-sm mb-8 border border-orange-100 overflow-hidden mt-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-orange-100 flex items-center justify-between
                      bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center uppercase tracking-wide
                       border-l-4 border-orange-500 pl-3">
          <HiSparkles className="mr-2 text-orange-500 text-2xl" />
          Có Thể Bạn Thích
        </h2>
      </div>

      {/* Content — Grid Layout */}
      <div className="p-5 px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="text-center text-sm text-slate-400 py-6">{error}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SimilarProducts;
