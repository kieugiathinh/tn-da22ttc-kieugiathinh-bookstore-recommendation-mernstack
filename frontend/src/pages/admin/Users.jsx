import { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaUserPlus, FaTimes, FaUsers, FaSync } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";

const ROWS_PER_PAGE = 10;

// ── Shared input style ─────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200/30";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    fullname: "", username: "", email: "", password: "", phone: "", role: 0,
  });

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/users");
      const sorted = res.data.sort((a, b) =>
        b.role !== a.role ? b.role - a.role : new Date(b.createdAt) - new Date(a.createdAt)
      );
      setUsers(sorted.map((u) => ({ ...u, id: u._id })));
    } catch {
      Swal.fire("Lỗi", "Không thể tải dữ liệu người dùng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ fullname: "", username: "", email: "", password: "", phone: "", role: 0 });
    setEditingUserId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({ fullname: user.fullname, username: user.username, email: user.email, password: "", phone: user.phone || "", role: user.role });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); resetForm(); };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        const data = { ...formData };
        if (!data.password) delete data.password;
        await userRequest.put(`/users/${editingUserId}`, data);
        Swal.fire("Thành công", "Đã cập nhật người dùng!", "success");
      } else {
        await userRequest.post("/users", formData);
        Swal.fire("Thành công", "Đã tạo người dùng mới!", "success");
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Có lỗi xảy ra", "error");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Xác nhận xóa?", text: "Hành động này không thể hoàn tác!",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (isConfirmed) {
      try {
        await userRequest.delete(`/users/${id}`);
        Swal.fire("Đã xóa!", "", "success");
        fetchUsers();
      } catch {
        Swal.fire("Lỗi!", "Xóa thất bại.", "error");
      }
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(users.length / ROWS_PER_PAGE);
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData = users.slice(startIdx, startIdx + ROWS_PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        subtitle={`${users.length} tài khoản trong hệ thống`}
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            <FaUserPlus size={14} /> Tạo tài khoản
          </button>
        }
      />

      {/* Table card */}
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
                    <th className="px-5 py-3.5">Người dùng</th>
                    <th className="px-5 py-3.5">Username</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">SĐT</th>
                    <th className="px-5 py-3.5">Vai trò</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Họ tên + avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                            {user.avatar
                              ? <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                              : (user.fullname?.charAt(0) || "U").toUpperCase()
                            }
                          </div>
                          <span className="font-semibold text-gray-800 truncate max-w-[140px]">{user.fullname}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{user.username}</td>
                      <td className="px-5 py-3.5 text-gray-600 truncate max-w-[160px]">{user.email}</td>
                      <td className="px-5 py-3.5 text-gray-500">{user.phone || "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.role === 1
                            ? "bg-brand-50 text-brand-700 border border-brand-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}>
                          {user.role === 1 ? "Admin" : "Khách hàng"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => openEdit(user)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage} totalPages={totalPages}
              total={users.length} rowsPerPage={ROWS_PER_PAGE}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="người dùng"
            />
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingUserId ? "Cập nhật thông tin" : "Thêm người dùng mới"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Họ và Tên</label>
                <input type="text" name="fullname" required placeholder="Nguyễn Văn A"
                  value={formData.fullname} onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Username</label>
                  <input type="text" name="username" required placeholder="user123"
                    value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Số điện thoại</label>
                  <input type="text" name="phone" placeholder="09xx..."
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Email</label>
                <input type="email" name="email" required placeholder="email@example.com"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  {editingUserId ? "Mật khẩu mới (để trống = không đổi)" : "Mật khẩu"}
                </label>
                <input type="password" name="password" required={!editingUserId}
                  placeholder={editingUserId ? "Giữ nguyên nếu để trống..." : "********"}
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Vai trò</label>
                <select name="role" value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) })}
                  className={inputCls}>
                  <option value={0}>Khách hàng (User)</option>
                  <option value={1}>Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors">
                  {editingUserId ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
