import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { publicRequest } from "../../requestMethods";
import {
  FaEnvelope,
  FaPaperPlane,
  FaBookOpen,
  FaArrowLeft,
  FaQuoteLeft,
} from "react-icons/fa";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.warning("Vui lòng nhập địa chỉ email!");
      return;
    }

    setIsLoading(true);
    try {
      await publicRequest.post("/auth/forgot-password", { email });
      setIsSent(true);
      toast.success("Link khôi phục đã được gửi vào email của bạn!");
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        "Không thể gửi email khôi phục. Vui lòng thử lại.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Nền mờ trang trí */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-light rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -z-10"></div>

      <div className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] z-10 relative">
        {/* --- CỘT TRÁI: TYPOGRAPHY --- */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-950 via-primary-hover to-violet-950 relative overflow-hidden justify-center items-center text-white p-12">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

          <div className="relative z-10 text-center flex flex-col items-center w-full">
            <div className="mb-8 p-4 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
              <FaBookOpen className="text-4xl text-primary" />
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-6">
              KHÔI PHỤC <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-300">
                MẬT KHẨU
              </span>
            </h2>

            <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-indigo-400 rounded-full mb-10"></div>

            <div className="relative max-w-md px-6">
              <FaQuoteLeft className="absolute top-[-10px] left-[-5px] text-2xl text-primary/30" />
              <p className="text-lg font-medium italic opacity-90 leading-relaxed">
                "Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập
                vào thế giới sách yêu thích."
              </p>
              <p className="text-xs mt-6 font-bold text-primary uppercase tracking-[0.2em]">
                — BookBee Team 🐝
              </p>
            </div>
          </div>
        </div>

        {/* --- CỘT PHẢI: FORM --- */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
          {!isSent ? (
            <>
              {/* Header */}
              <div className="mb-10">
                <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mb-6">
                  <FaEnvelope className="text-2xl text-primary" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                  Quên mật khẩu?
                </h2>
                <p className="mt-3 text-gray-500 font-medium text-sm leading-relaxed">
                  Nhập email đã đăng ký tài khoản BookBee. Chúng tôi sẽ gửi cho
                  bạn một link để đặt lại mật khẩu.
                </p>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">
                    Địa chỉ Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      className="w-full pl-14 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-primary outline-none transition-all text-sm font-semibold bg-gray-50/50"
                      placeholder="your-email@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-primary hover:bg-primary-hover transition-all duration-300 shadow-xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                      ĐANG GỬI...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 tracking-widest uppercase">
                      Gửi link khôi phục <FaPaperPlane className="text-xs" />
                    </span>
                  )}
                </button>
              </form>

              {/* Link quay lại */}
              <div className="text-center pt-6 border-t border-gray-50 mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-honey-gold hover:text-primary transition-colors"
                >
                  <FaArrowLeft className="text-xs" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          ) : (
            /* ── TRẠNG THÁI ĐÃ GỬI THÀNH CÔNG ── */
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
                Kiểm tra email của bạn! 📬
              </h2>
              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-2">
                Chúng tôi đã gửi link khôi phục mật khẩu đến:
              </p>
              <p className="text-primary font-bold text-base mb-6">{email}</p>
              <p className="text-gray-400 text-xs mb-8">
                Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam). Link sẽ
                hết hạn sau 15 phút.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsSent(false);
                    setEmail("");
                  }}
                  className="w-full py-3 px-4 text-sm font-bold rounded-2xl text-primary border-2 border-primary hover:bg-primary-light transition-all duration-300"
                >
                  Gửi lại email
                </button>
                <Link
                  to="/login"
                  className="block w-full py-3 px-4 text-sm font-bold rounded-2xl text-honey-gold hover:text-primary-hover transition-colors text-center"
                >
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
