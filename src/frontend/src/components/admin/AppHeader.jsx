import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaSignOutAlt, FaUser, FaExternalLinkAlt,
  FaBell, FaChevronRight
} from "react-icons/fa";

// Map đường dẫn → [Nhóm, Trang]
const BREADCRUMB_MAP = {
  "/admin":                       ["", "Dashboard"],
  "/admin/orders":                ["Cửa hàng", "Đơn hàng"],
  "/admin/products":              ["Cửa hàng", "Sản phẩm"],
  "/admin/categories":            ["Cửa hàng", "Thể loại"],
  "/admin/users":                 ["Cửa hàng", "Khách hàng"],
  "/admin/reviews":               ["Cửa hàng", "Đánh giá"],
  "/admin/flash-sales":           ["Marketing", "Flash Sale"],
  "/admin/coupons":               ["Marketing", "Mã giảm giá"],
  "/admin/banners":               ["Marketing", "Banner"],
  "/admin/email-marketing":       ["Marketing", "Email Marketing"],
  "/admin/ai-recommendations":    ["Trí tuệ nhân tạo", "AI Gợi ý"],
  "/admin/chat-analytics":        ["Trí tuệ nhân tạo", "AI Chat Insights"],
  "/admin/user-stats":            ["Thống kê", "Khách hàng"],
  "/admin/order-stats":           ["Thống kê", "Đơn hàng"],
  "/admin/product-stats":         ["Thống kê", "Sách"],
};

const AppHeader = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const handleToggle = () => {
    window.innerWidth >= 1024 ? toggleSidebar() : toggleMobileSidebar();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const crumb = BREADCRUMB_MAP[location.pathname] || ["", "Trang quản trị"];
  const [group, page] = crumb;

  return (
    <header className="sticky top-0 z-[99999] flex w-full items-center bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_8px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div className="flex w-full items-center justify-between px-4 py-3 lg:px-6">

        {/* ======= LEFT: Hamburger + Breadcrumb ======= */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger */}
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 text-gray-500 bg-gray-100 hover:bg-orange-50 hover:text-primary rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {isMobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M6.22 7.28a1 1 0 011.42-1.42L12 10.59l4.36-4.73a1 1 0 111.42 1.42L13.06 12l4.72 4.72a1 1 0 01-1.42 1.42L12 13.41l-4.36 4.73a1 1 0 11-1.42-1.42L10.94 12 6.22 7.28z"
                  fill="currentColor" />
              </svg>
            ) : (
              <svg width="18" height="14" viewBox="0 0 16 12" fill="none">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M0 1a1 1 0 011-1h14a1 1 0 010 2H1a1 1 0 01-1-1zm0 10a1 1 0 011-1h14a1 1 0 010 2H1a1 1 0 01-1-1zM1 5a1 1 0 000 2h7a1 1 0 000-2H1z"
                  fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Breadcrumb — chỉ desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm min-w-0">
            <Link to="/admin" className="flex-shrink-0 font-medium text-gray-400 hover:text-primary transition-colors">
              Admin
            </Link>
            {group && (
              <>
                <FaChevronRight size={9} className="flex-shrink-0 text-gray-300" />
                <span className="flex-shrink-0 text-gray-400 font-medium">{group}</span>
              </>
            )}
            <FaChevronRight size={9} className="flex-shrink-0 text-gray-300" />
            <span className="font-bold text-gray-800 truncate">{page}</span>
          </nav>

          {/* Tên trang — mobile */}
          <span className="lg:hidden font-bold text-gray-800 truncate text-sm">{page}</span>
        </div>

        {/* ======= RIGHT: Bell + User ======= */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Chuông thông báo */}
          <button
            className="relative flex items-center justify-center w-9 h-9 text-gray-500 bg-gray-100 hover:bg-orange-50 hover:text-primary rounded-xl transition-all duration-200 focus:outline-none"
            title="Thông báo"
          >
            <FaBell size={16} />
            {/* Badge tĩnh = 3 */}
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white ring-2 ring-white shadow-sm">
              3
            </span>
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(p => !p)}
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-all duration-200 focus:outline-none"
            >
              {/* Avatar */}
              <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-orange-100 shadow-sm flex-shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-orange-50 flex items-center justify-center">
                    <FaUser size={14} className="text-primary" />
                  </div>
                )}
              </div>
              {/* Name */}
              <div className="hidden lg:block text-left">
                <p className="text-[13px] font-bold text-gray-800 leading-tight truncate max-w-[100px]">
                  {currentUser?.fullname || "Admin"}
                </p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  Quản trị viên
                </p>
              </div>
              {/* Chevron */}
              <svg
                className={`hidden lg:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? "rotate-180 text-primary" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3.5 bg-gradient-to-br from-orange-50 to-white border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-orange-100 flex-shrink-0">
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="avatar" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-orange-100 flex items-center justify-center">
                          <FaUser size={15} className="text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-800 truncate">{currentUser?.fullname}</p>
                      <p className="text-[11px] text-gray-500 truncate">{currentUser?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-primary transition-colors"
                  >
                    <FaExternalLinkAlt size={13} className="text-gray-400" />
                    Xem Website
                  </a>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt size={13} />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
