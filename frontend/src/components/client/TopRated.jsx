import { useEffect, useState } from "react";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Arrow components — Sky/Blue accent
const NextArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10
               cursor-pointer bg-white text-slate-500 hover:text-sky-500
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-sky-200 hover:scale-110
               transition-all duration-200 flex items-center justify-center"
    onClick={onClick}
  >
    <FaChevronRight />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10
               cursor-pointer bg-white text-slate-500 hover:text-sky-500
               shadow-lg rounded-full p-3 border border-slate-100
               hover:border-sky-200 hover:scale-110
               transition-all duration-200 flex items-center justify-center"
    onClick={onClick}
  >
    <FaChevronLeft />
  </div>
);

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

  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3 } },
      { breakpoint: 600, settings: { slidesToShow: 2 } },
    ],
  };

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm mb-8 border border-sky-100 overflow-hidden">
      {/* Header — Sky theme */}
      <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between
                      bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center uppercase tracking-wide
                       border-l-4 border-sky-500 pl-3 gap-3">
          <FaStar className="text-amber-400 text-2xl drop-shadow-sm" />
          Đánh Giá Cao Nhất
        </h2>
        <span className="text-sm font-semibold text-sky-600 hover:text-sky-700 cursor-pointer hover:underline transition-colors">
          Xem tất cả &gt;
        </span>
      </div>

      {/* Slider */}
      <div className="p-5 px-6 relative">
        <Slider {...settings}>
          {products.map((item) => (
            <div key={item._id} className="px-2 py-2 h-full">
              <ProductCard product={item} />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default TopRated;
