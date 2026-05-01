import { useEffect, useState } from "react";
import { FaTrash, FaEdit, FaPlus, FaCloudUploadAlt } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import axios from "axios";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import IconButton from "../../components/common/IconButton";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ROWS_PER_PAGE = 10;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", img: "" });

  // State lưu file ảnh mới chọn
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

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setFormData({ name: "", description: "", img: "" });
    setNewSelectedImage(null);
    setEditingCatId(null);
    setUploadStatus("");
  };

  const handleOpenAddModal = () => { resetForm(); setShowModal(true); };

  const handleOpenEditModal = (category) => {
    setEditingCatId(category._id);
    setFormData({ name: category.name, description: category.description || "", img: category.img || "" });
    setNewSelectedImage(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); resetForm(); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewSelectedImage(e.target.files[0]);
      setUploadStatus("Đã chọn ảnh mới");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      Swal.fire("Lỗi", "Tên thể loại không được để trống", "warning");
      return;
    }

    setUploadStatus("Đang xử lý...");
    let imgUrl = formData.img;

    try {
      if (newSelectedImage) {
        setUploadStatus("Đang tải ảnh...");
        const data = new FormData();
        data.append("file", newSelectedImage);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
        const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
        imgUrl = uploadRes.data.url;
      }

      const categoryData = { ...formData, img: imgUrl };

      if (editingCatId) {
        await userRequest.put(`/categories/${editingCatId}`, categoryData);
        Swal.fire("Thành công", "Cập nhật thể loại thành công", "success");
      } else {
        await userRequest.post("/categories", categoryData);
        Swal.fire("Thành công", "Đã thêm thể loại mới", "success");
      }

      closeModal();
      fetchCategories();
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Có lỗi xảy ra khi lưu", "error");
      setUploadStatus("Lỗi");
    }
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Xác nhận xóa?", text: "Hành động này không thể hoàn tác!",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (isConfirmed) {
      try {
        await userRequest.delete(`/categories/${id}`);
        Swal.fire("Đã xóa!", "Thể loại đã bị xóa.", "success");
        fetchCategories();
      } catch {
        Swal.fire("Lỗi!", "Xóa thất bại.", "error");
      }
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(categories.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentCategories = categories.slice(startIndex, startIndex + ROWS_PER_PAGE);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Thể Loại"
        subtitle={`${categories.length} thể loại trong hệ thống`}
        action={
          <Button onClick={handleOpenAddModal} icon={<FaPlus size={14} />}>
            Thêm Thể Loại
          </Button>
        }
      />

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

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
                    <th className="px-5 py-3.5">Ảnh</th>
                    <th className="px-5 py-3.5">Tên Thể Loại</th>
                    <th className="px-5 py-3.5">Mô tả</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentCategories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        {cat.img ? (
                          <img src={cat.img} alt={cat.name} className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">N/A</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{cat.name}</td>
                      <td className="px-5 py-3.5 text-gray-600 truncate max-w-xs">{cat.description || "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-3">
                          <IconButton variant="edit" icon={<FaEdit size={13} />} onClick={() => handleOpenEditModal(cat)} title="Sửa" />
                          <IconButton variant="delete" icon={<FaTrash size={13} />} onClick={() => handleDelete(cat._id)} title="Xóa" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentCategories.length === 0 && (
                    <tr><td colSpan={4} className="py-12 text-center text-sm text-gray-400">Chưa có thể loại nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages}
              total={categories.length} rowsPerPage={ROWS_PER_PAGE}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="thể loại" />
          </>
        )}
      </Card>

      {/* ── MODAL ── */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingCatId ? "Cập Nhật Thể Loại" : "Thêm Thể Loại Mới"}>
        <form onSubmit={handleSave} className="space-y-4 p-6">
          <InputField label="Tên Thể Loại" required name="name"
            value={formData.name} onChange={handleInputChange} placeholder="Ví dụ: Tiểu thuyết" />

          {/* Upload Ảnh */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Ảnh Thể Loại</label>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
              <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-xl border bg-white shadow-sm">
                <img
                  src={newSelectedImage ? URL.createObjectURL(newSelectedImage) : formData.img || "https://placehold.co/150x150?text=No+Img"}
                  alt="Preview" className="h-full w-full object-cover"
                />
              </div>
              <label className="flex cursor-pointer items-center rounded-lg bg-primary-light px-3 py-2 text-sm font-semibold text-primary-hover transition hover:bg-primary-light">
                <FaCloudUploadAlt className="mr-2" />
                {newSelectedImage ? "Đổi ảnh khác" : "Chọn ảnh"}
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
              {uploadStatus && (
                <p className={`mt-2 text-xs font-medium ${uploadStatus.includes("Lỗi") ? "text-red-500" : "text-primary"}`}>
                  {uploadStatus}
                </p>
              )}
            </div>
          </div>

          <InputField label="Mô tả" as="textarea" name="description" rows={3}
            value={formData.description} onChange={handleInputChange} placeholder="Mô tả ngắn..." />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={closeModal}>Hủy</Button>
            <Button type="submit" isLoading={uploadStatus.includes("Đang")}>
              {editingCatId ? "Cập Nhật" : "Thêm Mới"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
