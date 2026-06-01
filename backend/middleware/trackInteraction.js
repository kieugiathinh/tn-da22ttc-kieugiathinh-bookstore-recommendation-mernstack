import mongoose from "mongoose";
import UserInteraction, {
  INTERACTION_TYPE,
} from "../models/userInteractionModel.js";

/**
 * ============================================================
 * trackInteraction — Express Middleware
 * ============================================================
 * Mục đích: Tự động ghi lại hành vi "xem sản phẩm" (view)
 *           mỗi khi user đã đăng nhập gọi GET /api/v1/products/find/:id
 *
 * Thiết kế:
 *   - KHÔNG dùng `await` → "Fire and Forget" — không block response
 *   - Chỉ track user đã xác thực (req.user tồn tại)
 *   - Validate :id là ObjectId hợp lệ trước khi ghi DB
 *   - Mọi lỗi đều bị nuốt (silent fail) để không ảnh hưởng UX
 *
 * Cách tích hợp vào productRoute.js:
 *   import { optionalProtect } from "../middleware/authMiddleware.js";
 *   import trackInteraction from "../middleware/trackInteraction.js";
 *   router.get("/find/:id", optionalProtect, trackInteraction, getProduct);
 * ============================================================
 */
const trackInteraction = (req, res, next) => {
  // ── Chuyển ngay sang handler tiếp theo, KHÔNG chờ ghi DB ──────────────────
  next();

  // ── Fire and Forget: chạy bất đồng bộ, hoàn toàn tách biệt với response ───
  (async () => {
    try {
      // 1. Chỉ track user đã đăng nhập (optionalProtect đặt req.user = null nếu guest)
      if (!req.user?._id) return;

      // 2. Validate productId từ route param
      const productId = req.params.id;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) return;

      // 3. Lấy source từ query param nếu Frontend gửi kèm
      //    Ví dụ: GET /api/v1/products/find/123?source=recommendation
      const allowedSources = [
        "homepage",
        "search",
        "category",
        "recommendation",
        "direct",
      ];
      const source = allowedSources.includes(req.query.source)
        ? req.query.source
        : "direct";

      // 4. Ghi record — upsert để tránh tạo bản ghi trùng trong 1 session ngắn
      //    Nếu user đã view cùng product trong vòng 30 phút → update thay vì insert mới
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const existingRecent = await UserInteraction.findOne({
        userId: req.user._id,
        productId: new mongoose.Types.ObjectId(productId),
        interactionType: INTERACTION_TYPE.VIEW,
        source,
        createdAt: { $gte: thirtyMinutesAgo },
      })
        .select("_id")
        .lean();

      if (existingRecent) {
        // Đã có view gần đây → không insert thêm (tránh inflate data)
        return;
      }

      await UserInteraction.create({
        userId: req.user._id,
        productId: new mongoose.Types.ObjectId(productId),
        interactionType: INTERACTION_TYPE.VIEW,
        source,
        // durationSeconds: null — Frontend sẽ cập nhật sau qua PATCH endpoint
        //                         khi user rời trang (beforeunload)
      });
    } catch (err) {
      // Silent fail — lỗi tracking KHÔNG được làm hỏng luồng chính
      // Chỉ log ở môi trường development để debug
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[trackInteraction] Không thể ghi interaction: ${err.message}`
        );
      }
    }
  })();
};

export default trackInteraction;
