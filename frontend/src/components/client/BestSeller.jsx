import { useEffect, useState } from "react";
import { FaTrophy, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Arrow components — Amber accent
const NextArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10
               cursor-pointer bg-white text-slate-500 hover:text-amber-500
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-amber-200 hover:scale-110 hover:shadow-amber-100
               transition-all duration-200 flex items-center justify-center"
    onClick={onClick}
  >
    <FaChevronRight />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10
               cursor-pointer bg-white text-slate-500 hover:text-amber-500
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-amber-200 hover:scale-110 hover:shadow-amber-100
               transition-all duration-200 flex items-center justify-center"
    onClick={onClick}
  >
    <FaChevronLeft />
  </div>
);

const ShoppingTrends = () => {
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState("week"); // Mặc định: Tuần này

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await userRequest.get(`/products/trends?period=${period}`);
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTrends();
  }, [period]);

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 2 } },
      { breakpoint: 600, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    ],
  };

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 mb-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-300/40">
            <FaTrophy className="text-white text-lg" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">
            Xu Hướng Mua Sắm
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-orange-50 p-1 rounded-xl">
          {[
            { id: "day", label: "Hôm nay" },
            { id: "week", label: "Tuần này" },
            { id: "month", label: "Tháng này" },
            { id: "all", label: "Mọi thời đại" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                period === tab.id
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-slate-500 hover:text-orange-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slider Content */}
      <div className="p-5 px-6 relative">
        <Slider {...settings}>
          {products.map((item, index) => (
            <div key={item._id} className="px-2 pb-2 pt-2 h-full">
              <div className="relative h-full">
                {/* Rank badge — Top 3 */}
                {index < 3 && (
                  <div
                    className={`absolute -top-2 -left-1 z-20 w-8 h-9 flex items-center justify-center
                                font-bold text-white text-sm shadow-md
                                ${index === 0 ? "bg-amber-500 shadow-amber-300/50"
                                  : index === 1 ? "bg-slate-400 shadow-slate-300/50"
                                  : "bg-orange-700 shadow-orange-300/50"
                                }`}
                    style={{ clipPath: "polygon(0% 0%, 100% 0, 100% 100%, 50% 85%, 0% 100%)" }}
                  >
                    {index + 1}
                  </div>
                )}
                <ProductCard product={item} isBestSeller={true} />
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default ShoppingTrends;
