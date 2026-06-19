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
  FaEnvelope,
} from "react-icons/fa";
import BookBeeLogo from "../shared/BookBeeLogo";

// Cấu hình tất cả menu nhóm của Admin
const menuGroups = [
  {
    label: "Menu",
    items: [
      { name: "Dashboard", icon: <FaTachometerAlt size={18} />, path: "/admin" },
    ],
  },
  {
    label: "Quản lý cửa hàng",
    items: [
      { name: "Đơn hàng", icon: <FaClipboardList size={18} />, path: "/admin/orders" },
      { name: "Sản phẩm", icon: <FaBook size={18} />, path: "/admin/products" },
      { name: "Thể loại", icon: <FaList size={18} />, path: "/admin/categories" },
      { name: "Khách hàng", icon: <FaUsers size={18} />, path: "/admin/users" },
      { name: "Đánh giá", icon: <FaComments size={18} />, path: "/admin/reviews" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { name: "Flash Sale", icon: <FaBolt size={18} />, path: "/admin/flash-sales" },
      { name: "Mã giảm giá", icon: <FaTicketAlt size={18} />, path: "/admin/coupons" },
      { name: "Banner", icon: <FaElementor size={18} />, path: "/admin/banners" },
      { name: "Email Marketing", icon: <FaEnvelope size={18} />, path: "/admin/email-marketing" },
    ],
  },
  {
    label: "Trí tuệ nhân tạo",
    items: [
      { name: "AI Gợi ý (Recommendations)", icon: <FaRobot size={18} />, path: "/admin/ai-recommendations" },
      { name: "AI Chat Insights", icon: <FaComments size={18} />, path: "/admin/chat-analytics" },
    ],
  },
];

/**
 * AppSidebar — Clone cấu trúc từ TailAdmin AppSidebar.tsx
 * aside: fixed, left-0, top-0, h-screen, bg-white, border-r, z-[9999]
 * width: w-[290px] (expanded) | w-[90px] (collapsed)
 * Logo section: py-8 px-5
 * Menu items: flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium
 * Active: bg-red-50 text-primary (BookBee thay cho brand-50 / brand-500 của TailAdmin)
 * Inactive: text-gray-700 hover:bg-gray-100
 */
const AppSidebar = () => {
  const location = useLocation();
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    toggleMobileSidebar,
  } = useSidebar();

  const showLabel = isExpanded || isHovered || isMobileOpen;

  // Kiểm tra link đang active
  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    if (isMobileOpen) toggleMobileSidebar();
  };

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={[
        // Clone TailAdmin: fixed left sidebar, full height
        "fixed top-0 left-0 z-[9999] flex h-screen flex-col overflow-y-auto overflow-x-hidden",
        "border-r border-gray-200 bg-white px-5",
        // Smooth transition
        "transition-all duration-300 ease-in-out",
        // Width: 290px expanded | 90px collapsed (exact TailAdmin values)
        showLabel ? "w-[290px]" : "w-[90px]",
        // Mobile: translate off-screen
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible
        "lg:translate-x-0",
      ].join(" ")}
    >
      {/* ---- LOGO AREA — clone TailAdmin py-8 ---- */}
      <div
        className={[
          "flex flex-shrink-0 items-center",
          showLabel ? "justify-between py-8" : "justify-center py-8",
        ].join(" ")}
      >
        {showLabel ? (
          <div className="flex items-center gap-2">
            <BookBeeLogo className="h-10 max-w-[160px]" />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Admin</span>
          </div>
        ) : (
          <BookBeeLogo className="w-10 h-10" />
        )}
      </div>

      {/* ---- NAVIGATION — clone TailAdmin flex flex-col gap-4 ---- */}
      <nav className="flex flex-col gap-4 flex-1">
        {menuGroups.map((group, gi) => (
          <div key={gi}>
            {/* Tiêu đề nhóm — clone TailAdmin: mb-2 text-xs uppercase tracking-widest */}
            {group.label && showLabel && (
              <h4 className="mb-2 text-xs font-medium uppercase tracking-widest text-gray-400 px-3">
                {group.label}
              </h4>
            )}
            {group.label && !showLabel && (
              <hr className="mb-2 border-gray-100" />
            )}

            {/* Menu list — clone TailAdmin: flex flex-col gap-1 */}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      title={!showLabel ? item.name : ""}
                      className={[
                        // Clone TailAdmin: relative flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium
                        "relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors duration-150",
                        !showLabel && "justify-center",
                        active
                          // Active state: bg-red-50 text-primary (BookBee brand = TailAdmin bg-brand-50 text-brand-500)
                          ? "bg-red-50 text-primary"
                          // Inactive state: text-gray-700 hover:bg-gray-100 (exact TailAdmin)
                          : "text-gray-700 hover:bg-gray-100",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {/* Icon — clone TailAdmin: icon span */}
                      <span
                        className={[
                          "flex-shrink-0",
                          active ? "text-primary" : "text-gray-500",
                        ].join(" ")}
                      >
                        {item.icon}
                      </span>
                      {/* Label — only when expanded */}
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
      <div className="flex-shrink-0 border-t border-gray-200 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={!showLabel ? "Xem Website" : ""}
          className={[
            "relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors",
            !showLabel && "justify-center",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <FaGlobe size={18} className="flex-shrink-0 text-gray-500" />
          {showLabel && <span className="truncate">Xem Website</span>}
        </a>
      </div>
    </aside>
  );
};

export default AppSidebar;
