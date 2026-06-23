import {
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiLogOut,
  FiClipboard,
  FiSettings,
  FiTag,
  FiMenu,
  FiClock,
  FiTrendingUp,
  FiX
} from "react-icons/fi";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import BookBeeLogo from "../shared/BookBeeLogo";
import { userRequest } from "../../requestMethods";

const Navbar = () => {
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

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

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const trendingRes = await userRequest.get("/search/trending");
        setTrendingSearches(trendingRes.data);

        if (currentUser) {
          const historyRes = await userRequest.get("/search/history");
          setSearchHistory(historyRes.data);
        }
      } catch (error) {
        console.error("Error fetching search data:", error);
      }
    };
    fetchSearchData();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await userRequest.get(`/search/suggest?q=${encodeURIComponent(search.trim())}`);
        setSuggestions(res.data);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSearch = async (keyword = search) => {
    if (keyword.trim()) {
      try {
        await userRequest.post("/search/record", { keyword: keyword.trim() });
        if (currentUser) {
          const historyRes = await userRequest.get("/search/history");
          setSearchHistory(historyRes.data);
        }
      } catch (error) {
        console.error("Error recording search:", error);
      }
      setIsSearchFocused(false);
      navigate(`/products?search=${encodeURIComponent(keyword.trim())}`);
    }
  };

  const handleEnterKey = (e) => {
    if (e.key === "Enter") handleSearch(search);
  };

  const handleDeleteHistory = async (e, keyword) => {
    e.stopPropagation();
    try {
      await userRequest.delete(`/search/history/${encodeURIComponent(keyword)}`);
      setSearchHistory(prev => prev.filter(item => item.keyword !== keyword));
    } catch (error) {
      console.error("Error deleting history:", error);
    }
  };

  const handleClearAllHistory = async (e) => {
    e.stopPropagation();
    try {
      await userRequest.delete("/search/history");
      setSearchHistory([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
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
          <div className="relative w-full max-w-[520px] group search-container">
            <input
              type="text"
              placeholder="Tìm kiếm sách yêu thích của bạn..."
              value={search}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full py-2.5 pl-6 pr-14 border-2 border-primary rounded-full outline-none
                         focus:ring-0 focus:shadow-md focus:border-orange-500
                         text-sm text-slate-700 placeholder:text-slate-400
                         bg-white transition-all duration-300"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleEnterKey}
            />
            <button
              onClick={() => handleSearch(search)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2
                         bg-primary hover:bg-primary-hover
                         text-white rounded-full w-10 h-[80%] flex items-center justify-center
                         transition-all duration-200 cursor-pointer"
            >
              <FiSearch className="text-lg" />
            </button>

            {/* SEARCH DROPDOWN */}
            {isSearchFocused && (search.trim() || searchHistory.length > 0 || trendingSearches.length > 0) && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                {search.trim() ? (
                  suggestions.length > 0 ? (
                    <div className="p-2">
                      <div className="px-2 mb-2 mt-1">
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                          <FiSearch /> Gợi ý sản phẩm
                        </span>
                      </div>
                      <div className="space-y-1">
                        {suggestions.map((item) => (
                          <Link
                            key={item._id}
                            to={`/product/${item._id}?source=search`}
                            onClick={() => {
                              setIsSearchFocused(false);
                              setSearch("");
                            }}
                            className="flex items-center gap-3 hover:bg-orange-50 rounded-xl p-2 cursor-pointer transition-colors"
                          >
                            <img src={item.img} alt={item.title} className="w-10 h-14 object-cover rounded-md shadow-sm border border-gray-100" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm text-gray-800 font-bold truncate leading-tight mb-1">{item.title}</span>
                              <span className="text-xs text-gray-500 truncate">{item.author || "Đang cập nhật"}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 font-medium">
                      Không tìm thấy kết quả nào cho "{search}"
                    </div>
                  )
                ) : (
                  <>
                    {currentUser && searchHistory.length > 0 && (
                      <div className="p-3 border-b border-gray-50">
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FiClock /> Lịch sử tìm kiếm
                          </span>
                          <button onClick={handleClearAllHistory} className="text-[10px] text-orange-500 hover:text-orange-600 font-medium hover:underline tracking-wide">
                            XÓA TẤT CẢ
                          </button>
                        </div>
                        <div className="space-y-1">
                          {searchHistory.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between hover:bg-orange-50 rounded-xl px-2 py-1.5 cursor-pointer group/item transition-colors" onClick={() => handleSearch(item.keyword)}>
                              <span className="text-sm text-gray-700 font-medium truncate flex-1">{item.keyword}</span>
                              <button onClick={(e) => handleDeleteHistory(e, item.keyword)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover/item:opacity-100 transition-all">
                                <FiX size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {trendingSearches.length > 0 && (
                      <div className="p-3">
                        <div className="px-2 mb-2">
                          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FiTrendingUp /> Tìm kiếm phổ biến
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 px-1">
                          {trendingSearches.map((item, idx) => (
                            <button key={idx} onClick={() => handleSearch(item.keyword)} className="px-3 py-1.5 bg-gray-50 hover:bg-orange-100 hover:text-orange-700 text-gray-600 text-xs font-medium rounded-lg transition-colors border border-gray-100 flex items-center gap-1.5 shadow-sm">
                              {item.keyword}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT MENU */}
        <div className="flex items-center gap-5">
          {/* Cart */}
          <Link to="/cart">
            <div className="relative cursor-pointer group p-2">
              <FiShoppingCart
                className="text-2xl text-slate-600 group-hover:text-primary transition-colors duration-200"
              />
              {cart.quantity > 0 && (
                <span
                  className="absolute top-0 right-0 w-5 h-5
                             bg-red-500 text-white text-[10px] font-bold rounded-full
                             flex items-center justify-center
                             shadow-sm ring-2 ring-white
                             transform group-hover:scale-110 transition-transform"
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
              <div className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-full hover:bg-slate-100 transition-colors group">
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
                <span className="font-semibold text-slate-700 text-sm hidden lg:block max-w-[100px] truncate select-none group-hover:text-primary transition-colors">
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
                  <div className="px-4 py-3 border-b border-slate-100 bg-orange-50/50 rounded-t-2xl">
                    <p className="text-xs text-slate-500">Xin chào,</p>
                    <p className="font-bold text-primary truncate">{currentUser.fullname}</p>
                  </div>

                  {currentUser.role === 1 && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                                 hover:bg-orange-50 hover:text-primary font-semibold transition-colors"
                    >
                      <FiSettings className="text-lg" /> Trang quản trị
                    </Link>
                  )}
                  <Link
                    to="/myaccount"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-orange-50 hover:text-primary transition-colors"
                  >
                    <FiUser className="text-lg" /> Tài khoản của tôi
                  </Link>
                  <Link
                    to="/my-vouchers"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-orange-50 hover:text-primary transition-colors"
                  >
                    <FiTag className="text-lg" /> Mã giảm giá
                  </Link>
                  <Link
                    to="/myorders"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700
                               hover:bg-orange-50 hover:text-primary transition-colors"
                  >
                    <FiClipboard className="text-lg" /> Đơn mua
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600
                                 hover:bg-rose-50 transition-colors
                                 flex items-center gap-2 rounded-b-2xl"
                    >
                      <FiLogOut className="text-lg" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login">
                <button className="text-slate-600 font-bold hover:text-orange-500 transition-colors text-sm px-2 cursor-pointer">
                  Đăng nhập
                </button>
              </Link>
              <Link to="/register">
                <button className="px-6 py-2.5 rounded-full font-bold text-sm text-white
                             bg-gradient-to-r from-orange-500 to-[#EE4D2D] hover:from-[#EE4D2D] hover:to-orange-600
                             shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer">
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
