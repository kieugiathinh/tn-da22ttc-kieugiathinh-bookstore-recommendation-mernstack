import { useEffect, useState } from "react";
import { FaTrophy, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { userRequest } from "../requestMethods";
import ProductCard from "./ProductCard";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- CUSTOM ARROW COMPONENTS (Nút điều hướng) ---
const NextArrow = ({ onClick }) => {
  return (
    <div
      className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 cursor-pointer bg-white text-gray-600 hover:text-purple-600 shadow-lg rounded-full p-3 border border-gray-100 hover:scale-110 transition-all duration-200 flex items-center justify-center"
      onClick={onClick}
    >
      <FaChevronRight />
    </div>
  );
};

const PrevArrow = ({ onClick }) => {
  return (
    <div
      className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 cursor-pointer bg-white text-gray-600 hover:text-purple-600 shadow-lg rounded-full p-3 border border-gray-100 hover:scale-110 transition-all duration-200 flex items-center justify-center"
      onClick={onClick}
    >
      <FaChevronLeft />
    </div>
  );
};

const BestSeller = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        // Gọi API lấy danh sách bestseller từ Backend
        const res = await userRequest.get("/products?bestseller=true");

        // Lấy 10 cuốn đầu tiên
        setProducts(res.data.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    };
    fetchBestSellers();
  }, []);

  // Cấu hình Slider
  const settings = {
    dots: false,
    infinite: false, // Không quay vòng lặp để người dùng biết điểm đầu/cuối
    speed: 500,
    slidesToShow: 5, // Hiển thị 5 sản phẩm trên PC
    slidesToScroll: 2, // Trượt 2 sản phẩm mỗi lần bấm
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024, // Tablet
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 600, // Mobile
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm mb-8 border border-indigo-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white rounded-t-xl">
        <h2 className="text-xl font-extrabold text-gray-800 flex items-center uppercase tracking-wide">
          <FaTrophy className="mr-3 text-yellow-500 text-2xl" />
          Bảng Xếp Hạng Bán Chạy
        </h2>
        <span className="text-sm font-medium text-indigo-600 cursor-pointer hover:underline">
          Xem tất cả &gt;
        </span>
      </div>

      {/* Slider Content */}
      <div className="p-5 px-6 relative">
        <Slider {...settings}>
          {products.map((item, index) => (
            <div key={item._id} className="px-2 pb-2 pt-2 h-full">
              <div className="relative h-full">
                {/* Huy hiệu Top 1, 2, 3 */}
                {index < 3 && (
                  <div
                    className={`absolute -top-2 -left-1 z-20 w-8 h-9 flex items-center justify-center font-bold text-white text-sm shadow-md
                          ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : "bg-orange-700"
                          }
                       `}
                    style={{
                      clipPath:
                        "polygon(0% 0%, 100% 0, 100% 100%, 50% 85%, 0% 100%)",
                    }}
                  >
                    {index + 1}
                  </div>
                )}

                {/* Product Card */}
                <ProductCard product={item} />
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default BestSeller;
