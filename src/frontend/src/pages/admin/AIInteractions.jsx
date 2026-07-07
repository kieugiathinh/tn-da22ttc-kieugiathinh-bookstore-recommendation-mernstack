import { useState, useEffect } from "react";
import { userRequest } from "../../requestMethods";
import { toast } from "react-toastify";
import { FaHistory, FaFilter, FaSync, FaEye, FaCartPlus, FaShoppingCart, FaStar, FaSearch, FaTrash, FaChevronDown, FaHeart, FaFunnelDollar, FaArrowRight } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import Pagination from "../../components/admin/Pagination";
import PageHeader from "../../components/admin/PageHeader";
import { format } from "timeago.js";

const interactionIcons = {
  view: <FaEye className="text-blue-500" />,
  search_click: <FaSearch className="text-cyan-500" />,
  add_to_cart: <FaCartPlus className="text-amber-500" />,
  favorite: <FaHeart className="text-rose-500" />,
  review: <FaStar className="text-purple-500" />,
  purchase: <FaShoppingCart className="text-emerald-500" />,
  remove_cart: <FaTrash className="text-red-500" />,
  remove_favorite: <FaHeart className="text-pink-300" />,
  low_rating: <FaStar className="text-gray-400" />
};

const interactionLabels = {
  view: "Xem sản phẩm",
  search_click: "Click từ Tìm kiếm",
  add_to_cart: "Thêm Giỏ hàng",
  favorite: "Sách yêu thích",
  review: "Đánh giá sách",
  purchase: "Mua thành công",
  remove_cart: "Xóa khỏi giỏ",
  remove_favorite: "Bỏ yêu thích",
  low_rating: "Đánh giá thấp"
};

