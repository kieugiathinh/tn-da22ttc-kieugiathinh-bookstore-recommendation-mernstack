import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";

// --- Khởi tạo Component Nút Next Custom ---
const NextArrow = (props) => {
  const { onClick } = props;
  return (
    <div
      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-white/80 hover:bg-primary hover:text-white text-primary w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </div>
  );
};

// --- Khởi tạo Component Nút Prev Custom ---
const PrevArrow = (props) => {
  const { onClick } = props;
  return (
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 cursor-pointer bg-white/80 hover:bg-primary hover:text-white text-primary w-10 h-10 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 backdrop-blur-sm"
      onClick={onClick}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </div>
  );
};

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0); // State để theo dõi vị trí banner hiện tại

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: true, // Bật mũi tên điều hướng
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    beforeChange: (prev, next) => setCurrentSlide(next), // Cập nhật vị trí mỗi khi slide đổi

    // Tùy chỉnh Container chứa các chấm tròn (nằm đè lên trên ảnh ở góc dưới)
    appendDots: (dots) => (
      <div style={{ bottom: "16px", position: "absolute", width: "100%" }}>
        <ul className="m-0 p-0 flex justify-center items-center gap-2"> {dots} </ul>
      </div>
    ),

    // Tùy chỉnh thiết kế của từng chấm tròn
    customPaging: (i) => (
      <div
        className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${i === currentSlide ? "w-8 bg-primary" : "w-2.5 bg-white/70 hover:bg-white"
          }`}
      ></div>
    ),
  };

  // Hàm tải banner từ API
  useEffect(() => {
    const getBanners = async () => {
      try {
        const res = await userRequest.get("/banners");
        const activeBanners = res.data.filter((b) => b.isActive === true);
        setBanners(activeBanners);
      } catch (err) {
        console.log("Lỗi tải banner:", err);
      } finally {
        setLoading(false);
      }
    };
    getBanners();
  }, []);

  // Phân loại banner sau khi tải
  const mainBanners = banners.filter((b) => b.type === "main" || !b.type);
  const subBanners = banners.filter((b) => b.type === "sub");

  // Nếu đang tải hoặc không có banner nào, hiển thị Banner Mặc định
  const displayMainBanners =
    mainBanners.length > 0
      ? mainBanners
      : [
          { _id: 1, img: "/banner1.png" },
          {
            _id: 2,
            img: "https://nhasachphuongnam.com/images/promo/262/banner-trang-chu-8-3-1920x640.jpg",
          },
        ];

  const displaySubBanners =
    subBanners.length >= 2
      ? subBanners.slice(0, 2) // Chỉ lấy đúng 2 banner phụ
      : [
          ...subBanners,
          ...[
            { _id: "sub1", img: "https://cdn0.fahasa.com/media/magentothem/banner7/VNPAY_315x115.png" },
            { _id: "sub2", img: "https://cdn0.fahasa.com/media/magentothem/banner7/Zalopay_315x115.jpg" },
          ].slice(0, 2 - subBanners.length), // Bù phần thiếu bằng banner mẫu
        ];

  if (loading) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-slate-100 animate-pulse rounded-2xl"></div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* CỘT TRÁI (2/3) - SLIDER BANNER CHÍNH */}
      <div className="md:col-span-2 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group h-[300px] md:h-[400px]">
        <Slider {...settings} className="h-full [&_.slick-list]:h-full [&_.slick-track]:h-full [&_.slick-slide]:h-full [&_.slick-slide>div]:h-full">
          {displayMainBanners.map((banner, index) => (
            <div key={banner._id || index} className="outline-none relative h-full w-full">
              <img
                src={banner.img}
                alt={banner.title || `banner-main-${index}`}
                className="block w-full h-full object-fill rounded-2xl"
              />
              {/* Hiển thị Title đè lên ảnh */}
              {banner.title && (
                <div className="absolute bottom-12 left-10 bg-white/80 px-4 py-2 rounded-lg shadow-sm hidden md:block backdrop-blur-md">
                  <h3 className="text-xl font-bold text-gray-800">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-sm text-gray-600">{banner.subtitle}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </Slider>
      </div>

      {/* CỘT PHẢI (1/3) - 2 BANNER PHỤ XẾP CHỒNG (CHỈ HIỂN THỊ TRÊN DESKTOP) */}
      <div className="hidden md:flex flex-col gap-4 h-[400px]">
        {displaySubBanners.map((banner, index) => (
          <div key={banner._id || index} className="flex-1 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group w-full">
            <img
              src={banner.img}
              alt={banner.title || `banner-sub-${index}`}
              className="block w-full h-full object-fill rounded-2xl transition-transform duration-500 group-hover:scale-105"
            />
            {banner.title && (
              <div className="absolute bottom-4 left-4 bg-white/80 px-3 py-1.5 rounded-md shadow-sm backdrop-blur-sm pointer-events-none">
                <h4 className="text-sm font-bold text-gray-800">{banner.title}</h4>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banner;