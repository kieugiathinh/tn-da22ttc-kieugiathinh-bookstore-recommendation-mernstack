import asyncHandler from "express-async-handler";
import * as flashsaleService from "../services/flashsaleService.js";

// 1. Tạo đợt Flash Sale mới (Chưa có sản phẩm)
// POST /api/v1/flash-sales
const createFlashSale = asyncHandler(async (req, res) => {
  const flashSale = await flashsaleService.createFlashSale(req.body);
  res.status(201).json(flashSale);
});

// 2. Thêm Sách vào Flash Sale (Thao tác N-N)
// POST /api/v1/flash-sales/:id/add-product
const addProductToFlashSale = asyncHandler(async (req, res) => {
  const flashSale = await flashsaleService.addProductToFlashSale(req.params.id, req.body);
  res.status(200).json(flashSale);
});

// Thêm NHIỀU Sách vào Flash Sale
// POST /api/v1/flash-sales/:id/add-multiple-products
const addMultipleProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;
  if (!products || !Array.isArray(products)) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
  }
  const result = await flashsaleService.addMultipleProductsToFlashSale(req.params.id, products);
  res.status(200).json(result);
});

// 3. Lấy Flash Sale ĐANG DIỄN RA (Cho trang chủ)
// GET /api/v1/flash-sales/active
const getActiveFlashSale = asyncHandler(async (req, res) => {
  const activeSale = await flashsaleService.getActiveFlashSale();
  res.status(200).json(activeSale);
});

// 4. Lấy danh sách TẤT CẢ Flash Sale (Cho Admin)
// GET /api/v1/flash-sales/all
const getAllFlashSales = asyncHandler(async (req, res) => {
  const flashSales = await flashsaleService.getAllFlashSales();
  res.status(200).json(flashSales);
});

// 5. Xóa Flash Sale
const deleteFlashSale = asyncHandler(async (req, res) => {
  await flashsaleService.deleteFlashSale(req.params.id);
  res.status(200).json({ message: "Đã xóa thành công" });
});

// 6. Cập nhật Flash Sale (Tên, Ngày, Bật/Tắt)
// PUT /api/v1/flash-sales/:id
const updateFlashSale = asyncHandler(async (req, res) => {
  const updatedFlashSale = await flashsaleService.updateFlashSale(req.params.id, req.body);
  res.status(200).json(updatedFlashSale);
});

// 7. Xóa Sách KHỎI Flash Sale
// DELETE /api/v1/flash-sales/:id/remove-product/:productId
const removeProductFromFlashSale = asyncHandler(async (req, res) => {
  await flashsaleService.removeProductFromFlashSale(req.params.id, req.params.productId);
  res.status(200).json({ message: "Removed product from flash sale" });
});

export {
  createFlashSale,
  addProductToFlashSale,
  addMultipleProducts,
  getActiveFlashSale,
  getAllFlashSales,
  deleteFlashSale,
  updateFlashSale,
  removeProductFromFlashSale,
};
