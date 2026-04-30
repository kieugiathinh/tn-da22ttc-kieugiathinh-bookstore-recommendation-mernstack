import Product from "../models/productModel.js";
import mongoose from "mongoose";

const createProduct = async (productData) => {
  const newProduct = new Product(productData);
  try {
    return await newProduct.save();
  } catch (error) {
    throw new Error(error.message || "Không thể tạo sản phẩm");
  }
};

const updateProduct = async (id, productData) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: productData },
    { new: true }
  );
  if (!updatedProduct) throw new Error("Không tìm thấy sản phẩm để cập nhật");
  return updatedProduct;
};

const deleteProduct = async (id) => {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new Error("Không tìm thấy sản phẩm để xóa");
  return product;
};

const getProductById = async (id) => {
  const product = await Product.findById(id).populate("category").lean();
  if (!product) throw new Error("Sản phẩm không tồn tại");
  return product;
};

const getAllProducts = async (queryParms) => {
  const { qNew, qCategory, qSearch, qBestSeller, qTopRated, qRandom } = queryParms;

  if (qRandom) {
    let products = await Product.aggregate([{ $sample: { size: 10 } }]);
    return await Product.populate(products, { path: "category" });
  } 
  
  if (qTopRated) {
    return await Product.find({
      rating: { $gte: 4.0 },
      numReviews: { $gt: 0 },
    })
      .sort({ rating: -1, numReviews: -1 })
      .limit(10)
      .populate("category")
      .lean();
  } 
  
  let filter = {};
  if (qCategory) filter.category = qCategory;
  if (qSearch) filter.title = { $regex: qSearch, $options: "i" };

  let query = Product.find(filter).populate("category").lean();

  if (qNew) {
    query = query.sort({ createdAt: -1 });
  } else if (qBestSeller) {
    query = query.sort({ sold: -1 });
  } else {
    query = query.sort({ createdAt: -1 });
  }
  return await query;
};

const getNewProducts = async () => {
  return await Product.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("category")
    .lean();
};

const getRelatedProducts = async (categoryId, productId) => {
  if (!categoryId || !productId) {
    throw new Error("Thiếu thông tin categoryId hoặc productId");
  }

  let products = await Product.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId),
        _id: { $ne: new mongoose.Types.ObjectId(productId) },
      },
    },
    { $sample: { size: 5 } },
  ]);

  return await Product.populate(products, { path: "category" });
};

export {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
  getNewProducts,
  getRelatedProducts,
};
