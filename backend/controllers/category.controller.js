import Category from "../models/category.model.js"; // Nhớ sửa đường dẫn nếu khác
import asyncHandler from "express-async-handler";

// 1. Tạo thể loại mới
// POST /api/v1/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, img } = req.body;

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error("Thể loại này đã tồn tại");
  }

  const category = await Category.create({
    name,
    description,
    img: img || "",
  });

  if (category) {
    res.status(201).json(category);
  } else {
    res.status(400);
    throw new Error("Dữ liệu thể loại không hợp lệ");
  }
});

// 2. Lấy tất cả thể loại
// GET /api/v1/categories
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.status(200).json(categories);
});

// 3. Cập nhật thể loại
// PUT /api/v1/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, status, img } = req.body;
  const category = await Category.findById(req.params.id);

  if (category) {
    category.name = name || category.name;
    category.description = description || category.description;

    if (img !== undefined) category.img = img;
    if (status !== undefined) category.status = status;

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy thể loại");
  }
});

// 4. Xóa thể loại
// DELETE /api/v1/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (category) {
    res.status(200).json({ message: "Đã xóa thể loại thành công" });
  } else {
    res.status(404);
    throw new Error("Không tìm thấy thể loại");
  }
});

// 5. Lấy chi tiết 1 thể loại (Optional - dùng khi cần sửa)
// GET /api/v1/categories/:id
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (category) {
    res.status(200).json(category);
  } else {
    res.status(404);
    throw new Error("Không tìm thấy thể loại");
  }
});

export {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
