import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaSignOutAlt,
  FaClipboardList,
  FaUserCog,
  FaBars,
  FaTicketAlt,
} from "react-icons/fa";
// 1. Thêm useLocation vào import
import { Link, useNavigate, useLocation } from "react-router-dom";
// 2. Thêm useEffect vào import
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logOut } from "../redux/userRedux.js";

const Navbar = () => {
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  const currentUser = user.currentUser;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // 3. Khai báo location
  const location = useLocation();

  // --- 4. THÊM ĐOẠN CODE NÀY ĐỂ TỰ ĐỘNG XÓA TÌM KIẾM ---
  useEffect(() => {
    // Mỗi khi đường dẫn (pathname) thay đổi, reset ô tìm kiếm về rỗng
    setSearch("");
  }, [location.pathname]);
  // -----------------------------------------------------

  // Xử lý tìm kiếm
  const handleSearch = () => {
    if (search.trim()) {
      // Dùng encodeURIComponent để tìm kiếm tiếng Việt không bị lỗi
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleLogout = () => {
    dispatch(logOut());
    navigate("/login");
  };

  return (
    <div className="h-[80px] bg-white shadow-sm sticky top-0 z-50 transition-all">
      <div className="wrapper px-4 md:px-10 h-full flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="flex-1 flex items-center">
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 cursor-pointer tracking-wide">
            GTBOOKS
          </span>
        </Link>

        {/* SEARCH BAR */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="relative w-full max-w-[500px]">
            <input
              type="text"
              placeholder="Tìm kiếm sách yêu thích..."
              // Gán giá trị value vào input để React kiểm soát (Controlled Component)
              value={search}
              className="w-full py-2.5 pl-5 pr-12 border border-gray-300 rounded-full outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 text-sm"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleEnterKey}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1 bottom-1 bg-purple-600 text-white rounded-full w-10 h-8 flex items-center justify-center hover:bg-purple-700 transition-colors"
            >
              <FaSearch className="text-sm" />
            </button>
          </div>
        </div>

        {/* ... (Phần RIGHT MENU giữ nguyên không đổi) ... */}
        <div className="flex-1 flex items-center justify-end space-x-6">
          <Link to="/cart">
            <div className="relative cursor-pointer group">
              <FaShoppingCart className="text-2xl text-gray-600 group-hover:text-purple-600 transition duration-200" />
              {cart.quantity > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {cart.quantity}
                </span>
              )}
            </div>
          </Link>

          {currentUser ? (
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center space-x-2 cursor-pointer py-2">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover border border-purple-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold border border-purple-200 select-none">
                    {currentUser.fullname
                      ? currentUser.fullname.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )}

                <span className="font-semibold text-gray-700 text-sm hidden lg:block max-w-[100px] truncate select-none">
                  {currentUser.fullname}
                </span>
              </div>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full w-56 bg-white shadow-xl rounded-lg py-2 border border-gray-100 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Xin chào,</p>
                    <p className="font-bold text-gray-800 truncate">
                      {currentUser.fullname}
                    </p>
                  </div>

                  {currentUser.role === 1 && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold transition"
                    >
                      <FaUserCog className="inline mr-2" /> Trang quản trị
                    </Link>
                  )}

                  <Link
                    to="/myaccount"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                  >
                    <FaUser className="inline mr-2" /> Tài khoản của tôi
                  </Link>

                  <Link
                    to="/my-vouchers"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                  >
                    <FaTicketAlt className="inline mr-2" /> Mã giảm giá của tôi
                  </Link>

                  <Link
                    to="/myorders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition"
                  >
                    <FaClipboardList className="inline mr-2" /> Đơn mua
                  </Link>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition flex items-center"
                    >
                      <FaSignOutAlt className="inline mr-2" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <button className="text-gray-600 font-semibold hover:text-purple-600 transition text-sm">
                  Đăng nhập
                </button>
              </Link>
              <Link to="/register">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-full font-semibold text-sm hover:bg-purple-700 shadow-md transition transform hover:-translate-y-0.5">
                  Đăng ký
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
