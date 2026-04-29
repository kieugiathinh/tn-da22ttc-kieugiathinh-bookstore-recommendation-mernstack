import {
  FaBook,
  FaList,
  FaClipboardList,
  FaElementor,
  FaTachometerAlt, // Icon Dashboard
  FaSignOutAlt,
  FaUsers,
  FaBolt,
  FaComments,
  FaTicketAlt,
  FaGlobe, // Icon Website
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
// Import logout action nếu cần

const Menu = () => {
  const location = useLocation();

  const menuGroups = [
    {
      title: "CHÍNH",
      items: [
        // Sửa link trang chủ admin thành /admin
        { path: "/admin", icon: <FaTachometerAlt />, label: "Dashboard" },
      ],
    },
    {
      title: "QUẢN LÝ CỬA HÀNG",
      items: [
        { path: "/admin/orders", icon: <FaClipboardList />, label: "Đơn hàng" },
        { path: "/admin/products", icon: <FaBook />, label: "Sản phẩm" },
        { path: "/admin/categories", icon: <FaList />, label: "Thể loại" },
        { path: "/admin/users", icon: <FaUsers />, label: "Khách hàng" },
        { path: "/admin/reviews", icon: <FaComments />, label: "Đánh giá" },
      ],
    },
    {
      title: "MARKETING",
      items: [
        { path: "/admin/flash-sales", icon: <FaBolt />, label: "Flash Sale" },
        { path: "/admin/coupons", icon: <FaTicketAlt />, label: "Mã giảm giá" },
        { path: "/admin/banners", icon: <FaElementor />, label: "Banner" },
      ],
    },
  ];

  const isActive = (path) => {
    // Logic chính xác cho Dashboard (chỉ active khi đúng là /admin)
    if (path === "/admin" && location.pathname !== "/admin") return false;
    return (
      (location.pathname.startsWith(path) && path !== "/admin") ||
      location.pathname === path
    );
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-white border-r border-gray-200 sticky top-0 shadow-sm font-sans">
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <span className="text-2xl font-extrabold text-purple-700 tracking-tighter">
          GTBOOKS<span className="text-gray-400 text-xs ml-1">ADMIN</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {menuGroups.map((group, index) => (
          <div key={index}>
            <span className="px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 block">
              {group.title}
            </span>
            <ul>
              {group.items.map((item) => (
                <Link to={item.path} key={item.label}>
                  <li
                    className={`relative px-6 py-3 flex items-center text-sm font-medium transition-all duration-200 cursor-pointer border-l-4
                      ${
                        isActive(item.path)
                          ? "border-purple-600 text-purple-700 bg-purple-50"
                          : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                      }`}
                  >
                    <span
                      className={`text-lg mr-3 ${
                        isActive(item.path)
                          ? "text-purple-600"
                          : "text-gray-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </li>
                </Link>
              ))}
            </ul>
          </div>
        ))}

        {/* Nút Xem Website */}
        <div>
          <span className="px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 block">
            LỐI TẮT
          </span>
          <ul>
            <a href="/" target="_blank" rel="noopener noreferrer">
              <li className="relative px-6 py-3 flex items-center text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 cursor-pointer border-l-4 border-transparent">
                <span className="text-lg mr-3 text-gray-400">
                  <FaGlobe />
                </span>
                Xem Website
              </li>
            </a>
          </ul>
        </div>
      </div>

      {/* <div className="border-t border-gray-200 p-4">
        <div className="flex items-center p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors duration-200 font-medium">
          <FaSignOutAlt className="mr-3 text-lg" />
          <span>Đăng xuất</span>
        </div>
      </div> */}
    </div>
  );
};

export default Menu;
