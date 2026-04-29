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
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";
// BỎ: import { Rating } from "react-simple-star-rating";

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
// ------------------------------------------

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Hiển thị 10 dòng mỗi trang
  // ------------------------

  // State cho Modal Reply
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await userRequest.get("/reviews"); // Gọi API lấy tất cả
      setReviews(res.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // --- LOGIC TÍNH TOÁN PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReviews = reviews.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reviews.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  // ----------------------------------

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
      confirmButtonText: "Xóa",
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

  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-between">
        <span>💬 Quản lý Đánh giá ({reviews.length})</span>
      </h1>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-purple-50 text-purple-700 uppercase text-xs font-bold">
              <tr>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Người dùng</th>
                <th className="p-4">Đánh giá</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {currentReviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50 transition">
                  {/* Cột Sản phẩm */}
                  <td className="p-4 max-w-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={review.product?.img}
                        alt=""
                        className="w-10 h-14 object-cover rounded border"
                      />
                      <span
                        className="font-semibold line-clamp-2"
                        title={review.product?.title}
                      >
                        {review.product?.title || "Sản phẩm đã xóa"}
                      </span>
                    </div>
                  </td>

                  {/* Cột Người dùng */}
                  <td className="p-4">
                    <p className="font-bold text-gray-800">
                      {review.user?.fullname}
                    </p>
                    <p className="text-xs text-gray-400">
                      {review.user?.email}
                    </p>
                  </td>

                  {/* Cột Nội dung */}
                  <td className="p-4 max-w-md">
                    <div className="flex items-center mb-1">
                      {/* THAY THẾ RATING CŨ */}
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-gray-700 italic mb-2 line-clamp-2">
                      "{review.comment}"
                    </p>

                    {/* Hiển thị phản hồi của Admin nếu có */}
                    {review.reply && (
                      <div className="bg-purple-50 p-2 rounded border border-purple-100 text-xs">
                        <span className="font-bold text-purple-700">
                          Admin trả lời:{" "}
                        </span>
                        {review.reply}
                      </div>
                    )}
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="p-4">
                    {review.isHidden ? (
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                        Đang Ẩn
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-bold">
                        Hiển thị
                      </span>
                    )}
                  </td>

                  {/* Cột Hành động */}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* Nút Trả lời */}
                      <button
                        onClick={() => openReplyModal(review)}
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                        title="Trả lời"
                      >
                        <FaReply />
                      </button>

                      {/* Nút Ẩn/Hiện */}
                      <button
                        onClick={() =>
                          handleToggleHide(review._id, review.isHidden)
                        }
                        className={`p-2 rounded transition ${
                          review.isHidden
                            ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                            : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                        }`}
                        title={review.isHidden ? "Hiện lại" : "Ẩn đi"}
                      >
                        {review.isHidden ? <FaEyeSlash /> : <FaEye />}
                      </button>

                      {/* Nút Xóa */}
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                        title="Xóa vĩnh viễn"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentReviews.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Chưa có đánh giá nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- THANH PHÂN TRANG (PAGINATION) --- */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
            <span className="text-sm text-gray-500">
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev))
                }
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FaChevronLeft className="text-xs" />
              </button>

              {/* Render số trang */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`px-3 py-1 border rounded text-sm font-medium transition ${
                      currentPage === number
                        ? "bg-purple-600 text-white border-purple-600"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {number}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev < totalPages ? prev + 1 : prev
                  )
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TRẢ LỜI */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Trả lời đánh giá của {selectedReview?.user?.fullname}
            </h3>
            <div className="bg-gray-50 p-3 rounded mb-4 italic text-sm text-gray-600 border-l-4 border-gray-300">
              "{selectedReview?.comment}"
            </div>

            <textarea
              rows="4"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Nhập câu trả lời của shop..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            ></textarea>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsReplyModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                onClick={submitReply}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
              >
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
