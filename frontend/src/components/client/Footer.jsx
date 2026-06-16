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
 * Footer — Vibrant Garden Edition
 * - Trust bar: gradient violet → indigo → blue (premium look)
 * - Main body: white canvas với typography slate-800
 * - Bottom bar: gradient dark slate → indigo (modern dark mode feel)
 * - Newsletter CTA: gradient amber → orange (brand honey-gold identity)
 */
const Footer = () => {
  return (
    <footer className="mt-16">
      {/* ============ TRUST BAR — Vibrant Gradient ============ */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6">
            <TrustItem
              icon={<FaTruck />}
              title="Giao hàng nhanh"
              desc="Toàn quốc từ 2–5 ngày"
              color="text-sky-300"
            />
            <TrustItem
              icon={<FaUndo />}
              title="Đổi trả miễn phí"
              desc="Trong 7 ngày đầu tiên"
              color="text-emerald-300"
            />
            <TrustItem
              icon={<FaHeadset />}
              title="Hỗ trợ 24/7"
              desc="Luôn sẵn sàng phục vụ"
              color="text-amber-300"
            />
            <TrustItem
              icon={<FaShieldAlt />}
              title="Thanh toán an toàn"
              desc="Bảo mật tuyệt đối"
              color="text-rose-300"
            />
          </div>
        </div>
      </div>

      {/* ============ MAIN FOOTER — White Canvas ============ */}
      <div className="bg-white border-t border-slate-100">
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
              <p className="text-sm leading-relaxed text-slate-500">
                BookBee.com — Nhà sách trực tuyến hàng đầu. Nơi hội tụ những
                cuốn sách hay nhất để nuôi dưỡng tâm hồn và trí tuệ của bạn.
              </p>

              {/* Social Icons */}
              <div className="flex gap-2.5 pt-1">
                <SocialIcon
                  icon={<FaFacebookF size={14} />}
                  link="https://www.facebook.com/kieugiathinh"
                  gradient="from-blue-500 to-indigo-500"
                />
                <SocialIcon
                  icon={<FaInstagram size={14} />}
                  link="https://www.instagram.com/giathinh_1301?igsh=c2ZhOXJ0eGdidzIy"
                  gradient="from-rose-500 to-pink-500"
                />
                <SocialIcon
                  icon={<FaYoutube size={14} />}
                  link="#"
                  gradient="from-red-500 to-rose-500"
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
              <h3 className="text-slate-800 text-sm font-bold mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full inline-block"></span>
                Dịch vụ
              </h3>
              <ul className="space-y-3 text-sm">
                <FooterLink to="/shipping" text="Điều khoản sử dụng" />
                <FooterLink to="/shipping" text="Chính sách bảo mật" />
                <FooterLink to="/returns" text="Chính sách đổi trả & hoàn tiền" />
                <FooterLink to="/shipping" text="Chính sách vận chuyển" />
                <FooterLink to="/faq" text="Hệ thống cửa hàng" />
              </ul>
            </div>

            {/* CỘT 3: HỖ TRỢ */}
            <div>
              <h3 className="text-slate-800 text-sm font-bold mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full inline-block"></span>
                Hỗ trợ
              </h3>
              <ul className="space-y-3 text-sm">
                <FooterLink to="/about" text="Giới thiệu BookBee" />
                <FooterLink to="/faq" text="Câu hỏi thường gặp" />
                <FooterLink to="/contact" text="Liên hệ hợp tác" />
                <FooterLink to="/blog" text="Tin tức & Blog" />
                <FooterLink to="/products" text="Danh mục sản phẩm" />
              </ul>
            </div>

            {/* CỘT 4: LIÊN HỆ + NEWSLETTER */}
            <div>
              <h3 className="text-slate-800 text-sm font-bold mb-5 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full inline-block"></span>
                Liên hệ
              </h3>
              <ul className="space-y-3 text-sm text-slate-500 mb-6">
                <li className="flex items-start gap-3">
                  <FaMapMarkerAlt className="text-amber-500 mt-0.5 flex-shrink-0" size={14} />
                  <span>Long Hòa, Châu Thành, Vĩnh Long</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaPhoneAlt className="text-amber-500 flex-shrink-0" size={13} />
                  <span>0339 601 263</span>
                </li>
                <li className="flex items-center gap-3">
                  <FaEnvelope className="text-amber-500 flex-shrink-0" size={13} />
                  <span>bookbee.store@gmail.com</span>
                </li>
              </ul>

              {/* Newsletter */}
              <div>
                <p className="text-xs text-slate-500 mb-2.5 font-medium">
                  📬 Đăng ký nhận tin khuyến mãi
                </p>
                <div className="flex gap-1">
                  <input
                    type="email"
                    placeholder="Nhập email của bạn..."
                    className="flex-1 px-3 py-2.5 text-sm text-slate-700 bg-slate-50
                               border border-slate-200 rounded-xl
                               focus:outline-none focus:border-primary-light
                               focus:ring-1 focus:ring-primary-light/50 transition-all"
                  />
                  <button
                    className="bg-primary hover:bg-primary-hover
                               text-white px-4 py-2.5 rounded-xl
                               transition-all shadow-sm shadow-primary-light
                               hover:shadow-md"
                  >
                    <FaPaperPlane size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ BOTTOM BAR — Dark Gradient ============ */}
      <div className="bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} BookBee.com — Đồ án tốt nghiệp Kiểu Gia Thịnh. All rights reserved.
            </p>

            {/* Payment methods */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 mr-1">Thanh toán:</span>
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ---- SUB-COMPONENTS ----

const TrustItem = ({ icon, title, desc, color }) => (
  <div className="flex items-center gap-3 text-white">
    <div className={`text-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm font-semibold leading-tight">{title}</p>
      <p className="text-xs text-white/65">{desc}</p>
    </div>
  </div>
);

const FooterLink = ({ to, text }) => (
  <li>
    <Link
      to={to}
      className="text-slate-500 hover:text-primary hover:translate-x-1 transition-all duration-200 inline-block"
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

const PaymentIcon = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    className="h-7 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity
               filter brightness-0 invert"
  />
);

export default Footer;
