import React, { useState } from "react";
import {
  FaBalanceScale,
  FaBan,
  FaBookOpen,
  FaBoxOpen,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaCookieBite,
  FaCopyright,
  FaCreditCard,
  FaDatabase,
  FaEnvelope,
  FaExclamationTriangle,
  FaFileContract,
  FaGlobeAsia,
  FaHeadset,
  FaInfoCircle,
  FaLock,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaQuestionCircle,
  FaReceipt,
  FaRegHandshake,
  FaSearch,
  FaShieldAlt,
  FaStore,
  FaTruck,
  FaUndoAlt,
  FaUser,
  FaUserShield,
} from "react-icons/fa";

const LAST_UPDATED = "25/06/2026";

const getPolicyMeta = (title) => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("bảo mật thanh toán")) {
    return {
      icon: FaCreditCard,
      eyebrow: "An toàn giao dịch",
      description:
        "Thông tin về các phương thức thanh toán, nguyên tắc bảo mật và cách BookBee xử lý sự cố giao dịch.",
    };
  }

  if (normalizedTitle.includes("bảo mật")) {
    return {
      icon: FaShieldAlt,
      eyebrow: "Quyền riêng tư của bạn",
      description:
        "Giải thích cách BookBee thu thập, sử dụng, chia sẻ và bảo vệ dữ liệu cá nhân của khách hàng.",
    };
  }

  if (normalizedTitle.includes("câu hỏi")) {
    return {
      icon: FaQuestionCircle,
      eyebrow: "Trung tâm hỗ trợ",
      description:
        "Giải đáp nhanh những thắc mắc thường gặp trong quá trình đặt sách, thanh toán và nhận hàng.",
    };
  }

  if (normalizedTitle.includes("vận chuyển")) {
    return {
      icon: FaTruck,
      eyebrow: "Giao sách tận nơi",
      description:
        "Thông tin về thời gian xử lý, phí giao hàng, theo dõi đơn và trách nhiệm khi nhận hàng qua GHN.",
    };
  }

  if (normalizedTitle.includes("điều khoản")) {
    return {
      icon: FaFileContract,
      eyebrow: "Quy định sử dụng",
      description:
        "Các quyền, nghĩa vụ và nguyên tắc áp dụng khi bạn truy cập, đăng ký tài khoản hoặc mua hàng tại BookBee.",
    };
  }

  return {
    icon: FaBookOpen,
    eyebrow: "Thông tin BookBee",
    description:
      "Các thông tin quan trọng giúp bạn hiểu rõ hơn về dịch vụ và quy trình hoạt động của BookBee.",
  };
};

