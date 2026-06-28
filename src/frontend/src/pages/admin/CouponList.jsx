import { useEffect, useState, useMemo } from "react";
import { userRequest } from "../../requestMethods";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaTicketAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { toast } from "sonner";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Modal from "../../components/common/Modal";

const AdminCoupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    code: "", description: "", discountType: "PERCENT", discountValue: 0,
    maxDiscountAmount: 0, minOrderValue: 0, startDate: "", endDate: "",
    usageLimit: 100, isActive: true,
  });
  const [currentId, setCurrentId] = useState(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/coupons/admin");
      setCoupons(res.data);
    } catch { 
      toast.error("Lỗi tải danh sách mã"); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleOpenAdd = () => {
    setFormData({
      code: "", description: "", discountType: "PERCENT", discountValue: 0,
      maxDiscountAmount: 0, minOrderValue: 0,
      startDate: new Date().toISOString().split("T")[0], endDate: "",
      usageLimit: 100, isActive: true,
    });
    setIsEdit(false);
    setShowModal(true);
  };

  const handleOpenEdit = (coupon) => {
    setFormData({
      ...coupon,
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
    });
    setCurrentId(coupon._id);
    setIsEdit(true);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        const res = await userRequest.put(`/coupons/${currentId}`, formData);
        setCoupons((prev) => prev.map((c) => (c._id === currentId ? res.data : c)));
        toast.success("Cập nhật thành công!");
      } else {
        const res = await userRequest.post("/coupons", formData);
        setCoupons([res.data, ...coupons]);
        toast.success("Tạo mã thành công!");
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa mã này?")) {
      try {
        await userRequest.delete(`/coupons/${id}`);
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        toast.success("Đã xóa mã!");
      } catch { toast.error("Lỗi khi xóa"); }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await userRequest.put(`/coupons/${id}`, { isActive: !currentStatus });
      setCoupons((prev) => prev.map((c) => (c._id === id ? res.data : c)));
      toast.success(res.data.isActive ? "Đã kích hoạt mã" : "Đã ẩn mã");
    } catch { toast.error("Lỗi cập nhật trạng thái"); }
  };

  // --- FILTER & STATS LOGIC ---
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      const matchType = filterType === "all" ? true : c.discountType === filterType;
      const matchStatus = filterStatus === "all" ? true : filterStatus === "active" ? c.isActive : !c.isActive;
      return matchSearch && matchType && matchStatus;
    });
  }, [coupons, search, filterType, filterStatus]);

  const totalPages = Math.ceil(filteredCoupons.length / rowsPerPage);
  const pageData = filteredCoupons.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const activeCount = coupons.filter(c => c.isActive).length;
  const expiredCount = coupons.filter(c => new Date(c.endDate) < new Date()).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quản Lý Mã Giảm Giá"
        subtitle={`${coupons.length} mã giảm giá trong hệ thống`}
        action={
          <button onClick={handleOpenAdd} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all">
            <FaPlus size={14} /> Tạo Mã Mới
          </button>
        }
      />

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500 transition-transform group-hover:scale-110">
            <FaTicketAlt size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tổng Số Mã</p>
            <p className="mt-0.5 text-2xl font-black text-gray-900">{coupons.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group cursor-pointer" onClick={() => {setFilterStatus("active"); setCurrentPage(1);}}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 transition-transform group-hover:scale-110">
            <FaCheckCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Đang Hoạt Động</p>
            <p className="mt-0.5 text-2xl font-black text-gray-900">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-transform group-hover:scale-110">
            <FaExclamationCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Đã Hết Hạn</p>
            <p className="mt-0.5 text-2xl font-black text-gray-900">{expiredCount}</p>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full items-center">
          <div className="relative w-full sm:max-w-xs">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text" placeholder="Tìm theo mã hoặc mô tả..."
              value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          
          <div className="relative hidden md:block">
            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
              className={`pl-9 pr-8 py-2.5 text-sm font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterType !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả hình thức</option>
              <option value="PERCENT">Theo phần trăm (%)</option>
              <option value="AMOUNT">Theo số tiền (VNĐ)</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className={`pl-4 pr-8 py-2.5 text-sm font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterStatus !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-gray-500">Hiển thị:</span>
          <select
            value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="pl-3 pr-7 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm font-medium">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-100">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Mã Code</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Giảm Giá</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Thời Hạn & Điều Kiện</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Tiến độ</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Trạng Thái</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((c) => {
                    const isExpired = new Date(c.endDate) < new Date();
                    return (
                      <tr key={c._id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center rounded bg-orange-100 px-2 py-1 text-sm font-black text-primary border border-orange-200">
                            {c.code}
                          </span>
                          <p className="mt-1 text-[11px] text-gray-500 max-w-[150px] line-clamp-2">{c.description}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-gray-800 text-base">
                            {c.discountType === "PERCENT" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}đ`}
                          </span>
                          {c.discountType === "PERCENT" && c.maxDiscountAmount > 0 && (
                            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Tối đa {c.maxDiscountAmount.toLocaleString()}đ</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-[12px] text-gray-600 font-medium">
                            {new Date(c.startDate).toLocaleDateString("vi-VN")} - {new Date(c.endDate).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="text-[11px] font-semibold text-primary mt-0.5">
                            Min Order: {c.minOrderValue.toLocaleString()}đ
                          </div>
                        </td>
                        <td className="px-5 py-3.5 w-32">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 mb-1.5">
                            <div className={`h-full rounded-full ${c.usedCount >= c.usageLimit ? 'bg-red-500' : 'bg-primary'}`}
                              style={{ width: `${Math.min((c.usedCount / c.usageLimit) * 100, 100)}%` }}></div>
                          </div>
                          <div className="text-center text-[10px] font-bold text-gray-500 tracking-wider">
                            {c.usedCount} / {c.usageLimit}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {isExpired ? (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 border border-red-100">Đã hết hạn</span>
                          ) : (
                            <button onClick={() => handleToggleStatus(c._id, c.isActive)} className="focus:outline-none">
                              {c.isActive ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors">Hoạt động</span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500 border border-gray-200 hover:bg-gray-200 transition-colors">Đã ẩn</span>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleOpenEdit(c)} className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all">
                              <FaEdit size={13} />
                            </button>
                            <button onClick={() => handleDelete(c._id)} className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 border border-red-100 hover:border-red-300 transition-all">
                              <FaTrash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <FaTicketAlt size={32} className="text-gray-200" />
                          <p className="text-sm font-medium">Không tìm thấy mã giảm giá nào.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage} totalPages={totalPages}
              total={filteredCoupons.length} rowsPerPage={rowsPerPage}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="mã giảm giá"
            />
          </>
        )}
      </div>

      {/* MODAL FORM */}
      <Modal isOpen={showModal} onClose={closeModal} title={isEdit ? "Cập Nhật Mã Giảm Giá" : "Tạo Mã Mới"} size="2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mã Code <span className="text-red-500">*</span></label>
              <input type="text" required name="code" value={formData.code} onChange={handleChange} placeholder="VD: SALE2025"
                className="w-full px-4 py-2.5 text-sm uppercase font-bold text-primary placeholder:normal-case placeholder:font-normal border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mô tả <span className="text-red-500">*</span></label>
              <input type="text" required name="description" value={formData.description} onChange={handleChange} placeholder="VD: Giảm 20% mừng năm mới"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Loại giảm giá</label>
              <select name="discountType" value={formData.discountType} onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all cursor-pointer">
                <option value="PERCENT">Theo Phần Trăm (%)</option>
                <option value="AMOUNT">Theo Số Tiền (VNĐ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Giá trị giảm <span className="text-red-500">*</span></label>
              <input type="number" required name="discountValue" value={formData.discountValue} onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            {formData.discountType === "PERCENT" && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Giảm tối đa (VNĐ)</label>
                <input type="number" name="maxDiscountAmount" value={formData.maxDiscountAmount} onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
              </div>
            )}
            <div className={formData.discountType !== "PERCENT" ? "md:col-span-2" : ""}>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Đơn tối thiểu (VNĐ)</label>
              <input type="number" name="minOrderValue" value={formData.minOrderValue} onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Ngày bắt đầu <span className="text-red-500">*</span></label>
              <input type="date" required name="startDate" value={formData.startDate} onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Ngày kết thúc <span className="text-red-500">*</span></label>
              <input type="date" required name="endDate" value={formData.endDate} onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Giới hạn số lượng mã <span className="text-red-500">*</span></label>
              <input type="number" required name="usageLimit" value={formData.usageLimit} onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div className="md:col-span-2 flex items-center mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
              <label htmlFor="isActive" className="ml-2 text-sm font-bold text-gray-800 cursor-pointer">Kích hoạt ngay lập tức</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Hủy</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all">{isEdit ? "LƯU THAY ĐỔI" : "TẠO MÃ MỚI"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCoupon;
