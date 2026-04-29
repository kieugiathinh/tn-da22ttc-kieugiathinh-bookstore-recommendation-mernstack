import { useState, useEffect } from "react";
import { FaBolt, FaClock, FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";
import { userRequest } from "../requestMethods";
import ProductCard from "../components/ProductCard";

const FlashSalePage = () => {
  const [products, setProducts] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await userRequest.get("/flash-sales/active");
        if (res.data) {
          const mappedProducts = res.data.products.map((item) => ({
            ...item.product,
            discountedPrice: item.discountPrice,
            sold: item.soldCount,
            quantityLimit: item.quantityLimit,
          }));
          setProducts(mappedProducts);
          setEndTime(new Date(res.data.endTime).getTime());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSale();
  }, []);

  // 2. Logic đếm ngược
  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = (endTime - now) / 1000;
      if (distance > 0) setTimeLeft(distance);
      else {
        setTimeLeft(0);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  // Format thời gian
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (num) => num.toString().padStart(2, "0");
    return { h: pad(h), m: pad(m), s: pad(s) };
  };

  const time = formatTime(timeLeft);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* --- HEADER BANNER --- */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white py-8 px-4 shadow-lg mb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Breadcrumb nhỏ */}
          <div className="absolute top-4 left-4 text-xs opacity-80 hover:opacity-100 flex items-center gap-1">
            <Link to="/">
              <FaHome />
            </Link>{" "}
            / <span>Flash Sale</span>
          </div>

          <div className="flex items-center gap-4">
            <FaBolt className="text-5xl text-yellow-300 animate-bounce" />
            <div>
              <h1 className="text-4xl font-extrabold uppercase italic tracking-tighter">
                Flash Sale
              </h1>
              <p className="opacity-90">Săn deal sốc - Giá hủy diệt</p>
            </div>
          </div>

          {/* Đồng hồ to */}
          {timeLeft > 0 ? (
            <div className="flex flex-col items-center">
              <span className="text-sm uppercase mb-1 font-bold opacity-90">
                Kết thúc trong
              </span>
              <div className="flex items-center gap-2 text-red-600 font-bold text-3xl">
                <div className="bg-white px-3 py-2 rounded-lg shadow-md min-w-[60px] text-center">
                  {time.h}
                </div>
                <span className="text-white text-2xl">:</span>
                <div className="bg-white px-3 py-2 rounded-lg shadow-md min-w-[60px] text-center">
                  {time.m}
                </div>
                <span className="text-white text-2xl">:</span>
                <div className="bg-white px-3 py-2 rounded-lg shadow-md min-w-[60px] text-center">
                  {time.s}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold bg-black/20 px-4 py-2 rounded-lg">
              Sự kiện đã kết thúc
            </div>
          )}
        </div>
      </div>

      {/* --- LIST PRODUCT --- */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-20">Đang tải dữ liệu...</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((item) => (
              <ProductCard key={item._id} product={item} isFlashSale={true} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 flex flex-col items-center text-gray-500">
            <FaClock className="text-6xl mb-4 text-gray-300" />
            <p className="text-xl">
              Hiện không có chương trình Flash Sale nào diễn ra.
            </p>
            <Link to="/" className="mt-4 text-purple-600 hover:underline">
              Quay lại trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashSalePage;
