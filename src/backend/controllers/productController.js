import asyncHandler from "express-async-handler";
import * as productService from "../services/productService.js";

const createProduct = asyncHandler(async (req, res) => {
  const savedProduct = await productService.createProduct(req.body);
  res.status(201).json(savedProduct);
});

const updateProduct = asyncHandler(async (req, res) => {
  const updatedProduct = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(200).json({ message: "Đã xóa sản phẩm thành công" });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json(product);
});

const trackProductView = asyncHandler(async (req, res) => {
  await productService.incrementViewCount(req.params.id);
  res.status(200).json({ success: true, message: "View count updated" });
});

const getAllProducts = asyncHandler(async (req, res) => {
  const queryParms = {
    qNew: req.query.new,
    qCategory: req.query.category,
    qSearch: req.query.search,
    qBestSeller: req.query.bestseller,
    qTopRated: req.query.toprated,
    qRandom: req.query.random,
  };
  const products = await productService.getAllProducts(queryParms);
  res.status(200).json(products);
});

const getNewProducts = asyncHandler(async (req, res) => {
  const products = await productService.getNewProducts();
  res.status(200).json(products);
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getRelatedProducts(req.query.categoryId, req.query.productId);
  res.status(200).json(products);
});

const getTrendingProducts = asyncHandler(async (req, res) => {
  const period = req.query.period || "all";
  const products = await productService.getTrendingProducts(period);
  res.status(200).json(products);
});

// Auto Fill: Tra cứu thông tin sách từ Google Books API
const autoFillBook = asyncHandler(async (req, res) => {
  const { title } = req.query;
  if (!title) {
    res.status(400);
    throw new Error("Vui lòng nhập tên sách để tra cứu.");
  }

  const bookInfo = await productService.fetchBookInfoFromGoogle(title);
  if (!bookInfo) {
    res.status(404);
    throw new Error("Không tìm thấy thông tin sách trên Google Books.");
  }

  res.status(200).json(bookInfo);
});

export {
  getAllProducts,
  getProduct,
  trackProductView,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getRelatedProducts,
  autoFillBook,
  getTrendingProducts,
};
