import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

if (!process.env.STRIPE_KEY) {
  console.error("❌ LỖI: Chưa cấu hình STRIPE_KEY trong file .env");
}

const stripe = new Stripe(process.env.STRIPE_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { cart, email, userId, name } = req.body;

    if (!cart || !cart.products || cart.products.length === 0) {
      return res.status(400).json({ error: "Giỏ hàng trống" });
    }

    // Tạo line_items cho Stripe
    const line_items = cart.products.map((item) => {
      // 1. Chuẩn bị dữ liệu sản phẩm cơ bản
      const product_data = {
        name: item.title,
        // Stripe yêu cầu ảnh phải là link online hợp lệ
        images: item.img ? [item.img] : ["https://via.placeholder.com/150"],
        metadata: {
          id: item._id,
        },
      };

      // 2. FIX LỖI STRIPE: Chỉ thêm description nếu nó có dữ liệu thực sự
      if (item.desc && item.desc.trim() !== "") {
        // Cắt ngắn mô tả để tránh quá dài gây lỗi (Stripe giới hạn)
        product_data.description = item.desc.substring(0, 100) + "...";
      }

      return {
        price_data: {
          currency: "vnd", // Hoặc 'usd' tùy tài khoản Stripe của bạn
          product_data: product_data,
          // Làm tròn giá tiền để tránh lỗi số thập phân
          unit_amount: Math.round(item.price),
        },
        quantity: item.quantity,
      };
    });

    // Tạo session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      customer_email: email,
      // metadata: { ... } // Tạm bỏ metadata phức tạp để tránh lỗi quá tải ký tự
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ STRIPE ERROR:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
