import express from "express";
import {
  getProvinces,
  getDistricts,
  getWards,
  calculateFee,
} from "../controllers/shippingController.js";

const router = express.Router();

// Lấy danh sách Tỉnh/Thành
router.get("/provinces", getProvinces);

// Lấy danh sách Quận/Huyện theo Tỉnh
router.get("/districts", getDistricts);

// Lấy danh sách Phường/Xã theo Quận
router.get("/wards", getWards);

// Tính phí vận chuyển
router.post("/fee", calculateFee);

export default router;
