// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { errorHandler, notFound } from "./middleware/error.middleware.js";
// import authRoute from "./routes/auth.route.js";
// import productRoute from "./routes/product.route.js";
// import bannerRoute from "./routes/banner.route.js";
// import userRoute from "./routes/user.route.js";
// import orderRoute from "./routes/order.route.js";
// import stripeRoute from "./routes/stripe.js";
// import categoryRoutes from "./routes/category.routes.js";
// import flashSaleRoutes from "./routes/flashsale.route.js";

// const app = express();

// //cors
// app.use(cors());

// //json body
// app.use(express.json());

// //cookie-parser
// app.use(cookieParser());

// //Routes
// app.use("/api/v1/auth", authRoute);
// app.use("/api/v1/products", productRoute);
// app.use("/api/v1/banners", bannerRoute);
// app.use("/api/v1/users", userRoute);
// app.use("/api/v1/categories", categoryRoutes);
// app.use("/api/v1/orders", orderRoute);
// app.use("/api/v1/stripe", stripeRoute);
// app.use("/api/v1/flash-sales", flashSaleRoutes);

// //Error middleware
// app.use(notFound);
// app.use(errorHandler);

// export default app;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import authRoute from "./routes/auth.route.js";
import productRoute from "./routes/product.route.js";
import bannerRoute from "./routes/banner.route.js";
import userRoute from "./routes/user.route.js";
import orderRoute from "./routes/order.route.js";
import stripeRoute from "./routes/stripe.js";
import categoryRoutes from "./routes/category.routes.js";
import flashSaleRoutes from "./routes/flashsale.route.js";
import reviewRoute from "./routes/review.route.js";
import couponRoute from "./routes/coupon.routes.js";
import statsRoute from "./routes/stats.route.js";

const app = express();

// --- CẤU HÌNH CORS CHUẨN ---
// Danh sách các domain được phép gọi API và gửi Cookie
const allowedOrigins = [
  "http://localhost:5173", // Cổng Frontend (Vite)
  "http://localhost:1301", // Cổng Admin
  "http://localhost:3000", // Cổng React Create App (Dự phòng)
];

app.use(
  cors({
    origin: allowedOrigins, // Chỉ cho phép các nguồn này
    credentials: true, // BẮT BUỘC: Cho phép nhận Cookie/Token
    methods: ["GET", "POST", "PUT", "DELETE"], // Các method cho phép
  })
);

//json body
app.use(express.json());

//cookie-parser
app.use(cookieParser());

//Routes
app.use("/api/v1/auth", authRoute);
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

//Error middleware
app.use(notFound);
app.use(errorHandler);

export default app;
