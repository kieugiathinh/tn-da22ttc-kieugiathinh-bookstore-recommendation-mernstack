import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// GHN (Giao Hàng Nhanh) Shipping Service
// Lưu ý: GHN dùng 2 base path khác nhau:
//   - Master-data: /shiip/public-api/master-data/...
//   - Shipping:    /shiip/public-api/v2/shipping-order/...
// ============================================================

const GHN_HOST = "https://online-gateway.ghn.vn";
const GHN_TOKEN = process.env.GHN_API_TOKEN;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;

// Axios instance riêng cho GHN, tránh conflict với các service khác
const ghnApi = axios.create({
  baseURL: GHN_HOST,
  headers: {
    "Content-Type": "application/json",
    Token: GHN_TOKEN,
  },
});

// -----------------------------------------------------------
// 1. Lấy danh sách Tỉnh / Thành phố
// -----------------------------------------------------------
const getProvinces = async () => {
  const { data } = await ghnApi.get(
    "/shiip/public-api/master-data/province"
  );
  return data;
};

// -----------------------------------------------------------
// 2. Lấy danh sách Quận / Huyện theo Tỉnh
// -----------------------------------------------------------
const getDistricts = async (provinceId) => {
  const { data } = await ghnApi.get(
    "/shiip/public-api/master-data/district",
    { params: { province_id: provinceId } }
  );
  return data;
};

// -----------------------------------------------------------
// 3. Lấy danh sách Phường / Xã theo Quận
// -----------------------------------------------------------
const getWards = async (districtId) => {
  const { data } = await ghnApi.get(
    "/shiip/public-api/master-data/ward",
    { params: { district_id: districtId } }
  );
  return data;
};

// -----------------------------------------------------------
// 4. Tính phí vận chuyển
//    - service_type_id: 2 = Chuyển phát Chuẩn (E-Commerce Standard)
//      (Dùng service_type_id thay vì service_id vì service_id thay đổi theo shop)
//    - insurance_value: Tổng giá trị đơn hàng (để GHN tính phí bảo hiểm)
// -----------------------------------------------------------
const calculateFee = async ({
  to_district_id,
  to_ward_code,
  weight,
  insurance_value = 0,
}) => {
  const payload = {
    service_type_id: 2, // Chuyển phát Chuẩn (universal, không phụ thuộc shop)
    insurance_value: insurance_value,
    to_district_id: Number(to_district_id),
    to_ward_code: String(to_ward_code),
    weight: Number(weight), // gram
    // Kích thước mặc định cho sách (cm)
    length: 25,
    width: 18,
    height: 5,
  };

  try {
    const { data } = await ghnApi.post(
      "/shiip/public-api/v2/shipping-order/fee",
      payload,
      {
        headers: {
          Token: GHN_TOKEN,
          ShopId: GHN_SHOP_ID,
        },
      }
    );

    return data;
  } catch (error) {
    // Trích xuất lỗi chi tiết từ GHN response
    const ghnError =
      error.response?.data?.message || error.message;
    const err = new Error(`GHN API Error: ${ghnError}`);
    err.statusCode = error.response?.status || 500;
    throw err;
  }
};

export { getProvinces, getDistricts, getWards, calculateFee };
