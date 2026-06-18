import { useEffect, useState } from "react";
import { FaStar, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";

const TopRated = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        const res = await userRequest.get("/products?toprated=true");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTopRated();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-200 mb-8">
      {/* Header — Amber theme */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-100">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-300/40">
          <FaStar className="text-white text-lg" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight flex items-center gap-2">
          Mật Vàng 5 Sao
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent ml-4 hidden sm:block" />
      </div>

      {/* Grid: 2 rows x 5 columns = 10 items */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.slice(0, 10).map((item) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </div>

      {/* Xem Thêm Button */}
      <div className="mt-8 flex justify-center">
        <Link 
          to="/products?sort=toprated" 
          className="group flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-sm border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-amber-500/30"
        >
          Khám phá thêm Mật Vàng
          <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default TopRated;
