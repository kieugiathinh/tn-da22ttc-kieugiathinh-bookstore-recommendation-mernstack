import { useEffect, useState } from "react";
import { FaBookOpen, FaFire, FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";

const NewProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchNew = async () => {
      try {
        const res = await userRequest.get("/products/new");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNew();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 shadow-md">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/20">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <FaBookOpen className="text-orange-500 text-lg" />
        </div>
        <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight flex items-center gap-2 drop-shadow-sm">
          Tủ Sách Mới Của Ong Vàng
          <FaFire className="text-white animate-pulse text-lg" />
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-white/40 to-transparent ml-4 hidden sm:block" />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((item) => (
          <ProductCard key={item._id} product={item} isNew={true} />
        ))}
      </div>

      {/* Button Xem Thêm */}
      <div className="mt-8 flex justify-center">
        <Link 
          to="/products?sort=newest"
          className="group flex items-center gap-2 px-8 py-2.5 rounded-full font-bold text-sm border-2 border-white text-white hover:bg-white hover:text-orange-600 transition-all duration-300 shadow-sm"
        >
          Khám phá thêm sách mới 
          <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

export default NewProducts;
