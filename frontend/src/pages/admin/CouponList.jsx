import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaCheck,
  FaBan,
} from "react-icons/fa";
import { toast } from "sonner";

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
      startDate: coupon.startDate.split("T")[0],
      endDate: coupon.endDate.split("T")[0],
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Quản Lý Mã Giảm Giá
        </h1>
        <button
          onClick={handleOpenAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition"
        >
          <FaPlus className="mr-2" /> Thêm Mã Mới
        </button>
      </div>

      {/* BẢNG DANH SÁCH */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
              <th className="p-4">Mã Code</th>
              <th className="p-4">Giảm Giá</th>
              <th className="p-4">Điều Kiện</th>
              <th className="p-4">Hạn Dùng</th>
              <th className="p-4">Đã Dùng</th>
              <th className="p-4 text-center">Trạng Thái</th>
              <th className="p-4 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.map((c) => (
              <tr
                key={c._id}
                className="hover:bg-gray-50 text-sm text-gray-700"
              >
                <td className="p-4 font-bold text-purple-600">{c.code}</td>
                <td className="p-4">
                  {c.discountType === "PERCENT"
                    ? `${c.discountValue}%`
                    : `${c.discountValue.toLocaleString()}đ`}
                  {c.discountType === "PERCENT" && c.maxDiscountAmount > 0 && (
                    <div className="text-xs text-gray-400">
                      Tối đa: {c.maxDiscountAmount.toLocaleString()}đ
                    </div>
                  )}
                </td>
                <td className="p-4">
                  Min: {c.minOrderValue.toLocaleString()}đ
                </td>
                <td className="p-4">
                  {new Date(c.startDate).toLocaleDateString()} - <br />
                  {new Date(c.endDate).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {c.usedCount} / {c.usageLimit}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleToggleStatus(c._id, c.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      c.isActive
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {c.isActive ? "Hoạt động" : "Đã ẩn"}
                  </button>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-xl font-bold">
                {isEdit ? "Cập Nhật Mã" : "Tạo Mã Mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Code */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Mã Code (Viết liền, không dấu)
                </label>
                <input
                  required
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full border p-2 rounded uppercase font-bold"
                  placeholder="VD: SALE2025"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <input
                  required
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                  placeholder="VD: Giảm 20% mừng năm mới"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Loại giảm giá
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                >
                  <option value="PERCENT">Theo Phần Trăm (%)</option>
                  <option value="AMOUNT">Theo Số Tiền (VNĐ)</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Giá trị giảm
                </label>
                <input
                  required
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Max Discount (Only for Percent) */}
              {formData.discountType === "PERCENT" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={formData.maxDiscountAmount}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                  />
                </div>
              )}

              {/* Min Order */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Đơn tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Dates */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ngày bắt đầu
                </label>
                <input
                  required
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Ngày kết thúc
                </label>
                <input
                  required
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Số lượng mã
                </label>
                <input
                  required
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Status */}
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 mr-2 accent-purple-600"
                />
                <span className="font-medium">Kích hoạt ngay</span>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-2 mt-4 flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold"
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
