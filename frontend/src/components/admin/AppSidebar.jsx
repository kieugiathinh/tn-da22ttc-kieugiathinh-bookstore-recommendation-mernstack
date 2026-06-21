import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import {
  FaTachometerAlt, FaRobot, FaGlobe,
  FaStore, FaBullhorn, FaAngleDown, FaChartBar, FaUsers, FaLightbulb
} from "react-icons/fa";
import BookBeeLogo from "../shared/BookBeeLogo";

const menuGroups = [
  {
    label: "Tổng quan",
    items: [
      { name: "Dashboard", icon: <FaTachometerAlt size={18} />, path: "/admin" },
    ],
  },
  {
    label: "Quản trị",
    items: [
      {
        name: "Cửa hàng",
        icon: <FaStore size={18} />,
        isDropdown: true,
        subItems: [
          { name: "Đơn hàng", path: "/admin/orders" },
          { name: "Sản phẩm", path: "/admin/products" },
          { name: "Thể loại", path: "/admin/categories" },
          { name: "Khách hàng", path: "/admin/users" },
          { name: "Đánh giá", path: "/admin/reviews" },
        ]
      },
      {
        name: "Chiến dịch Marketing",
        icon: <FaBullhorn size={18} />,
        isDropdown: true,
        subItems: [
          { name: "Flash Sale", path: "/admin/flash-sales" },
          { name: "Mã giảm giá", path: "/admin/coupons" },
          { name: "Banner", path: "/admin/banners" },
          { name: "Email Marketing", path: "/admin/email-marketing" },
        ]
      },
      {
        name: "AI Chatbot",
        icon: <FaRobot size={18} />,
        isDropdown: true,
        subItems: [
          { name: "Dashboard", path: "/admin/chat-analytics" },
          { name: "Lịch sử Chat", path: "/admin/chat-history" },
        ]
      },
      {
        name: "Hệ thống gợi ý",
        icon: <FaLightbulb size={18} />,
        isDropdown: true,
        subItems: [
          { name: "Dashboard", path: "/admin/ai-recommendations" },
        ]
      }
    ],
  },
  {
    label: "Thống kê & Báo cáo",
    items: [
      {
        name: "Phân tích & Báo cáo",
        icon: <FaChartBar size={18} />,
        isDropdown: true,
        subItems: [
          { name: "Thống kê Khách hàng", path: "/admin/user-stats" },
          { name: "Thống kê Đơn hàng", path: "/admin/order-stats" },
          { name: "Thống kê Sách", path: "/admin/product-stats" },
          { name: "Thống kê Flash Sale", path: "/admin/flashsale-stats" },
        ]
      },
    ],
  }
];

