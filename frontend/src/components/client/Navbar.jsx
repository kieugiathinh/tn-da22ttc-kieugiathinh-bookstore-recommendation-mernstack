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
      className={`h-[72px] bg-white sticky top-0 z-50 transition-all duration-300 ${isScrolled
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
              className="w-full py-2.5 pl-5 pr-14 border-2 border-primary rounded-sm outline-none
                         focus:ring-0
                         text-sm text-slate-700 placeholder:text-slate-400
                         bg-white transition-all duration-300"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleEnterKey}
            />
            <button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2
                         bg-primary hover:bg-primary-hover
                         text-white rounded-sm w-12 h-[80%] flex items-center justify-center
                         transition-all duration-200"
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
                className="text-2xl text-slate-500 group-hover:text-primary transition-colors duration-200"
              />
              {cart.quantity > 0 && (
                <span
                  className="absolute -top-2 -right-2 w-5 h-5
                             bg-primary text-white text-[10px] font-bold rounded-full
                             flex items-center justify-center
                             shadow-sm border-2 border-white
                             animate-bounce"
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
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-light"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full
                               bg-primary
                               flex items-center justify-center
                               text-white font-bold text-sm
                               select-none border border-transparent"
                  >
                    {currentUser.fullname ? currentUser.fullname.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <span className="font-semibold text-slate-700 text-sm hidden lg:block max-w-[100px] truncate select-none hover:text-primary transition-colors">
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
                  <div className="px-4 py-3 border-b border-slate-100 bg-primary-light/50 rounded-t-2xl">
                    <p className="text-xs text-slate-500">Xin chào,</p>
                    <p className="font-bold text-primary truncate">{currentUser.fullname}</p>
                  </div>

                  {currentUser.role === 1 && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                                 hover:bg-primary-light hover:text-primary font-semibold transition-colors"
                    >
                      <FaUserCog /> Trang quản trị
                    </Link>
                  )}
                  <Link
                    to="/myaccount"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-primary-light hover:text-primary transition-colors"
                  >
                    <FaUser /> Tài khoản của tôi
                  </Link>
                  <Link
                    to="/my-vouchers"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-primary-light hover:text-primary transition-colors"
                  >
                    <FaTicketAlt /> Mã giảm giá của tôi
                  </Link>
                  <Link
                    to="/myorders"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-primary-light hover:text-primary transition-colors"
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
            <div className="flex items-center gap-4">
              <Link to="/login">
                <button className="text-slate-600 font-semibold hover:text-primary transition-colors text-sm">
                  Đăng nhập
                </button>
              </Link>
              <div className="w-px h-4 bg-slate-300"></div>
              <Link to="/register">
                <button className="px-5 py-2 rounded-sm font-semibold text-sm text-white
                             bg-primary hover:bg-primary-hover
                             shadow-sm transition-all duration-200 hover:-translate-y-0.5">
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
