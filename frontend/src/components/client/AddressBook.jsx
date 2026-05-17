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
    <section className="border-t border-gray-100 pt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center">
          <FaMapMarkerAlt className="mr-2 text-primary" />
          Sổ địa chỉ
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center text-sm font-semibold text-primary hover:text-primary-hover transition cursor-pointer"
          >
            <FaPlus className="mr-1" /> Thêm địa chỉ
          </button>
        )}
      </div>

      {/* DANH SÁCH ĐỊA CHỈ */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-400">
          <FaMapMarkerAlt className="mx-auto text-3xl mb-2" />
          <p className="text-sm">Bạn chưa có địa chỉ nào.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-primary font-semibold text-sm hover:underline cursor-pointer"
          >
            + Thêm địa chỉ đầu tiên
          </button>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {addresses.map((addr) => (
          <div
            key={addr._id}
            className={`relative p-4 rounded-lg border transition ${
              addr.isDefault
                ? "border-primary bg-primary-light/50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-gray-800 text-sm">
                    {addr.name}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-600 text-sm">{addr.phone}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20">
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {addr.street}, {addr.wardName}, {addr.districtName},{" "}
                  {addr.provinceName}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    title="Đặt mặc định"
                    className="text-xs text-gray-400 hover:text-primary transition cursor-pointer p-1"
                  >
                    <FaStar />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr._id)}
                  title="Xóa"
                  className="text-xs text-gray-400 hover:text-red-500 transition cursor-pointer p-1"
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
          className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4 animate-fadeIn"
        >
          <h3 className="font-bold text-gray-800 text-sm mb-2">
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

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
            >
              <FaTimes className="inline mr-1" /> Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition flex items-center disabled:opacity-50 cursor-pointer"
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
    </section>
  );
};

export default AddressBook;
