import { useEffect, useRef, useState } from "react";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { FaBell, FaSignOutAlt, FaUser, FaExternalLinkAlt, FaSearch } from "react-icons/fa";

const AppHeader = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Xác định và gọi đúng hàm toggle tương ứng với kích thước màn hình
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between bg-white border-b border-gray-200 shadow-sm px-4 py-3 lg:px-6">
      {/* ---- BÊN TRÁI: Hamburger + Search ---- */}
      <div className="flex items-center gap-3">
        {/* Nút Hamburger */}
        <button
          onClick={handleToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          {isMobileOpen ? (
            /* Icon X khi mobile sidebar đang mở */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.22 6.22a.75.75 0 011.06 0L12 10.94l4.72-4.72a.75.75 0 111.06 1.06L13.06 12l4.72 4.72a.75.75 0 01-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 01-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 010-1.06z"
                fill="currentColor"
              />
            </svg>
          ) : (
            /* Icon hamburger 3 gạch */
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect width="16" height="1.5" rx="0.75" fill="currentColor" />
              <rect y="5.25" width="10" height="1.5" rx="0.75" fill="currentColor" />
              <rect y="10.5" width="16" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          )}
        </button>

        {/* Thanh tìm kiếm (chỉ hiện trên desktop) */}
        <div className="hidden lg:block">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <FaSearch size={13} />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="h-10 w-full max-w-md rounded-full bg-slate-100 py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 border-0 outline-none focus:ring-2 focus:ring-primary/20 transition-all xl:w-80"
            />
          </div>
        </div>
      </div>

      {/* ---- BÊN PHẢI: Thông báo + Avatar ---- */}
      <div className="flex items-center gap-2">
        {/* Nút thông báo */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-slate-100 transition-colors">
          <FaBell size={16} />
          {/* Badge số thông báo */}
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            3
          </span>
        </button>

        {/* Divider dọc */}
        <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1"></div>

        {/* Dropdown Avatar User */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen((p) => !p)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
          >
            {/* Avatar */}
            <div className="h-8 w-8 overflow-hidden rounded-full bg-primary-light flex items-center justify-center flex-shrink-0 ring-2 ring-gray-100">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaUser size={13} className="text-primary" />
              )}
            </div>
            {/* Tên + role (chỉ hiện trên sm+) */}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[120px]">
                {currentUser?.fullname || "Admin"}
              </p>
              <p className="text-[11px] text-gray-400">Quản trị viên</p>
            </div>
            {/* Chevron */}
            <svg
              className={`hidden sm:block w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1 overflow-hidden">
              {/* Info section */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentUser?.fullname}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{currentUser?.email}</p>
              </div>
              {/* Xem website */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaExternalLinkAlt size={13} className="text-gray-400" />
                Xem Website
              </a>
              {/* Đăng xuất */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <FaSignOutAlt size={13} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
