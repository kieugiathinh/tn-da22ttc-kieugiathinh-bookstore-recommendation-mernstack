
import Banner from "../../components/client/Banner";
import Category from "../../components/client/Category";
import FlashSale from "../../components/client/FlashSale";
import BestSeller from "../../components/client/BestSeller";
import TopRated from "../../components/client/TopRated";
import CouponList from "../../components/client/CouponList";
import NewProducts from "../../components/client/NewProducts";
import RecommendedForYou from "../../components/client/RecommendedForYou";

const Home = () => {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 pt-10 space-y-10 mb-10">
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
