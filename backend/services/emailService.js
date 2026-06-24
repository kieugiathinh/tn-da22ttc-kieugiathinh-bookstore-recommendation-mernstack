import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, "../../frontend/public/logobookbee.jpg");

const logoAttachment = {
  filename: "logobookbee.jpg",
  path: logoPath,
  cid: "logobookbee"
};
// ============================================
// BOOKBEE EMAIL SERVICE
// Nodemailer + Gmail SMTP Transporter
// ============================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error.message);
  } else {
    console.log("✅ Email service sẵn sàng gửi mail");
  }
});

// ============================================
// SHARED HTML COMPONENTS
// ============================================

const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #EE4D2D 0%, #F59E0B 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <div style="display: inline-block; margin-bottom: 12px; background: white; padding: 10px 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <img src="cid:logobookbee" alt="BookBee Logo" style="height: 45px; display: block;" />
    </div>
    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">
      Thiên đường sách của bạn
    </h1>
  </div>
`;

const getEmailFooter = () => `
  <div style="background: #1c1917; padding: 24px; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="margin: 0 0 8px; font-size: 13px; color: #a8a29e;">
      © ${new Date().getFullYear()} BookBee. All rights reserved.
    </p>
    <p style="margin: 0; font-size: 12px; color: #78716c;">
      Email này được gửi tự động, vui lòng không trả lời trực tiếp.
    </p>
  </div>
`;

const getEmailWrapper = (content) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
    ${getEmailHeader()}
    ${content}
    ${getEmailFooter()}
  </div>
</body>
</html>
`;

// ============================================
// 1. WELCOME EMAIL
// ============================================

const sendWelcomeEmail = async (email, name) => {
  const content = `
    <div style="padding: 36px 32px;">
      <!-- Greeting -->
      <h2 style="margin: 0 0 8px; font-size: 22px; color: #1c1917; font-weight: 700;">
        Chào mừng bạn, ${name}! 🎉
      </h2>
      <p style="margin: 0 0 24px; font-size: 15px; color: #57534e; line-height: 1.7;">
        Cảm ơn bạn đã gia nhập cộng đồng <strong style="color: #EE4D2D;">BookBee</strong>. 
        Chúng tôi rất vui được đồng hành cùng bạn trên hành trình khám phá thế giới sách!
      </p>

      <!-- Voucher Block -->
      <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #F59E0B; border-radius: 12px; padding: 28px 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #92400e; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
          🎁 Quà tặng chào mừng
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #78350f;">
          Giảm <strong style="font-size: 18px; color: #EE4D2D;">10%</strong> cho đơn hàng đầu tiên
        </p>
        <div style="display: inline-block; background: #EE4D2D; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 4px; padding: 14px 32px; border-radius: 8px; border: 2px solid #D73F22;">
          WELCOMEBEE
        </div>
        <p style="margin: 16px 0 0; font-size: 12px; color: #a16207;">
          Nhập mã trên khi thanh toán để được giảm giá
        </p>
      </div>

      <!-- Features -->
      <div style="margin: 28px 0 0;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #1c1917; font-weight: 600;">
          Với BookBee, bạn có thể:
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 12px; vertical-align: top; width: 32px;">
              <span style="font-size: 20px;">📚</span>
            </td>
            <td style="padding: 10px 0; font-size: 14px; color: #57534e; line-height: 1.5;">
              Khám phá hàng ngàn đầu sách hay từ nhiều thể loại
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; vertical-align: top; width: 32px;">
              <span style="font-size: 20px;">🤖</span>
            </td>
            <td style="padding: 10px 0; font-size: 14px; color: #57534e; line-height: 1.5;">
              Nhận gợi ý sách thông minh dựa trên sở thích của bạn
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; vertical-align: top; width: 32px;">
              <span style="font-size: 20px;">🚀</span>
            </td>
            <td style="padding: 10px 0; font-size: 14px; color: #57534e; line-height: 1.5;">
              Giao hàng nhanh chóng, an toàn trên toàn quốc
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 8px;">
        <a href="${process.env.CLIENT_URL}" 
           style="display: inline-block; background: linear-gradient(135deg, #EE4D2D 0%, #D73F22 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(238,77,45,0.3);">
          Khám phá ngay →
        </a>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"BookBee 🐝" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Chào mừng bạn đến với BookBee! - Nhận ngay voucher giảm 10%",
    html: getEmailWrapper(content),
    attachments: [logoAttachment]
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Welcome email đã gửi tới: ${email}`);
};

