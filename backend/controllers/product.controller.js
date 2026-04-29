import Product from "../models/product.model.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

// 1. Create Product
const createProduct = asyncHandler(async (req, res) => {
  const newProduct = new Product(req.body);
  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400);
    throw new Error(error.message || "Không thể tạo sản phẩm");
  }
});

// 2. Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );
  if (!updatedProduct) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm để cập nhật");
  } else {
    res.status(200).json(updatedProduct);
  }
});

// 3. Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Không tìm thấy sản phẩm để xóa");
  } else {
    res.status(200).json({ message: "Đã xóa sản phẩm thành công" });
  }
});

// 4. Get Single Product
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");
  if (!product) {
    res.status(404);
    throw new Error("Sản phẩm không tồn tại");
  } else {
    res.status(200).json(product);
  }
});

// 5. Get All Products
const getAllProducts = asyncHandler(async (req, res) => {
  const qNew = req.query.new;
  const qCategory = req.query.category;
  const qSearch = req.query.search;
  const qBestSeller = req.query.bestseller;
  const qTopRated = req.query.toprated;
  const qRandom = req.query.random;

  try {
    let products;

    if (qRandom) {
      products = await Product.aggregate([{ $sample: { size: 10 } }]);
      products = await Product.populate(products, { path: "category" });
    } else if (qTopRated) {
      products = await Product.find({
        rating: { $gte: 4.0 },
        numReviews: { $gt: 0 },
      })
        .sort({ rating: -1, numReviews: -1 })
        .limit(10)
        .populate("category");
    } else {
      let filter = {};
      if (qCategory) {
        filter.category = qCategory;
      }
      if (qSearch) {
        filter.title = { $regex: qSearch, $options: "i" };
      }

      let query = Product.find(filter).populate("category");

      if (qNew) {
        query = query.sort({ createdAt: -1 });
      } else if (qBestSeller) {
        query = query.sort({ sold: -1 });
      } else {
        query = query.sort({ createdAt: -1 });
      }
      products = await query;
    }
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Lỗi: " + err.message });
  }
});

// 6. Get New Products
const getNewProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("category");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(error);
  }
});

// 7. Get Related Products (FIXED)
const getRelatedProducts = asyncHandler(async (req, res) => {
  const { categoryId, productId } = req.query;

  if (!categoryId || !productId) {
    return res
      .status(400)
      .json({ message: "Thiếu thông tin categoryId hoặc productId" });
  }

  try {
    // Cần import mongoose ở đầu file để dùng mongoose.Types.ObjectId
    let products = await Product.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(categoryId),
          _id: { $ne: new mongoose.Types.ObjectId(productId) },
        },
      },
      { $sample: { size: 5 } },
    ]);

    products = await Product.populate(products, { path: "category" });
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi lấy sách liên quan: " + error.message });
  }
});

export {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getRelatedProducts,
};
