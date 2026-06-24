import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/userRedux";
import { publicRequest, userRequest } from "../../requestMethods";
import { toast } from "sonner";
import {
  FaPlus,
  FaMapMarkerAlt,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaChevronDown,
  FaStar,
} from "react-icons/fa";

const AddressBook = () => {
  const currentUser = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();

  // --- Form states ---
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    isDefault: false,
  });

  // --- GHN states ---
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  const addresses = currentUser?.addresses || [];

  // --- Load provinces on mount ---
  useEffect(() => {
    if (!showForm) return;
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const res = await publicRequest.get("/shipping/provinces");
        setProvinces(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load tỉnh:", err);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [showForm]);

  // --- Load districts ---
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      return;
    }
    const fetch = async () => {
      setIsLoadingDistricts(true);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      try {
        const res = await publicRequest.get(
          `/shipping/districts?province_id=${selectedProvince.ProvinceID}`
        );
        setDistricts(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load quận:", err);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetch();
  }, [selectedProvince]);

  // --- Load wards ---
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard(null);
      return;
    }
    const fetch = async () => {
      setIsLoadingWards(true);
      setSelectedWard(null);
      try {
        const res = await publicRequest.get(
          `/shipping/wards?district_id=${selectedDistrict.DistrictID}`
        );
        setWards(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load phường:", err);
      } finally {
        setIsLoadingWards(false);
      }
    };
    fetch();
  }, [selectedDistrict]);

  // --- Reset form ---
  const resetForm = () => {
    setFormData({ name: "", phone: "", street: "", isDefault: false });
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setShowForm(false);
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.street.trim()
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Quận/Phường!");
      return;
    }

    setIsSaving(true);
    try {
      const res = await userRequest.post("/users/addresses", {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        provinceId: selectedProvince.ProvinceID,
        provinceName: selectedProvince.ProvinceName,
        districtId: selectedDistrict.DistrictID,
        districtName: selectedDistrict.DistrictName,
        wardCode: selectedWard.WardCode,
        wardName: selectedWard.WardName,
        isDefault: formData.isDefault,
      });

      dispatch(loginSuccess({ ...currentUser, ...res.data }));
      toast.success("Thêm địa chỉ thành công!");
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thêm địa chỉ thất bại!");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Set default ---
  const handleSetDefault = async (addressId) => {
    try {
      const res = await userRequest.put(
        `/users/addresses/${addressId}/default`
      );
      dispatch(loginSuccess({ ...currentUser, ...res.data }));
      toast.success("Đã đặt làm mặc định!");
    } catch (err) {
      toast.error("Thao tác thất bại!");
    }
  };

  // --- Delete ---
  const handleDelete = async (addressId) => {
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      const res = await userRequest.delete(`/users/addresses/${addressId}`);
      dispatch(loginSuccess({ ...currentUser, ...res.data }));
      toast.success("Đã xóa địa chỉ!");
    } catch (err) {
      toast.error("Xóa thất bại!");
    }
  };

  // --- Select component ---
  const GhnSelect = ({
    id,
    label,
    value,
    onChange,
    options,
    disabled,
    loading,
    placeholder,
    valueKey,
    labelKey,
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          id={id}
          value={value || ""}
          onChange={onChange}
          disabled={disabled || loading}
          className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed pr-8 text-sm"
        >
          <option value="">
            {loading ? "Đang tải..." : placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt[valueKey]} value={opt[valueKey]}>
              {opt[labelKey]}
            </option>
          ))}
        </select>
        <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
          <h2 className="text-xl font-extrabold text-slate-800">Sổ Địa Chỉ</h2>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center text-sm font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl border border-orange-200"
          >
            <FaPlus className="mr-1.5" /> Thêm Mới
          </button>
        )}
      </div>

      <div className="p-6 md:p-8">

      {/* DANH SÁCH ĐỊA CHỈ */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <FaMapMarkerAlt className="mx-auto text-4xl text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500">Bạn chưa có địa chỉ nhận hàng nào.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-orange-600 font-bold text-sm hover:underline cursor-pointer flex items-center justify-center mx-auto"
          >
            <FaPlus className="mr-1.5" /> Thêm địa chỉ đầu tiên
          </button>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {addresses.map((addr) => (
          <div
            key={addr._id}
            className={`relative p-5 rounded-xl border-2 transition-all ${
              addr.isDefault
                ? "border-orange-400 bg-orange-50/50 shadow-sm"
                : "border-slate-100 bg-white hover:border-orange-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <span className="font-extrabold text-slate-800 text-base">
                    {addr.name}
                  </span>
                  <span className="text-slate-300 text-sm">|</span>
                  <span className="text-slate-600 text-sm font-medium">{addr.phone}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-md border border-orange-200">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {addr.street}, {addr.wardName}, {addr.districtName},{" "}
                  {addr.provinceName}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    title="Đặt mặc định"
                    className="text-sm text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition cursor-pointer p-2"
                  >
                    <FaStar />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr._id)}
                  title="Xóa"
                  className="text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer p-2"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FORM THÊM ĐỊA CHỈ */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-2 border-slate-100 rounded-2xl p-6 bg-slate-50/50 space-y-5 animate-fadeIn"
        >
          <h3 className="font-extrabold text-slate-800 text-base mb-2">
            Thêm địa chỉ mới
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ tên người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0901234567"
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GhnSelect
              id="ab-province"
              label="Tỉnh / Thành phố"
              value={selectedProvince?.ProvinceID}
              onChange={(e) => {
                const p = provinces.find(
                  (x) => x.ProvinceID === Number(e.target.value)
                );
                setSelectedProvince(p || null);
              }}
              options={provinces}
              disabled={false}
              loading={isLoadingProvinces}
              placeholder="-- Chọn Tỉnh/Thành --"
              valueKey="ProvinceID"
              labelKey="ProvinceName"
            />
            <GhnSelect
              id="ab-district"
              label="Quận / Huyện"
              value={selectedDistrict?.DistrictID}
              onChange={(e) => {
                const d = districts.find(
                  (x) => x.DistrictID === Number(e.target.value)
                );
                setSelectedDistrict(d || null);
              }}
              options={districts}
              disabled={!selectedProvince}
              loading={isLoadingDistricts}
              placeholder={
                !selectedProvince ? "-- Chọn Tỉnh trước --" : "-- Chọn Quận/Huyện --"
              }
              valueKey="DistrictID"
              labelKey="DistrictName"
            />
            <GhnSelect
              id="ab-ward"
              label="Phường / Xã"
              value={selectedWard?.WardCode}
              onChange={(e) => {
                const w = wards.find((x) => x.WardCode === e.target.value);
                setSelectedWard(w || null);
              }}
              options={wards}
              disabled={!selectedDistrict}
              loading={isLoadingWards}
              placeholder={
                !selectedDistrict ? "-- Chọn Quận trước --" : "-- Chọn Phường/Xã --"
              }
              valueKey="WardCode"
              labelKey="WardName"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số nhà, tên đường <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) =>
                setFormData({ ...formData, street: e.target.value })
              }
              placeholder="123 Nguyễn Văn A"
              className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light text-sm"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm text-gray-700">
              Đặt làm địa chỉ mặc định
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <FaTimes className="inline mr-1.5" /> Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-sm transition flex items-center disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" /> Đang lưu...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" /> Lưu địa chỉ
                </>
              )}
            </button>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};

export default AddressBook;