// ============================================
// 2. RESET PASSWORD EMAIL
// ============================================

const sendResetPasswordEmail = async (email, resetUrl) => {
  const content = `
    <div style="padding: 36px 32px;">
      <!-- Icon -->
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 64px; height: 64px; background: #fef2f2; border-radius: 50%; line-height: 64px; font-size: 28px;">
          🔒
        </div>
      </div>

      <h2 style="margin: 0 0 8px; font-size: 22px; color: #1c1917; font-weight: 700; text-align: center;">
        Đặt lại mật khẩu
      </h2>
      <p style="margin: 0 0 28px; font-size: 15px; color: #57534e; line-height: 1.7; text-align: center;">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản BookBee của bạn.
        Nhấn nút bên dưới để tạo mật khẩu mới.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #EE4D2D 0%, #D73F22 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 16px 48px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(238,77,45,0.35);">
          🔑 Đặt lại mật khẩu
        </a>
      </div>

      <!-- Warning Box -->
      <div style="background: #fffbeb; border-left: 4px solid #F59E0B; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 28px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
          ⏰ <strong>Lưu ý:</strong> Link đặt lại mật khẩu sẽ <strong>hết hạn sau 15 phút</strong>. 
          Nếu quá thời gian, bạn vui lòng yêu cầu lại.
        </p>
      </div>

      <!-- Security Notice -->
      <div style="background: #f5f5f4; border-radius: 8px; padding: 16px 20px; margin: 20px 0 0;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #78716c; line-height: 1.6;">
          🛡️ Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. 
          Tài khoản của bạn vẫn an toàn.
        </p>
        <p style="margin: 0; font-size: 12px; color: #a8a29e; word-break: break-all;">
          Link: ${resetUrl}
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"BookBee 🐝" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔒 BookBee - Yêu cầu đặt lại mật khẩu",
    html: getEmailWrapper(content),
    attachments: [logoAttachment]
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Reset password email đã gửi tới: ${email}`);
};

// ============================================
// 3. NEWSLETTER WELCOME EMAIL
// ============================================

const sendNewsletterWelcomeEmail = async (email) => {
  const content = `
    <div style="padding: 36px 32px;">
      <h2 style="margin: 0 0 8px; font-size: 22px; color: #1c1917; font-weight: 700;">
        Chào bạn! 💌
      </h2>
      <p style="margin: 0 0 24px; font-size: 15px; color: #57534e; line-height: 1.7;">
        Cảm ơn bạn đã đăng ký nhận bản tin từ <strong style="color: #EE4D2D;">BookBee</strong>. 
        Từ nay, bạn sẽ là một trong những người đầu tiên nhận được thông tin về sách mới, chương trình khuyến mãi và các sự kiện hấp dẫn của chúng tôi!
      </p>

      <!-- Voucher Block -->
      <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px dashed #F59E0B; border-radius: 12px; padding: 28px 24px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #92400e; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
          🎁 Quà tặng tri ân
        </p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #78350f;">
          Giảm <strong style="font-size: 18px; color: #EE4D2D;">10.000đ</strong> cho đơn hàng tiếp theo
        </p>
        <div style="display: inline-block; background: #EE4D2D; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 4px; padding: 14px 32px; border-radius: 8px; border: 2px solid #D73F22;">
          BEE10K
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0 8px;">
        <a href="${process.env.CLIENT_URL}" 
           style="display: inline-block; background: linear-gradient(135deg, #EE4D2D 0%, #D73F22 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(238,77,45,0.3);">
          Mua sắm ngay →
        </a>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"BookBee 🐝" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "✨ Chào mừng bạn đến với Bản tin BookBee! - Tặng ngay 10K",
    html: getEmailWrapper(content),
    attachments: [logoAttachment]
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Newsletter welcome email đã gửi tới: ${email}`);
};

// ============================================
// 4. ORDER CONFIRMATION EMAIL
// ============================================

const formatPrice = (price) => {
  return price.toLocaleString('vi-VN') + 'đ';
};

