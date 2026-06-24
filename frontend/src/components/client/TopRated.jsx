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
    <div className="bg-orange-600 rounded-3xl p-6 shadow-xl mb-10 relative overflow-hidden">
      {/* Header — Left Aligned, White text on Orange bg */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-orange-500 relative z-10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
          <FaStar className="text-orange-500 text-lg" />
        </div>
        <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
          Mật Vàng 5 Sao
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-orange-400 to-transparent ml-4 hidden sm:block" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
        {products.slice(0, 10).map((item) => (
          <div key={item._id} className="h-full">
            <ProductCard product={item} />
          </div>
        ))}
      </div>

      {/* Xem Thêm Button */}
      <div className="mt-8 flex justify-center relative z-10">
        <Link 
          to="/products?sort=toprated" 
          className="group flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-sm border-2 border-white text-white hover:bg-white hover:text-orange-600 transition-all duration-300 shadow-sm"
        >
          Khám phá thêm Mật Vàng
          <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default TopRated;
