import React from "react";

// Template chung cho các trang text
const PolicyTemplate = ({ title, lastUpdated, children }) => (
  <div className="max-w-4xl mx-auto py-16 px-6 min-h-screen">
    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
      {title}
    </h1>
    {lastUpdated && (
      <p className="text-sm text-gray-500 mb-8 italic">
        Cập nhật lần cuối: {lastUpdated}
      </p>
    )}
    <div className="prose prose-purple max-w-none text-gray-700 leading-relaxed space-y-4">
      {children}
    </div>
  </div>
);

// 1. FAQ
export const FAQ = () => (
  <PolicyTemplate title="Câu hỏi thường gặp">
    <h3 className="text-xl font-bold text-slate-800">
      1. Tôi có thể hủy đơn hàng không?
    </h3>
    <p>
      Có, bạn có thể hủy đơn hàng khi trạng thái là "Đang xử lý". Nếu đơn hàng
      đã giao cho vận chuyển, vui lòng liên hệ hotline.
    </p>
    <h3 className="text-xl font-bold text-slate-800">
      2. Thời gian giao hàng bao lâu?
    </h3>
    <p>Thông thường từ 2-4 ngày làm việc tùy khu vực.</p>
  </PolicyTemplate>
);

// 2. Chính sách vận chuyển
export const ShippingPolicy = () => (
  <PolicyTemplate title="Chính sách vận chuyển" lastUpdated="01/01/2026">
    <p>GTBooks miễn phí vận chuyển cho đơn hàng từ 500.000đ.</p>
    <p>
      Các đơn vị vận chuyển đối tác: Giao Hàng Nhanh, Viettel Post, Shopee
      Express.
    </p>
  </PolicyTemplate>
);

// 3. Chính sách bảo mật
export const PrivacyPolicy = () => (
  <PolicyTemplate title="Chính sách bảo mật" lastUpdated="01/01/2026">
    <p>
      Chúng tôi cam kết bảo mật tuyệt đối thông tin cá nhân của khách hàng theo
      quy định của pháp luật.
    </p>
    <p>
      Thông tin của bạn chỉ được sử dụng để xử lý đơn hàng và gửi thông báo
      khuyến mãi (nếu bạn đăng ký).
    </p>
  </PolicyTemplate>
);

// 4. Điều khoản dịch vụ
export const Terms = () => (
  <PolicyTemplate title="Điều khoản dịch vụ">
    <p>
      Khi truy cập website GTBooks, bạn đồng ý với các điều khoản sử dụng của
      chúng tôi...
    </p>
  </PolicyTemplate>
);

