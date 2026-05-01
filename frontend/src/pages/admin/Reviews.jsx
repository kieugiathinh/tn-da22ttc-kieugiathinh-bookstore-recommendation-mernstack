import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import {
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaReply,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTimes,
  FaSync,
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";

// --- COMPONENT HIỂN THỊ SAO (READ-ONLY) ---
const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} className="text-yellow-400 text-xs" />);
    } else if (rating >= i - 0.5) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400 text-xs" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-gray-300 text-xs" />);
    }
  }
  return <div className="flex flex-row gap-0.5">{stars}</div>;
};

const ROWS_PER_PAGE = 10;

// ── Shared input style ─────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200/30";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  // ------------------------

  // State cho Modal Reply
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/reviews"); // Gọi API lấy tất cả
      setReviews(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // --- LOGIC TÍNH TOÁN PHÂN TRANG ---
  const totalPages = Math.ceil(reviews.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentReviews = reviews.slice(startIndex, startIndex + ROWS_PER_PAGE);

  // --- XỬ LÝ ẨN/HIỆN ---
  const handleToggleHide = async (id, currentStatus) => {
    try {
      await userRequest.put(`/reviews/${id}/hide`);
      toast.success(currentStatus ? "Đã hiện lại đánh giá" : "Đã ẩn đánh giá");
      // Update UI local
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isHidden: !r.isHidden } : r))
      );
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  // --- XỬ LÝ XÓA ---
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xóa đánh giá này?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/reviews/${id}`);
        toast.success("Đã xóa đánh giá");
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } catch (error) {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  // --- XỬ LÝ TRẢ LỜI ---
  const openReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.reply || ""); // Nếu đã trả lời trước đó thì hiện lại
    setIsReplyModalOpen(true);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return toast.warning("Vui lòng nhập nội dung");

    try {
      await userRequest.put(`/reviews/${selectedReview._id}/reply`, {
        reply: replyText,
      });
      toast.success("Đã gửi phản hồi");
      setIsReplyModalOpen(false);
      // Update UI local
      setReviews((prev) =>
        prev.map((r) =>
          r._id === selectedReview._id ? { ...r, reply: replyText } : r
        )
      );
    } catch (error) {
      toast.error("Lỗi gửi phản hồi");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Đánh giá"
        subtitle={`${reviews.length} đánh giá từ khách hàng`}
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
            <FaSync className="animate-spin text-brand-500" /> Đang tải...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3.5">Sản phẩm</th>
                    <th className="px-5 py-3.5">Khách hàng</th>
                    <th className="px-5 py-3.5">Đánh giá & Phản hồi</th>
                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentReviews.map((review) => (
                    <tr key={review._id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Cột Sản phẩm */}
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={review.product?.img || "https://placehold.co/40x56"}
                            alt=""
                            className="h-14 w-10 shrink-0 rounded border border-gray-200 object-cover shadow-sm bg-gray-100"
                          />
                          <span className="font-semibold text-gray-800 line-clamp-2" title={review.product?.title}>
                            {review.product?.title || "Sản phẩm đã xóa"}
                          </span>
                        </div>
                      </td>

                      {/* Cột Người dùng */}
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-800">{review.user?.fullname}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{review.user?.email}</p>
                      </td>

                      {/* Cột Nội dung */}
                      <td className="px-5 py-3.5 max-w-[300px]">
                        <div className="mb-1.5 flex items-center">
                          <StarRating rating={review.rating} />
                        </div>
                        <p className="text-sm text-gray-700 italic line-clamp-2" title={review.comment}>
                          "{review.comment}"
                        </p>

                        {/* Hiển thị phản hồi của Admin nếu có */}
                        {review.reply && (
                          <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50 p-2.5 text-xs text-gray-700">
                            <span className="font-bold text-brand-700 mr-1">Admin:</span>
                            {review.reply}
                          </div>
                        )}
                      </td>

                      {/* Cột Trạng thái */}
                      <td className="px-5 py-3.5 text-center">
                        {review.isHidden ? (
                          <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                            Đang ẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                            Hiển thị
                          </span>
                        )}
                      </td>

                      {/* Cột Hành động */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          {/* Nút Trả lời */}
                          <button
                            onClick={() => openReplyModal(review)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
                            title="Trả lời"
                          >
                            <FaReply size={13} />
                          </button>

                          {/* Nút Ẩn/Hiện */}
                          <button
                            onClick={() => handleToggleHide(review._id, review.isHidden)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                              review.isHidden
                                ? "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
                                : "border-yellow-100 bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                            }`}
                            title={review.isHidden ? "Hiện lại" : "Ẩn đi"}
                          >
                            {review.isHidden ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                          </button>

                          {/* Nút Xóa */}
                          <button
                            onClick={() => handleDelete(review._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition-colors hover:bg-red-100"
                            title="Xóa vĩnh viễn"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentReviews.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-sm text-gray-400">
                        Chưa có đánh giá nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={reviews.length}
              rowsPerPage={ROWS_PER_PAGE}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="đánh giá"
            />
          </>
        )}
      </div>

      {/* MODAL TRẢ LỜI */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-bold text-gray-900">
                Trả lời đánh giá
              </h3>
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-5 rounded-xl border-l-4 border-gray-300 bg-gray-50 p-4 text-sm italic text-gray-600">
                "{selectedReview?.comment}"
                <div className="mt-2 text-xs font-semibold not-italic text-gray-500">
                  — {selectedReview?.user?.fullname}
                </div>
              </div>

              <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                Nội dung phản hồi từ Shop
              </label>
              <textarea
                rows="4"
                className={`${inputCls} resize-none`}
                placeholder="Nhập câu trả lời của shop..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  onClick={() => setIsReplyModalOpen(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={submitReply}
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
                >
                  Gửi Phản Hồi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
