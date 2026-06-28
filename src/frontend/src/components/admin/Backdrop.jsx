import { useSidebar } from "../../context/SidebarContext";

// Backdrop (màn hình mờ đen) hiển thị khi mở sidebar trên mobile
const Backdrop = () => {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};

export default Backdrop;
