import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cuộn lên đầu trang (0, 0) mỗi khi pathname thay đổi
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // Component này không cần render giao diện gì cả
};

export default ScrollToTop;
