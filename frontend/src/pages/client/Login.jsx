import { Link, useNavigate } from "react-router-dom";
import { login, loginWithGoogleAction } from "../../redux/apiCalls.js";
import { toast } from "sonner"; // Sử dụng sonner thay cho react-toastify
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import {
  FaUser,
  FaLock,
  FaArrowRight,
  FaBookOpen,
  FaQuoteLeft,
} from "react-icons/fa";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { isFetching } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.warning("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
      return;
    }

    try {
      await login(dispatch, { username, password });
      toast.success("Chào mừng bạn quay trở lại!");
      navigate("/");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(errorMsg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogleAction(dispatch, credentialResponse.credential);
      toast.success("Đăng nhập bằng Google thành công!");
      navigate("/");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Đăng nhập Google thất bại.";
      toast.error(errorMsg);
    }
  };

  const handleGoogleError = () => {
    toast.error("Lỗi hệ thống khi tải Google Login.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Nền mờ trang trí */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>

      {/* Đã xóa ToastContainer ở đây */}

      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] z-10 relative">
        {/* --- CỘT TRÁI: TYPOGRAPHY TRUYỀN ĐỘNG LỰC --- */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 relative overflow-hidden justify-center items-center text-white p-12">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

          <div className="relative z-10 text-center flex flex-col items-center w-full">
            <div className="mb-8 p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
              <FaBookOpen className="text-4xl text-purple-300" />
            </div>

            <h2 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
              KHÁM PHÁ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                TRI THỨC MỚI
              </span>
            </h2>

            <div className="w-20 h-1.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mb-10"></div>

            <div className="relative max-w-md px-6">
              <FaQuoteLeft className="absolute top-[-10px] left-[-5px] text-2xl text-purple-400/30" />
              <p className="text-lg font-medium italic opacity-90 leading-relaxed">
                "Một cuốn sách thực sự hay nên được đọc khi còn trẻ, rồi đọc lại
                khi đã trưởng thành, và một lần nữa lúc về già."
              </p>
              <p className="text-xs mt-6 font-bold text-purple-300 uppercase tracking-[0.2em]">
                — Robertson Davies
              </p>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: FORM ĐĂNG NHẬP --- */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Xin Chào! <span className="inline-block animate-bounce">👋</span>
            </h2>
            <p className="mt-3 text-gray-500 font-medium">
              Chào mừng bạn quay lại với nhà sách GTBooks.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">
                Tên đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-14 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-sm font-semibold bg-gray-50/50"
                  placeholder="Nhập username của bạn"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-gray-700">
                  Mật khẩu
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-purple-600 hover:text-purple-800"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-14 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-sm font-semibold bg-gray-50/50"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isFetching}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-slate-900 hover:bg-purple-900 transition-all duration-300 shadow-xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isFetching ? (
                "ĐANG XỬ LÝ..."
              ) : (
                <span className="flex items-center gap-2 tracking-widest uppercase">
                  Đăng nhập <FaArrowRight className="text-xs" />
                </span>
              )}
            </button>

            {/* DIVIDER */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Hoặc</span>
              </div>
            </div>

            {/* GOOGLE LOGIN BUTTON */}
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
              />
            </div>

            <div className="text-center pt-6 border-t border-gray-50 mt-6">
              <p className="text-sm text-gray-500 font-medium">
                Bạn chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="font-bold text-purple-700 hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

