import Banner from "../../components/client/Banner";
import Category from "../../components/client/Category";
import FlashSale from "../../components/client/FlashSale";
import BestSeller from "../../components/client/BestSeller";
import TopRated from "../../components/client/TopRated";
import CouponList from "../../components/client/CouponList";
import NewProducts from "../../components/client/NewProducts";

const Home = () => {
  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Wrapper giới hạn chiều rộng nội dung để căn giữa đẹp mắt */}
      <div className="max-w-7xl mx-auto px-4 space-y-2 pt-6">
        {/* 1. Hero Banner Slider */}
        <Banner />
        {/* 2. Coupon Showcase */}
        <CouponList />
        {/* 3. Flash Sale — Hot deals */}
        <FlashSale />
        {/* 4. Thể loại sách đa sắc */}
        <Category />
        {/* 5. Sách mới — Emerald section */}
        <NewProducts />
        {/* 6. Bán chạy — Amber section */}
        <BestSeller />
        {/* 7. Đánh giá cao — Sky section */}
        <TopRated />
      </div>
    </div>
  );
};

export default Home;

