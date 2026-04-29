import Banner from "../components/Banner";
import Category from "../components/Category";
import FlashSale from "../components/FlashSale";
import BestSeller from "../components/BestSeller";
import TopRated from "../components/TopRated";
import CouponList from "../components/CouponList";
import NewProducts from "../components/NewProducts";

const Home = () => {
  return (
    <div className="bg-gray-100 min-h-screen pb-10">
      {/* Wrapper giới hạn chiều rộng nội dung để căn giữa đẹp mắt */}
      <div className="max-w-7xl mx-auto px-4 space-y-6 pt-6">
        {/* 1. Banner Slider */}
        <Banner />
        <CouponList />
        <FlashSale />
        <Category />
        <NewProducts />
        <BestSeller />
        <TopRated />
      </div>
    </div>
  );
};

export default Home;
