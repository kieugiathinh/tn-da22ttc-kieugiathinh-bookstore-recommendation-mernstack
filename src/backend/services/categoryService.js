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
  const categories = await Category.find().sort({ createdAt: -1 }).lean();
  const Product = (await import("../models/productModel.js")).default;
  
  const stats = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 }, sold: { $sum: "$sold" } } }
  ]);

  return categories.map(cat => {
    const stat = stats.find(s => s._id && s._id.toString() === cat._id.toString());
    return {
      ...cat,
      productCount: stat ? stat.count : 0,
      soldCount: stat ? stat.sold : 0
    };
  });
};

const updateCategory = async (id, categoryData) => {
  const { name, description, status, img } = categoryData;
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Không tìm thấy thể loại");
  }

  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (img !== undefined) category.img = img;
  if (status !== undefined) category.status = status;

  return await category.save();
};

const deleteCategory = async (id) => {
  const Product = (await import("../models/productModel.js")).default;
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new Error(`Không thể xóa! Danh mục này đang chứa ${productCount} cuốn sách.`);
  }

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
