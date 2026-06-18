import { useState, useEffect } from "react";
import { FaBolt, FaChevronRight, FaClock, FaChevronLeft } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const NextArrow = ({ onClick }) => (
  <div
    onClick={onClick}
    className="absolute top-1/2 -right-2 md:-right-4 transform -translate-y-1/2 z-20
               cursor-pointer bg-white text-primary hover:bg-primary hover:text-white
               shadow-lg rounded-full p-2 md:p-3 border border-orange-200
               transition-all duration-300 flex items-center justify-center"
  >
    <FaChevronRight className="text-sm md:text-base" />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    onClick={onClick}
    className="absolute top-1/2 -left-2 md:-left-4 transform -translate-y-1/2 z-20
               cursor-pointer bg-white text-primary hover:bg-primary hover:text-white
               shadow-lg rounded-full p-2 md:p-3 border border-orange-200
               transition-all duration-300 flex items-center justify-center"
  >
    <FaChevronLeft className="text-sm md:text-base" />
  </div>
);

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
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n) => n.toString().padStart(2, "0");
    return { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
  };

  const time = formatTime(timeLeft);
  if (products.length === 0 || timeLeft <= 0) return null;

  const sliderSettings = {
    dots: false,
    infinite: products.length > 5,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4, slidesToScroll: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 480, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="bg-primary py-12 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4">
        {/* ===== HEADER — White bar ===== */}
        <div className="bg-white rounded-full px-6 py-4 flex flex-col md:flex-row items-center justify-between mb-6 shadow-md">
          <div className="flex items-center gap-6 mb-2 md:mb-0">
            {/* Title */}
            <div className="flex flex-col">
              <div className="flex items-center text-2xl font-extrabold italic uppercase tracking-tighter">
                <FaBolt className="mr-1 text-primary text-2xl animate-bounce" />
                <span className="text-primary">Giờ Vàng Ong Thợ</span>
              </div>
              <p className="text-gray-500 text-[11px] font-medium ml-7 mt-0.5">Ong đang xả kho, nhanh tay săn mã to!</p>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 hidden sm:inline-block">
                Kết thúc trong
              </span>
              <div className="flex items-center gap-1 font-bold">
                {time.d !== "00" && (
                  <>
                    <TimeBlock value={time.d} />
                    <span className="text-gray-700 font-bold">:</span>
                  </>
                )}
                <TimeBlock value={time.h} />
                <span className="text-gray-700 font-bold">:</span>
                <TimeBlock value={time.m} />
                <span className="text-gray-700 font-bold">:</span>
                <TimeBlock value={time.s} />
              </div>
            </div>
          </div>

          <Link
            to="/flash-sale"
            className="group text-primary hover:text-orange-700
                       text-sm font-bold transition-all flex items-center gap-1"
          >
            Xem tất cả
            <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* ===== PRODUCT LIST — Slider ===== */}
        <div className="px-2">
          {products.length > 5 ? (
            <Slider {...sliderSettings} className="flash-sale-slider pb-2">
              {products.map((item) => (
                <div key={item._id} className="px-1.5 h-full">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all h-full overflow-hidden border border-white hover:border-orange-200">
                    <ProductCard product={item} isFlashSale={true} />
                  </div>
                </div>
              ))}
            </Slider>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.map((item) => (
                <div key={item._id} className="h-full">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all h-full overflow-hidden border border-white hover:border-orange-200">
                    <ProductCard product={item} isFlashSale={true} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Khối hiển thị số đếm ngược — nền đen
const TimeBlock = ({ value }) => (
  <div className="bg-black px-2 py-1 rounded text-white font-mono font-bold text-[15px] min-w-[32px] text-center leading-none">
    {value}
  </div>
);

export default FlashSale;
