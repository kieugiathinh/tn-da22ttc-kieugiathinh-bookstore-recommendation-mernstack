/**
 * verifyApiKey — Middleware bảo vệ Data Endpoints cho Python Service
 * ─────────────────────────────────────────────────────────────────────
 * Cơ chế: Python service gửi kèm header `x-api-key: <AI_SERVICE_API_KEY>`
 * trong mỗi request. Middleware kiểm tra và từ chối nếu key không khớp.
 *
 * Tại sao không dùng JWT?
 *   - Python service là server-to-server (không có user session).
 *   - API Key đơn giản hơn, phù hợp cho internal service communication.
 *   - Dễ rotate khi cần (chỉ đổi biến môi trường).
 *
 * Cách dùng trong Python (requests):
 *   headers = {"x-api-key": "bookbee-ai-secret-key-2024"}
 *   res = requests.get("http://localhost:3000/api/v1/recommend/data/products", headers=headers)
 */
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const validKey = process.env.AI_SERVICE_API_KEY;

  // Nếu biến môi trường chưa được cấu hình → cảnh báo dev
  if (!validKey) {
    console.warn(
      "[verifyApiKey] ⚠️ AI_SERVICE_API_KEY chưa được cấu hình trong .env"
    );
    return res.status(500).json({
      success: false,
      message: "Server configuration error: API key not set.",
    });
  }

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or missing API key (x-api-key header).",
    });
  }

  next();
};

export default verifyApiKey;
