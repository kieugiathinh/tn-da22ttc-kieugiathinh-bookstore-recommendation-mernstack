import { useEffect, useState } from "react";
import { FaUserPlus, FaEdit, FaTrash } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import IconButton from "../../components/common/IconButton";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";

const ROWS_PER_PAGE = 10;

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

  const handleField = (field) => (e) =>
    setFormData({ ...formData, [field]: field === "role" ? Number(e.target.value) : e.target.value });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Người dùng"
        subtitle={`${users.length} tài khoản trong hệ thống`}
        action={
          <Button onClick={openAdd} icon={<FaUserPlus size={14} />}>
            Tạo tài khoản
          </Button>
        }
      />

      {/* Table card */}
      <Card>
        {loading ? (
          <LoadingSpinner />
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
                        <Badge variant={user.role === 1 ? "brand" : "neutral"}>
                          {user.role === 1 ? "Admin" : "Khách hàng"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-3">
                          <IconButton variant="edit" icon={<FaEdit size={13} />} onClick={() => openEdit(user)} title="Sửa" />
                          <IconButton variant="delete" icon={<FaTrash size={13} />} onClick={() => handleDelete(user._id)} title="Xóa" />
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
      </Card>

      {/* ── MODAL ── */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingUserId ? "Cập nhật thông tin" : "Thêm người dùng mới"}>
        <form onSubmit={handleSave} className="space-y-4 p-6">
          <InputField label="Họ và Tên" required placeholder="Nguyễn Văn A"
            value={formData.fullname} onChange={handleField("fullname")} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Username" required placeholder="user123"
              value={formData.username} onChange={handleField("username")} />
            <InputField label="Số điện thoại" placeholder="09xx..."
              value={formData.phone} onChange={handleField("phone")} />
          </div>
          <InputField label="Email" type="email" required placeholder="email@example.com"
            value={formData.email} onChange={handleField("email")} />
          <InputField
            label={editingUserId ? "Mật khẩu mới (để trống = không đổi)" : "Mật khẩu"}
            type="password" required={!editingUserId}
            placeholder={editingUserId ? "Giữ nguyên nếu để trống..." : "********"}
            value={formData.password} onChange={handleField("password")}
          />
          <InputField label="Vai trò" as="select" value={formData.role} onChange={handleField("role")}>
            <option value={0}>Khách hàng (User)</option>
            <option value={1}>Quản trị viên (Admin)</option>
          </InputField>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={closeModal}>Hủy</Button>
            <Button type="submit">{editingUserId ? "Cập nhật" : "Tạo mới"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
