import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import {
  FaTachometerAlt,
  FaBook,
  FaList,
  FaClipboardList,
  FaUsers,
  FaComments,
  FaBolt,
  FaTicketAlt,
  FaElementor,
  FaGlobe,
  FaRobot,
  FaTimes,
} from "react-icons/fa";
import BookBeeLogo from "../shared/BookBeeLogo";

// Cấu hình tất cả menu nhóm của Admin
const menuGroups = [
  {
    label: null, // Nhóm đầu không có tiêu đề
    items: [
      { name: "Dashboard", icon: <FaTachometerAlt size={17} />, path: "/admin" },
    ],
  },
  {
    label: "Quản lý cửa hàng",
    items: [
      { name: "Đơn hàng", icon: <FaClipboardList size={17} />, path: "/admin/orders" },
      { name: "Sản phẩm", icon: <FaBook size={17} />, path: "/admin/products" },
      { name: "Thể loại", icon: <FaList size={17} />, path: "/admin/categories" },
      { name: "Khách hàng", icon: <FaUsers size={17} />, path: "/admin/users" },
      { name: "Đánh giá", icon: <FaComments size={17} />, path: "/admin/reviews" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { name: "Flash Sale", icon: <FaBolt size={17} />, path: "/admin/flash-sales" },
      { name: "Mã giảm giá", icon: <FaTicketAlt size={17} />, path: "/admin/coupons" },
      { name: "Banner", icon: <FaElementor size={17} />, path: "/admin/banners" },
    ],
  },
  {
    label: "Trí tuệ nhân tạo",
    items: [
      { name: "AI Chat Insights", icon: <FaRobot size={17} />, path: "/admin/chat-analytics" },
    ],
  },
];

const AppSidebar = () => {
  const location = useLocation();
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();

  // Sidebar đang hiển thị đủ label khi:
  // - Desktop: đang mở rộng HOẶC đang hover
  // - Mobile: sidebar đang được mở
  const showLabel = isExpanded || isHovered || isMobileOpen;

  // Kiểm tra link đang active
  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    // Đóng mobile sidebar sau khi chọn menu
    if (isMobileOpen) toggleMobileSidebar();
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={[
        // Vị trí: fixed, full chiều cao màn hình
        "fixed top-0 left-0 z-40 flex h-screen flex-col",
        "border-r border-gray-200 bg-white",
        // Transition chiều rộng mượt mà
        "transition-all duration-300 ease-in-out",
        // Chiều rộng theo trạng thái
        isExpanded || isHovered ? "w-[260px]" : "w-[72px]",
        // Mobile: ẩn bằng cách translate ra khỏi màn hình
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: luôn hiển thị
        "lg:translate-x-0",
      ].join(" ")}
    >
      {/* ---- LOGO AREA ---- */}
      <div
        className={[
          "flex flex-shrink-0 items-center border-b border-gray-200",
          showLabel ? "justify-between px-6 py-5" : "justify-center py-5",
        ].join(" ")}
      >
        {showLabel ? (
          <div className="flex items-center gap-2">
            <BookBeeLogo className="h-9 max-w-[140px]" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
          </div>
        ) : (
          <BookBeeLogo className="w-8 h-8" />
        )}

        {/* Nút đóng sidebar (chỉ hiện trên mobile) */}
        {isMobileOpen && (
          <button
            onClick={toggleMobileSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Đóng menu"
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>

      {/* ---- NAVIGATION ---- */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
        {menuGroups.map((group, gi) => (
          <div key={gi}>
            {/* Tiêu đề nhóm: chỉ hiện khi sidebar mở */}
            {group.label && showLabel && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            {/* Divider khi sidebar thu gọn */}
            {group.label && !showLabel && (
              <hr className="mb-2 border-gray-100" />
            )}

            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      title={!showLabel ? item.name : ""}
                      className={[
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                        !showLabel && "justify-center",
                        active
                          ? "bg-red-50 text-primary"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {/* Icon */}
                      <span
                        className={[
                          "flex-shrink-0",
                          active ? "text-primary" : "text-slate-400",
                        ].join(" ")}
                      >
                        {item.icon}
                      </span>
                      {/* Label */}
                      {showLabel && (
                        <span className="truncate">{item.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ---- FOOTER: LINK XEM WEBSITE ---- */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={!showLabel ? "Xem Website" : ""}
          className={[
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors",
            !showLabel && "justify-center",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <FaGlobe size={17} className="flex-shrink-0" />
          {showLabel && <span className="truncate">Xem Website</span>}
        </a>
      </div>
    </aside>
  );
};

export default AppSidebar;
