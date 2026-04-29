import { useEffect, useState } from "react";
import { FaStar, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { userRequest } from "../requestMethods";
import ProductCard from "./ProductCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Nút Next
const NextArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 cursor-pointer bg-white text-gray-600 hover:text-purple-600 shadow-lg rounded-full p-3 border border-gray-100 hover:scale-110 transition-all duration-200 flex items-center justify-center"
    onClick={onClick}
  >
    <FaChevronRight />
  </div>
);

// Nút Prev
const PrevArrow = ({ onClick }) => (
  <div
    className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 cursor-pointer bg-white text-gray-600 hover:text-purple-600 shadow-lg rounded-full p-3 border border-gray-100 hover:scale-110 transition-all duration-200 flex items-center justify-center"
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
        // Gọi API Top Rated
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
    <div className="bg-white rounded-xl shadow-sm mb-8 border border-yellow-100">
      <div className="px-6 py-4 border-b border-yellow-100 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-white rounded-t-xl">
        <h2 className="text-xl font-extrabold text-gray-800 flex items-center uppercase tracking-wide">
          <FaStar className="mr-3 text-yellow-500 text-2xl" />
          Đánh Giá Cao Nhất
        </h2>
      </div>
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
