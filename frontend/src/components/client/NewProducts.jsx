import { useEffect, useState } from "react";
import { FaBookOpen, FaMagic, FaChevronRight } from "react-icons/fa";
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
    <div className="mb-8">
      {/* Section Header — Emerald theme */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50
                      rounded-2xl px-6 py-4 mb-5 border border-emerald-100
                      flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg
                          flex items-center justify-center shadow-sm shadow-emerald-300/40">
            <FaBookOpen className="text-white text-sm" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide
                         border-l-4 border-emerald-500 pl-3 flex items-center gap-2">
            Sách Mới Tuyển Chọn
            <FaMagic className="text-emerald-500 animate-pulse text-base" />
          </h2>
        </div>
        <span className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer
                         hover:underline transition-colors flex items-center gap-1">
          Xem thêm <FaChevronRight className="text-xs" />
        </span>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((item) => (
          <ProductCard key={item._id} product={item} isNew={true} />
        ))}
      </div>
    </div>
  );
};

export default NewProducts;