const PolicyTemplate = ({
  title,
  lastUpdated = LAST_UPDATED,
  navigation = [],
  children,
}) => {
  const meta = getPolicyMeta(title);
  const HeaderIcon = meta.icon;

  return (
    <main className="min-h-screen bg-[#fffaf5] text-slate-700">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="absolute -left-28 top-8 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-200 bg-white text-orange-500 shadow-xl shadow-orange-900/10">
              <HeaderIcon size={34} />
            </div>

            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.24em] text-orange-500">
              {meta.eyebrow}
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {meta.description}
            </p>

            {lastUpdated && (
              <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                <FaClock className="text-orange-500" />
                <span>Cập nhật lần cuối:</span>
                <span className="font-extrabold text-slate-800">
                  {lastUpdated}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:self-start">
          <div className="space-y-5 lg:sticky lg:top-24">
            {navigation.length > 0 && (
              <nav className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
                <p className="mb-4 flex items-center gap-2 font-extrabold text-slate-900">
                  <FaBookOpen className="text-orange-500" />
                  Nội dung chính
                </p>

                <div className="space-y-1.5">
                  {navigation.map((item, index) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-500 transition group-hover:bg-orange-500 group-hover:text-white">
                        {index + 1}
                      </span>
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              </nav>
            )}

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-900/10">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500">
                <FaHeadset size={20} />
              </div>

              <h2 className="text-lg font-extrabold">Bạn cần hỗ trợ?</h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Hãy gửi yêu cầu qua trang Liên hệ. BookBee sẽ kiểm tra thông
                tin đơn hàng và phản hồi trong thời gian sớm nhất.
              </p>

              <a
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-slate-900 transition hover:bg-orange-50 hover:text-orange-600"
              >
                <FaEnvelope />
                Liên hệ BookBee
              </a>
            </div>
          </div>
        </aside>

        <article className="min-w-0 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 md:p-10">
          {children}
        </article>
      </section>

      {/* Footer note */}
      <section className="border-t border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-sm font-medium text-slate-500 sm:px-6 md:flex-row md:text-left lg:px-8">
          <div className="flex items-center gap-2">
            <FaRegHandshake className="text-orange-500" size={18} />
            <span>BookBee.com – Lấy trải nghiệm khách hàng làm trung tâm</span>
          </div>

          <a
            href="/contact"
            className="font-bold text-orange-600 transition hover:text-orange-700"
          >
            Gửi phản hồi về chính sách
          </a>
        </div>
      </section>
    </main>
  );
};

const PolicyIntro = ({ children }) => (
  <div className="mb-10 rounded-2xl border border-orange-100 bg-orange-50/70 p-5 text-base leading-7 text-slate-700 sm:p-6">
    {children}
  </div>
);

const PolicySection = ({ id, number, title, icon: Icon, children }) => (
  <section id={id} className="scroll-mt-28 border-b border-slate-100 py-9 first:pt-0 last:border-b-0 last:pb-0">
    <div className="mb-5 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
        {Icon ? <Icon size={20} /> : <span className="font-black">{number}</span>}
      </div>

      <div>
        {number && (
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.2em] text-orange-500">
            Mục {number}
          </p>
        )}
        <h2 className="text-xl font-black leading-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
      </div>
    </div>

    <div className="space-y-4 text-[15px] leading-7 text-slate-600 sm:text-base">
      {children}
    </div>
  </section>
);

const PolicyList = ({ items }) => (
  <ul className="space-y-3">
    {items.map((item, index) => (
      <li key={`${index}-${item}`} className="flex items-start gap-3">
        <FaCheckCircle className="mt-1.5 shrink-0 text-orange-500" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const Notice = ({ type = "info", title, children }) => {
  const styles = {
    info: {
      wrapper: "border-blue-100 bg-blue-50 text-blue-950",
      icon: "text-blue-500",
      Icon: FaInfoCircle,
    },
    warning: {
      wrapper: "border-amber-200 bg-amber-50 text-amber-950",
      icon: "text-amber-500",
      Icon: FaExclamationTriangle,
    },
    success: {
      wrapper: "border-emerald-100 bg-emerald-50 text-emerald-950",
      icon: "text-emerald-500",
      Icon: FaCheckCircle,
    },
  };

  const selectedStyle = styles[type] || styles.info;
  const Icon = selectedStyle.Icon;

  return (
    <div className={`rounded-2xl border p-5 ${selectedStyle.wrapper}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-1 shrink-0 ${selectedStyle.icon}`} />
        <div>
          {title && <p className="mb-1 font-extrabold">{title}</p>}
          <div className="text-sm leading-6 opacity-90">{children}</div>
        </div>
      </div>
    </div>
  );
};

const FAQItem = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-orange-200">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-extrabold leading-6 text-slate-900">
          {question}
        </span>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
          <FaChevronDown
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 px-5 py-4 text-sm leading-7 text-slate-600 sm:text-base">
          {children}
        </div>
      )}
    </div>
  );
};

const PaymentMethodCard = ({ icon: Icon, title, badge, children }) => (
  <div className="rounded-2xl border border-slate-200 p-5 transition hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5">
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
        <Icon size={20} />
      </div>

      {badge && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">
          {badge}
        </span>
      )}
    </div>

    <h3 className="font-black text-slate-900">{title}</h3>
    <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
  </div>
);

// =========================================================
// 1. CÂU HỎI THƯỜNG GẶP
// =========================================================

const faqNavigation = [
  { id: "faq-order", label: "Đặt hàng và chỉnh sửa đơn" },
  { id: "faq-shipping", label: "Vận chuyển và nhận hàng" },
  { id: "faq-payment", label: "Thanh toán" },
  { id: "faq-product", label: "Sản phẩm và khiếu nại" },
  { id: "faq-account", label: "Tài khoản và hỗ trợ" },
];

export const FAQ = () => (
  <PolicyTemplate title="Câu hỏi thường gặp" navigation={faqNavigation}>
    <PolicyIntro>
      Dưới đây là những câu hỏi phổ biến khi mua sách tại{" "}
      <strong className="font-extrabold text-slate-900">BookBee.com</strong>.
      Nội dung này giúp bạn xử lý nhanh các tình huống thường gặp trước khi
      gửi yêu cầu hỗ trợ.
    </PolicyIntro>

    <PolicySection
      id="faq-order"
      number="01"
      title="Đặt hàng và chỉnh sửa đơn"
      icon={FaReceipt}
    >
      <div className="space-y-3">
        <FAQItem question="Tôi có thể mua hàng mà không cần đăng ký tài khoản không?">
          Bạn có thể đặt hàng theo quy trình mà hệ thống BookBee đang hỗ trợ.
          Tuy nhiên, tài khoản thành viên giúp bạn theo dõi trạng thái đơn,
          lưu địa chỉ giao hàng và xem lại lịch sử mua sách thuận tiện hơn.
        </FAQItem>

        <FAQItem question="Tôi có thể hủy đơn hàng không?">
          Bạn có thể yêu cầu hủy khi đơn chưa được bàn giao cho Giao Hàng Nhanh
          (GHN). Hãy kiểm tra mục quản lý đơn hàng hoặc liên hệ BookBee sớm
          nhất. Khi kiện hàng đã được GHN tiếp nhận, khả năng hủy hoặc thay đổi
          sẽ phụ thuộc vào trạng thái vận chuyển thực tế.
        </FAQItem>

        <FAQItem question="Tôi nhập sai số điện thoại hoặc địa chỉ giao hàng thì phải làm gì?">
          Hãy liên hệ BookBee ngay khi phát hiện sai thông tin. Nếu đơn chưa bàn
          giao cho GHN, BookBee sẽ cố gắng cập nhật. Nếu đơn đã vận chuyển, việc
          thay đổi địa chỉ có thể làm phát sinh thời gian hoặc chi phí giao lại.
        </FAQItem>

        <FAQItem question="Vì sao đơn hàng của tôi có thể bị hủy?">
          Đơn có thể bị hủy khi sản phẩm hết hàng, thông tin giao nhận không hợp
          lệ, không thể liên hệ xác nhận, có lỗi hiển thị giá rõ ràng hoặc hệ
          thống phát hiện dấu hiệu gian lận. BookBee sẽ thông báo và xử lý hoàn
          tiền nếu đơn đã thanh toán trước.
        </FAQItem>
      </div>
    </PolicySection>

    <PolicySection
      id="faq-shipping"
      number="02"
      title="Vận chuyển và nhận hàng"
      icon={FaTruck}
    >
      <div className="space-y-3">
        <FAQItem question="BookBee sử dụng đơn vị vận chuyển nào?">
          BookBee hiện sử dụng duy nhất{" "}
          <strong className="font-extrabold text-slate-800">
            Giao Hàng Nhanh (GHN)
          </strong>{" "}
          để giao đơn đến khách hàng.
        </FAQItem>

        <FAQItem question="Thời gian giao hàng dự kiến là bao lâu?">
          Sau khi đơn được xác nhận và đóng gói, thời gian giao dự kiến thường
          khoảng 1–3 ngày làm việc đối với khu vực nội thành hoặc thành phố lớn,
          và khoảng 3–7 ngày làm việc đối với các tỉnh, huyện xa. Đây là thời
          gian tham khảo và có thể thay đổi theo địa chỉ, thời tiết, ngày lễ
          hoặc tình trạng khai thác của GHN.
        </FAQItem>

        <FAQItem question="Tôi theo dõi đơn hàng bằng cách nào?">
          Bạn có thể theo dõi trong mục quản lý đơn hàng trên BookBee. Khi GHN
          đã tiếp nhận kiện hàng, hệ thống có thể hiển thị mã vận đơn và trạng
          thái vận chuyển tương ứng.
        </FAQItem>

        <FAQItem question="Tôi nên làm gì khi không nhận được cuộc gọi giao hàng?">
          Hãy kiểm tra cuộc gọi nhỡ và chủ động liên hệ lại theo thông tin của
          nhân viên giao hàng nếu có. GHN có thể thực hiện giao lại theo quy
          trình của đơn vị vận chuyển. Đơn giao không thành công nhiều lần có
          thể được hoàn về BookBee.
        </FAQItem>
      </div>
    </PolicySection>

    <PolicySection
      id="faq-payment"
      number="03"
      title="Thanh toán"
      icon={FaCreditCard}
    >
      <div className="space-y-3">
        <FAQItem question="BookBee hỗ trợ những phương thức thanh toán nào?">
          BookBee hỗ trợ ba phương thức: thanh toán khi nhận hàng (COD), thanh
          toán trực tuyến qua VNPay và thanh toán thẻ quốc tế qua Stripe.
        </FAQItem>

        <FAQItem question="Thanh toán COD được thực hiện như thế nào?">
          Bạn thanh toán số tiền được hiển thị trên đơn cho nhân viên giao hàng
          của GHN khi nhận kiện. Hãy kiểm tra đúng mã đơn và số tiền trước khi
          thanh toán.
        </FAQItem>

        <FAQItem question="Tôi đã bị trừ tiền nhưng đơn chưa ghi nhận thanh toán thì phải làm gì?">
          Không thực hiện thanh toán lặp lại ngay. Hãy lưu mã giao dịch, thời
          gian thanh toán và ảnh chụp trạng thái, sau đó gửi cho BookBee qua
          trang Liên hệ để đối soát với VNPay hoặc Stripe.
        </FAQItem>

        <FAQItem question="BookBee có yêu cầu cung cấp mã OTP hoặc mã CVV qua tin nhắn không?">
          Không. BookBee không yêu cầu bạn gửi mật khẩu, mã OTP, mã PIN hoặc mã
          CVV qua điện thoại, email, mạng xã hội hay biểu mẫu hỗ trợ. Chỉ nhập
          thông tin bảo mật trong luồng thanh toán chính thức của VNPay hoặc
          Stripe.
        </FAQItem>
      </div>
    </PolicySection>

    <PolicySection
      id="faq-product"
      number="04"
      title="Sản phẩm và khiếu nại"
      icon={FaBoxOpen}
    >
      <div className="space-y-3">
        <FAQItem question="Tôi nhận sai sách, thiếu sách hoặc sách bị hư hỏng thì xử lý thế nào?">
          Hãy giữ nguyên sản phẩm, bao bì, tem vận chuyển và liên hệ BookBee
          ngay sau khi nhận hàng, ưu tiên trong vòng 48 giờ. Bạn nên cung cấp
          mã đơn, ảnh hoặc video mở kiện để BookBee kiểm tra và đề xuất phương
          án đổi, bổ sung hoặc hoàn tiền phù hợp.
        </FAQItem>

        <FAQItem question="Màu sắc hoặc hình ảnh bìa sách có thể khác trên website không?">
          Hình ảnh có thể chênh lệch nhẹ do thiết bị hiển thị hoặc do nhà xuất
          bản thay đổi thiết kế giữa các lần tái bản. BookBee sẽ cố gắng mô tả
          rõ phiên bản, nhà xuất bản và thông tin nhận diện của sản phẩm.
        </FAQItem>

        <FAQItem question="Tôi có thể đổi sách vì không còn nhu cầu không?">
          Khả năng đổi hoặc trả phụ thuộc vào tình trạng sản phẩm, lý do yêu cầu
          và chính sách đang áp dụng tại thời điểm mua. Sách đã có dấu hiệu sử
          dụng, viết, gấp, rách, bẩn hoặc mất phụ kiện có thể không đủ điều kiện
          tiếp nhận.
        </FAQItem>
      </div>
    </PolicySection>

    <PolicySection
      id="faq-account"
      number="05"
      title="Tài khoản và hỗ trợ"
      icon={FaUser}
    >
      <div className="space-y-3">
        <FAQItem question="Tôi quên mật khẩu thì làm thế nào?">
          Sử dụng chức năng “Quên mật khẩu” tại trang đăng nhập và làm theo
          hướng dẫn gửi đến email của bạn. Không chia sẻ đường dẫn đặt lại mật
          khẩu hoặc mã xác minh cho người khác.
        </FAQItem>

        <FAQItem question="Làm sao để yêu cầu chỉnh sửa hoặc xóa thông tin cá nhân?">
          Bạn có thể cập nhật một số dữ liệu trong trang tài khoản. Với các yêu
          cầu khác, hãy gửi thông tin qua trang Liên hệ. BookBee có thể cần xác
          minh danh tính trước khi xử lý để tránh thay đổi trái phép.
        </FAQItem>

        <FAQItem question="Tôi có thể liên hệ BookBee ở đâu?">
          Truy cập trang Liên hệ và cung cấp mã đơn hàng, nội dung cần hỗ trợ
          cùng tài liệu liên quan. Không gửi mật khẩu, OTP, CVV hoặc toàn bộ số
          thẻ trong yêu cầu hỗ trợ.
        </FAQItem>
      </div>
    </PolicySection>
  </PolicyTemplate>
);

// =========================================================
// 2. CHÍNH SÁCH VẬN CHUYỂN
// =========================================================

const shippingNavigation = [
  { id: "shipping-scope", label: "Phạm vi và đối tác vận chuyển" },
  { id: "shipping-processing", label: "Xác nhận và xử lý đơn" },
  { id: "shipping-time", label: "Thời gian giao dự kiến" },
  { id: "shipping-fee", label: "Phí vận chuyển" },
  { id: "shipping-tracking", label: "Theo dõi và thay đổi thông tin" },
  { id: "shipping-receive", label: "Nhận và kiểm tra kiện hàng" },
  { id: "shipping-failed", label: "Giao hàng không thành công" },
  { id: "shipping-delay", label: "Chậm trễ và trường hợp ngoài kiểm soát" },
];

export const ShippingPolicy = () => (
  <PolicyTemplate
    title="Chính sách vận chuyển"
    navigation={shippingNavigation}
  >
    <PolicyIntro>
      BookBee hợp tác duy nhất với{" "}
      <strong className="font-extrabold text-slate-900">
        Giao Hàng Nhanh (GHN)
      </strong>{" "}
      để vận chuyển đơn hàng. Chính sách dưới đây áp dụng cho các đơn sách đặt
      thành công trên BookBee.com.
    </PolicyIntro>

    <PolicySection
      id="shipping-scope"
      number="01"
      title="Phạm vi và đối tác vận chuyển"
      icon={FaGlobeAsia}
    >
      <p>
        BookBee giao hàng đến các địa chỉ nằm trong khu vực GHN đang hỗ trợ.
        Khả năng giao hàng được kiểm tra dựa trên tỉnh, thành phố, quận, huyện,
        phường, xã và địa chỉ cụ thể do khách hàng cung cấp.
      </p>

      <PolicyList
        items={[
          "Đơn vị vận chuyển duy nhất hiện tại: Giao Hàng Nhanh (GHN).",
          "Không áp dụng nhận hàng trực tiếp tại kho nếu BookBee chưa xác nhận riêng.",
          "Một số khu vực xa, hải đảo hoặc khu vực hạn chế khai thác có thể chưa được hỗ trợ hoặc cần thêm thời gian giao.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="shipping-processing"
      number="02"
      title="Xác nhận và xử lý đơn hàng"
      icon={FaBoxOpen}
    >
      <p>
        Sau khi bạn đặt hàng, BookBee kiểm tra thông tin người nhận, tình trạng
        sản phẩm và phương thức thanh toán trước khi đóng gói. Thời gian xử lý
        thông thường là 1–2 ngày làm việc, không bao gồm ngày nghỉ, ngày lễ hoặc
        thời gian phát sinh khi cần xác minh đơn.
      </p>

      <Notice type="info" title="Đơn thanh toán trực tuyến">
        Đơn qua VNPay hoặc Stripe chỉ được chuyển sang bước xử lý sau khi hệ
        thống nhận được trạng thái thanh toán phù hợp. Trường hợp trạng thái
        chưa đồng bộ, BookBee có thể cần đối soát trước khi bàn giao cho GHN.
      </Notice>
    </PolicySection>

    <PolicySection
      id="shipping-time"
      number="03"
      title="Thời gian giao hàng dự kiến"
      icon={FaClock}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
          <p className="font-black text-slate-900">Nội thành, thành phố lớn</p>
          <p className="mt-2 text-2xl font-black text-orange-600">
            1–3 ngày làm việc
          </p>
          <p className="mt-2 text-sm leading-6">
            Tính từ khi GHN tiếp nhận kiện hàng.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="font-black text-slate-900">Tỉnh, huyện và khu vực xa</p>
          <p className="mt-2 text-2xl font-black text-slate-800">
            3–7 ngày làm việc
          </p>
          <p className="mt-2 text-sm leading-6">
            Có thể lâu hơn tùy địa chỉ và năng lực khai thác của GHN.
          </p>
        </div>
      </div>

      <p>
        Thời gian trên là dự kiến, không phải cam kết giao hàng tuyệt đối. Thời
        gian thực tế có thể thay đổi do lượng đơn tăng cao, thời tiết, thiên
        tai, sự kiện bất khả kháng, ngày lễ hoặc việc liên hệ người nhận không
        thành công.
      </p>
    </PolicySection>

    <PolicySection
      id="shipping-fee"
      number="04"
      title="Phí vận chuyển và ưu đãi giao hàng"
      icon={FaMoneyBillWave}
    >
      <p>
        Phí vận chuyển được hệ thống tính dựa trên địa chỉ nhận hàng, khối
        lượng, kích thước kiện và biểu phí được áp dụng tại thời điểm đặt hàng.
        Số tiền cụ thể được hiển thị ở bước xác nhận đơn trước khi bạn thanh
        toán.
      </p>

      <PolicyList
        items={[
          "BookBee không tự ý thu thêm phí vận chuyển ngoài số tiền đã hiển thị, trừ khi có thay đổi đơn hàng được hai bên xác nhận.",
          "Chương trình miễn hoặc giảm phí vận chuyển, nếu có, sẽ kèm điều kiện và thời gian áp dụng cụ thể.",
          "Phí giao lại hoặc chuyển đổi địa chỉ có thể phát sinh nếu khách hàng cung cấp sai thông tin hoặc yêu cầu thay đổi sau khi đơn đã bàn giao cho GHN.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="shipping-tracking"
      number="05"
      title="Theo dõi đơn và thay đổi thông tin giao nhận"
      icon={FaSearch}
    >
      <p>
        Khi GHN tiếp nhận kiện, mã vận đơn và trạng thái giao hàng có thể được
        cập nhật tại trang quản lý đơn hàng. Trạng thái hiển thị phụ thuộc vào
        dữ liệu đồng bộ từ GHN và có thể chậm hơn tình trạng thực tế trong một
        khoảng thời gian ngắn.
      </p>

      <Notice type="warning" title="Cần đổi địa chỉ hoặc số điện thoại?">
        Hãy liên hệ BookBee ngay khi phát hiện sai thông tin. BookBee chỉ có thể
        hỗ trợ trong phạm vi trạng thái đơn cho phép. Việc thay đổi sau khi GHN
        đã tiếp nhận có thể không thực hiện được hoặc làm phát sinh phí.
      </Notice>
    </PolicySection>

    <PolicySection
      id="shipping-receive"
      number="06"
      title="Nhận và kiểm tra kiện hàng"
      icon={FaReceipt}
    >
      <PolicyList
        items={[
          "Đối chiếu tên người nhận, mã đơn, số tiền COD và tình trạng bên ngoài của kiện trước khi thanh toán hoặc nhận hàng.",
          "Không nhận kiện có dấu hiệu bị mở, rách nghiêm trọng, ướt hoặc biến dạng nếu bạn nghi ngờ sản phẩm bên trong bị ảnh hưởng; hãy ghi nhận tình trạng với nhân viên GHN.",
          "Khuyến nghị quay video liên tục khi mở kiện, thể hiện rõ tem vận chuyển và tình trạng sản phẩm để hỗ trợ đối chiếu khi có khiếu nại.",
          "Giữ lại hộp, vật liệu đóng gói, hóa đơn hoặc tài liệu đi kèm cho đến khi xác nhận đơn đầy đủ và không có lỗi.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="shipping-failed"
      number="07"
      title="Giao hàng không thành công và hoàn đơn"
      icon={FaUndoAlt}
    >
      <p>
        GHN có thể thực hiện nhiều lần giao theo quy trình vận hành. Đơn có thể
        bị hoàn về BookBee khi không liên hệ được người nhận, địa chỉ không hợp
        lệ, người nhận từ chối nhận, không chuẩn bị đủ tiền COD hoặc hết thời
        gian lưu giao.
      </p>

      <p>
        Khi đơn bị hoàn, BookBee sẽ kiểm tra tình trạng sản phẩm trước khi xử lý
        yêu cầu giao lại hoặc hoàn tiền. Chi phí giao lại có thể do khách hàng
        thanh toán nếu nguyên nhân xuất phát từ thông tin sai, không thể liên hệ
        hoặc từ chối nhận hàng không có lý do hợp lệ.
      </p>
    </PolicySection>

    <PolicySection
      id="shipping-delay"
      number="08"
      title="Chậm trễ và trường hợp ngoài khả năng kiểm soát"
      icon={FaExclamationTriangle}
    >
      <p>
        BookBee phối hợp với GHN để cập nhật tình trạng và hỗ trợ xử lý, nhưng
        không thể bảo đảm thời điểm giao tuyệt đối trong các trường hợp ngoài
        khả năng kiểm soát hợp lý như thiên tai, dịch bệnh, gián đoạn giao
        thông, sự cố hệ thống, yêu cầu của cơ quan nhà nước hoặc khu vực giao
        hàng bị hạn chế.
      </p>

      <Notice type="success" title="BookBee sẽ hỗ trợ như thế nào?">
        Khi nhận được phản ánh, BookBee sẽ kiểm tra mã vận đơn, làm việc với GHN
        và thông báo lại kết quả hoặc phương án tiếp theo cho khách hàng.
      </Notice>
    </PolicySection>
  </PolicyTemplate>
);

// =========================================================
// 3. CHÍNH SÁCH BẢO MẬT
// =========================================================

const privacyNavigation = [
  { id: "privacy-scope", label: "Phạm vi và nguyên tắc" },
  { id: "privacy-data", label: "Dữ liệu được thu thập" },
  { id: "privacy-purpose", label: "Mục đích sử dụng" },
  { id: "privacy-cookie", label: "Cookie và dữ liệu kỹ thuật" },
  { id: "privacy-share", label: "Chia sẻ dữ liệu" },
  { id: "privacy-retention", label: "Thời gian lưu trữ" },
  { id: "privacy-security", label: "Biện pháp bảo vệ" },
  { id: "privacy-rights", label: "Quyền của khách hàng" },
  { id: "privacy-children", label: "Dữ liệu của người chưa thành niên" },
  { id: "privacy-update", label: "Cập nhật và liên hệ" },
];

export const PrivacyPolicy = () => (
  <PolicyTemplate title="Chính sách bảo mật" navigation={privacyNavigation}>
    <PolicyIntro>
      BookBee tôn trọng quyền riêng tư và chỉ xử lý dữ liệu cá nhân trong phạm
      vi cần thiết để cung cấp dịch vụ, vận hành website, giao hàng, thanh toán
      và hỗ trợ khách hàng. Khi sử dụng BookBee.com, bạn nên đọc chính sách này
      cùng Điều khoản sử dụng và Chính sách bảo mật thanh toán.
    </PolicyIntro>

    <PolicySection
      id="privacy-scope"
      number="01"
      title="Phạm vi áp dụng và nguyên tắc xử lý dữ liệu"
      icon={FaUserShield}
    >
      <p>
        Chính sách áp dụng đối với dữ liệu phát sinh khi bạn truy cập website,
        đăng ký tài khoản, đặt hàng, thanh toán, nhận hàng, gửi đánh giá hoặc
        liên hệ hỗ trợ tại BookBee.
      </p>

      <PolicyList
        items={[
          "Thu thập dữ liệu phù hợp với mục đích đã thông báo và hoạt động của dịch vụ.",
          "Hạn chế truy cập dữ liệu cho những cá nhân hoặc bên liên quan cần sử dụng để thực hiện công việc.",
          "Không bán dữ liệu cá nhân của khách hàng cho bên thứ ba.",
          "Cập nhật hoặc xóa dữ liệu khi có yêu cầu hợp lệ, trừ trường hợp BookBee cần tiếp tục lưu theo nghĩa vụ pháp lý hoặc để giải quyết tranh chấp.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="privacy-data"
      number="02"
      title="Những loại dữ liệu BookBee có thể thu thập"
      icon={FaDatabase}
    >
      <PolicyList
        items={[
          "Thông tin nhận diện và liên hệ: họ tên, email, số điện thoại, địa chỉ nhận hàng.",
          "Thông tin tài khoản: tên đăng nhập, mật khẩu đã được xử lý bảo mật, tùy chọn và lịch sử hoạt động tài khoản.",
          "Thông tin đơn hàng: sản phẩm, số lượng, giá trị đơn, mã giảm giá, trạng thái giao hàng và lịch sử mua hàng.",
          "Thông tin giao dịch: phương thức thanh toán, mã giao dịch, thời gian, số tiền và trạng thái thanh toán do VNPay hoặc Stripe phản hồi.",
          "Dữ liệu hỗ trợ: nội dung trao đổi, hình ảnh, video hoặc tài liệu bạn cung cấp khi yêu cầu trợ giúp.",
          "Dữ liệu kỹ thuật: địa chỉ IP, loại thiết bị, trình duyệt, thời gian truy cập, trang đã xem và dữ liệu cookie cần thiết.",
        ]}
      />

      <Notice type="warning" title="Thông tin nhạy cảm không nên gửi">
        Không gửi mật khẩu, mã OTP, mã PIN, mã CVV hoặc toàn bộ thông tin thẻ
        qua biểu mẫu liên hệ, email, điện thoại hay mạng xã hội. BookBee không
        cần các dữ liệu này để hỗ trợ đơn hàng.
      </Notice>
    </PolicySection>

    <PolicySection
      id="privacy-purpose"
      number="03"
      title="Mục đích sử dụng dữ liệu"
      icon={FaStore}
    >
      <PolicyList
        items={[
          "Tạo, xác minh và duy trì tài khoản khách hàng.",
          "Tiếp nhận, xác nhận, đóng gói, thanh toán và giao đơn hàng.",
          "Gửi thông báo liên quan đến đơn, giao dịch, thay đổi dịch vụ hoặc bảo mật tài khoản.",
          "Hỗ trợ đổi trả, khiếu nại, hoàn tiền và xử lý tranh chấp.",
          "Phát hiện hành vi bất thường, giả mạo, gian lận hoặc lạm dụng chương trình ưu đãi.",
          "Phân tích hiệu quả website, cải thiện trải nghiệm và đề xuất sách phù hợp dựa trên hoạt động của người dùng khi được phép.",
          "Gửi nội dung tiếp thị hoặc ưu đãi khi bạn đã đăng ký nhận và cho phép hủy đăng ký bất cứ lúc nào.",
          "Thực hiện nghĩa vụ kế toán, thuế, lưu trữ giao dịch và yêu cầu hợp pháp của cơ quan có thẩm quyền.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="privacy-cookie"
      number="04"
      title="Cookie và dữ liệu kỹ thuật"
      icon={FaCookieBite}
    >
      <p>
        Cookie là tệp dữ liệu nhỏ được lưu trên trình duyệt để duy trì phiên
        đăng nhập, ghi nhớ giỏ hàng, bảo vệ tài khoản và cải thiện trải nghiệm.
        BookBee có thể sử dụng cookie cần thiết, cookie đo lường và cookie cá
        nhân hóa tùy theo cấu hình website.
      </p>

      <p>
        Bạn có thể xóa hoặc chặn cookie trong trình duyệt. Tuy nhiên, một số
        chức năng như đăng nhập, ghi nhớ giỏ hàng hoặc thanh toán có thể hoạt
        động không chính xác nếu cookie cần thiết bị vô hiệu hóa.
      </p>
    </PolicySection>

    <PolicySection
      id="privacy-share"
      number="05"
      title="Các trường hợp BookBee có thể chia sẻ dữ liệu"
      icon={FaRegHandshake}
    >
      <p>
        BookBee chỉ chia sẻ dữ liệu trong phạm vi cần thiết để thực hiện dịch
        vụ hoặc đáp ứng yêu cầu hợp pháp. Các nhóm bên nhận có thể bao gồm:
      </p>

      <PolicyList
        items={[
          "Giao Hàng Nhanh (GHN): nhận họ tên, số điện thoại, địa chỉ, ghi chú giao hàng, số tiền COD và thông tin kiện cần thiết để giao đơn.",
          "VNPay và Stripe: nhận dữ liệu giao dịch cần thiết để xử lý, xác thực, đối soát, hoàn tiền và phòng chống gian lận.",
          "Nhà cung cấp hạ tầng, lưu trữ, email, phân tích, chăm sóc khách hàng hoặc bảo mật được BookBee sử dụng để vận hành hệ thống.",
          "Cơ quan nhà nước, tòa án hoặc bên có thẩm quyền khi BookBee có nghĩa vụ cung cấp theo yêu cầu hợp pháp.",
          "Bên nhận chuyển giao trong trường hợp tổ chức lại, sáp nhập hoặc chuyển nhượng hoạt động, với điều kiện quyền lợi dữ liệu tiếp tục được xem xét bảo vệ.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="privacy-retention"
      number="06"
      title="Thời gian lưu trữ dữ liệu"
      icon={FaClock}
    >
      <p>
        Dữ liệu được lưu trong thời gian cần thiết để duy trì tài khoản, hoàn
        tất đơn hàng, hỗ trợ khách hàng, phòng chống gian lận, thực hiện nghĩa
        vụ kế toán hoặc giải quyết khiếu nại. Thời gian cụ thể phụ thuộc vào
        loại dữ liệu, mục đích xử lý và yêu cầu pháp lý áp dụng.
      </p>

      <p>
        Khi dữ liệu không còn cần thiết, BookBee sẽ xóa, ẩn danh hoặc hạn chế
        truy cập theo quy trình nội bộ, trừ trường hợp cần tiếp tục lưu để bảo
        vệ quyền và lợi ích hợp pháp của các bên.
      </p>
    </PolicySection>

    <PolicySection
      id="privacy-security"
      number="07"
      title="Biện pháp bảo vệ dữ liệu"
      icon={FaLock}
    >
      <PolicyList
        items={[
          "Sử dụng kết nối bảo mật cho các trang và luồng dữ liệu quan trọng.",
          "Áp dụng cơ chế xác thực, phân quyền và giới hạn quyền truy cập theo vai trò.",
          "Theo dõi dấu hiệu đăng nhập hoặc giao dịch bất thường để hạn chế gian lận.",
          "Sao lưu, cập nhật hệ thống và rà soát lỗ hổng trong phạm vi vận hành phù hợp.",
          "Yêu cầu nhân sự và nhà cung cấp liên quan giữ bí mật dữ liệu trong phạm vi trách nhiệm.",
        ]}
      />

      <Notice type="info" title="Không có hệ thống nào an toàn tuyệt đối">
        BookBee thực hiện các biện pháp hợp lý để giảm rủi ro nhưng không thể
        bảo đảm mọi sự cố đều không xảy ra. Khách hàng cần đặt mật khẩu mạnh,
        không dùng chung mật khẩu và đăng xuất khỏi thiết bị công cộng.
      </Notice>
    </PolicySection>

    <PolicySection
      id="privacy-rights"
      number="08"
      title="Quyền và lựa chọn của khách hàng"
      icon={FaUser}
    >
      <p>
        Tùy theo loại dữ liệu và quy định áp dụng, bạn có thể gửi yêu cầu để:
      </p>

      <PolicyList
        items={[
          "Biết hoặc yêu cầu giải thích về dữ liệu BookBee đang xử lý.",
          "Truy cập, cập nhật hoặc chỉnh sửa dữ liệu không chính xác.",
          "Rút lại sự đồng ý đối với hoạt động dựa trên sự đồng ý, với hiệu lực từ thời điểm yêu cầu được xử lý.",
          "Yêu cầu xóa, hạn chế hoặc phản đối một số hoạt động xử lý khi có cơ sở phù hợp.",
          "Hủy đăng ký email hoặc thông báo tiếp thị.",
          "Gửi khiếu nại khi cho rằng dữ liệu bị sử dụng không đúng mục đích đã thông báo.",
        ]}
      />

      <p>
        BookBee có thể yêu cầu xác minh danh tính và thông tin liên quan trước
        khi xử lý. Một số yêu cầu có thể bị giới hạn khi ảnh hưởng đến nghĩa vụ
        pháp lý, quyền của người khác, phòng chống gian lận hoặc giải quyết
        tranh chấp.
      </p>
    </PolicySection>

    <PolicySection
      id="privacy-children"
      number="09"
      title="Dữ liệu của người chưa thành niên"
      icon={FaUserShield}
    >
      <p>
        Người chưa thành niên nên sử dụng BookBee dưới sự hướng dẫn của cha mẹ
        hoặc người giám hộ. Khi việc xử lý dữ liệu cần sự đồng ý hoặc xác nhận
        của người đại diện theo quy định áp dụng, BookBee có thể yêu cầu bổ sung
        thông tin xác minh trước khi cung cấp một số chức năng.
      </p>
    </PolicySection>

    <PolicySection
      id="privacy-update"
      number="10"
      title="Cập nhật chính sách và liên hệ"
      icon={FaEnvelope}
    >
      <p>
        BookBee có thể sửa đổi chính sách để phản ánh thay đổi của dịch vụ,
        công nghệ hoặc yêu cầu pháp lý. Phiên bản mới sẽ được đăng trên website
        và ghi rõ ngày cập nhật. Thay đổi quan trọng có thể được thông báo thêm
        qua tài khoản, email hoặc giao diện website.
      </p>

      <p>
        Để gửi yêu cầu liên quan đến dữ liệu cá nhân, hãy sử dụng trang{" "}
        <a
          href="/contact"
          className="font-extrabold text-orange-600 hover:text-orange-700"
        >
          Liên hệ
        </a>{" "}
        và mô tả rõ nội dung cần xử lý. Không gửi mật khẩu, OTP, CVV hoặc toàn
        bộ thông tin thẻ.
      </p>
    </PolicySection>
  </PolicyTemplate>
);

// =========================================================
// 4. ĐIỀU KHOẢN SỬ DỤNG
// =========================================================

const termsNavigation = [
  { id: "terms-acceptance", label: "Chấp nhận điều khoản" },
  { id: "terms-account", label: "Tài khoản khách hàng" },
  { id: "terms-product", label: "Thông tin sản phẩm" },
  { id: "terms-price", label: "Giá và khuyến mãi" },
  { id: "terms-order", label: "Đặt và xác nhận đơn" },
  { id: "terms-payment", label: "Thanh toán" },
  { id: "terms-shipping", label: "Vận chuyển" },
  { id: "terms-complaint", label: "Đổi trả và khiếu nại" },
  { id: "terms-prohibited", label: "Hành vi bị cấm" },
  { id: "terms-ip", label: "Sở hữu trí tuệ" },
  { id: "terms-review", label: "Đánh giá của người dùng" },
  { id: "terms-liability", label: "Giới hạn trách nhiệm" },
  { id: "terms-change", label: "Thay đổi điều khoản" },
  { id: "terms-dispute", label: "Giải quyết tranh chấp" },
];

export const Terms = () => (
  <PolicyTemplate title="Điều khoản sử dụng" navigation={termsNavigation}>
    <PolicyIntro>
      Chào mừng bạn đến với{" "}
      <strong className="font-extrabold text-slate-900">BookBee.com</strong>.
      Khi truy cập website, đăng ký tài khoản hoặc đặt mua sản phẩm, bạn xác
      nhận đã đọc và đồng ý với Điều khoản sử dụng này cùng các chính sách liên
      quan được công bố trên BookBee.
    </PolicyIntro>

    <PolicySection
      id="terms-acceptance"
      number="01"
      title="Chấp nhận và phạm vi áp dụng"
      icon={FaFileContract}
    >
      <p>
        Điều khoản điều chỉnh việc truy cập, sử dụng tính năng, tạo tài khoản,
        đặt hàng, thanh toán, đánh giá sản phẩm và liên hệ hỗ trợ trên BookBee.
        Nếu không đồng ý với một nội dung, bạn nên ngừng sử dụng phần dịch vụ
        tương ứng.
      </p>

      <p>
        Người thực hiện giao dịch phải có năng lực phù hợp hoặc có sự đồng ý,
        giám sát của người đại diện hợp pháp theo quy định áp dụng.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-account"
      number="02"
      title="Đăng ký và quản lý tài khoản"
      icon={FaUser}
    >
      <PolicyList
        items={[
          "Cung cấp thông tin chính xác, đầy đủ và cập nhật khi có thay đổi.",
          "Tự bảo vệ mật khẩu, mã xác minh và thiết bị đăng nhập của mình.",
          "Thông báo sớm cho BookBee khi nghi ngờ tài khoản bị truy cập trái phép.",
          "Không cho thuê, mua bán, chuyển nhượng tài khoản hoặc sử dụng tài khoản của người khác khi chưa được phép.",
          "Chịu trách nhiệm đối với hoạt động thực hiện từ tài khoản của mình, trừ trường hợp có căn cứ cho thấy lỗi thuộc về hệ thống hoặc bên khác.",
        ]}
      />

      <p>
        BookBee có thể tạm khóa, giới hạn hoặc chấm dứt tài khoản khi phát hiện
        dấu hiệu gian lận, tấn công hệ thống, lạm dụng khuyến mãi, giả mạo thông
        tin hoặc vi phạm điều khoản. Khi phù hợp, BookBee sẽ thông báo lý do và
        hướng xử lý.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-product"
      number="03"
      title="Thông tin và tình trạng sản phẩm"
      icon={FaBookOpen}
    >
      <p>
        BookBee cố gắng hiển thị chính xác tên sách, tác giả, nhà xuất bản,
        phiên bản, kích thước, hình ảnh, giá và tình trạng hàng. Tuy nhiên, thông
        tin có thể thay đổi do nhà xuất bản cập nhật, tái bản hoặc sai sót kỹ
        thuật ngoài ý muốn.
      </p>

      <p>
        Màu sắc bìa trên màn hình có thể khác nhẹ so với sản phẩm thật do thiết
        bị hiển thị. Khi có thay đổi đáng kể ảnh hưởng đến đơn, BookBee sẽ cố
        gắng liên hệ trước khi giao.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-price"
      number="04"
      title="Giá bán, phí và chương trình khuyến mãi"
      icon={FaMoneyBillWave}
    >
      <PolicyList
        items={[
          "Giá bán và khoản giảm giá được hiển thị tại trang sản phẩm hoặc bước xác nhận đơn.",
          "Phí vận chuyển được tính riêng theo địa chỉ, kiện hàng và biểu phí tại thời điểm đặt.",
          "Thuế hoặc khoản phí áp dụng, nếu có, sẽ được thể hiện theo quy trình thanh toán và chứng từ liên quan.",
          "Mã giảm giá có thể giới hạn thời gian, số lượt, nhóm sản phẩm, giá trị đơn hoặc đối tượng sử dụng.",
          "BookBee có quyền từ chối ưu đãi khi phát hiện sử dụng sai điều kiện, tạo nhiều tài khoản hoặc có dấu hiệu gian lận.",
        ]}
      />

      <Notice type="warning" title="Lỗi giá hiển thị rõ ràng">
        Nếu hệ thống hiển thị mức giá bất thường do lỗi kỹ thuật hoặc nhập liệu,
        BookBee có thể liên hệ để xác nhận lại, đề nghị điều chỉnh hoặc hủy đơn.
        Khoản đã thanh toán cho phần bị hủy sẽ được xử lý hoàn theo phương thức
        phù hợp.
      </Notice>
    </PolicySection>

    <PolicySection
      id="terms-order"
      number="05"
      title="Đặt hàng, xác nhận và hủy đơn"
      icon={FaReceipt}
    >
      <p>
        Việc gửi đơn trên website là đề nghị mua hàng của khách hàng. Đơn được
        xem là tiếp nhận khi BookBee xác nhận có thể cung cấp sản phẩm và tiến
        hành xử lý. Email hoặc thông báo tự động ghi nhận yêu cầu chưa nhất thiết
        đồng nghĩa với việc đơn đã được bàn giao cho GHN.
      </p>

      <PolicyList
        items={[
          "BookBee có thể liên hệ để xác minh thông tin, giá trị đơn hoặc yêu cầu thanh toán.",
          "Khách hàng có thể yêu cầu hủy trước khi đơn được bàn giao cho GHN.",
          "BookBee có thể hủy toàn bộ hoặc một phần đơn khi hết hàng, thông tin không hợp lệ, không thể liên hệ, lỗi giá hoặc có dấu hiệu gian lận.",
          "Nếu đơn trả trước bị hủy, BookBee sẽ thực hiện quy trình hoàn tiền sau khi đối soát giao dịch.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="terms-payment"
      number="06"
      title="Phương thức và nghĩa vụ thanh toán"
      icon={FaCreditCard}
    >
      <p>BookBee hiện hỗ trợ đúng ba phương thức thanh toán:</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <PaymentMethodCard
          icon={FaMoneyBillWave}
          title="COD"
          badge="Thanh toán khi nhận"
        >
          Thanh toán cho nhân viên GHN khi nhận kiện hàng.
        </PaymentMethodCard>

        <PaymentMethodCard
          icon={FaCreditCard}
          title="VNPay"
          badge="Trực tuyến"
        >
          Thanh toán qua luồng giao dịch do VNPay cung cấp.
        </PaymentMethodCard>

        <PaymentMethodCard
          icon={FaCreditCard}
          title="Stripe"
          badge="Thẻ quốc tế"
        >
          Thanh toán thẻ quốc tế qua luồng xử lý của Stripe.
        </PaymentMethodCard>
      </div>

      <p>
        Khách hàng có trách nhiệm kiểm tra số tiền, đơn vị tiền tệ, nội dung
        thanh toán và trạng thái giao dịch trước khi xác nhận. Không chuyển tiền
        đến tài khoản hoặc đường dẫn không được hiển thị trong quy trình chính
        thức của BookBee.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-shipping"
      number="07"
      title="Vận chuyển và giao nhận"
      icon={FaTruck}
    >
      <p>
        BookBee hiện sử dụng duy nhất Giao Hàng Nhanh (GHN). Khách hàng cần cung
        cấp địa chỉ, số điện thoại và thông tin người nhận chính xác; đồng thời
        phối hợp nhận hàng trong thời gian GHN liên hệ giao.
      </p>

      <p>
        Thời gian giao hiển thị là ước tính. Các trường hợp giao chậm do thời
        tiết, ngày lễ, khu vực hạn chế, sự cố vận hành hoặc không liên hệ được
        người nhận sẽ được xử lý theo Chính sách vận chuyển và quy trình của
        GHN.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-complaint"
      number="08"
      title="Đổi trả, hoàn tiền và khiếu nại"
      icon={FaUndoAlt}
    >
      <p>
        Khi nhận sai, thiếu hoặc hư hỏng sản phẩm, khách hàng nên liên hệ ngay
        sau khi nhận, ưu tiên trong vòng 48 giờ, và cung cấp mã đơn cùng ảnh hoặc
        video liên quan. BookBee sẽ kiểm tra tình trạng, nguyên nhân và đề xuất
        đổi, bổ sung, hoàn tiền hoặc phương án khác phù hợp.
      </p>

      <p>
        Sản phẩm gửi lại cần giữ nguyên tình trạng hợp lý, không có dấu hiệu sử
        dụng, viết, gấp, rách, bẩn hoặc thiếu phụ kiện do lỗi của khách hàng,
        trừ trường hợp lỗi đó là nội dung đang được khiếu nại.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-prohibited"
      number="09"
      title="Các hành vi không được phép"
      icon={FaBan}
    >
      <PolicyList
        items={[
          "Sử dụng thông tin giả mạo, thông tin của người khác hoặc phương thức thanh toán không được phép.",
          "Can thiệp, phá hoại, dò quét, phát tán mã độc hoặc cố gắng truy cập trái phép vào hệ thống.",
          "Tạo nhiều tài khoản, tự động hóa thao tác hoặc lợi dụng lỗi để chiếm ưu đãi, sản phẩm hoặc lợi ích không hợp lệ.",
          "Sao chép, thu thập hàng loạt, bán lại dữ liệu hoặc nội dung của BookBee khi chưa được phép.",
          "Đăng đánh giá có nội dung xúc phạm, sai sự thật, quảng cáo, spam, vi phạm quyền riêng tư hoặc quyền sở hữu trí tuệ.",
          "Thực hiện hoạt động vi phạm pháp luật hoặc gây thiệt hại cho BookBee, khách hàng, đối tác và bên thứ ba.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="terms-ip"
      number="10"
      title="Quyền sở hữu trí tuệ"
      icon={FaCopyright}
    >
      <p>
        Logo, tên thương hiệu, giao diện, nội dung biên soạn, hình ảnh, đồ họa,
        dữ liệu và mã nguồn thuộc BookBee hoặc bên cấp quyền tương ứng. Việc
        truy cập website không làm phát sinh quyền sở hữu hoặc quyền sử dụng
        ngoài phạm vi cá nhân, thông thường của khách hàng.
      </p>

      <p>
        Không sao chép, sửa đổi, phân phối, khai thác thương mại hoặc tạo sản
        phẩm phái sinh từ nội dung nếu chưa có sự cho phép của chủ thể quyền.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-review"
      number="11"
      title="Nội dung đánh giá và phản hồi của người dùng"
      icon={FaBookOpen}
    >
      <p>
        Khi đăng đánh giá, bạn xác nhận nội dung phản ánh trải nghiệm thực tế,
        không vi phạm quyền của người khác và không chứa dữ liệu cá nhân nhạy
        cảm. Bạn cho phép BookBee hiển thị, định dạng và sử dụng đánh giá trong
        phạm vi vận hành, giới thiệu sản phẩm và cải thiện dịch vụ.
      </p>

      <p>
        BookBee có thể ẩn hoặc xóa nội dung vi phạm điều khoản, có dấu hiệu spam,
        không liên quan đến sản phẩm hoặc chứa thông tin gây hại.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-liability"
      number="12"
      title="Tính sẵn sàng của dịch vụ và giới hạn trách nhiệm"
      icon={FaExclamationTriangle}
    >
      <p>
        BookBee nỗ lực duy trì website ổn định và thông tin chính xác nhưng có
        thể tạm ngừng để bảo trì, nâng cấp, xử lý sự cố hoặc do yếu tố ngoài khả
        năng kiểm soát. BookBee không cam kết website luôn liên tục hoặc hoàn
        toàn không có lỗi.
      </p>

      <p>
        Trong phạm vi pháp luật cho phép, trách nhiệm của BookBee được xem xét
        dựa trên thiệt hại trực tiếp, thực tế và có căn cứ liên quan đến giao
        dịch cụ thể. Nội dung này không loại trừ các quyền bắt buộc của người
        tiêu dùng theo quy định áp dụng.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-change"
      number="13"
      title="Thay đổi điều khoản"
      icon={FaFileContract}
    >
      <p>
        BookBee có thể cập nhật điều khoản để phù hợp với tính năng, quy trình
        kinh doanh hoặc yêu cầu pháp lý. Phiên bản mới được đăng trên website
        cùng ngày cập nhật. Việc tiếp tục sử dụng dịch vụ sau thời điểm điều
        khoản có hiệu lực được xem xét theo nội dung thông báo và quy định áp
        dụng.
      </p>
    </PolicySection>

    <PolicySection
      id="terms-dispute"
      number="14"
      title="Tiếp nhận phản ánh và giải quyết tranh chấp"
      icon={FaBalanceScale}
    >
      <p>
        Khi phát sinh vấn đề, hai bên ưu tiên trao đổi thiện chí dựa trên mã
        đơn, chứng từ thanh toán, trạng thái GHN và tài liệu liên quan. Khách
        hàng có thể gửi yêu cầu qua trang Liên hệ để BookBee kiểm tra và phản
        hồi.
      </p>

      <p>
        Nếu không thể giải quyết bằng thương lượng, các bên có quyền sử dụng cơ
        chế giải quyết tranh chấp phù hợp theo quy định pháp luật áp dụng.
      </p>
    </PolicySection>
  </PolicyTemplate>
);

// =========================================================
// 5. CHÍNH SÁCH BẢO MẬT THANH TOÁN
// =========================================================

const paymentNavigation = [
  { id: "payment-methods", label: "Phương thức thanh toán" },
  { id: "payment-cod", label: "Thanh toán COD" },
  { id: "payment-vnpay", label: "Thanh toán VNPay" },
  { id: "payment-stripe", label: "Thanh toán Stripe" },
  { id: "payment-security", label: "Nguyên tắc bảo mật" },
  { id: "payment-status", label: "Giao dịch lỗi hoặc trùng" },
  { id: "payment-refund", label: "Hoàn tiền" },
  { id: "payment-fraud", label: "Phòng chống gian lận" },
  { id: "payment-responsibility", label: "Trách nhiệm khách hàng" },
  { id: "payment-support", label: "Hỗ trợ thanh toán" },
];

export const PaymentPolicy = () => (
  <PolicyTemplate
    title="Chính sách bảo mật thanh toán"
    navigation={paymentNavigation}
  >
    <PolicyIntro>
      BookBee hỗ trợ thanh toán bằng COD, VNPay và Stripe. Chính sách này giải
      thích cách giao dịch được tiếp nhận, các nguyên tắc bảo vệ thông tin và
      quy trình xử lý khi trạng thái thanh toán có vấn đề.
    </PolicyIntro>

    <PolicySection
      id="payment-methods"
      number="01"
      title="Các phương thức thanh toán được hỗ trợ"
      icon={FaCreditCard}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <PaymentMethodCard
          icon={FaMoneyBillWave}
          title="COD"
          badge="Thanh toán khi nhận"
        >
          Thanh toán đúng số tiền đơn hàng cho nhân viên giao hàng của GHN.
        </PaymentMethodCard>

        <PaymentMethodCard
          icon={FaCreditCard}
          title="VNPay"
          badge="Thanh toán online"
        >
          Thực hiện giao dịch qua giao diện hoặc luồng thanh toán do VNPay cung
          cấp.
        </PaymentMethodCard>

        <PaymentMethodCard
          icon={FaCreditCard}
          title="Stripe"
          badge="Thẻ quốc tế"
        >
          Thực hiện giao dịch thẻ quốc tế qua luồng xử lý của Stripe.
        </PaymentMethodCard>
      </div>

      <Notice type="warning" title="Chỉ thanh toán trên luồng chính thức">
        BookBee không yêu cầu khách hàng chuyển tiền đến tài khoản cá nhân, quét
        mã lạ hoặc mở đường dẫn thanh toán được gửi từ nguồn không xác định.
      </Notice>
    </PolicySection>

    <PolicySection
      id="payment-cod"
      number="02"
      title="Thanh toán khi nhận hàng (COD)"
      icon={FaMoneyBillWave}
    >
      <PolicyList
        items={[
          "Khách hàng thanh toán cho nhân viên GHN khi nhận kiện.",
          "Số tiền COD phải khớp với thông tin đơn hàng hoặc thông báo chính thức từ BookBee.",
          "Khách hàng nên chuẩn bị đúng số tiền hoặc lựa chọn hình thức thanh toán phù hợp theo khả năng hỗ trợ của nhân viên giao hàng.",
          "Không thanh toán nếu mã đơn, tên người nhận hoặc số tiền có dấu hiệu không đúng; hãy liên hệ BookBee để xác minh.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="payment-vnpay"
      number="03"
      title="Thanh toán trực tuyến qua VNPay"
      icon={FaCreditCard}
    >
      <p>
        Khi chọn VNPay, bạn được chuyển đến luồng thanh toán do VNPay cung cấp
        để lựa chọn phương thức khả dụng và xác thực giao dịch. Sau khi hoàn
        tất, VNPay trả trạng thái giao dịch về hệ thống BookBee để ghi nhận đơn.
      </p>

      <PolicyList
        items={[
          "Kiểm tra tên đơn vị, số tiền và nội dung giao dịch trước khi xác nhận.",
          "Không đóng trình duyệt hoặc tải lại trang trong lúc hệ thống đang xử lý nếu chưa cần thiết.",
          "Giữ lại mã giao dịch hoặc ảnh chụp kết quả để đối soát khi phát sinh lỗi.",
          "Thời gian ngân hàng ghi nhận hoặc hoàn tiền có thể phụ thuộc vào ngân hàng và quy trình của VNPay.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="payment-stripe"
      number="04"
      title="Thanh toán thẻ quốc tế qua Stripe"
      icon={FaCreditCard}
    >
      <p>
        Khi chọn Stripe, thông tin thẻ được nhập trong luồng thanh toán được
        tích hợp với Stripe. BookBee nhận các thông tin cần thiết như mã giao
        dịch, số tiền và trạng thái để xác nhận đơn, đối soát hoặc hoàn tiền.
      </p>

      <PolicyList
        items={[
          "Tên chủ thẻ, địa chỉ thanh toán hoặc bước xác thực bổ sung có thể được yêu cầu tùy ngân hàng phát hành.",
          "Giao dịch có thể bị từ chối do hạn mức, sai thông tin, quy tắc bảo mật hoặc quyết định của ngân hàng phát hành.",
          "Tỷ giá, phí chuyển đổi ngoại tệ hoặc phí thẻ quốc tế, nếu có, do ngân hàng phát hành hoặc bên cung cấp dịch vụ áp dụng.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="payment-security"
      number="05"
      title="Nguyên tắc bảo mật thông tin thanh toán"
      icon={FaLock}
    >
      <PolicyList
        items={[
          "BookBee sử dụng kết nối bảo mật cho các trang và luồng giao dịch quan trọng.",
          "BookBee không yêu cầu khách hàng gửi OTP, PIN, CVV hoặc mật khẩu ngân hàng qua kênh hỗ trợ.",
          "Dữ liệu thẻ nhạy cảm được nhập và xử lý thông qua luồng của cổng thanh toán tương ứng; BookBee chỉ sử dụng thông tin giao dịch cần thiết để quản lý đơn.",
          "Quyền truy cập thông tin giao dịch được giới hạn theo chức năng công việc.",
          "Hoạt động bất thường có thể được kiểm tra hoặc tạm giữ đơn để phòng chống gian lận.",
        ]}
      />

      <Notice type="info" title="BookBee có thể lưu gì?">
        Hệ thống có thể lưu mã giao dịch, phương thức thanh toán, thời gian, số
        tiền, trạng thái và một phần thông tin nhận diện giao dịch cần thiết.
        BookBee không cần bạn cung cấp toàn bộ số thẻ hoặc mã CVV cho bộ phận hỗ
        trợ.
      </Notice>
    </PolicySection>

    <PolicySection
      id="payment-status"
      number="06"
      title="Giao dịch lỗi, chờ xử lý hoặc thanh toán trùng"
      icon={FaExclamationTriangle}
    >
      <p>
        Nếu tài khoản đã bị trừ tiền nhưng đơn chưa cập nhật, không nên thanh
        toán lại ngay. Trạng thái có thể cần thời gian đồng bộ hoặc đối soát.
      </p>

      <PolicyList
        items={[
          "Kiểm tra lịch sử đơn hàng và thông báo từ ngân hàng hoặc cổng thanh toán.",
          "Lưu mã đơn, mã giao dịch, thời gian, số tiền và ảnh chụp trạng thái.",
          "Gửi thông tin qua trang Liên hệ để BookBee đối soát với VNPay hoặc Stripe.",
          "Không công khai ảnh chứa toàn bộ số thẻ, OTP, CVV hoặc dữ liệu đăng nhập ngân hàng.",
        ]}
      />

      <p>
        Nếu có giao dịch trùng, BookBee sẽ kiểm tra các khoản ghi nhận thực tế
        trước khi xác định phương án hoàn hoặc bù trừ.
      </p>
    </PolicySection>

    <PolicySection
      id="payment-refund"
      number="07"
      title="Quy trình hoàn tiền"
      icon={FaUndoAlt}
    >
      <p>
        Hoàn tiền có thể phát sinh khi đơn thanh toán trước bị hủy, sản phẩm hết
        hàng, giao dịch trùng hoặc yêu cầu đổi trả được chấp thuận. BookBee chỉ
        thực hiện hoàn sau khi xác minh đơn, giao dịch và tình trạng hàng liên
        quan.
      </p>

      <PolicyList
        items={[
          "Giao dịch VNPay hoặc Stripe: ưu tiên hoàn về phương thức thanh toán ban đầu khi hệ thống và cổng thanh toán cho phép.",
          "Đơn COD: phương án hoàn được thống nhất sau khi BookBee xác minh thông tin người nhận và tài khoản nhận hoàn phù hợp.",
          "Thời gian tiền hiển thị lại phụ thuộc vào cổng thanh toán, ngân hàng phát hành, ngân hàng nhận và thời gian đối soát.",
          "BookBee có thể yêu cầu thông tin bổ sung để xác minh người nhận tiền và ngăn ngừa gian lận.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="payment-fraud"
      number="08"
      title="Phòng chống gian lận thanh toán"
      icon={FaShieldAlt}
    >
      <p>
        BookBee có thể áp dụng kiểm tra bổ sung với giao dịch có giá trị cao,
        nhiều lần thất bại, thông tin không nhất quán, địa chỉ bất thường hoặc
        dấu hiệu sử dụng phương thức thanh toán không được phép.
      </p>

      <p>
        Trong quá trình kiểm tra, đơn có thể tạm dừng xử lý. BookBee có thể yêu
        cầu xác nhận một số thông tin không nhạy cảm, hủy giao dịch hoặc từ chối
        đơn khi rủi ro không thể được làm rõ.
      </p>
    </PolicySection>

    <PolicySection
      id="payment-responsibility"
      number="09"
      title="Trách nhiệm bảo mật của khách hàng"
      icon={FaUserShield}
    >
      <PolicyList
        items={[
          "Chỉ thanh toán trên thiết bị và mạng kết nối mà bạn tin cậy.",
          "Kiểm tra tên miền BookBee và thông tin giao dịch trước khi nhập dữ liệu.",
          "Không chia sẻ mật khẩu, OTP, PIN, CVV hoặc ảnh đầy đủ hai mặt thẻ.",
          "Không cho người khác điều khiển từ xa thiết bị trong khi đăng nhập hoặc thanh toán.",
          "Liên hệ ngay ngân hàng, cổng thanh toán và BookBee khi phát hiện giao dịch không được phép.",
        ]}
      />
    </PolicySection>

    <PolicySection
      id="payment-support"
      number="10"
      title="Tiếp nhận yêu cầu hỗ trợ thanh toán"
      icon={FaHeadset}
    >
      <p>
        Khi cần hỗ trợ, hãy cung cấp mã đơn, phương thức thanh toán, thời gian,
        số tiền, mã giao dịch và mô tả lỗi qua trang Liên hệ. BookBee có thể
        phối hợp với GHN, VNPay, Stripe hoặc ngân hàng liên quan để kiểm tra,
        tùy theo loại giao dịch.
      </p>

      <Notice type="warning" title="Không gửi dữ liệu bí mật">
        Hãy che phần lớn số thẻ và số tài khoản trong ảnh chứng từ. Tuyệt đối
        không gửi OTP, PIN, CVV, mật khẩu ngân hàng hoặc mã khôi phục tài khoản.
      </Notice>
    </PolicySection>
  </PolicyTemplate>
);

export default PolicyTemplate;
