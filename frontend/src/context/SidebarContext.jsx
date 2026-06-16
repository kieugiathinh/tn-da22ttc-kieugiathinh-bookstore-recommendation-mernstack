import { createContext, useContext, useState, useEffect } from "react";

// Tạo Context để chia sẻ trạng thái Sidebar cho toàn bộ Admin Layout
const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar phải được dùng bên trong SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  // Lắng nghe sự kiện thay đổi kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Tự động đóng mobile sidebar khi chuyển sang desktop
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar trên desktop (thu gọn / mở rộng)
  const toggleSidebar = () => setIsExpanded((prev) => !prev);

  // Toggle sidebar trên mobile (ẩn / hiện)
  const toggleMobileSidebar = () => setIsMobileOpen((prev) => !prev);

  // Toggle submenu
  const toggleSubmenu = (item) =>
    setOpenSubmenu((prev) => (prev === item ? null : item));

  return (
    <SidebarContext.Provider
      value={{
        // Trên mobile: sidebar không expand theo kiểu desktop
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
        setActiveItem,
        toggleSubmenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
