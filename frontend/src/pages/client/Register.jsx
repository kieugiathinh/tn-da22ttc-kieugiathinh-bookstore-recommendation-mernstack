import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userRequest } from "../../requestMethods.js";
import { toast } from "sonner"; // Chuyển sang sonner
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserPlus,
  FaBookOpen,
  FaQuoteLeft,
  FaArrowRight,
} from "react-icons/fa";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate
    if (!name || !email || !password || !username) {
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    try {
      await userRequest.post("/auth/register", {
        fullname: name,
        username: username,
        email: email,
        password: password,
      });

      toast.success("Đăng ký thành công! Chào mừng bạn gia nhập GTBooks.");

      setTimeout(() => {
        setLoading(false);
        navigate("/login");
      }, 1500);
    } catch (error) {
      setLoading(false);
      const errorMsg =
        error.response?.data?.message || "Đã xảy ra lỗi khi đăng ký.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Nền mờ trang trí đồng bộ với Login */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>

      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px] z-10 relative">
        {/* --- CỘT TRÁI: TYPOGRAPHY TRUYỀN ĐỘNG LỰC (Đồng bộ Login) --- */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 relative overflow-hidden justify-center items-center text-white p-12">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

          <div className="relative z-10 text-center flex flex-col items-center w-full">
            <div className="mb-8 p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
              <FaUserPlus className="text-4xl text-purple-300" />
            </div>

            <h2 className="text-5xl font-extrabold tracking-tight leading-tight mb-6">
              GIA NHẬP <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                CỘNG ĐỒNG ĐỌC
              </span>
            </h2>

            <div className="w-20 h-1.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mb-10"></div>

            <div className="relative max-w-md px-6">
              <FaQuoteLeft className="absolute top-[-10px] left-[-5px] text-2xl text-purple-400/30" />
              <p className="text-lg font-medium italic opacity-90 leading-relaxed">
                "Việc đọc rất quan trọng. Nếu bạn biết cách đọc, cả thế giới sẽ
                mở ra cho bạn."
              </p>
              <p className="text-xs mt-6 font-bold text-purple-300 uppercase tracking-[0.2em]">
                — Barack Obama
              </p>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: FORM ĐĂNG KÝ --- */}
        <div className="w-full md:w-1/2 p-8 md:px-16 flex flex-col justify-center bg-white">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              TẠO TÀI KHOẢN{" "}
              <span className="inline-block animate-bounce">✨</span>
            </h2>
            <p className="mt-3 text-gray-500 font-normal">
              Bắt đầu hành trình chinh phục tri thức ngay hôm nay.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">
                Họ và Tên
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-14 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-sm font-semibold bg-gray-50/50"
                  placeholder="Nguyễn Văn A"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">
                Tên đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-14 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-sm font-semibold bg-gray-50/50"
                  placeholder="nguyenvana123"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-14 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-sm font-semibold bg-gray-50/50"
                  placeholder="van-a@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 ml-1 uppercase tracking-wider">
                Mật khẩu
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-14 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-purple-600 outline-none transition-all text-sm font-semibold bg-gray-50/50"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-slate-900 hover:bg-purple-900 transition-all duration-300 shadow-xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
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
                <span className="flex items-center gap-2 tracking-widest uppercase">
                  Đăng ký ngay <FaArrowRight className="text-xs" />
                </span>
              )}
            </button>

            <div className="text-center pt-6 border-t border-gray-50">
              <p className="text-sm text-gray-500 font-medium">
                Bạn đã có tài khoản rồi?{" "}
                <Link
                  to="/login"
                  className="font-bold text-purple-700 hover:underline"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;

