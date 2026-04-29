import { Link, useNavigate } from "react-router-dom";
import { login } from "../redux/apiCalls.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
      navigate("/");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Các khối màu nền trang trí mờ */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 -z-10"></div>

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] z-10 relative">
        {/* --- CỘT TRÁI: TYPOGRAPHY TRUYỀN ĐỘNG LỰC (THAY CHO ẢNH) --- */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 relative overflow-hidden justify-center items-center text-white p-12">
          {/* Họa tiết nền nhẹ */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <FaBookOpen className="absolute -bottom-24 -left-24 text-[15rem] text-white/5 rotate-12" />

          {/* Nội dung chính căn giữa */}
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="mb-8 p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-inner animate-pulse-slow">
              <FaBookOpen className="text-4xl text-purple-300" />
            </div>

            <h2 className="text-5xl font-black tracking-tight leading-tight mb-6 drop-shadow-lg">
              Khám Phá <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                Thế Giới Mới
              </span>
            </h2>

            {/* Đường kẻ trang trí */}
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mb-8"></div>

            {/* Câu trích dẫn */}
            <div className="relative max-w-md">
              <FaQuoteLeft className="absolute -top-4 -left-6 text-3xl text-purple-400/30" />
              <p className="text-xl font-medium italic opacity-90 leading-relaxed font-serif">
                "Một cuốn sách thực sự hay nên được đọc khi còn trẻ, rồi đọc lại
                khi đã trưởng thành, và một lần nữa lúc về già."
              </p>
              <p className="text-sm mt-4 font-bold text-purple-300 uppercase tracking-widest">
                — Robertson Davies
              </p>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: FORM ĐĂNG NHẬP (GIỮ NGUYÊN LOGIC, TINH CHỈNH UI) --- */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white/80 backdrop-blur-xl">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              Xin Chào! <span className="wave inline-block">👋</span>
            </h2>
            <p className="mt-3 text-gray-500 font-medium text-lg">
              Đăng nhập để tiếp tục hành trình đọc của bạn.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Input Username */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">
                Tên đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 text-lg group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-14 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-base font-medium bg-gray-50/50 hover:border-gray-300"
                  placeholder="Ví dụ: gtbooks_user"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-gray-700">
                  Mật khẩu
                </label>
                <a
                  href="#"
                  className="text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 text-lg group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-14 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-base font-medium bg-gray-50/50 hover:border-gray-300"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isFetching}
              className="w-full flex justify-center py-4.5 px-4 border border-transparent text-base font-black rounded-2xl text-white bg-gradient-to-r from-slate-900 to-slate-800 hover:from-purple-900 hover:to-indigo-900 focus:outline-none focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {isFetching ? (
                <span className="flex items-center gap-3">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  ĐANG XỬ LÝ...
                </span>
              ) : (
                <span className="flex items-center tracking-wider gap-3">
                  ĐĂNG NHẬP NGAY <FaArrowRight />
                </span>
              )}
            </button>

            <div className="text-center pt-6 border-t border-gray-100">
              <p className="text-base text-gray-600 font-medium">
                Bạn chưa có tài khoản GTBooks?{" "}
                <Link
                  to="/register"
                  className="font-black text-purple-700 hover:text-purple-900 transition-colors ml-1"
                >
                  Tạo tài khoản mới
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* CSS nhỏ cho hiệu ứng vẫy tay */}
      <style jsx>{`
        .wave {
          animation: wave-animation 2.5s infinite;
          transform-origin: 70% 70%;
        }
        @keyframes wave-animation {
          0% {
            transform: rotate(0deg);
          }
          10% {
            transform: rotate(14deg);
          }
          20% {
            transform: rotate(-8deg);
          }
          30% {
            transform: rotate(14deg);
          }
          40% {
            transform: rotate(-4deg);
          }
          50% {
            transform: rotate(10deg);
          }
          60% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
