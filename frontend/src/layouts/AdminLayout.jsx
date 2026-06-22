import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppSidebar from "../components/admin/AppSidebar";
import AppHeader from "../components/admin/AppHeader";
import Backdrop from "../components/admin/Backdrop";
import ScrollToTop from "../components/common/ScrollToTop";
import LoadingSpinner from "../components/common/LoadingSpinner";

// Inner component: nằm BÊN TRONG SidebarProvider nên có thể dùng useSidebar()
// Cấu trúc clone chính xác từ TailAdmin AppLayout.tsx
const AdminLayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar cố định bên trái */}
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      {/* Khu vực nội dung chính - flex-1 chiếm phần còn lại */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[272px]" : "lg:ml-[80px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        {/* Header dính trên cùng */}
        <AppHeader />

        {/* Nội dung trang (được inject từ React Router) */}
        <div className="p-4 mx-auto max-w-screen-2xl md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

// Outer component: kiểm tra quyền Admin rồi cung cấp SidebarProvider
const AdminLayout = () => {
  const { isAuthenticated, isAdmin, isInitializing } = useAuth();

  // Đang verify token → hiển thị loading
  if (isInitializing) {
    return <LoadingSpinner text="Đang xác thực quyền quản trị..." />;
  }

  // Bảo vệ route Admin: chỉ cho phép role === 1 (Admin) truy cập
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <ScrollToTop />
      <AdminLayoutContent />
    </SidebarProvider>
  );
};

export default AdminLayout;
