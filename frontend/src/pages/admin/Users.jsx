import {
  FaTrash,
  FaEdit,
  FaUserPlus,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const ROWS_PER_PAGE = 10;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // --- STATE CHO MODAL ---
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null); // State xác định đang Sửa hay Thêm
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    role: 0,
  });

  // 1. Hàm Tải dữ liệu
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/users");
      // Sắp xếp: Admin lên đầu, sau đó đến người mới nhất
      const sortedData = res.data.sort((a, b) => {
        if (b.role !== a.role) return b.role - a.role;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setUsers(sortedData.map((user) => ({ ...user, id: user._id })));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Reset Form (Dùng khi đóng modal hoặc chuyển sang chế độ thêm)
  const resetForm = () => {
    setFormData({
      fullname: "",
      username: "",
      email: "",
      password: "",
      phone: "",
      role: 0,
    });
    setEditingUserId(null); // Reset về chế độ Thêm
    setError(null);
  };

  // 3. Xử lý mở Modal ở chế độ THÊM
  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // 4. Xử lý mở Modal ở chế độ SỬA (Quan Trọng)
  const handleOpenEditModal = (user) => {
    setEditingUserId(user._id); // Lưu ID đang sửa
    setFormData({
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      password: "", // Mật khẩu để trống (nghĩa là không đổi)
      phone: user.phone || "",
      role: user.role,
    });
    setShowModal(true);
  };

  // 5. Xử lý nhập liệu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 6. Xử lý LƯU (Chung cho cả Thêm và Sửa)
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        // --- LOGIC SỬA (UPDATE) ---
        // Nếu password rỗng thì xóa khỏi object để backend không hash chuỗi rỗng
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }

        await userRequest.put(`/users/${editingUserId}`, updateData);
        Swal.fire("Thành công", "Đã cập nhật thông tin người dùng!", "success");
      } else {
        // --- LOGIC THÊM (CREATE) ---
        await userRequest.post("/users", formData);
        Swal.fire("Thành công", "Đã tạo người dùng mới!", "success");
      }

      setShowModal(false);
      resetForm();
      fetchUsers(); // Tải lại danh sách
    } catch (err) {
      Swal.fire("Lỗi", err.response?.data?.message || "Có lỗi xảy ra", "error");
    }
  };

  // 7. Xử lý Xóa
  const handleDelete = async (userId) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/users/${userId}`);
        Swal.fire("Đã xóa!", "Người dùng đã bị xóa.", "success");
        fetchUsers();
      } catch (error) {
        Swal.fire("Lỗi!", "Xóa thất bại.", "error");
      }
    }
  };

  // Logic Phân trang
  const totalPages = Math.ceil(users.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  if (loading)
    return (
      <div className="p-8 text-center text-xl text-purple-600">
        Đang tải dữ liệu...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-red-500 bg-red-100 border border-red-300 rounded-lg">
        {error}
      </div>
    );

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto relative">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          👤 Quản lý Người dùng
        </h1>
        <button
          className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300"
          onClick={handleOpenAddModal} // Gọi hàm mở modal thêm
        >
          <FaUserPlus className="mr-2" />
          Tạo Người Dùng
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Họ và tên
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Tên đăng nhập
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                SĐT
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.fullname}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.phone || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role === 1 ? "Admin" : "Khách hàng"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-4">
                    {/* NÚT SỬA: Gọi hàm handleOpenEditModal */}
                    <FaEdit
                      className="text-blue-500 cursor-pointer hover:text-blue-700 text-lg"
                      onClick={() => handleOpenEditModal(user)}
                    />
                    <FaTrash
                      className="text-red-500 cursor-pointer hover:text-red-700 text-lg"
                      onClick={() => handleDelete(user._id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER PHÂN TRANG (Giữ nguyên) */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Trang {currentPage} / {totalPages}
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <FaChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <FaChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* ==================== MODAL (POPUP) ==================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-100">
            {/* Modal Header: Đổi tiêu đề dựa trên editingUserId */}
            <div className="flex justify-between items-center bg-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {editingUserId ? "Cập Nhật Thông Tin" : "Thêm Người Dùng Mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body (Form) */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và Tên
                </label>
                <input
                  type="text"
                  name="fullname"
                  required
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    // Nếu đang sửa thì có thể disable username nếu không muốn cho đổi
                    // disabled={!!editingUserId}
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="user123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="09xx..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {/* Đổi nhãn mật khẩu khi sửa */}
                  {editingUserId
                    ? "Mật khẩu mới (Để trống nếu không đổi)"
                    : "Mật khẩu"}
                </label>
                <input
                  type="password"
                  name="password"
                  // Khi thêm mới thì BẮT BUỘC, khi sửa thì KHÔNG bắt buộc
                  required={!editingUserId}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder={
                    editingUserId ? "Giữ nguyên mật khẩu cũ..." : "********"
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white"
                >
                  <option value={0}>Khách hàng (User)</option>
                  <option value={1}>Quản trị viên (Admin)</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-lg"
                >
                  {/* Đổi chữ nút Lưu */}
                  {editingUserId ? "Cập Nhật" : "Tạo Mới"}
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
