import dotenv from "dotenv";
dotenv.config();

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // 1. Lỗi Mongoose CastError (Sai định dạng ID)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Dữ liệu không được tìm thấy (Invalid ID)";
  }

  // 2. Lỗi Mongoose Duplicate Key (Ví dụ: Trùng email)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Dữ liệu '${field}' đã tồn tại trong hệ thống. Vui lòng chọn giá trị khác.`;
  }

  // 3. Lỗi Mongoose Validation (Quên điền trường bắt buộc)
  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    message = `Lỗi nhập liệu: ${messages.join(", ")}`;
  }

  // 4. Lỗi JWT
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token không hợp lệ, vui lòng đăng nhập lại.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token đã hết hạn, vui lòng đăng nhập lại.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { errorHandler, notFound };
