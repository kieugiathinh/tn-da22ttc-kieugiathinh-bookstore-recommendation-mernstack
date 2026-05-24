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

/**
 * Footer chuyên nghiệp theo phong cách Fahasa.com
 * - Nền trắng sạch sẽ, không bị lỗi logo nền trắng trên dark bg
 * - Có dải cam kết phía trên (Vận chuyển, Đổi trả, Hỗ trợ, Bảo mật)
 * - 4 cột rõ ràng: Thương hiệu | Hỗ trợ | Tài khoản | Liên hệ
 * - Bottom bar với payment icons và copyright
 */
const Footer = () => {
  return (
    <footer className="mt-10">
      {/* ============ TRUST BAR — Dải cam kết (Fahasa style) ============ */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-5">
            <TrustItem
              icon={<FaTruck />}
              title="Giao hàng nhanh"
              desc="Toàn quốc từ 2–5 ngày"
            />
            <TrustItem
              icon={<FaUndo />}
              title="Đổi trả miễn phí"
              desc="Trong 7 ngày đầu tiên"
            />
            <TrustItem
              icon={<FaHeadset />}
              title="Hỗ trợ 24/7"
              desc="Luôn sẵn sàng phục vụ"
            />
            <TrustItem
              icon={<FaShieldAlt />}
              title="Thanh toán an toàn"
              desc="Bảo mật tuyệt đối"
            />
          </div>
        </div>
      </div>

      {/* ============ MAIN FOOTER — Nền trắng (Fahasa style) ============ */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* CỘT 1: THÔNG TIN THƯƠNG HIỆU */}
            <div className="space-y-4">
              {/* Logo — Nền trắng nên hiển thị hoàn hảo */}
              <Link to="/" className="inline-block">
                <img
                  src="/logobookbee.jpg"
                  alt="BookBee Logo"
                  className="h-12 object-contain"
                />
              </Link>
              <p className="text-sm leading-relaxed text-gray-500">
                BookBee.com — Nhà sách trực tuyến hàng đầu. Nơi hội tụ những
                cuốn sách hay nhất để nuôi dưỡng tâm hồn và trí tuệ của bạn.
              </p>

              {/* Social Icons */}
              <div className="flex space-x-3 pt-2">
                <SocialIcon
                  icon={<FaFacebookF size={14} />}
                  link="https://www.facebook.com/kieugiathinh"
                />
                <SocialIcon
                  icon={<FaInstagram size={14} />}
                  link="https://www.instagram.com/giathinh_1301?igsh=c2ZhOXJ0eGdidzIy"
                />
                <SocialIcon icon={<FaYoutube size={14} />} link="#" />
                <SocialIcon icon={<FaTwitter size={14} />} link="#" />
              </div>
            </div>

            {/* CỘT 2: DỊCH VỤ */}
            <div>
              <h3 className="text-gray-900 text-sm font-bold mb-4 uppercase tracking-wider">
                Dịch vụ
              </h3>
              <ul className="space-y-2.5 text-sm">
                <FooterLink to="/shipping" text="Điều khoản sử dụng" />
                <FooterLink to="/shipping" text="Chính sách bảo mật" />
                <FooterLink to="/returns" text="Chính sách đổi trả & hoàn tiền" />
                <FooterLink to="/shipping" text="Chính sách vận chuyển" />
                <FooterLink to="/faq" text="Hệ thống cửa hàng" />
              </ul>
            </div>

            {/* CỘT 3: HỖ TRỢ */}
            <div>
              <h3 className="text-gray-900 text-sm font-bold mb-4 uppercase tracking-wider">
                Hỗ trợ
              </h3>
              <ul className="space-y-2.5 text-sm">
                <FooterLink to="/about" text="Giới thiệu BookBee" />
                <FooterLink to="/faq" text="Câu hỏi thường gặp" />
                <FooterLink to="/contact" text="Liên hệ hợp tác" />
                <FooterLink to="/blog" text="Tin tức & Blog" />
                <FooterLink to="/products" text="Danh mục sản phẩm" />
              </ul>
            </div>

            {/* CỘT 4: LIÊN HỆ & NEWSLETTER */}
            <div>
              <h3 className="text-gray-900 text-sm font-bold mb-4 uppercase tracking-wider">
                Liên hệ
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 mb-5">
                <li className="flex items-start space-x-3">
                  <FaMapMarkerAlt className="text-primary mt-0.5 flex-shrink-0" size={14} />
                  <span>Long Hòa, Châu Thành, Vĩnh Long</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaPhoneAlt className="text-primary flex-shrink-0" size={13} />
                  <span>0339 601 263</span>
                </li>
                <li className="flex items-center space-x-3">
                  <FaEnvelope className="text-primary flex-shrink-0" size={13} />
                  <span>bookbee.store@gmail.com</span>
                </li>
              </ul>

              {/* Newsletter */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">
                  Đăng ký nhận tin khuyến mãi
                </p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Nhập email của bạn..."
                    className="flex-1 px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-l-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                  <button className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-hover transition-colors text-sm font-medium">
                    <FaPaperPlane size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ BOTTOM BAR — Copyright + Payment ============ */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} BookBee.com — Đồ án tốt nghiệp
              Kiểu Gia Thịnh. All rights reserved.
            </p>

            {/* Phương thức thanh toán */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 mr-1">Thanh toán:</span>
              <PaymentIcon
                src="https://cdn-icons-png.flaticon.com/512/196/196578.png"
                alt="Visa"
              />
              <PaymentIcon
                src="https://cdn-icons-png.flaticon.com/512/196/196565.png"
                alt="Mastercard"
              />
              <PaymentIcon
                src="https://cdn-icons-png.flaticon.com/512/196/196566.png"
                alt="PayPal"
              />
              {/* <PaymentIcon
                src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                alt="MoMo"
              /> */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ---- SUB-COMPONENTS ----

// Dải cam kết (Trust bar item)
const TrustItem = ({ icon, title, desc }) => (
  <div className="flex items-center gap-3 text-white">
    <div className="text-xl text-honey-gold">{icon}</div>
    <div>
      <p className="text-sm font-semibold leading-tight">{title}</p>
      <p className="text-xs text-white/70">{desc}</p>
    </div>
  </div>
);

// Footer link item
const FooterLink = ({ to, text }) => (
  <li>
    <Link
      to={to}
      className="text-gray-500 hover:text-primary hover:translate-x-0.5 transition-all duration-200 inline-block"
    >
      {text}
    </Link>
  </li>
);

// Social icon button
const SocialIcon = ({ icon, link }) => (
  <a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white transition-all duration-300"
  >
    {icon}
  </a>
);

// Payment method icon
const PaymentIcon = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
  />
);

export default Footer;
