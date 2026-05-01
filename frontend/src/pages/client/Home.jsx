import Banner from "../../components/client/Banner";
import Category from "../../components/client/Category";
import FlashSale from "../../components/client/FlashSale";
import BestSeller from "../../components/client/BestSeller";
import TopRated from "../../components/client/TopRated";
import CouponList from "../../components/client/CouponList";
import NewProducts from "../../components/client/NewProducts";

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

