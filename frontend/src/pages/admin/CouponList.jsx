import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { toast } from "sonner";
import PageHeader from "../../components/admin/PageHeader";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import IconButton from "../../components/common/IconButton";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";

const AdminCoupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    code: "", description: "", discountType: "PERCENT", discountValue: 0,
    maxDiscountAmount: 0, minOrderValue: 0, startDate: "", endDate: "",
    usageLimit: 100, isActive: true,
  });
  const [currentId, setCurrentId] = useState(null);

  // Load danh sách
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await userRequest.get("/coupons/admin");
        setCoupons(res.data);
      } catch { toast.error("Lỗi tải danh sách mã"); }
    };
    fetchCoupons();
  }, []);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản Lý Mã Giảm Giá"
        subtitle={`${coupons.length} mã giảm giá trong hệ thống`}
        action={<Button onClick={handleOpenAdd} icon={<FaPlus size={14} />}>Thêm Mã Mới</Button>}
      />

      <Card>
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
                  <td className="px-5 py-3.5 font-bold text-primary">{c.code}</td>
                  <td className="px-5 py-3.5 text-gray-800">
                    <span className="font-semibold">
                      {c.discountType === "PERCENT" ? `${c.discountValue}%` : `${c.discountValue.toLocaleString()}đ`}
                    </span>
                    {c.discountType === "PERCENT" && c.maxDiscountAmount > 0 && (
                      <div className="text-xs text-gray-500 mt-0.5">Tối đa: {c.maxDiscountAmount.toLocaleString()}đ</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">Min: {c.minOrderValue.toLocaleString()}đ</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {new Date(c.startDate).toLocaleDateString()} - <br />
                    {new Date(c.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{c.usedCount} / {c.usageLimit}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button onClick={() => handleToggleStatus(c._id, c.isActive)}>
                      <Badge variant={c.isActive ? "success" : "danger"} className="cursor-pointer hover:opacity-80 transition-opacity">
                        {c.isActive ? "Hoạt động" : "Đã ẩn"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-3">
                      <IconButton variant="edit" icon={<FaEdit size={13} />} onClick={() => handleOpenEdit(c)} title="Sửa" />
                      <IconButton variant="delete" icon={<FaTrash size={13} />} onClick={() => handleDelete(c._id)} title="Xóa" />
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Chưa có mã giảm giá nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL FORM */}
      <Modal isOpen={showModal} onClose={closeModal} title={isEdit ? "Cập Nhật Mã Giảm Giá" : "Tạo Mã Mới"} size="2xl">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <InputField label="Mã Code (Viết liền, không dấu)" required name="code"
                value={formData.code} onChange={handleChange} placeholder="VD: SALE2025"
                className="uppercase font-bold text-primary placeholder:normal-case placeholder:font-normal" />
            </div>
            <div className="md:col-span-2">
              <InputField label="Mô tả" required name="description"
                value={formData.description} onChange={handleChange} placeholder="VD: Giảm 20% mừng năm mới" />
            </div>
            <InputField label="Loại giảm giá" as="select" name="discountType"
              value={formData.discountType} onChange={handleChange}>
              <option value="PERCENT">Theo Phần Trăm (%)</option>
              <option value="AMOUNT">Theo Số Tiền (VNĐ)</option>
            </InputField>
            <InputField label="Giá trị giảm" required type="number" name="discountValue"
              value={formData.discountValue} onChange={handleChange} />
            {formData.discountType === "PERCENT" && (
              <InputField label="Giảm tối đa (VNĐ)" type="number" name="maxDiscountAmount"
                value={formData.maxDiscountAmount} onChange={handleChange} />
            )}
            <InputField label="Đơn tối thiểu (VNĐ)" type="number" name="minOrderValue"
              value={formData.minOrderValue} onChange={handleChange}
              className={formData.discountType !== "PERCENT" ? "md:col-span-2" : ""} />
            <InputField label="Ngày bắt đầu" required type="date" name="startDate"
              value={formData.startDate} onChange={handleChange} />
            <InputField label="Ngày kết thúc" required type="date" name="endDate"
              value={formData.endDate} onChange={handleChange} />
            <InputField label="Giới hạn số lượng mã" required type="number" name="usageLimit"
              value={formData.usageLimit} onChange={handleChange} />
            <div className="flex items-center md:mt-6">
              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive}
                onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
              <label htmlFor="isActive" className="ml-2 text-sm font-semibold text-gray-700">Kích hoạt ngay</label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={closeModal}>Hủy</Button>
            <Button type="submit">Lưu Mã</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCoupon;