const sendOrderConfirmationEmail = async (email, order) => {
  const { _id, name, address, phone, products, total, shippingFee, paymentMethod } = order;
  const orderIdShort = _id.toString().slice(-8).toUpperCase();

  const productsHtml = products.map((item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4;">
        <p style="margin: 0; font-size: 14px; color: #1c1917; font-weight: 600;">${item.title}</p>
        <p style="margin: 4px 0 0; font-size: 12px; color: #78716c;">Số lượng: ${item.quantity}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f5f5f4; text-align: right; font-size: 14px; color: #1c1917; font-weight: 600;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `).join("");

  const content = `
    <div style="padding: 36px 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">📦</span>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 22px; color: #1c1917; font-weight: 700; text-align: center;">
        Đặt hàng thành công!
      </h2>
      <p style="margin: 0 0 24px; font-size: 15px; color: #57534e; line-height: 1.7; text-align: center;">
        Xin chào <strong>${name}</strong>, cảm ơn bạn đã mua sắm tại BookBee.<br>
        Đơn hàng <strong>#${orderIdShort}</strong> của bạn đã được ghi nhận.
      </p>

      <div style="background: #fafaf9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 16px; font-size: 14px; color: #a8a29e; text-transform: uppercase; letter-spacing: 1px;">Thông tin giao hàng</h3>
        <p style="margin: 0 0 8px; font-size: 14px; color: #44403c;"><strong>Người nhận:</strong> ${name}</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #44403c;"><strong>Điện thoại:</strong> ${phone}</p>
        <p style="margin: 0 0 8px; font-size: 14px; color: #44403c;"><strong>Địa chỉ:</strong> ${address}</p>
        <p style="margin: 0; font-size: 14px; color: #44403c;"><strong>Thanh toán:</strong> ${paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Đã thanh toán online'}</p>
      </div>

      <div style="border: 1px solid #e7e5e4; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; padding: 0 16px; display: block;">
          <tbody style="width: 100%; display: table; padding: 0 16px; box-sizing: border-box;">
            ${productsHtml}
            <tr>
              <td style="padding: 12px 0; color: #57534e; font-size: 14px;">Tạm tính</td>
              <td style="padding: 12px 0; text-align: right; color: #57534e; font-size: 14px;">${formatPrice(total - shippingFee)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; color: #57534e; font-size: 14px; border-bottom: 1px solid #f5f5f4;">Phí vận chuyển</td>
              <td style="padding: 12px 0; text-align: right; color: #57534e; font-size: 14px; border-bottom: 1px solid #f5f5f4;">${formatPrice(shippingFee)}</td>
            </tr>
            <tr>
              <td style="padding: 16px 0; color: #1c1917; font-size: 16px; font-weight: 700;">Tổng cộng</td>
              <td style="padding: 16px 0; text-align: right; color: #EE4D2D; font-size: 18px; font-weight: 800;">${formatPrice(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin: 32px 0 8px;">
        <a href="${process.env.CLIENT_URL}/myorders"
           style="display: inline-block; background: linear-gradient(135deg, #EE4D2D 0%, #D73F22 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(238,77,45,0.3);">
          Theo dõi đơn hàng →
        </a>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"BookBee 🐝" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Xác nhận đơn hàng #${orderIdShort} từ BookBee`,
    html: getEmailWrapper(content),
    attachments: [logoAttachment]
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Order confirmation email đã gửi tới: ${email}`);
};

// ============================================
// 5. MARKETING EMAIL CAMPAIGN
// ============================================

const sendMarketingEmail = async (emails, subject, htmlContent) => {
  const content = `
    <div style="padding: 36px 32px;">
      ${htmlContent}
    </div>
  `;

  // Gửi riêng rẽ cho từng người để đảm bảo tính riêng tư (không dùng BCC để tránh bị vào mục Spam)
  // DÙNG VÒNG LẶP TUẦN TỰ (thay vì Promise.all) ĐỂ TRÁNH BỊ GMAIL CHẶN VÌ GỬI QUÁ NHIỀU CÙNG LÚC
  let successCount = 0;
  for (const recipient of emails) {
    try {
      const mailOptions = {
        from: `"BookBee 🐝" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: subject,
        html: getEmailWrapper(content),
        attachments: [logoAttachment]
      };
      await transporter.sendMail(mailOptions);
      successCount++;
      
      // Delay 150ms giữa mỗi mail để tránh rate-limit của Google SMTP
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (err) {
      console.error(`❌ Lỗi gửi email tới ${recipient}:`, err.message);
    }
  }

  console.log(`✅ Đã gửi chiến dịch Email Marketing thành công tới ${successCount}/${emails.length} người dùng.`);
};

export {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendNewsletterWelcomeEmail,
  sendOrderConfirmationEmail,
  sendMarketingEmail
};