const AppSidebar = () => {
  const location = useLocation();
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const [openDropdowns, setOpenDropdowns] = useState({});

  const showLabel = isExpanded || isHovered || isMobileOpen;

  useEffect(() => {
    const newOpenState = {};
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.isDropdown) {
          const isChildActive = item.subItems.some(sub => location.pathname.startsWith(sub.path));
          if (isChildActive) newOpenState[item.name] = true;
        }
      });
    });
    setOpenDropdowns(newOpenState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleDropdown = (name) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
    if (!showLabel) setIsHovered(true);
  };

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
        "fixed top-0 left-0 z-[9999] flex h-screen flex-col overflow-y-auto overflow-x-hidden",
        "border-r border-gray-100 bg-white",
        "shadow-[2px_0_20px_rgba(0,0,0,0.04)]",
        "transition-all duration-300 ease-in-out",
        showLabel ? "w-[272px]" : "w-[80px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      ].join(" ")}
    >
      {/* ---- LOGO ---- */}
      <div className={[
        "flex flex-shrink-0 items-center border-b border-gray-50 transition-all duration-300",
        showLabel ? "justify-start px-6 py-5" : "justify-center px-0 py-5",
      ].join(" ")}>
        {showLabel ? (
          <BookBeeLogo className="h-8 max-w-[140px]" />
        ) : (
          <img
            src="/logochatbot.png"
            alt="Logo"
            className="w-10 h-10 object-contain drop-shadow-sm"
          />
        )}
      </div>

      {/* ---- NAVIGATION ---- */}
      <nav className="flex flex-col flex-1 py-4 overflow-y-auto">
        {menuGroups.map((group, gi) => (
          <div key={gi} className="mb-2">
            {/* Group Label */}
            {showLabel && (
              <div className="px-6 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 select-none">
                  {group.label}
                </span>
              </div>
            )}
            {!showLabel && gi > 0 && <div className="mx-5 mb-2 border-t border-gray-100" />}

            <ul className="flex flex-col gap-0.5 px-3">
              {group.items.map((item) => {
                if (item.isDropdown) {
                  const isOpen = openDropdowns[item.name];
                  const hasActive = item.subItems.some(s => isActive(s.path));

                  return (
                    <li key={item.name}>
                      <button
                        onClick={() => toggleDropdown(item.name)}
                        title={!showLabel ? item.name : undefined}
                        className={[
                          "group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200",
                          !showLabel && "justify-center",
                          hasActive
                            ? "bg-orange-50 text-primary"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        ].filter(Boolean).join(" ")}
                      >
                        {/* Active bar */}
                        {hasActive && showLabel && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}

                        <span className={[
                          "flex-shrink-0 transition-all duration-200",
                          "group-hover:scale-110",
                          hasActive ? "text-primary" : "text-gray-400",
                        ].join(" ")}>
                          {item.icon}
                        </span>

                        {showLabel && (
                          <>
                            <span className="flex-1 text-left truncate transition-transform duration-200 group-hover:translate-x-0.5">
                              {item.name}
                            </span>
                            <FaAngleDown
                              size={12}
                              className={[
                                "flex-shrink-0 transition-transform duration-300 text-gray-400",
                                isOpen ? "rotate-180 text-primary" : "",
                              ].join(" ")}
                            />
                          </>
                        )}
                      </button>

                      {/* Sub-menu */}
                      <div className={[
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        (isOpen && showLabel) ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
                      ].join(" ")}>
                        <ul className="mt-1 mb-1 ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5">
                          {item.subItems.map((sub) => {
                            const subActive = isActive(sub.path);
                            return (
                              <li key={sub.path}>
                                <Link
                                  to={sub.path}
                                  onClick={handleLinkClick}
                                  className={[
                                    "group/sub relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                                    subActive
                                      ? "text-primary bg-white shadow-sm font-semibold"
                                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                                  ].join(" ")}
                                >
                                  {/* Dot indicator */}
                                  <span className={[
                                    "flex-shrink-0 w-1.5 h-1.5 rounded-full transition-all duration-200 -ml-1",
                                    subActive
                                      ? "bg-primary scale-125"
                                      : "bg-gray-300 group-hover/sub:bg-gray-500",
                                  ].join(" ")} />
                                  <span className="transition-transform duration-200 group-hover/sub:translate-x-0.5 truncate">
                                    {sub.name}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                }

                // Direct Link
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleLinkClick}
                      title={!showLabel ? item.name : undefined}
                      className={[
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-200",
                        !showLabel && "justify-center",
                        active
                          ? "bg-orange-50 text-primary"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      ].filter(Boolean).join(" ")}
                    >
                      {active && showLabel && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                      )}
                      <span className={[
                        "flex-shrink-0 transition-all duration-200 group-hover:scale-110",
                        active ? "text-primary" : "text-gray-400",
                      ].join(" ")}>
                        {item.icon}
                      </span>
                      {showLabel && (
                        <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ---- FOOTER ---- */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title={!showLabel ? "Về Cửa hàng" : undefined}
          className={[
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-gray-600",
            "hover:bg-orange-50 hover:text-primary transition-all duration-200",
            !showLabel && "justify-center",
          ].filter(Boolean).join(" ")}
        >
          <FaGlobe
            size={18}
            className="flex-shrink-0 text-gray-400 transition-all duration-300 group-hover:rotate-12 group-hover:text-primary"
          />
          {showLabel && (
            <span className="truncate transition-transform duration-200 group-hover:translate-x-0.5">
              Cửa hàng BookBee
            </span>
          )}
        </a>
      </div>
    </aside>
  );
};

export default AppSidebar;
