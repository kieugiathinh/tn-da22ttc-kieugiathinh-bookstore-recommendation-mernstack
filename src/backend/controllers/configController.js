import asyncHandler from "express-async-handler";
import * as configService from "../services/configService.js";

/**
 * GET /api/v1/config/:key
 * Lấy cấu hình hệ thống theo key. Nếu chưa có, trả về giá trị mặc định và lưu vào DB.
 */
export const getConfigByKey = asyncHandler(async (req, res) => {
  try {
    const config = await configService.getConfigByKey(req.params.key);
    res.status(200).json({
      success: true,
      key: config.key,
      value: config.value,
    });
  } catch (error) {
    if (error.message === "Cấu hình không tồn tại") {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * PUT /api/v1/config/:key
 * Cập nhật cấu hình hệ thống (yêu cầu Admin).
 */
export const updateConfigByKey = asyncHandler(async (req, res) => {
  try {
    const config = await configService.updateConfigByKey(req.params.key, req.body.value);
    res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình thành công",
      key: config.key,
      value: config.value,
    });
  } catch (error) {
    if (error.message === "Value không được để trống") {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});
