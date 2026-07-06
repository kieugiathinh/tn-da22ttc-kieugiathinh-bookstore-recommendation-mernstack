import { useEffect, useState, useMemo } from "react";
import { FaTrash, FaEdit, FaPlus, FaCloudUploadAlt, FaSearch, FaTags, FaBookOpen, FaChartPie, FaChevronDown } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import axios from "axios";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Modal from "../../components/common/Modal";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [statsData, setStatsData]   = useState(null); // Để lấy data phân bố thể loại
  const [loading, setLoading]       = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch]         = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", img: "" });

  // State lưu file ảnh mới chọn
  const [newSelectedImage, setNewSelectedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, statsRes] = await Promise.all([
        userRequest.get("/categories"),
        userRequest.get("/stats/product-stats").catch(() => ({ data: null }))
      ]);
      setCategories(catRes.data);
      setStatsData(statsRes.data);
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Không thể tải danh mục sản phẩm.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
        Swal.fire({ title: "Thành công", text: "Cập nhật thể loại thành công", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        await userRequest.post("/categories", categoryData);
        Swal.fire({ title: "Thành công", text: "Đã thêm thể loại mới", icon: "success", timer: 1500, showConfirmButton: false });
      }

      closeModal();
      fetchData();
    } catch (err) {
      console.error(err);
      Swal.fire("Lỗi", "Có lỗi xảy ra khi lưu", "error");
      setUploadStatus("Lỗi");
    }
  };

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Xác nhận xóa?", text: "Sẽ xóa vĩnh viễn thể loại này!",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (isConfirmed) {
      try {
        await userRequest.delete(`/categories/${id}`);
        Swal.fire({ title: "Đã xóa!", icon: "success", timer: 1200, showConfirmButton: false });
        fetchData();
      } catch {
        Swal.fire("Lỗi!", "Xóa thất bại. Có thể thể loại đang chứa sách.", "error");
      }
    }
  };

  // ── FILTER & PAGING ──
  const filtered = useMemo(() => {
    return categories.filter(c => 
      !search || c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── GET STATS ──
  // Tìm thể loại có nhiều sách nhất và bán chạy nhất từ statsData
  const catDistribution = statsData?.categoryDistribution || [];
  const topBooksCat = [...catDistribution].sort((a,b) => b.count - a.count)[0];
  const topSalesCat = [...catDistribution].sort((a,b) => b.totalSold - a.totalSold)[0];

  return (
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <PageHeader
        title="Quản lý Thể Loại"
        subtitle={`${categories.length} thể loại trong hệ thống`}
        action={
          <button onClick={handleOpenAddModal} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all">
            <FaPlus size={12} />
            Thêm Thể Loại
          </button>
        }
      />

      {/* ── QUICK STATS CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-transform group-hover:scale-110">
            <FaTags size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tổng thể loại</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900">{categories.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition-transform group-hover:scale-110">
            <FaBookOpen size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Nhiều sách nhất</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900 truncate max-w-[140px]">{topBooksCat?._id || "—"}</p>
            <p className="text-[11px] text-gray-400 font-semibold">{topBooksCat?.count || 0} đầu sách</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-primary transition-transform group-hover:scale-110">
            <FaChartPie size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Bán chạy nhất</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900 truncate max-w-[140px]">{topSalesCat?._id || "—"}</p>
            <p className="text-[11px] text-gray-400 font-semibold">{topSalesCat?.totalSold || 0} cuốn đã bán</p>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
          <input
            type="text"
            placeholder="Tìm tên thể loại..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
          />
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
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Thể Loại</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Mô tả</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Thống kê</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((cat) => {
                    const catStat = catDistribution.find(c => c._id === cat.name) || { count: 0, totalSold: 0 };
                    return (
                      <tr key={cat._id} className="hover:bg-orange-50/30 transition-colors group">
                        {/* Ảnh & Tên */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {cat.img ? (
                              <img src={cat.img} alt={cat.name} className="h-10 w-10 rounded-xl object-cover border border-gray-200 shadow-sm group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 border border-orange-100 text-primary font-bold text-xs shadow-sm">
                                {cat.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <p className="font-bold text-gray-900 text-[13px]">{cat.name}</p>
                          </div>
                        </td>

                        {/* Mô tả */}
                        <td className="px-5 py-3.5">
                          <p className="text-gray-500 text-xs truncate max-w-xs">{cat.description || "—"}</p>
                        </td>

                        {/* Thống kê mượn từ Product Stats */}
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <p className="text-xs"><span className="font-semibold text-gray-700">{catStat.count}</span> đầu sách</p>
                            <p className="text-[11px] text-gray-400"><span className="font-semibold text-primary">{catStat.totalSold}</span> cuốn đã bán</p>
                          </div>
                        </td>

                        {/* Thao tác */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              title="Chỉnh sửa"
                              onClick={() => handleOpenEditModal(cat)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all"
                            >
                              <FaEdit size={13} />
                            </button>
                            <button
                              title="Xóa"
                              onClick={() => handleDelete(cat._id)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 border border-red-100 hover:border-red-300 transition-all"
                            >
                              <FaTrash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <FaTags size={32} className="text-gray-200" />
                          <p className="text-sm font-medium">Chưa có thể loại nào</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              rowsPerPage={rowsPerPage}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="thể loại"
            />
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingCatId ? "Cập Nhật Thể Loại" : "Thêm Thể Loại Mới"}>
        <form onSubmit={handleSave} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tên Thể Loại <span className="text-red-500">*</span></label>
            <input
              type="text" required name="name"
              value={formData.name} onChange={handleInputChange} placeholder="Ví dụ: Tiểu thuyết"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>

          {/* Upload Ảnh */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Ảnh Thể Loại</label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-5 text-center hover:bg-orange-50 hover:border-primary/40 transition-all">
              <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-xl border bg-white shadow-sm flex items-center justify-center">
                {newSelectedImage || formData.img ? (
                  <img
                    src={newSelectedImage ? URL.createObjectURL(newSelectedImage) : formData.img}
                    alt="Preview" className="h-full w-full object-cover"
                  />
                ) : (
                  <FaCloudUploadAlt size={24} className="text-gray-300" />
                )}
              </div>
              <label className="flex cursor-pointer items-center rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary hover:border-primary transition-all shadow-sm">
                {newSelectedImage ? "Đổi ảnh khác" : "Chọn ảnh từ máy"}
                <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
              </label>
              {uploadStatus && (
                <p className={`mt-2 text-[11px] font-bold uppercase tracking-wide ${uploadStatus.includes("Lỗi") ? "text-red-500" : "text-primary"}`}>
                  {uploadStatus}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mô tả</label>
            <textarea
              name="description" rows={3}
              value={formData.description} onChange={handleInputChange} placeholder="Mô tả ngắn về thể loại..."
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 mt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">
              Hủy
            </button>
            <button
              type="submit"
              disabled={uploadStatus.includes("Đang")}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadStatus.includes("Đang") ? "Đang xử lý..." : editingCatId ? "Cập Nhật" : "Thêm Mới"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;
