import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userRequest } from "../../requestMethods";

const Announcement = () => {
  const [topBanner, setTopBanner] = useState(null);

  useEffect(() => {
    const getBanners = async () => {
      try {
        const res = await userRequest.get("/banners");
        const activeTopBanners = res.data.filter(
          (b) => b.isActive === true && b.type === "top"
        );
        if (activeTopBanners.length > 0) {
          // Ưu tiên lấy banner top mới nhất
          setTopBanner(activeTopBanners[activeTopBanners.length - 1]);
        }
      } catch (err) {
        console.log("Lỗi tải banner top:", err);
      }
    };
    getBanners();
  }, []);

  return (
    <div className="bg-primary text-white flex justify-center items-center relative z-50 overflow-hidden h-[60px]">
      {topBanner ? (
        <Link to="/products" className="block w-full h-full flex justify-center items-center">
          <img
            src={topBanner.img}
            alt={topBanner.title || "Top Banner"}
            className="h-full w-full max-w-[1263px] object-cover object-center"
          />
        </Link>
      ) : (
        <div className="text-xs md:text-sm font-medium">
          🔥 Mùa Hè Rực Rỡ - Giảm giá lên đến 50% mọi đầu sách.
          <Link to="/products" className="ml-2 font-bold underline hover:text-white/80">
            Xem ngay!
          </Link>
        </div>
      )}
    </div>
  );
};

export default Announcement;
