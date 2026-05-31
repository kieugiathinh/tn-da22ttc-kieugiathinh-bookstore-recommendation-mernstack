import { Outlet } from "react-router-dom";
import Navbar from "../components/client/Navbar";
import Footer from "../components/client/Footer";
import ScrollToTop from "../components/common/ScrollToTop";
import ChatWidget from "../components/client/ChatWidget";
import Announcement from "../components/client/Announcement";

// Layout dùng chung cho tất cả các trang khách hàng (Client)
const ClientLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      {/* Announcement bar – inspired by Fahasa's top promotional strip */}
      <Announcement />
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default ClientLayout;
