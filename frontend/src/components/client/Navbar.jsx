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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import BookBeeLogo from "../shared/BookBeeLogo";

const Navbar = () => {
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const cart = useSelector((state) => state.cart);
  const { currentUser, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setSearch("");
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`h-[72px] bg-white sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "shadow-md border-b border-slate-100"
          : "shadow-sm border-b border-slate-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link to="/" className="flex-shrink-0 flex items-center">
          <BookBeeLogo className="h-10" />
        </Link>

        {/* SEARCH BAR */}
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="relative w-full max-w-[520px]">
            <input
              type="text"
              placeholder="Tìm kiếm sách yêu thích của bạn..."
              value={search}
              className="w-full py-2.5 pl-5 pr-14 border border-slate-200 rounded-full outline-none
                         focus:border-violet-400 focus:ring-2 focus:ring-violet-300/60
                         text-sm text-slate-700 placeholder:text-slate-400
                         bg-slate-50 transition-all duration-300"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleEnterKey}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2
                         bg-gradient-to-r from-violet-500 to-indigo-500
                         hover:from-violet-600 hover:to-indigo-600
                         text-white rounded-full w-9 h-9 flex items-center justify-center
                         shadow-sm shadow-violet-300/50 transition-all duration-200
                         hover:shadow-md hover:shadow-violet-400/40"
            >
              <FaSearch className="text-sm" />
            </button>
          </div>
        </div>

        {/* RIGHT MENU */}
        <div className="flex items-center gap-5">
          {/* Cart */}
          <Link to="/cart">
            <div className="relative cursor-pointer group">
              <FaShoppingCart
                className="text-2xl text-slate-500 group-hover:text-violet-600 transition-colors duration-200"
              />
              {cart.quantity > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-5 h-5
                             bg-gradient-to-br from-rose-400 to-orange-400
                             text-white text-[10px] font-bold rounded-full
                             flex items-center justify-center
                             shadow-sm border-2 border-white
                             animate-pulse"
                >
                  {cart.quantity}
                </span>
              )}
            </div>
          </Link>

          {/* User section */}
          {currentUser ? (
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center gap-2 cursor-pointer py-2 group">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-200 ring-offset-1"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full
                               bg-gradient-to-br from-violet-500 to-indigo-500
                               flex items-center justify-center
                               text-white font-bold text-sm
                               shadow-sm shadow-violet-300/50 select-none"
                  >
                    {currentUser.fullname ? currentUser.fullname.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <span className="font-semibold text-slate-700 text-sm hidden lg:block max-w-[100px] truncate select-none group-hover:text-violet-700 transition-colors">
                  {currentUser.fullname}
                </span>
              </div>

              {isDropdownOpen && (
                <div
                  className="absolute right-0 top-full w-58 bg-white
                             shadow-xl shadow-slate-200/70 rounded-2xl py-2
                             border border-slate-100 animate-fadeIn min-w-[220px]"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-t-2xl">
                    <p className="text-xs text-slate-500">Xin chào,</p>
                    <p className="font-bold text-slate-800 truncate">{currentUser.fullname}</p>
                  </div>

                  {currentUser.role === 1 && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600
                                 hover:bg-rose-50 font-semibold transition-colors"
                    >
                      <FaUserCog /> Trang quản trị
                    </Link>
                  )}
                  <Link
                    to="/myaccount"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    <FaUser /> Tài khoản của tôi
                  </Link>
                  <Link
                    to="/my-vouchers"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    <FaTicketAlt /> Mã giảm giá của tôi
                  </Link>
                  <Link
                    to="/myorders"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    <FaClipboardList /> Đơn mua
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-600
                                 hover:bg-rose-50 hover:text-rose-600 transition-colors
                                 flex items-center gap-2"
                    >
                      <FaSignOutAlt /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <button className="text-slate-600 font-semibold hover:text-violet-700 transition-colors text-sm">
                  Đăng nhập
                </button>
              </Link>
              <Link to="/register">
                <button
                  className="px-5 py-2 rounded-full font-semibold text-sm text-white
                             bg-gradient-to-r from-amber-400 to-orange-400
                             hover:from-amber-500 hover:to-orange-500
                             shadow-sm shadow-amber-300/50
                             transition-all duration-200
                             hover:shadow-md hover:shadow-amber-400/40
                             hover:-translate-y-0.5"
                >
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
