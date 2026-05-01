import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import { FaTrash, FaEye, FaEyeSlash, FaReply, FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import IconButton from "../../components/common/IconButton";
import Modal from "../../components/common/Modal";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";

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

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // State cho Modal Reply
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState("");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/reviews");
      setReviews(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const totalPages = Math.ceil(reviews.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentReviews = reviews.slice(startIndex, startIndex + ROWS_PER_PAGE);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Quản lý Đánh giá" subtitle={`${reviews.length} đánh giá từ khách hàng`} />

      <Card>
        {loading ? (
          <LoadingSpinner />
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
                      <td className="px-5 py-3.5 max-w-[200px]">
                        <div className="flex items-center gap-3">
                          <img src={review.product?.img || "https://placehold.co/40x56"} alt=""
                            className="h-14 w-10 shrink-0 rounded border border-gray-200 object-cover shadow-sm bg-gray-100" />
                          <span className="font-semibold text-gray-800 line-clamp-2" title={review.product?.title}>
                            {review.product?.title || "Sản phẩm đã xóa"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-800">{review.user?.fullname}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{review.user?.email}</p>
                      </td>
                      <td className="px-5 py-3.5 max-w-[300px]">
                        <div className="mb-1.5"><StarRating rating={review.rating} /></div>
                        <p className="text-sm text-gray-700 italic line-clamp-2" title={review.comment}>
                          "{review.comment}"
                        </p>
                        {review.reply && (
                          <div className="mt-2 rounded-lg border border-primary-light bg-primary-light p-2.5 text-xs text-gray-700">
                            <span className="font-bold text-primary-hover mr-1">Admin:</span>{review.reply}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge variant={review.isHidden ? "danger" : "success"}>
                          {review.isHidden ? "Đang ẩn" : "Hiển thị"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <IconButton variant="edit" icon={<FaReply size={13} />} onClick={() => openReplyModal(review)} title="Trả lời" />
                          <IconButton
                            variant={review.isHidden ? "default" : "toggle"}
                            icon={review.isHidden ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                            onClick={() => handleToggleHide(review._id, review.isHidden)}
                            title={review.isHidden ? "Hiện lại" : "Ẩn đi"}
                          />
                          <IconButton variant="delete" icon={<FaTrash size={13} />} onClick={() => handleDelete(review._id)} title="Xóa" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentReviews.length === 0 && (
                    <tr><td colSpan="5" className="py-12 text-center text-sm text-gray-400">Chưa có đánh giá nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages}
              total={reviews.length} rowsPerPage={ROWS_PER_PAGE}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="đánh giá" />
          </>
        )}
      </Card>

      {/* MODAL TRẢ LỜI */}
      <Modal isOpen={isReplyModalOpen} onClose={() => setIsReplyModalOpen(false)} title="Trả lời đánh giá" size="lg">
        <div className="p-6">
          <div className="mb-5 rounded-xl border-l-4 border-gray-300 bg-gray-50 p-4 text-sm italic text-gray-600">
            "{selectedReview?.comment}"
            <div className="mt-2 text-xs font-semibold not-italic text-gray-500">— {selectedReview?.user?.fullname}</div>
          </div>
          <InputField label="Nội dung phản hồi từ Shop" as="textarea" rows={4}
            placeholder="Nhập câu trả lời của shop..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={() => setIsReplyModalOpen(false)}>Hủy</Button>
            <Button onClick={submitReply}>Gửi Phản Hồi</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReviews;
