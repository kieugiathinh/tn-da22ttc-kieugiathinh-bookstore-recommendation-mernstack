import { useState, useEffect } from "react";
import { userRequest } from "../../requestMethods";
import { toast } from "react-toastify";
import { FaHistory, FaFilter, FaSync, FaEye, FaCartPlus, FaShoppingCart, FaStar, FaSearch } from "react-icons/fa";
import Pagination from "../../components/admin/Pagination";
import { format } from "timeago.js";

const interactionIcons = {
  view: <FaEye className="text-blue-500" />,
  search_click: <FaSearch className="text-cyan-500" />,
  add_to_cart: <FaCartPlus className="text-amber-500" />,
  review: <FaStar className="text-purple-500" />,
  purchase: <FaShoppingCart className="text-emerald-500" />
};

const interactionLabels = {
  view: "Xem sản phẩm",
  search_click: "Click từ Tìm kiếm",
  add_to_cart: "Thêm Giỏ hàng",
  review: "Đánh giá sách",
  purchase: "Mua thành công"
};

const AIInteractions = () => {

  const [interactionsList, setInteractionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [filterType, setFilterType] = useState("all");

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get(`/interactions?pageNumber=${page}&limit=15&type=${filterType}`);
      setInteractionsList(res.data.interactions);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch (error) {
      toast.error("Lỗi khi tải lịch sử hành vi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterType]);

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
            <FaHistory className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Hành vi Người dùng
            </h1>
            <p className="mt-1 text-sm text-gray-500 font-medium">
              Tổng số <span className="font-bold text-indigo-600">{total}</span> hành vi đã được AI ghi nhận.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={filterType}
              onChange={handleFilterChange}
              className="pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả hành vi</option>
              <option value="view">Chỉ Xem (View)</option>
              <option value="add_to_cart">Giỏ hàng (Cart)</option>
              <option value="purchase">Mua hàng (Purchase)</option>
              <option value="review">Đánh giá (Review)</option>
            </select>
          </div>
          <button
            onClick={fetchInteractions}
            className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <FaSync className={loading ? "animate-spin text-indigo-500" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] uppercase tracking-widest text-gray-500 font-black">
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Hành vi (Signal)</th>
                <th className="px-6 py-4">Thời lượng</th>
                <th className="px-6 py-4 text-right">Thời gian</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && interactionsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                    <FaSync className="animate-spin mx-auto text-2xl mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : interactionsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500 font-medium">
                    Không tìm thấy lịch sử hành vi nào.
                  </td>
                </tr>
              ) : (
                interactionsList.map((item) => (
                  <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {item.userId ? (
                        <div className="flex items-center gap-3">
                          <img src={item.userId.avatar || "/avatar.png"} alt="" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-100" />
                          <div>
                            <p className="font-bold text-gray-900">{item.userId.name}</p>
                            <p className="text-xs text-gray-500">{item.userId.email}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Khách vãng lai</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.productId ? (
                        <div className="flex items-center gap-3 max-w-[250px]">
                          <img src={item.productId.img} alt="" className="w-8 h-10 object-contain rounded bg-gray-50" />
                          <p className="font-semibold text-gray-800 line-clamp-2 text-xs" title={item.productId.title}>
                            {item.productId.title}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sản phẩm đã bị xóa</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {interactionIcons[item.interactionType]}
                        <span className="font-bold text-gray-700 text-xs">{interactionLabels[item.interactionType]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium text-xs">
                      {item.durationSeconds ? `${item.durationSeconds} giây` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md" title={new Date(item.createdAt).toLocaleString("vi-VN")}>
                        {format(item.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Phân trang */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
            <Pagination page={page} pages={pages} changePage={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInteractions;
