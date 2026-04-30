import Category from "../models/categoryModel.js";

const createCategory = async (categoryData) => {
  const { name, description, img } = categoryData;
  const categoryExists = await Category.findOne({ name }).lean();
  if (categoryExists) {
    throw new Error("Thể loại này đã tồn tại");
  }

  const category = await Category.create({
    name,
    description,
    img: img || "",
  });

  if (!category) {
    throw new Error("Dữ liệu thể loại không hợp lệ");
  }
  return category;
};

const getAllCategories = async () => {
  return await Category.find().sort({ createdAt: -1 }).lean();
};

const updateCategory = async (id, categoryData) => {
  const { name, description, status, img } = categoryData;
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Không tìm thấy thể loại");
  }

  if (name) category.name = name;
  if (description) category.description = description;
  if (img !== undefined) category.img = img;
  if (status !== undefined) category.status = status;

  return await category.save();
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new Error("Không tìm thấy thể loại");
  }
  return category;
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id).lean();
  if (!category) {
    throw new Error("Không tìm thấy thể loại");
  }
  return category;
};

export { createCategory, getAllCategories, updateCategory, deleteCategory, getCategoryById };
