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

const BestSeller = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await userRequest.get("/products?bestseller=true");
        setProducts(res.data.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    };
    fetchBestSellers();
  }, []);

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
    <div className="bg-white rounded-2xl shadow-sm mb-8 border border-amber-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between
                      bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 honeycomb-bg">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center uppercase tracking-wide
                       border-l-4 border-amber-400 pl-3">
          <FaTrophy className="mr-3 text-amber-500 text-2xl" />
          Bảng Xếp Hạng Bán Chạy
        </h2>
        <span className="text-sm font-semibold text-amber-600 cursor-pointer hover:text-amber-700 hover:underline transition-colors">
          Xem tất cả &gt;
        </span>
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

export default BestSeller;
