import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCloudUploadAlt,
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
// Import cấu hình Cloudinary giống bên Product
import { CLOUDINARY_CONFIG } from "../../utils/constants";

const ROWS_PER_PAGE = 10;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    img: "", // Link ảnh (cũ hoặc mới sau khi upload)
  });

  // State lưu file ảnh mới chọn (giống Product.jsx)
  const [newSelectedImage, setNewSelectedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/categories");
      setCategories(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh mục sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", description: "", img: "" });
    setNewSelectedImage(null); // Reset file
    setEditingCatId(null);
    setUploadStatus("");
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (category) => {
    setEditingCatId(category._id);
    setFormData({
      name: category.name,
      description: category.description || "",
      img: category.img || "",
    });
    setNewSelectedImage(null); // Reset file mới
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- XỬ LÝ CHỌN ẢNH (Giống Product.jsx) ---
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewSelectedImage(e.target.files[0]);
      setUploadStatus("Đã chọn ảnh mới");
    }
  };

  // --- XỬ LÝ LƯU (Có Upload ảnh) ---
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      Swal.fire("Lỗi", "Tên thể loại không được để trống", "warning");
      return;
    }

    setUploadStatus("Đang xử lý...");
    let imgUrl = formData.img; // Mặc định dùng ảnh cũ

    try {
      // 1. Nếu có chọn ảnh mới -> Upload lên Cloudinary trước
      if (newSelectedImage) {
        setUploadStatus("Đang tải ảnh...");
        const data = new FormData();
        data.append("file", newSelectedImage);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

        const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
        imgUrl = uploadRes.data.url; // Lấy link ảnh mới
      }

      // 2. Gom dữ liệu để gửi về Backend
      const categoryData = {
        ...formData,
        img: imgUrl,
      };

      if (editingCatId) {
        await userRequest.put(`/categories/${editingCatId}`, categoryData);
        Swal.fire("Thành công", "Cập nhật thể loại thành công", "success");
      } else {
        await userRequest.post("/categories", categoryData);
        Swal.fire("Thành công", "Đã thêm thể loại mới", "success");
      }

      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Có lỗi xảy ra khi lưu", "error");
      setUploadStatus("Lỗi");
    }
  };

  const handleDelete = async (id) => {
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
        await userRequest.delete(`/categories/${id}`);
        Swal.fire("Đã xóa!", "Thể loại đã bị xóa.", "success");
        fetchCategories();
      } catch (error) {
        Swal.fire("Lỗi!", "Xóa thất bại.", "error");
      }
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(categories.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentCategories = categories.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

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
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          📚 Quản lý Thể Loại
        </h1>
        <button
          className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300"
          onClick={handleOpenAddModal}
        >
          <FaPlus className="mr-2" /> Thêm Thể Loại
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-purple-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Ảnh
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Tên Thể Loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentCategories.map((cat) => (
              <tr
                key={cat._id}
                className="hover:bg-gray-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {cat.img ? (
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                      No Img
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                  {cat.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">
                  {cat.description || "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-4">
                    <FaEdit
                      className="text-blue-500 cursor-pointer text-lg hover:text-blue-700"
                      onClick={() => handleOpenEditModal(cat)}
                    />
                    <FaTrash
                      className="text-red-500 cursor-pointer text-lg hover:text-red-700"
                      onClick={() => handleDelete(cat._id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination (Giữ nguyên logic cũ) */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex justify-between w-full sm:hidden">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Trang {currentPage} / {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all scale-100">
            <div className="flex justify-between items-center bg-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {editingCatId ? "Cập Nhật Thể Loại" : "Thêm Thể Loại Mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Tên Thể Loại */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Thể Loại <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Ví dụ: Tiểu thuyết"
                />
              </div>

              {/* Upload Ảnh */}
              <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-3 bg-white rounded-lg overflow-hidden shadow-sm border">
                  <img
                    src={
                      newSelectedImage
                        ? URL.createObjectURL(newSelectedImage)
                        : formData.img ||
                          "https://via.placeholder.com/150?text=No+Img"
                    }
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <label className="cursor-pointer bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition flex items-center text-sm font-bold">
                  <FaCloudUploadAlt className="mr-2" />
                  {newSelectedImage ? "Đổi ảnh khác" : "Chọn ảnh"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                </label>

                {uploadStatus && (
                  <p
                    className={`text-xs mt-2 ${
                      uploadStatus.includes("Lỗi")
                        ? "text-red-500"
                        : "text-blue-500"
                    }`}
                  >
                    {uploadStatus}
                  </p>
                )}
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                  placeholder="Mô tả ngắn..."
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploadStatus.includes("Đang")} // Disable khi đang upload
                  className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-lg ${
                    uploadStatus.includes("Đang")
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {editingCatId ? "Cập Nhật" : "Thêm Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
