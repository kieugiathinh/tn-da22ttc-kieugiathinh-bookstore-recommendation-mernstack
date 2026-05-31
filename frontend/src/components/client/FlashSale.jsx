import { useState, useEffect } from "react";
import { FaBolt, FaChevronRight, FaClock } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";

const FlashSale = () => {
  const [products, setProducts] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

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
      }
    };
    fetchFlashSale();
  }, []);

  useEffect(() => {
    if (!endTime) return;
    const interval = setInterval(() => {
      const distance = (endTime - new Date().getTime()) / 1000;
      if (distance > 0) setTimeLeft(distance);
      else { setTimeLeft(0); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n) => n.toString().padStart(2, "0");
    return { h: pad(h), m: pad(m), s: pad(s) };
  };

  const time = formatTime(timeLeft);
  if (products.length === 0 || timeLeft <= 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-rose-100">
      {/* ===== HEADER — Vibrant gradient rose → orange → amber ===== */}
      <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between
                      bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white">
        <div className="flex items-center gap-6 mb-2 md:mb-0">
          {/* Title */}
          <div className="flex items-center text-2xl font-extrabold italic uppercase tracking-tighter -skew-x-6">
            <FaBolt className="mr-2 text-yellow-200 text-3xl animate-bounce drop-shadow-sm" />
            <span className="drop-shadow-sm">Flash Sale</span>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            <FaClock className="text-white/80 text-sm" />
            <span className="text-sm font-medium text-white/90 hidden sm:inline-block">
              Kết thúc sau
            </span>
            <div className="flex items-center gap-1 font-bold">
              <TimeBlock value={time.h} />
              <span className="text-yellow-200 text-lg font-black">:</span>
              <TimeBlock value={time.m} />
              <span className="text-yellow-200 text-lg font-black">:</span>
              <TimeBlock value={time.s} />
            </div>
          </div>
        </div>

        <Link
          to="/flash-sale"
          className="group bg-white/20 hover:bg-white/35 text-white
                     px-4 py-1.5 rounded-full text-sm font-semibold
                     transition-all flex items-center gap-1
                     backdrop-blur-sm border border-white/40"
        >
          Xem tất cả
          <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* ===== PRODUCT LIST — White canvas ===== */}
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

// Khối hiển thị số đếm ngược — nền trắng mờ
const TimeBlock = ({ value }) => (
  <div className="bg-white/25 backdrop-blur-sm border border-white/30
                  px-2.5 py-1 rounded-lg min-w-[36px] text-center
                  text-white font-mono font-black text-lg shadow-sm">
    {value}
  </div>
);

export default FlashSale;
