import asyncHandler from "express-async-handler";
import * as shippingService from "../services/shippingService.js";

// GET /api/v1/shipping/provinces
const getProvinces = asyncHandler(async (req, res) => {
  const result = await shippingService.getProvinces();
  res.status(200).json(result);
});

// GET /api/v1/shipping/districts?province_id=...
const getDistricts = asyncHandler(async (req, res) => {
  const { province_id } = req.query;

  if (!province_id) {
    res.status(400);
    throw new Error("province_id là bắt buộc");
  }

  const result = await shippingService.getDistricts(Number(province_id));
  res.status(200).json(result);
});

// GET /api/v1/shipping/wards?district_id=...
const getWards = asyncHandler(async (req, res) => {
  const { district_id } = req.query;

  if (!district_id) {
    res.status(400);
    throw new Error("district_id là bắt buộc");
  }

  const result = await shippingService.getWards(Number(district_id));
  res.status(200).json(result);
});

// POST /api/v1/shipping/fee
const calculateFee = asyncHandler(async (req, res) => {
  const { to_district_id, to_ward_code, weight, insurance_value } = req.body;

  if (!to_district_id || !to_ward_code || !weight) {
    res.status(400);
    throw new Error("to_district_id, to_ward_code, weight là bắt buộc");
  }

  const result = await shippingService.calculateFee({
    to_district_id,
    to_ward_code,
    weight,
    insurance_value: insurance_value || 0,
  });

  res.status(200).json(result);
});

export { getProvinces, getDistricts, getWards, calculateFee };
