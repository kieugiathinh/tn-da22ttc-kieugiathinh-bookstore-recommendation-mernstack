import { useDispatch, useSelector } from "react-redux";
import { logOut, loginSuccess } from "../redux/userRedux";
import { userRequest } from "../requestMethods";
import { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaSignOutAlt,
  FaSave,
  FaCamera,
  FaIdBadge,
  FaSpinner,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CLOUDINARY_CONFIG } from "../utils/constants";
import { toast } from "sonner";

// --- 1. MANG RA NGOÀI ĐỂ KHÔNG BỊ RERENDER ---
const DisabledInput = ({ label, value, icon }) => (
  <div>
    <label className="block text-gray-500 text-sm font-medium mb-1.5">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        type="text"
        value={value || ""}
        disabled
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none select-none font-medium"
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
    <label className="block text-gray-700 text-sm font-medium mb-1.5">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-800"
      />
    </div>
  </div>
);

const MyAccount = () => {
  const user = useSelector((state) => state.user);
  const currentUser = user.currentUser;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    address: "",
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
        address: currentUser.address || "",
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
        address: formData.address,
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

    // Gọi API đổi mật khẩu ở đây
    try {
      await userRequest.put("/users/update-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      // Reset form mật khẩu
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* HEADER */}
        <div className="flex flex-col items-center p-8 border-b border-gray-100 bg-white">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
              {previewUrl || formData.avatar ? (
                <img
                  src={previewUrl || formData.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl text-purple-600 font-bold">
                  {currentUser?.fullname
                    ? currentUser.fullname.charAt(0).toUpperCase()
                    : "U"}
                </span>
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-1 right-1 bg-purple-600 p-2.5 rounded-full shadow-md cursor-pointer hover:bg-purple-700 transition text-white border-2 border-white"
            >
              <FaCamera size={16} />
              <input
                id="avatar-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            {currentUser?.fullname}
          </h1>
          <div className="flex items-center mt-1 space-x-3">
            <span className="text-gray-500 text-sm">
              @{currentUser?.username}
            </span>
            <span className="text-gray-300">•</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                currentUser?.role === 1
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {currentUser?.role === 1 ? "Quản trị viên" : "Thành viên"}
            </span>
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* PHẦN 1: READ ONLY */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
              Thông tin tài khoản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DisabledInput
                label="Tên đăng nhập"
                value={currentUser?.username}
                icon={<FaIdBadge />}
              />
              <DisabledInput
                label="Địa chỉ Email"
                value={currentUser?.email}
                icon={<FaEnvelope />}
              />
            </div>
          </section>

          {/* PHẦN 2: EDITABLE FORM */}
          <section className="border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-5">
              Thông tin cá nhân
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <EditableInput
                label="Họ và tên"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                icon={<FaUser />}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <EditableInput
                  label="Số điện thoại"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={<FaPhone />}
                  placeholder="Nhập số điện thoại"
                />
                <EditableInput
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  icon={<FaMapMarkerAlt />}
                  placeholder="Nhập địa chỉ giao hàng"
                />
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all flex items-center cursor-pointer ${
                    isUpdating
                      ? "bg-purple-400 cursor-not-allowed text-white"
                      : "bg-purple-600 hover:bg-purple-700 text-white hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Cập nhật
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* PHẦN 3: SECURITY */}
          <section className="border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold text-gray-800 mb-5">Bảo mật</h2>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 ">
                <EditableInput
                  label="Mật khẩu cũ"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  icon={<FaLock />}
                  placeholder="••••••••"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    icon={<FaLock />}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-4 items-center">
                <button
                  type="submit"
                  className="bg-white border border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center cursor-pointer"
                >
                  <FaLock className="mr-2" /> Đổi mật khẩu
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
