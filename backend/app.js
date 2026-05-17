import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoute from "./routes/authRoute.js";
import productRoute from "./routes/productRoute.js";
import bannerRoute from "./routes/bannerRoute.js";
import userRoute from "./routes/userRoute.js";
import orderRoute from "./routes/orderRoute.js";
import stripeRoute from "./routes/stripe.js";
import categoryRoutes from "./routes/categoryRoute.js";
import flashSaleRoutes from "./routes/flashsaleRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import couponRoute from "./routes/couponRoute.js";
import statsRoute from "./routes/statsRoute.js";
import chatbotRoute from "./routes/chatbotRoute.js";
import analyticsRoute from "./routes/analyticsRoute.js";
import shippingRoute from "./routes/shippingRoute.js";

const app = express();

// --- BẢO MẬT (SECURITY) ---
// 1. Set Security HTTP Headers
// crossOriginOpenerPolicy: cho phép Google Sign-In popup giao tiếp qua postMessage
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// 2. Cấu hình CORS
const allowedOrigins = [
  "http://localhost:5173", // Cổng Frontend (Vite)
  "http://localhost:1301", // Cổng Admin
  "http://localhost:3000", // Cổng React Create App (Dự phòng)
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// 3. Rate Limiting (Giới hạn API)
const isDev = process.env.NODE_ENV !== "production";

// Auth limiter: nới lỏng trong Dev để tránh 429 khi hot-reload
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20, // Dev: 1000 | Prod: 20
  message: "Quá nhiều lượt đăng nhập, vui lòng thử lại sau 15 phút.",
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 1000,
});
app.use("/api/", apiLimiter);

// 4. Body Parser
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ...
app.use("/api/v1/auth", authLimiter, authRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/banners", bannerRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/stripe", stripeRoute);
app.use("/api/v1/flash-sales", flashSaleRoutes);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/coupons", couponRoute);
app.use("/api/v1/stats", statsRoute);
app.use("/api/v1/chatbot", chatbotRoute);
app.use("/api/v1/analytics", analyticsRoute);
app.use("/api/v1/shipping", shippingRoute);

// --- ERROR MIDDLEWARE ---
app.use(notFound);
app.use(errorHandler);

export default app;
