import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppSidebar from "../components/admin/AppSidebar";
import AppHeader from "../components/admin/AppHeader";
import Backdrop from "../components/admin/Backdrop";
import ScrollToTop from "../components/common/ScrollToTop";

// Inner component: nằm BÊN TRONG SidebarProvider nên có thể dùng useSidebar()
const AdminLayoutContent = () => {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar cố định bên trái */}
      <AppSidebar />
      {/* Màn hình mờ phía sau sidebar khi mở trên mobile */}
      <Backdrop />

      {/* Khu vực nội dung chính - dịch phải theo độ rộng sidebar */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out
          ${isExpanded || isHovered ? "lg:ml-[260px]" : "lg:ml-[72px]"}
        `}
      >
        {/* Header dính trên cùng */}
        <AppHeader />

        {/* Nội dung trang (được inject từ React Router) */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Outer component: kiểm tra quyền Admin rồi cung cấp SidebarProvider
const AdminLayout = () => {
  const currentUser = useSelector((state) => state.user.currentUser);

  // Bảo vệ route Admin: chỉ cho phép role === 1 (Admin) truy cập
  if (!currentUser || currentUser.role !== 1) {
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
