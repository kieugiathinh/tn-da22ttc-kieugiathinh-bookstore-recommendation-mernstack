import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * GuestRoute — Chỉ dành cho khách (chưa đăng nhập).
 * Nếu đã đăng nhập → redirect về trang chủ.
 * Dùng cho: Login, Register.
 */
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingSpinner text="Đang xác thực..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
