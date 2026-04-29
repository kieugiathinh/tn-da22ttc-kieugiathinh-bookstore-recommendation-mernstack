import { useEffect, useState } from "react";
import { FaLightbulb } from "react-icons/fa";
import { userRequest } from "../requestMethods";
import ProductCard from "./ProductCard";

const RandomProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchRandom = async () => {
      try {
        // Gọi API Random
        const res = await userRequest.get("/products?random=true");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRandom();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="mb-12">
      {/* --- KHUNG CHỨA (CONTAINER) --- */}
      {/* bg-teal-50: Nền xanh ngọc nhạt */}
      {/* border-teal-100: Viền xanh ngọc rất nhạt */}
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Trang trí nền mờ (Optional) - tạo cảm giác mềm mại */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-teal-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50"></div>

        {/* --- HEADER --- */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Đường kẻ trang trí đổi sang màu Teal */}
          <div className="h-[2px] w-12 bg-teal-300 rounded-full hidden sm:block"></div>

          <h2 className="text-2xl font-extrabold text-gray-800 mx-4 flex items-center uppercase tracking-wide">
            {/* Icon bóng đèn giữ màu vàng cho nổi bật */}
            <FaLightbulb className="mr-2 text-yellow-500 animate-pulse" />
            <span className="text-teal-800">Gợi Ý Hôm Nay</span>
          </h2>

          <div className="h-[2px] w-12 bg-teal-300 rounded-full hidden sm:block"></div>
        </div>

        {/* --- GRID SẢN PHẨM --- */}
        {/* z-10 để nội dung nổi lên trên lớp trang trí nền */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((item) => (
            <ProductCard key={item._id} product={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RandomProducts;
