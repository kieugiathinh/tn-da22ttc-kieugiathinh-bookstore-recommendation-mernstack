import { useState, useEffect } from "react";
import Banner from "../../components/client/Banner";
import Category from "../../components/client/Category";
import FlashSale from "../../components/client/FlashSale";
import BestSeller from "../../components/client/BestSeller";
import TopRated from "../../components/client/TopRated";
import CouponList from "../../components/client/CouponList";
import NewProducts from "../../components/client/NewProducts";
import RecommendedForYou from "../../components/client/RecommendedForYou";

const Home = () => {
  // Giữ chiều cao trang ảo lúc mới load để ScrollRestoration của React Router
  // có thể cuộn đúng xuống vị trí cũ (ở tuốt dưới đáy) trước khi các API load xong.
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 1500); // Chờ 1.5s cho các API load xong
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="pb-16" style={{ minHeight: isInitialMount ? '4000px' : '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6 mb-8">
        {/* 1. Hero Banner Slider */}
        <Banner />
        {/* 2. Coupon Showcase */}
        <CouponList />
      </div>

      {/* 3. Flash Sale — Full width background */}
      <FlashSale />

      <div className="max-w-7xl mx-auto px-4 space-y-10 mt-10">
        {/* 4. Thể loại sách đa sắc */}
        <Category />
        {/* 5. Sách mới — Emerald section */}
        <NewProducts />
        {/* 6. Bán chạy — Amber section */}
        <BestSeller />
        {/* 7. Đánh giá cao — Mật Vàng 5 Sao */}
        <TopRated />
        {/* 8. AI Gợi ý cá nhân — Cuối trang */}
        <RecommendedForYou topK={20} />
      </div>
    </div>
  );
};

export default Home;
