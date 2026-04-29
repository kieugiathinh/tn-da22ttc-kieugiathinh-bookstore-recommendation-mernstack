import { useState, useEffect } from "react";
import { FaBolt, FaChevronRight, FaClock } from "react-icons/fa";
import { userRequest } from "../requestMethods";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";

const FlashSale = () => {
  const [products, setProducts] = useState([]);
  const [endTime, setEndTime] = useState(null); // Lưu thời gian kết thúc thực tế
  const [timeLeft, setTimeLeft] = useState(0); // Lưu số giây còn lại

  // 1. Fetch Data
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await userRequest.get("/flash-sales/active");
        if (res.data) {
          // Map dữ liệu sản phẩm
          const mappedProducts = res.data.products.map((item) => ({
            ...item.product,
            discountedPrice: item.discountPrice,
            sold: item.soldCount,
            quantityLimit: item.quantityLimit,
          }));
          setProducts(mappedProducts);

          // Lưu thời gian kết thúc từ DB
          setEndTime(new Date(res.data.endTime).getTime());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchFlashSale();
  }, []);

  // 2. Logic đếm ngược chính xác
  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = (endTime - now) / 1000; // Chuyển sang giây

      if (distance > 0) {
        setTimeLeft(distance);
      } else {
        // Hết giờ -> Dừng đếm và có thể reload lại data hoặc ẩn đi
        setTimeLeft(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  // 3. Hàm Format hiển thị (HH : MM : SS)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    // Helper thêm số 0 đằng trước (vd: 05)
    const pad = (num) => num.toString().padStart(2, "0");

    return { h: pad(h), m: pad(m), s: pad(s) };
  };

  const time = formatTime(timeLeft);

  // Nếu không có sản phẩm hoặc đã hết giờ thì ẩn
  if (products.length === 0 || timeLeft <= 0) return null;

  return (
    <div className="rounded-xl shadow-sm mb-8 overflow-hidden border border-red-200">
      {/* --- HEADER STYLE FAHASA --- */}
      {/* Sử dụng Background màu đỏ/cam đặc trưng */}
      <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-red-600 to-orange-500 text-white">
        <div className="flex items-center gap-6 mb-2 md:mb-0">
          {/* Title có icon tia sét */}
          <div className="flex items-center text-2xl font-extrabold italic uppercase tracking-tighter transform -skew-x-10">
            <FaBolt className="mr-2 text-yellow-300 text-3xl animate-bounce" />
            <span className="text-shadow-sm">Flash Sale</span>
          </div>

          {/* Đồng hồ đếm ngược nổi bật */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium opacity-90 hidden sm:inline-block">
              Kết thúc sau
            </span>
            <div className="flex items-center font-bold text-red-600">
              <div className="bg-white px-2 py-1 rounded-md min-w-[32px] text-center shadow-sm">
                {time.h}
              </div>
              <span className="text-white mx-1 text-xl">:</span>
              <div className="bg-white px-2 py-1 rounded-md min-w-[32px] text-center shadow-sm">
                {time.m}
              </div>
              <span className="text-white mx-1 text-xl">:</span>
              <div className="bg-white px-2 py-1 rounded-md min-w-[32px] text-center shadow-sm">
                {time.s}
              </div>
            </div>
          </div>
        </div>
        <Link
          to="/flash-sale"
          className="group bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center backdrop-blur-sm border border-white/40"
        >
          Xem tất cả{" "}
          <FaChevronRight className="ml-1 text-xs group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* --- PRODUCT LIST --- */}
      {/* Nền trắng làm nổi bật sản phẩm */}
      <div className="bg-white p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.slice(0, 5).map((item) => (
            <ProductCard key={item._id} product={item} isFlashSale={true} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashSale;
