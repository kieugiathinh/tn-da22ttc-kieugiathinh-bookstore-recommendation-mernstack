import { useEffect, useState, useMemo } from "react";
import { userRequest } from "../../requestMethods";
import { FaTrash, FaEye, FaEyeSlash, FaReply, FaStar, FaStarHalfAlt, FaRegStar, FaSearch, FaFilter, FaCommentDots, FaRegSmileBeam, FaClock, FaChevronDown } from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Modal from "../../components/common/Modal";

// --- COMPONENT HIỂN THỊ SAO (READ-ONLY) ---
const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} className="text-orange-400 text-[13px]" />);
    } else if (rating >= i - 0.5) {
      stars.push(<FaStarHalfAlt key={i} className="text-orange-400 text-[13px]" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-gray-300 text-[13px]" />);
    }
  }
  return <div className="flex flex-row gap-0.5">{stars}</div>;
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Paging & Filter
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterReplyStatus, setFilterReplyStatus] = useState("all");

  // State cho Modal Reply
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/reviews");
      // Sort mới nhất lên đầu
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(sorted);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleToggleHide = async (id, currentStatus) => {
    try {
      await userRequest.put(`/reviews/${id}/hide`);
      toast.success(currentStatus ? "Đã hiện lại đánh giá" : "Đã ẩn đánh giá");
      setReviews((prev) => prev.map((r) => (r._id === id ? { ...r, isHidden: !r.isHidden } : r)));
    } catch { toast.error("Lỗi cập nhật trạng thái"); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xóa đánh giá này?", text: "Hành động này không thể hoàn tác!",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/reviews/${id}`);
        toast.success("Đã xóa đánh giá");
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } catch { toast.error("Lỗi khi xóa"); }
    }
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.reply || "");
    setIsReplyModalOpen(true);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return toast.warning("Vui lòng nhập nội dung");
    try {
      await userRequest.put(`/reviews/${selectedReview._id}/reply`, { reply: replyText });
      toast.success("Đã gửi phản hồi");
      setIsReplyModalOpen(false);
      setReviews((prev) => prev.map((r) => (r._id === selectedReview._id ? { ...r, reply: replyText } : r)));
    } catch { toast.error("Lỗi gửi phản hồi"); }
  };

  // ── Lọc & Tính toán ──
  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        r.user?.fullname?.toLowerCase().includes(q) || 
        r.product?.title?.toLowerCase().includes(q) || 
        r.comment?.toLowerCase().includes(q);
      const matchRating = filterRating === "all" ? true : r.rating === Number(filterRating);
      const matchReply = filterReplyStatus === "all" ? true : filterReplyStatus === "replied" ? !!r.reply : !r.reply;
      return matchSearch && matchRating && matchReply;
    });
  }, [reviews, search, filterRating, filterReplyStatus]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Quick Stats
  const total5Star = reviews.filter(r => r.rating === 5).length;
  const pendingReply = reviews.filter(r => !r.reply).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Quản lý Đánh giá" subtitle={`${reviews.length} đánh giá từ khách hàng`} />

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-transform group-hover:scale-110">
            <FaCommentDots size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tổng đánh giá</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{reviews.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-400 transition-transform group-hover:scale-110">
            <FaRegSmileBeam size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Đánh giá 5 Sao</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{total5Star}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group cursor-pointer" onClick={() => {setFilterReplyStatus("pending"); setFilterRating("all"); setCurrentPage(1);}}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-transform group-hover:scale-110">
            <FaClock size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Chờ phản hồi</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{pendingReply}</p>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full items-center">
          <div className="relative w-full sm:max-w-xs">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Tìm khách hàng, sách, nội dung..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          
          <div className="relative">
            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterReplyStatus}
              onChange={e => { setFilterReplyStatus(e.target.value); setCurrentPage(1); }}
              className={`pl-9 pr-8 py-2.5 text-sm font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterReplyStatus !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="replied">Đã phản hồi</option>
              <option value="pending">Chưa phản hồi</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>
          
          <div className="relative">
            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterRating}
              onChange={e => { setFilterRating(e.target.value); setCurrentPage(1); }}
              className={`pl-9 pr-8 py-2.5 text-sm font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterRating !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả số sao</option>
              <option value="5">5 Sao</option>
              <option value="4">4 Sao</option>
              <option value="3">3 Sao</option>
              <option value="2">2 Sao</option>
              <option value="1">1 Sao</option>
            </select>
            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500">Hiển thị:</span>
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm font-medium">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-100">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Khách hàng & Thời gian</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Sản phẩm</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 w-1/3">Đánh giá & Phản hồi</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((review) => (
                    <tr key={review._id} className={`hover:bg-orange-50/30 transition-colors group ${review.isHidden ? 'opacity-60 bg-gray-50' : ''}`}>
                      {/* Khách hàng & Thời gian */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 font-bold shadow-sm group-hover:bg-orange-100 group-hover:text-primary transition-colors">
                            {review.user?.fullname?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-[13px]">{review.user?.fullname}</p>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                              <FaClock size={10} />
                              <span>{new Date(review.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sản phẩm */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={review.product?.img || "https://placehold.co/40x56"} alt=""
                            className="h-12 w-9 shrink-0 rounded-md border border-gray-200 object-cover shadow-sm bg-gray-50" />
                          <span className="font-semibold text-gray-800 text-[13px] line-clamp-2 max-w-[180px]" title={review.product?.title}>
                            {review.product?.title || "Sản phẩm đã xóa"}
                          </span>
                        </div>
                      </td>

                      {/* Đánh giá & Phản hồi */}
                      <td className="px-5 py-3.5">
                        <div className="mb-1.5"><StarRating rating={review.rating} /></div>
                        <p className="text-sm text-gray-700 italic line-clamp-2" title={review.comment}>
                          "{review.comment}"
                        </p>
                        {review.reply ? (
                          <div className="mt-2 rounded-lg border border-orange-100 bg-orange-50/50 p-2 text-xs text-gray-700">
                            <span className="font-bold text-primary mr-1">Admin đã trả lời:</span>
                            <span className="line-clamp-1" title={review.reply}>{review.reply}</span>
                          </div>
                        ) : (
                          <div className="mt-1.5 text-[11px] font-semibold text-orange-400">Chưa có phản hồi</div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-3.5 text-center">
                        {review.isHidden ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 border border-gray-200">Đang ẩn</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-100">Hiển thị</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="Trả lời"
                            onClick={() => openReplyModal(review)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all shadow-sm"
                          >
                            <FaReply size={13} />
                          </button>
                          <button
                            title={review.isHidden ? "Hiện lại" : "Ẩn đi"}
                            onClick={() => handleToggleHide(review._id, review.isHidden)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all shadow-sm"
                          >
                            {review.isHidden ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                          </button>
                          <button
                            title="Xóa"
                            onClick={() => handleDelete(review._id)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 border border-red-100 hover:border-red-300 transition-all shadow-sm"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <FaCommentDots size={32} className="text-gray-200" />
                          <p className="text-sm font-medium">Không tìm thấy đánh giá nào phù hợp.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages}
              total={filtered.length} rowsPerPage={rowsPerPage}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="đánh giá" />
          </>
        )}
      </div>

      {/* MODAL TRẢ LỜI */}
      <Modal isOpen={isReplyModalOpen} onClose={() => setIsReplyModalOpen(false)} title="Trả lời đánh giá">
        <div className="p-6">
          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                {selectedReview?.user?.fullname?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-gray-800">{selectedReview?.user?.fullname}</span>
              <div className="ml-auto flex"><StarRating rating={selectedReview?.rating || 5} /></div>
            </div>
            <p className="text-sm italic text-gray-600">"{selectedReview?.comment}"</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Phản hồi từ Admin</label>
            <textarea
              rows={4}
              placeholder="Nhập câu trả lời của shop..." 
              value={replyText} 
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={() => setIsReplyModalOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
              Hủy
            </button>
            <button onClick={submitReply} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all">
              Gửi Phản Hồi
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReviews;
