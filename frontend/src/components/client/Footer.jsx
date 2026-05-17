import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaPaperPlane,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import BookBeeLogo from "../shared/BookBeeLogo";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- MAIN FOOTER CONTENT --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* CỘT 1: THÔNG TIN THƯƠNG HIỆU */}
          <div className="space-y-4">
            {/* Logo Text hoặc Image */}
            <Link to="/">
              <BookBeeLogo className="h-10" />
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Nơi hội tụ những cuốn sách hay nhất để nuôi dưỡng tâm hồn và trí
              tuệ của bạn. "Let's make your mind flourish with our books."
            </p>

            {/* Social Icons */}
            <div className="flex space-x-4 pt-2">
              <SocialIcon
                icon={<FaFacebookF />}
                link="https://www.facebook.com/kieugiathinh"
              />
              <SocialIcon
                icon={<FaInstagram />}
                link="https://www.instagram.com/giathinh_1301?igsh=c2ZhOXJ0eGdidzIy"
              />
              <SocialIcon icon={<FaTwitter />} link="#" />
              <SocialIcon icon={<FaLinkedinIn />} link="#" />
            </div>
          </div>

          {/* CỘT 2: LIÊN KẾT NHANH */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4 border-b-2 border-primary inline-block pb-1">
              KHÁM PHÁ
            </h3>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/" text="Trang chủ" />
              <FooterLink to="/products" text="Sản phẩm" />
              <FooterLink to="/about" text="Về chúng tôi" />
              <FooterLink to="/blog" text="Tin tức & Blog" />
              <FooterLink to="/contact" text="Liên hệ" />
            </ul>
          </div>

          {/* CỘT 3: CHÍNH SÁCH & HỖ TRỢ (Thêm cho chuyên nghiệp) */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4 border-b-2 border-primary inline-block pb-1">
              HỖ TRỢ KHÁCH HÀNG
            </h3>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/faq" text="Câu hỏi thường gặp" />
              <FooterLink to="/shipping" text="Chính sách vận chuyển" />
              <FooterLink to="/returns" text="Chính sách đổi trả" />
              <FooterLink to="/privacy" text="Bảo mật thông tin" />
              <FooterLink to="/terms" text="Điều khoản dịch vụ" />
            </ul>
          </div>

          {/* CỘT 4: LIÊN HỆ & NEWSLETTER */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4 border-b-2 border-primary inline-block pb-1">
              LIÊN HỆ
            </h3>
            <ul className="space-y-4 text-sm mb-6">
              <li className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                <span>Long Hòa, Châu Thành, Vĩnh Long</span>
              </li>
              <li className="flex items-center space-x-3">
                <FaPhoneAlt className="text-primary flex-shrink-0" />
                <span>0339 601 263</span>
              </li>
              <li className="flex items-center space-x-3">
                <FaEnvelope className="text-primary flex-shrink-0" />
                <span>bookstore@gmail.com</span>
              </li>
            </ul>

            {/* Newsletter Input */}
            <div>
              <h4 className="text-white font-semibold mb-2 text-sm">
                Đăng ký nhận tin
              </h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="w-full px-3 py-2 text-gray-900 rounded-l-md focus:outline-none text-sm"
                />
                <button className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-hover transition">
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM FOOTER --- */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} BookBee.com. All rights
            reserved.
          </p>

          {/* Payment Icons (Giả lập) */}
          <div className="flex space-x-4 mt-4 md:mt-0">
            <img
              src="https://cdn-icons-png.flaticon.com/512/196/196578.png"
              alt="Visa"
              className="h-8 opacity-70 hover:opacity-100 transition"
            />
            <img
              src="https://cdn-icons-png.flaticon.com/512/196/196566.png"
              alt="Paypal"
              className="h-8 opacity-70 hover:opacity-100 transition"
            />
            <img
              src="https://cdn-icons-png.flaticon.com/512/196/196565.png"
              alt="Mastercard"
              className="h-8 opacity-70 hover:opacity-100 transition"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

// Component con cho Link để code gọn hơn
const FooterLink = ({ to, text }) => (
  <li>
    <Link
      to={to}
      className="hover:text-primary hover:translate-x-1 transition-all duration-300 inline-block"
    >
      {text}
    </Link>
  </li>
);

// Component con cho Social Icon
const SocialIcon = ({ icon, link }) => (
  <a
    href={link}
    className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all duration-300"
  >
    {icon}
  </a>
);

export default Footer;

