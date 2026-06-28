import { useEffect, useState, useMemo } from "react";
import {
  FaSearch, FaFilter, FaSort, FaChevronDown, FaEnvelopeOpenText, FaReply, FaCheckCircle, FaClock, FaEye, FaTrash
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";

const ROWS_PER_PAGE = 10;

// ─── STATUS BADGE ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (status === "replied")
    return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200"><FaCheckCircle size={10} /> Đã phản hồi</span>;
  return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-200"><FaClock size={10} /> Chờ phản hồi</span>;
};

// ─── TOPIC BADGE ───────────────────────────────────────────────────────────────
const TopicBadge = ({ topic }) => {
  const topics = {
    order: "Đơn hàng",
    product: "Sản phẩm",
    payment: "Thanh toán",
    other: "Khác"
  };
  return <span className="rounded-lg bg-orange-50 border border-orange-100 px-2.5 py-1 text-xs font-semibold text-primary">{topics[topic] || "Khác"}</span>;
};

// ─── MAIN ──────────────────────────────────────────────────────────────────────
const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | pending | replied
  const [filterTopic, setFilterTopic] = useState("all"); // all | order | product | payment | other
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/contacts", {
        params: {
          search,
          status: filterStatus === "all" ? "" : filterStatus,
          topic: filterTopic === "all" ? "" : filterTopic,
          sort: sortBy,
          page: 1, // Dùng client-side pagination cho đơn giản nếu list ko quá lớn
          limit: 1000
        }
      });
      setContacts(res.data.contacts);
    } catch {
      Swal.fire("Lỗi", "Không thể tải dữ liệu liên hệ.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [search, filterStatus, filterTopic, sortBy]);

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      return Swal.fire("Lỗi", "Vui lòng nhập nội dung phản hồi", "error");
    }

    try {
      setIsReplying(true);
      await userRequest.put(`/contacts/${selectedContact._id}/reply`, { replyMessage });
      Swal.fire({ title: "Thành công!", text: "Đã gửi email phản hồi.", icon: "success", timer: 1500, showConfirmButton: false });
      setIsModalOpen(false);
      setReplyMessage("");
      fetchAll();
    } catch (error) {
      Swal.fire("Lỗi!", error.response?.data?.message || "Không thể gửi phản hồi.", "error");
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Liên hệ này sẽ bị xóa vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EE4D2D',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Có, xóa!',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/contacts/${id}`);
        Swal.fire({ title: 'Đã xóa!', text: 'Liên hệ đã được xóa thành công.', icon: 'success', timer: 1500, showConfirmButton: false });
        fetchAll();
      } catch (error) {
        Swal.fire('Lỗi', error.response?.data?.message || 'Không thể xóa liên hệ', 'error');
      }
    }
  };

  const openModal = (contact) => {
    setSelectedContact(contact);
    setReplyMessage(contact.replyMessage || "");
    setIsModalOpen(true);
  };

  // ── Pagination Logic ────────────────────────────────────────────────────
  const totalPages = Math.ceil(contacts.length / rowsPerPage);
  const pageData = contacts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Stats nhanh cho toolbar
  const pendingCount = contacts.filter(c => c.status === "pending").length;
  const repliedCount = contacts.filter(c => c.status === "replied").length;

  const resetFilters = () => {
    setSearch(""); setFilterStatus("all"); setFilterTopic("all"); setSortBy("newest");
    setCurrentPage(1);
  };
  const hasFilter = search || filterStatus !== "all" || filterTopic !== "all" || sortBy !== "newest";

  return (
    <div className="space-y-5 relative">
      {/* ── PAGE HEADER ── */}
      <PageHeader
        title="Quản lý Liên hệ"
        subtitle={`${contacts.length} yêu cầu hỗ trợ từ khách hàng`}
      />

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => { setFilterStatus("all"); setCurrentPage(1); }}
          className={`rounded-xl border p-4 text-left transition-all ${filterStatus === "all" ? "border-primary bg-orange-50 shadow-sm" : "border-gray-100 bg-white hover:border-primary/40"}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tổng liên hệ</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{contacts.length}</p>
        </button>
        <button
          onClick={() => { setFilterStatus("pending"); setCurrentPage(1); }}
          className={`rounded-xl border p-4 text-left transition-all ${filterStatus === "pending" ? "border-yellow-400 bg-yellow-50 shadow-sm" : "border-gray-100 bg-white hover:border-yellow-300"}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Chờ phản hồi</p>
          <p className="mt-1 text-2xl font-black text-yellow-600">{pendingCount}</p>
        </button>
        <button
          onClick={() => { setFilterStatus("replied"); setCurrentPage(1); }}
          className={`rounded-xl border p-4 text-left transition-all ${filterStatus === "replied" ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-gray-100 bg-white hover:border-emerald-300"}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Đã giải quyết</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{repliedCount}</p>
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 space-y-3">
        <div className="flex gap-3 flex-col sm:flex-row items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            <input
              type="text"
              placeholder="Tìm theo tên khách, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          {hasFilter && (
            <button onClick={resetFilters} className="text-xs font-semibold text-gray-500 hover:text-primary px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0">
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterStatus !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ phản hồi</option>
              <option value="replied">Đã phản hồi</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterTopic}
              onChange={e => { setFilterTopic(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterTopic !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả chủ đề</option>
              <option value="order">Đơn hàng</option>
              <option value="product">Sản phẩm</option>
              <option value="payment">Thanh toán</option>
              <option value="other">Khác</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          <div className="relative">
            <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${sortBy !== "newest" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[25%]">Khách hàng</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[15%]">Chủ đề</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[35%]">Nội dung</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider w-[15%]">Ngày gửi</th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center w-[15%]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  </td>
                </tr>
              ) : (
                <>
                  {pageData.map(c => (
                    <tr key={c._id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900 text-[13px]">{c.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.phone || "N/A"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <TopicBadge topic={c.topic} />
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] text-gray-600 line-clamp-2">{c.message}</p>
                        <div className="mt-2">
                          <StatusBadge status={c.status} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[13px] font-medium text-gray-700">
                          {format(new Date(c.createdAt), "dd/MM/yyyy", { locale: vi })}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {format(new Date(c.createdAt), "HH:mm")}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(c)}
                            title={c.status === "replied" ? "Xem chi tiết" : "Phản hồi"}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${c.status === "replied"
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                              }`}
                          >
                            {c.status === "replied" ? <FaEye size={14} /> : <FaReply size={14} />}
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            title="Xóa liên hệ"
                            className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <FaEnvelopeOpenText size={32} className="text-gray-200" />
                          <p className="text-sm font-medium">Không tìm thấy yêu cầu liên hệ nào</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ── MODAL PHẢN HỒI ── */}
      {isModalOpen && selectedContact && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">
                {selectedContact.status === "replied" ? "Chi tiết phản hồi" : "Phản hồi yêu cầu"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900">{selectedContact.name}</span>
                  <span className="text-xs text-gray-500">{selectedContact.email}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedContact.message}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {selectedContact.status === "replied" ? "Nội dung đã phản hồi:" : "Nội dung phản hồi (sẽ gửi qua Email):"}
                </label>
                <textarea
                  rows={5}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={selectedContact.status === "replied"}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Nhập nội dung trả lời khách hàng..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50"
              >
                Đóng
              </button>
              {selectedContact.status !== "replied" && (
                <button
                  onClick={handleReply}
                  disabled={isReplying}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2"
                >
                  {isReplying ? "Đang gửi..." : "Gửi Email Phản Hồi"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContacts;
