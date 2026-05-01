import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { toast } from "sonner";
import PageHeader from "../../components/admin/PageHeader";

// ── Shared input style ─────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200/30";

const AdminCoupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // State cho Form
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "PERCENT", // PERCENT hoặc AMOUNT
    discountValue: 0,
    maxDiscountAmount: 0,
    minOrderValue: 0,
    startDate: "",
    endDate: "",
    usageLimit: 100,
    isActive: true,
  });

  const [currentId, setCurrentId] = useState(null);

  // Load danh sách
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await userRequest.get("/coupons/admin");
        setCoupons(res.data);
      } catch (err) {
        toast.error("Lỗi tải danh sách mã");
      }
    };
    fetchCoupons();
  }, []);

  // Xử lý Input thay đổi
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Mở modal tạo mới
  const handleOpenAdd = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "PERCENT",
      discountValue: 0,
      maxDiscountAmount: 0,
      minOrderValue: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      usageLimit: 100,
      isActive: true,
    });
    setIsEdit(false);
    setShowModal(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (coupon) => {
    setFormData({
      ...coupon,
      // Format date về YYYY-MM-DD để hiển thị trong input date
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
      endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
    });
    setCurrentId(coupon._id);
    setIsEdit(true);
    setShowModal(true);
  };

  // Submit Form (Tạo hoặc Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        const res = await userRequest.put(`/coupons/${currentId}`, formData);
        setCoupons((prev) =>
          prev.map((c) => (c._id === currentId ? res.data : c))
        );
        toast.success("Cập nhật thành công!");
      } else {
        const res = await userRequest.post("/coupons", formData);
        setCoupons([res.data, ...coupons]);
        toast.success("Tạo mã thành công!");
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  // Xóa mã
  const handleDelete = async (id) => {
    if (window.confirm("Bạn chắc chắn muốn xóa mã này?")) {
      try {
        await userRequest.delete(`/coupons/${id}`);
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        toast.success("Đã xóa mã!");
      } catch (err) {
        toast.error("Lỗi khi xóa");
      }
    }
  };

  // Toggle nhanh trạng thái Ẩn/Hiện
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await userRequest.put(`/coupons/${id}`, {
        isActive: !currentStatus,
      });
      setCoupons((prev) => prev.map((c) => (c._id === id ? res.data : c)));
      toast.success(res.data.isActive ? "Đã kích hoạt mã" : "Đã ẩn mã");
    } catch (err) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Mã Giảm Giá"
        subtitle={`${coupons.length} mã giảm giá trong hệ thống`}
        action={
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            <FaPlus size={14} /> Thêm Mã Mới
          </button>
        }
      />

      {/* BẢNG DANH SÁCH */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-5 py-3.5">Mã Code</th>
                <th className="px-5 py-3.5">Giảm Giá</th>
                <th className="px-5 py-3.5">Điều Kiện</th>
                <th className="px-5 py-3.5">Hạn Dùng</th>
                <th className="px-5 py-3.5">Đã Dùng</th>
                <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                <th className="px-5 py-3.5 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-brand-600">{c.code}</td>
                  <td className="px-5 py-3.5 text-gray-800">
                    <span className="font-semibold">
                      {c.discountType === "PERCENT"
                        ? `${c.discountValue}%`
                        : `${c.discountValue.toLocaleString()}đ`}
                    </span>
                    {c.discountType === "PERCENT" && c.maxDiscountAmount > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Tối đa: {c.maxDiscountAmount.toLocaleString()}đ
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    Min: {c.minOrderValue.toLocaleString()}đ
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {new Date(c.startDate).toLocaleDateString()} - <br />
                    {new Date(c.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {c.usedCount} / {c.usageLimit}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleStatus(c._id, c.isActive)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        c.isActive
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                      } transition-colors`}
                    >
                      {c.isActive ? "Hoạt động" : "Đã ẩn"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <FaEdit size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    Chưa có mã giảm giá nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <h2 className="text-base font-bold text-gray-900">
                {isEdit ? "Cập Nhật Mã Giảm Giá" : "Tạo Mã Mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Mã Code (Viết liền, không dấu)
                  </label>
                  <input
                    required
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className={`${inputCls} uppercase font-bold text-brand-600 placeholder:normal-case placeholder:font-normal`}
                    placeholder="VD: SALE2025"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">Mô tả</label>
                  <input
                    required
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="VD: Giảm 20% mừng năm mới"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Loại giảm giá
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="PERCENT">Theo Phần Trăm (%)</option>
                    <option value="AMOUNT">Theo Số Tiền (VNĐ)</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Giá trị giảm
                  </label>
                  <input
                    required
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>

                {/* Max Discount (Only for Percent) */}
                {formData.discountType === "PERCENT" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      value={formData.maxDiscountAmount}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                )}

                {/* Min Order */}
                <div className={formData.discountType !== "PERCENT" ? "md:col-span-2" : ""}>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="minOrderValue"
                    value={formData.minOrderValue}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>

                {/* Dates */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Ngày bắt đầu
                  </label>
                  <input
                    required
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Ngày kết thúc
                  </label>
                  <input
                    required
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Giới hạn số lượng mã
                  </label>
                  <input
                    required
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>

                {/* Status */}
                <div className="flex items-center md:mt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-semibold text-gray-700">
                    Kích hoạt ngay
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
                >
                  Lưu Mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupon;
