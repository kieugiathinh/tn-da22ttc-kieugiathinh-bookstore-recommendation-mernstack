import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "../../redux/userRedux";
import { userRequest } from "../../requestMethods";
import { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaSave,
  FaCamera,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import { toast } from "sonner";
import AddressBook from "../../components/client/AddressBook";

// --- 1. MANG RA NGOÀI ĐỂ KHÔNG BỊ RERENDER ---
const DisabledInput = ({ label, value, icon }) => (
  <div>
    <label className="block text-slate-500 text-sm font-bold mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        {icon}
      </div>
      <input
        type="text"
        value={value || ""}
        disabled
        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none select-none font-medium text-sm"
      />
    </div>
  </div>
);

// --- 2. MANG RA NGOÀI ---
const EditableInput = ({
  label,
  name,
  value,
  onChange,
  icon,
  type = "text",
  placeholder = "",
}) => (
  <div>
    <label className="block text-slate-700 text-sm font-bold mb-2">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300/50 transition-all bg-white text-slate-800 text-sm"
      />
    </div>
  </div>
);

const MyAccount = () => {
  const user = useSelector((state) => state.user);
  const currentUser = user.currentUser;
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    avatar: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        fullname: currentUser.fullname || "",
        phone: currentUser.phone || "",
        avatar: currentUser.avatar || "",
      }));
    }
  }, [currentUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    let avatarUrl = formData.avatar;

    try {
      if (selectedImage) {
        const data = new FormData();
        data.append("file", selectedImage);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
        const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
        avatarUrl = uploadRes.data.url;
      }

      const res = await userRequest.put(`/users/${currentUser._id}`, {
        fullname: formData.fullname,
        phone: formData.phone,
        avatar: avatarUrl,
      });

      dispatch(loginSuccess({ ...currentUser, ...res.data }));
      toast.success("Cập nhật thành công!", {
        description: "Thông tin cá nhân của bạn đã được lưu.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại", {
        description: "Vui lòng kiểm tra lại kết nối mạng.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    try {
      await userRequest.put("/users/update-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CỘT TRÁI (Avatar + Đổi Mật Khẩu) */}
          <div className="lg:col-span-4 space-y-8">
            {/* AVATAR CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-8 flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
                  {previewUrl || formData.avatar ? (
                    <img
                      src={previewUrl || formData.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl text-orange-600 font-bold">
                      {currentUser?.fullname
                        ? currentUser.fullname.charAt(0).toUpperCase()
                        : "U"}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 bg-white p-3 rounded-full shadow-md cursor-pointer hover:bg-orange-50 transition border border-slate-200 text-slate-600 hover:text-orange-600"
                >
                  <FaCamera size={18} />
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 text-center">{currentUser?.fullname}</h2>
              <p className="text-sm text-slate-500 mb-4">{currentUser?.email}</p>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">
                Dụng lượng file tối đa 1 MB. Định dạng: .JPEG, .PNG
              </p>
            </div>

            {/* ĐỔI MẬT KHẨU CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
                <h2 className="text-lg font-extrabold text-slate-800">Đổi Mật Khẩu</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <EditableInput
                    label="Mật khẩu hiện tại"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    icon={<FaLock />}
                    placeholder="••••••••"
                  />
                  <EditableInput
                    label="Mật khẩu mới"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    icon={<FaLock />}
                    placeholder="••••••••"
                  />
                  <EditableInput
                    label="Xác nhận mật khẩu mới"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    icon={<FaLock />}
                    placeholder="••••••••"
                  />
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-bold text-sm transition-all flex justify-center items-center cursor-pointer"
                    >
                      <FaLock className="mr-2" /> Lưu Mật Khẩu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (Thông tin cá nhân + Sổ địa chỉ) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* THÔNG TIN CÁ NHÂN CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
                <h2 className="text-xl font-extrabold text-slate-800">Thông Tin Hồ Sơ</h2>
              </div>
              <div className="p-6 md:p-8">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DisabledInput
                      label="Địa chỉ Email"
                      value={currentUser?.email}
                      icon={<FaEnvelope />}
                    />
                    <EditableInput
                      label="Số điện thoại"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      icon={<FaPhone />}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <EditableInput
                    label="Họ và tên"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleChange}
                    icon={<FaUser />}
                  />

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className={`px-8 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center cursor-pointer ${
                        isUpdating
                          ? "bg-slate-300 cursor-not-allowed text-white shadow-none"
                          : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-300/40 hover:-translate-y-0.5"
                      }`}
                    >
                      {isUpdating ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" /> Đang lưu...
                        </>
                      ) : (
                        <>
                          <FaSave className="mr-2" /> Lưu Hồ Sơ
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* SỔ ĐỊA CHỈ CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <AddressBook />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default MyAccount;