const AIInteractions = () => {

  const [interactionsList, setInteractionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterType, setFilterType] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterDays, setFilterDays] = useState("all");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(15);

  const [trendingSearches, setTrendingSearches] = useState([]);
  const [funnel, setFunnel] = useState(null);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get(`/interactions?pageNumber=${page}&limit=${limit}&type=${filterType}&source=${filterSource}&days=${filterDays}&keyword=${search}`);
      setInteractionsList(res.data.interactions);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch (error) {
      toast.error("Lỗi khi tải lịch sử hành vi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await userRequest.get("/search/trending");
      setTrendingSearches(res.data);
    } catch (error) {
      console.error("Lỗi lấy trending:", error);
    }
  };

  const fetchFunnel = async () => {
    try {
      const res = await userRequest.get("/stats/interaction-funnel");
      setFunnel(res.data);
    } catch (error) {
      console.error("Lỗi lấy funnel:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hành vi này không?")) {
      try {
        await userRequest.delete(`/interactions/${id}`);
        toast.success("Đã xóa hành vi thành công");
        fetchInteractions();
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi xóa hành vi");
      }
    }
  };

  useEffect(() => {
    fetchTrending();
    fetchFunnel();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInteractions();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterType, filterSource, filterDays, limit, search]);

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── PAGE HEADER ── */}
      <PageHeader
        title="Hành vi Người dùng"
        subtitle={`Tổng số ${total} hành vi đã được ghi nhận`}
        action={
          <button
            onClick={fetchInteractions}
            className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
          >
            <FaSync className={loading ? "animate-spin text-primary" : ""} size={12} />
            Làm mới
          </button>
        }
      />

      {/* ── FUNNEL CHUYỂN ĐỔI ── */}
      {funnel && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-100 p-2 rounded-lg"><FaFunnelDollar className="text-indigo-600 text-lg" /></div>
            <div>
              <h2 className="font-bold text-gray-900">Funnel Chuyển Đổi: Xem → Giỏ → Mua</h2>
              <p className="text-xs text-gray-400 font-medium">Tỷ lệ chuyển đổi giữa các bước quan trọng trong hành trình mua hàng</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar chart */}
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel.funnel} margin={{top: 5, right: 10, left: -10, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#374151', fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgb(0 0 0/0.1)'}} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {funnel.funnel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Conversion metrics */}
            <div className="flex flex-col justify-center gap-4">
              {[
                { label: "Xem → Thêm giỏ", rate: funnel.viewToCart, from: funnel.funnel[0]?.count, to: funnel.funnel[1]?.count, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                { label: "Giỏ → Mua", rate: funnel.cartToPurchase, from: funnel.funnel[1]?.count, to: funnel.funnel[2]?.count, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
                { label: "Tổng: Xem → Mua", rate: funnel.viewToPurchase, from: funnel.funnel[0]?.count, to: funnel.funnel[2]?.count, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${item.bg}`}>
                  <div>
                    <p className="text-xs font-bold text-gray-600">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{(item.from || 0).toLocaleString()} → {(item.to || 0).toLocaleString()} lượt</p>
                  </div>
                  <span className={`text-2xl font-bold ${item.color}`}>{item.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRENDING SEARCHES ── */}
      {trendingSearches && trendingSearches.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700">
            <FaSearch className="text-cyan-500" /> Top Từ Khóa Tìm Kiếm (7 Ngày Qua)
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingSearches.map((item, index) => (
              <div key={index} className="px-3 py-1.5 bg-cyan-50 border border-cyan-100 rounded-lg flex items-center gap-2 transition-transform hover:-translate-y-0.5 cursor-default">
                <span className="text-xs font-semibold text-cyan-800">{item.keyword}</span>
                <span className="text-[10px] font-bold text-white bg-cyan-500 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 space-y-3">
        {/* Row 1: Search */}
        <div className="flex gap-3 flex-col sm:flex-row items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            <input
              type="text"
              placeholder="Tìm tên khách hàng hoặc sản phẩm..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          {(filterType !== "all" || search !== "") && (
            <button
              onClick={() => { setFilterType("all"); setSearch(""); setPage(1); }}
              className="text-xs font-semibold text-gray-500 hover:text-primary px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
            >
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Lọc loại hành vi */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterType !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả hành vi</option>
              <option value="view">Chỉ Xem (View)</option>
              <option value="search_click">Từ Tìm kiếm</option>
              <option value="add_to_cart">Thêm Giỏ hàng</option>
              <option value="favorite">Sách yêu thích</option>
              <option value="purchase">Mua hàng</option>
              <option value="review">Đánh giá sách</option>
              <option value="remove_cart">Xóa khỏi giỏ</option>
              <option value="remove_favorite">Bỏ yêu thích</option>
              <option value="low_rating">Đánh giá thấp</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Lọc nguồn */}
          <div className="relative">
            <select
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
              className={`pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterSource !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Mọi nguồn</option>
              <option value="homepage">Trang chủ</option>
              <option value="search">Tìm kiếm</option>
              <option value="category">Danh mục</option>
              <option value="recommendation">Gợi ý AI</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Lọc thời gian */}
          <div className="relative">
            <select
              value={filterDays}
              onChange={(e) => { setFilterDays(e.target.value); setPage(1); }}
              className={`pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterDays !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Mọi lúc</option>
              <option value="7">7 ngày qua</option>
              <option value="30">30 ngày qua</option>
              <option value="90">90 ngày qua</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Số hàng/trang */}
          <div className="ml-auto">
            <select
              value={limit}
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="pl-3 pr-7 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-primary cursor-pointer appearance-none"
            >
              <option value={10}>10 / trang</option>
              <option value={15}>15 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>
        </div>

        {/* Kết quả */}
        <p className="text-xs text-gray-400">
          Hiển thị <span className="font-bold text-gray-700">{interactionsList.length}</span> / <span className="font-bold text-gray-700">{total}</span> kết quả
        </p>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Khách hàng</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Sản phẩm</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Hành vi (Signal)</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Thời lượng</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right">Thời gian</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                          <div className="h-2 bg-gray-200 rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-10 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="h-6 w-6 bg-gray-200 rounded mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : interactionsList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <FaHistory size={32} className="text-gray-200" />
                      <p className="text-sm font-medium">
                        {filterType !== "all" ? `Không tìm thấy hành vi nào phù hợp` : "Chưa có lịch sử hành vi"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                interactionsList.map((item) => (
                  <tr key={item._id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      {item.userId ? (
                        <div className="flex items-center gap-3">
                          <img src={item.userId.avatar || "/avatar.png"} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm" />
                          <div className="min-w-0">
                            <p className="truncate max-w-[150px] font-semibold text-gray-900 text-[13px]">{item.userId.fullname}</p>
                            <p className="text-[11px] text-gray-400">{item.userId.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[13px]">Khách vãng lai</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.productId ? (
                        <div className="flex items-center gap-3">
                          <img src={item.productId.img} alt="" className="h-10 w-7 object-cover rounded shadow-sm border border-gray-100 bg-white" />
                          <div className="min-w-0 max-w-[200px]">
                            <p className="truncate font-semibold text-gray-800 text-[13px]" title={item.productId.title}>
                              {item.productId.title}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[13px]">Sản phẩm đã bị xóa</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {interactionIcons[item.interactionType]}
                        <span className="font-semibold text-gray-700 text-[13px]">{interactionLabels[item.interactionType]}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-medium text-gray-500">
                      {item.durationSeconds ? `${item.durationSeconds} giây` : "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                        {format(item.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Xóa"
                          onClick={() => handleDelete(item._id)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 border border-red-100 hover:border-red-300 transition-all cursor-pointer"
                        >
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={pages}
            total={total}
            rowsPerPage={limit}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(pages, p + 1))}
            unit="hành vi"
          />
        </div>
      </div>
    </div>
  );
};

export default AIInteractions;
