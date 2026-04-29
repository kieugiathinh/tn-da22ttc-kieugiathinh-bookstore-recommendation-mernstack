import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useEffect, useState } from "react";
import { userRequest } from "../requestMethods";

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
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

  // Nếu đang tải hoặc không có banner nào, hiển thị Banner Mặc định
  const displayBanners =
    banners.length > 0
      ? banners
      : [
          { _id: 1, img: "/banner1.png" },
          {
            _id: 2,
            img: "https://nhasachphuongnam.com/images/promo/262/banner-trang-chu-8-3-1920x640.jpg",
          },
          {
            _id: 3,
            img: "https://cdn0.fahasa.com/media/magentothem/banner7/Manga_Week_T324_Slide_840x320.jpg",
          },
        ];

  if (loading) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-gray-200 animate-pulse rounded-xl"></div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-md my-4">
      <Slider {...settings}>
        {displayBanners.map((banner, index) => (
          <div key={banner._id || index} className="outline-none relative">
            <img
              src={banner.img}
              alt={banner.title || "banner"}
              className="w-full h-[200px] md:h-[400px] object-cover"
            />
            {/* (Tùy chọn) Hiển thị Title đè lên ảnh nếu muốn */}
            {banner.title && (
              <div className="absolute bottom-10 left-10 bg-white/80 px-4 py-2 rounded-lg shadow-sm hidden md:block">
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
  );
};

export default Banner;
