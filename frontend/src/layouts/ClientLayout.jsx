import { Outlet } from "react-router-dom";
import Navbar from "../components/client/Navbar";
import Footer from "../components/client/Footer";
import ScrollToTop from "../components/common/ScrollToTop";

// Layout dùng chung cho tất cả các trang khách hàng (Client)
const ClientLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default ClientLayout;
