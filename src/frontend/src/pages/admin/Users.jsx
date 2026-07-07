import { useEffect, useState, useMemo } from "react";
import { FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaUsers, FaUserTie, FaUser, FaChevronDown } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import Modal from "../../components/common/Modal";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all"); // "all", "admin", "customer"

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    fullname: "", email: "", password: "", phone: "", role: 0,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/users");
      // Sắp xếp mặc định: Admin lên đầu, sau đó theo ngày tạo mới nhất
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

  const resetForm = () => {
    setFormData({ fullname: "", email: "", password: "", phone: "", role: 0 });
    setEditingUserId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (user) => {
    setEditingUserId(user._id);
    setFormData({ fullname: user.fullname, email: user.email, password: "", phone: user.phone || "", role: user.role });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); resetForm(); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        const data = { ...formData };
        if (!data.password) delete data.password;
        await userRequest.put(`/users/${editingUserId}`, data);
        Swal.fire({ title: "Thành công", text: "Đã cập nhật người dùng!", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        await userRequest.post("/users", formData);
        Swal.fire({ title: "Thành công", text: "Đã tạo người dùng mới!", icon: "success", timer: 1500, showConfirmButton: false });
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Có lỗi xảy ra", "error");
    }
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Xác nhận xóa?", text: "Sẽ xóa vĩnh viễn người dùng này!",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (isConfirmed) {
      try {
        await userRequest.delete(`/users/${id}`);
        Swal.fire({ title: "Đã xóa!", icon: "success", timer: 1200, showConfirmButton: false });
        fetchUsers();
      } catch {
        Swal.fire("Lỗi!", "Xóa thất bại.", "error");
      }
    }
  };

  // ── Filter Logic ──
  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.fullname?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
      const matchRole = filterRole === "all" ? true : filterRole === "admin" ? u.role === 1 : u.role === 0;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── Stats ──
  const totalAdmin = users.filter(u => u.role === 1).length;
  const totalCustomer = users.filter(u => u.role === 0).length;

  const handleField = (field) => (e) =>
    setFormData({ ...formData, [field]: field === "role" ? Number(e.target.value) : e.target.value });

  return (
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <PageHeader
        title="Quản lý Người dùng"
        subtitle={`${users.length} tài khoản trong hệ thống`}
        action={
          <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all">
            <FaUserPlus size={14} />
            Tạo tài khoản
          </button>
        }
      />

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-transform group-hover:scale-110">
            <FaUsers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tổng tài khoản</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group cursor-pointer" onClick={() => { setFilterRole("customer"); setCurrentPage(1); }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition-transform group-hover:scale-110">
            <FaUser size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Khách hàng</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{totalCustomer}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group cursor-pointer" onClick={() => { setFilterRole("admin"); setCurrentPage(1); }}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-primary transition-transform group-hover:scale-110">
            <FaUserTie size={18} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Quản trị viên</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{totalAdmin}</p>
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
              placeholder="Tìm tên, email, sđt..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterRole}
              onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className={`pl-9 pr-8 py-2.5 text-sm font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterRole !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="customer">Khách hàng</option>
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
          <LoadingSpinner text="Đang tải dữ liệu..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-100">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Người dùng</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Email & SĐT</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Vai trò</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((user) => (
                    <tr key={user.id} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${user.role === 1 ? 'bg-gradient-to-br from-primary to-orange-400 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-100 group-hover:text-primary transition-colors'}`}>
                            {user.avatar
                              ? <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                              : (user.fullname?.charAt(0) || "U").toUpperCase()
                            }
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 text-[13px] block truncate max-w-[160px]">{user.fullname}</span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-700 font-medium text-[13px] truncate max-w-[180px]">{user.email}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{user.phone || "Chưa có SĐT"}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.role === 1 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-orange-50 text-primary border border-orange-100">
                            <FaUserTie size={10} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Khách hàng
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="Chỉnh sửa"
                            onClick={() => openEdit(user)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all"
                          >
                            <FaEdit size={13} />
                          </button>
                          <button
                            title="Xóa"
                            onClick={() => handleDelete(user._id)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 border border-red-100 hover:border-red-300 transition-all"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <FaUsers size={32} className="text-gray-200" />
                          <p className="text-sm font-medium">Không tìm thấy người dùng nào phù hợp.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage} totalPages={totalPages}
              total={filtered.length} rowsPerPage={rowsPerPage}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="người dùng"
            />
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingUserId ? "Cập nhật tài khoản" : "Thêm người dùng mới"}>
        <form onSubmit={handleSave} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Họ và Tên <span className="text-red-500">*</span></label>
            <input
              type="text" required placeholder="Nguyễn Văn A"
              value={formData.fullname} onChange={handleField("fullname")}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Số điện thoại</label>
              <input
                type="text" placeholder="09xx..."
                value={formData.phone} onChange={handleField("phone")}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Vai trò</label>
              <select
                value={formData.role} onChange={handleField("role")}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all cursor-pointer"
              >
                <option value={0}>Khách hàng</option>
                <option value={1}>Quản trị viên (Admin)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email <span className="text-red-500">*</span></label>
            <input
              type="email" required placeholder="email@example.com"
              value={formData.email} onChange={handleField("email")}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
              {editingUserId ? "Mật khẩu mới" : "Mật khẩu"} {editingUserId ? "" : <span className="text-red-500">*</span>}
            </label>
            <input
              type="password" required={!editingUserId}
              placeholder={editingUserId ? "Giữ nguyên nếu để trống..." : "********"}
              value={formData.password} onChange={handleField("password")}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 mt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
              Hủy
            </button>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all">
              {editingUserId ? "Cập Nhật" : "Thêm Mới"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
