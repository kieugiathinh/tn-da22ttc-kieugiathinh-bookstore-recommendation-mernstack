import { useEffect, useState } from "react";
import { userRequest } from "../requestMethods";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { updateWallet } from "../redux/userRedux";
import Slider from "react-slick"; // Import Slider
import {
  FaTicketAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
} from "react-icons/fa";

// Import CSS cho slider (nếu chưa import ở index.js/App.js)
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- CUSTOM ARROW BUTTONS ---
const NextArrow = ({ onClick }) => (
  <div
    onClick={onClick}
    className="absolute top-1/2 -right-2 md:-right-4 transform -translate-y-1/2 z-10 cursor-pointer bg-white text-purple-600 hover:bg-purple-600 hover:text-white shadow-md rounded-full p-2 border border-purple-100 transition-all duration-300"
  >
    <FaChevronRight />
  </div>
);

const PrevArrow = ({ onClick }) => (
  <div
    onClick={onClick}
    className="absolute top-1/2 -left-2 md:-left-4 transform -translate-y-1/2 z-10 cursor-pointer bg-white text-purple-600 hover:bg-purple-600 hover:text-white shadow-md rounded-full p-2 border border-purple-100 transition-all duration-300"
  >
    <FaChevronLeft />
  </div>
);

const CouponList = () => {
  const [coupons, setCoupons] = useState([]);
  const user = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();

  useEffect(() => {
    const getCoupons = async () => {
      try {
        const res = await userRequest.get("/coupons");
        setCoupons(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    getCoupons();
  }, []);

  const handleSaveCoupon = async (couponId) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu mã!");
      return;
    }
    try {
      const res = await userRequest.post("/coupons/save", { couponId });
      toast.success("Đã lưu vào kho voucher!");
      dispatch(updateWallet(res.data.wallet));
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu mã");
    }
  };

  // --- CẤU HÌNH SLIDER ---
  const settings = {
    dots: false,
    infinite: false, // Không lặp lại vô tận để người dùng biết điểm dừng
    speed: 500,
    slidesToShow: 3, // Hiển thị 3 mã trên PC
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2, slidesToScroll: 1 }, // Tablet hiện 2
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1, slidesToScroll: 1 }, // Mobile hiện 1
      },
    ],
  };

  if (coupons.length === 0) return null;

  return (
    <div className="my-8 px-2">
      <div className="flex items-center mb-4 gap-2">
        <div className="bg-purple-100 p-2 rounded-full">
          <FaTicketAlt className="text-purple-600 text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
          Mã Giảm Giá Hot
        </h2>
      </div>

      {/* Wrapper cho Slider */}
      <div className="px-2">
        <Slider {...settings}>
          {coupons.map((coupon) => {
            // Check xem user đã lưu mã này chưa
            const isSaved = user?.wallet?.some(
              (item) =>
                item.coupon === coupon._id || item.coupon?._id === coupon._id
            );

            return (
              <div key={coupon._id} className="px-2 py-2 h-full">
                {" "}
                {/* Padding để tạo khoảng cách giữa các slide */}
                <div className="bg-white border border-purple-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center shadow-sm hover:shadow-md transition-shadow relative overflow-hidden h-full min-h-[120px]">
                  {/* Trang trí: Hình bán nguyệt tạo hiệu ứng vé */}
                  <div className="absolute -left-3 top-1/2 -mt-3 w-6 h-6 rounded-full bg-gray-100 border-r border-gray-200 border-dashed"></div>
                  <div className="absolute -right-3 top-1/2 -mt-3 w-6 h-6 rounded-full bg-gray-100 border-l border-gray-200 border-dashed"></div>
                  {/* Đường kẻ đứt nét trang trí */}
                  <div className="absolute left-[70%] top-2 bottom-2 border-l-2 border-dashed border-gray-100 hidden md:block"></div>

                  {/* Cột Trái: Thông tin mã */}
                  <div className="flex-1 pr-4 w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-purple-50 text-purple-700 font-extrabold text-lg px-2 py-0.5 rounded border border-purple-100">
                        {coupon.code}
                      </span>
                      {/* Nếu là loại giảm % thì hiện badge */}
                      {coupon.discountType === "PERCENT" && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">
                          Giảm {coupon.discountValue}%
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 font-medium mb-2 min-h-[40px]">
                      {coupon.description}
                    </p>

                    <div className="text-xs text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded">
                      HSD:{" "}
                      {new Date(coupon.endDate).toLocaleDateString("vi-VN")}
                    </div>
                  </div>

                  {/* Cột Phải: Nút bấm */}
                  <div className="mt-3 md:mt-0 md:pl-4 flex flex-col items-center justify-center min-w-[80px]">
                    <button
                      onClick={() => handleSaveCoupon(coupon._id)}
                      disabled={isSaved}
                      className={`
                        flex items-center justify-center gap-1 px-4 py-2 rounded-full text-sm font-bold transition-all w-full
                        ${
                          isSaved
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105 active:scale-95"
                        }
                      `}
                    >
                      {isSaved ? (
                        <>
                          <FaCheck className="text-xs" /> Đã Lưu
                        </>
                      ) : (
                        "Lưu Mã"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>
    </div>
  );
};

export default CouponList;
