import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * ProtectedRoute — Bảo vệ route yêu cầu đăng nhập.
 * Nếu chưa đăng nhập → redirect về /login.
 * Nếu đang khởi tạo auth → hiển thị loading.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <LoadingSpinner text="Đang xác thực..." />;
  }

  if (!isAuthenticated) {
    // Lưu vị trí hiện tại để redirect lại sau khi login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
