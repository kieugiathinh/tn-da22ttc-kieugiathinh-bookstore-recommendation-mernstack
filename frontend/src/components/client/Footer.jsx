import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaPaperPlane,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaHeadset,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState } from "react";
import { publicRequest } from "../../requestMethods";
import { toast } from "react-toastify";

/**
 * Footer — BookBee Professional Edition v2
 * - Tầng 1: Newsletter Bar (bg-white)
 * - Tầng 2: Trust bar (gradient orange → amber)
 * - Tầng 3: Main body (white canvas)
 * - Tầng 4: Partners Layer (GHN & Stripe on one line with grayscale)
 * - Tầng 5: Bottom bar (dark slate)
 */
const Footer = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Vui lòng nhập email của bạn");
      return;
    }

    try {
      setIsLoading(true);
      const res = await publicRequest.post("/newsletter/subscribe", { email });
      toast.success(res.data.message || "Đăng ký thành công!");
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="mt-10 font-sans border-t border-slate-100">

      {/* ============ TẦNG 1: NEWSLETTER BAR ============ */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Cột trái: Tiêu đề */}
            <div className="flex items-center gap-3 text-white md:w-1/3">
              <FaEnvelope className="text-3xl drop-shadow-sm" />
              <h3 className="text-base font-extrabold uppercase tracking-wider drop-shadow-sm">Đăng ký nhận bản tin</h3>
            </div>

            {/* Cột phải: Form nhập */}
            <form onSubmit={handleSubscribe} className="w-full md:w-2/3 flex bg-white p-1 rounded-2xl shadow-lg border border-orange-200/50">
              <input
                type="email"
                placeholder="Nhập địa chỉ email của bạn..."
                className="flex-1 px-5 py-3 text-sm text-slate-700 bg-transparent focus:outline-none font-medium rounded-l-2xl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm uppercase tracking-wide flex items-center justify-center ${isLoading
                  ? "bg-slate-400 text-white cursor-not-allowed"
                  : "bg-slate-800 hover:bg-slate-900 text-white cursor-pointer hover:shadow-md active:scale-95"
                  }`}
              >
                {isLoading ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ============ TẦNG 2: MAIN CANVAS (Thông tin) ============ */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* CỘT 1: THƯƠNG HIỆU */}
            <div className="space-y-5">
              <Link to="/" className="inline-block">
                <img
                  src="/logobookbee.jpg"
                  alt="BookBee Logo"
                  className="h-12 object-contain"
                />
              </Link>
              <p className="text-sm leading-relaxed text-slate-500 font-medium">
                BookBee.com — Nhà sách trực tuyến hàng đầu. Nơi hội tụ những
                cuốn sách hay nhất để nuôi dưỡng tâm hồn và trí tuệ của bạn.
              </p>

              {/* Social Icons */}
              <div className="flex gap-2.5 pt-1">
                <SocialIcon
                  icon={<FaFacebookF size={14} />}
                  link="https://www.facebook.com/kieugiathinh"
                  gradient="from-blue-500 to-indigo-600"
                />
                <SocialIcon
                  icon={<FaInstagram size={14} />}
                  link="https://www.instagram.com/giathinh_1301?igsh=c2ZhOXJ0eGdidzIy"
                  gradient="from-rose-500 to-pink-500"
                />
                <SocialIcon
                  icon={<FaYoutube size={14} />}
                  link="#"
                  gradient="from-red-500 to-rose-600"
                />
                <SocialIcon
                  icon={<FaTwitter size={14} />}
                  link="#"
                  gradient="from-sky-400 to-blue-500"
                />
              </div>
            </div>

            {/* CỘT 2: DỊCH VỤ */}
            <div>
              <h3 className="text-slate-800 text-sm font-extrabold mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full inline-block"></span>
                Dịch vụ khách hàng
              </h3>
              <ul className="space-y-3 text-sm font-medium">
                <FooterLink to="/terms" text="Điều khoản sử dụng" />
                <FooterLink to="/privacy" text="Chính sách bảo mật" />
                <FooterLink to="/payment-policy" text="Chính sách bảo mật thanh toán" />
                <FooterLink to="/shipping" text="Chính sách vận chuyển" />
              </ul>
            </div>

            {/* CỘT 3: HỖ TRỢ */}
            <div>
              <h3 className="text-slate-800 text-sm font-extrabold mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full inline-block"></span>
                Về chúng tôi
              </h3>
              <ul className="space-y-3 text-sm font-medium">
                <FooterLink to="/about" text="Giới thiệu BookBee" />
                <FooterLink to="/faq" text="Câu hỏi thường gặp" />
                <FooterLink to="/contact" text="Liên hệ với chúng tôi" />
                <FooterLink to="/products" text="Danh mục sản phẩm" />
              </ul>
            </div>

            {/* CỘT 4: LIÊN HỆ */}
            <div>
              <h3 className="text-slate-800 text-sm font-extrabold mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full inline-block"></span>
                Liên hệ
              </h3>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-orange-500 mt-0.5 flex-shrink-0" size={16} />
                  <span className="leading-relaxed">Long Hòa, Châu Thành, Vĩnh Long</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaPhoneAlt className="text-orange-500 flex-shrink-0" size={15} />
                  <span>0339 601 263</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaEnvelope className="text-orange-500 flex-shrink-0" size={15} />
                  <span>bookbee.store@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ============ TẦNG 4: ĐỐI TÁC (Partners) ============ */}
      <div className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Đơn Vị Vận Chuyển */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Đơn vị vận chuyển
              </span>
              <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-orange-300 transition-colors cursor-pointer group">
                <img
                  src="https://cdn.hstatic.net/themes/200000472237/1001423864/14/logo.png?v=2874"
                  alt="Giao Hàng Nhanh"
                  className="h-6 object-contain transition-all duration-300"
                />
              </div>
            </div>

            {/* Thanh Toán */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                Thanh toán an toàn
              </span>
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
                  <img
                    src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png"
                    alt="VNPay"
                    className="h-5 object-contain"
                  />
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                    alt="Stripe"
                    className="h-5 object-contain"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ============ TẦNG 5: BOTTOM BAR (Copyright) ============ */}
      <div className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} BookBee.com — Đồ án tốt nghiệp Kiểu Gia Thịnh. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ---- SUB-COMPONENTS ----

const TrustItem = ({ icon, title, desc }) => (
  <div className="flex items-center gap-3 text-white">
    <div className="text-3xl text-white/90 drop-shadow-sm">{icon}</div>
    <div>
      <p className="text-sm font-extrabold leading-tight tracking-wide">{title}</p>
      <p className="text-xs text-white/80 font-medium">{desc}</p>
    </div>
  </div>
);

const FooterLink = ({ to, text }) => (
  <li>
    <Link
      to={to}
      className="text-slate-500 hover:text-orange-500 hover:translate-x-1 transition-all duration-200 inline-block"
    >
      {text}
    </Link>
  </li>
);

const SocialIcon = ({ icon, link, gradient }) => (
  <a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className={`w-9 h-9 rounded-full flex items-center justify-center text-white
               bg-gradient-to-br ${gradient}
               shadow-sm hover:shadow-md hover:-translate-y-0.5
               transition-all duration-300`}
  >
    {icon}
  </a>
);

export default Footer;
