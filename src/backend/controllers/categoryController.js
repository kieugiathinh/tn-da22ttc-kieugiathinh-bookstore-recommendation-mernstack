import asyncHandler from "express-async-handler";
import * as categoryService from "../services/categoryService.js";

// 1. Tạo thể loại mới
// POST /api/v1/categories
const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(category);
});

// 2. Lấy tất cả thể loại
// GET /api/v1/categories
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories();
  res.status(200).json(categories);
});

// 3. Cập nhật thể loại
// PUT /api/v1/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const updatedCategory = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(updatedCategory);
});

// 4. Xóa thể loại
// DELETE /api/v1/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(200).json({ message: "Đã xóa thể loại thành công" });
});

// 5. Lấy chi tiết 1 thể loại (Optional - dùng khi cần sửa)
// GET /api/v1/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.status(200).json(category);
});

export {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
