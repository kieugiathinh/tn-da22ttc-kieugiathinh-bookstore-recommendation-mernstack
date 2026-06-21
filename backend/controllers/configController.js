import asyncHandler from "express-async-handler";
import SystemConfig from "../models/systemConfigModel.js";

// ─── Default Configurations ───────────────────────────────────────────────────

const DEFAULT_CONFIGS = {
  INTERACTION_WEIGHTS: {
    view: 1,
    search_click: 2,
    add_to_cart: 3,
    review: 4,
    purchase: 5,
  },
  HYBRID_WEIGHTS: {
    cf: 40,
    cbf: 30,
    pop: 30,
  },
};

// ─── Controller Functions ─────────────────────────────────────────────────────

/**
 * GET /api/v1/config/:key
 * Lấy cấu hình hệ thống theo key. Nếu chưa có, trả về giá trị mặc định và lưu vào DB.
 */
export const getConfigByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  let config = await SystemConfig.findOne({ key });

  if (!config) {
    if (DEFAULT_CONFIGS[key] !== undefined) {
      config = await SystemConfig.create({
        key,
        value: DEFAULT_CONFIGS[key],
        description: `Cấu hình tự động tạo cho ${key}`,
      });
    } else {
      return res.status(404).json({ success: false, message: "Cấu hình không tồn tại" });
    }
  }

  res.status(200).json({
    success: true,
    key: config.key,
    value: config.value,
  });
});

/**
 * PUT /api/v1/config/:key
 * Cập nhật cấu hình hệ thống (yêu cầu Admin).
 */
export const updateConfigByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    return res.status(400).json({ success: false, message: "Value không được để trống" });
  }

  let config = await SystemConfig.findOne({ key });

  if (config) {
    config.value = value;
    await config.save();
  } else {
    config = await SystemConfig.create({
      key,
      value,
      description: `Cấu hình được tạo từ Admin cho ${key}`,
    });
  }

  res.status(200).json({
    success: true,
    message: "Cập nhật cấu hình thành công",
    key: config.key,
    value: config.value,
  });
});
