import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";
import * as flashsaleService from "./flashsaleService.js";

dotenv.config();

/**
 * Gọi Google Books API để lấy thông tin sách theo tên.
 * Trả về object chứa các trường cần thiết hoặc null nếu không tìm thấy.
 */
const fetchBookInfoFromGoogle = async (title) => {
  try {
    const params = {
      q: `intitle:${title}`,
      maxResults: 1,
    };

    // Nếu có API Key → gắn vào để tránh bị rate limit
    if (process.env.GOOGLE_BOOKS_API_KEY) {
      params.key = process.env.GOOGLE_BOOKS_API_KEY;
    }

    const response = await axios.get(
      "https://www.googleapis.com/books/v1/volumes",
      { params, timeout: 10000 }
    );

    if (!response.data.totalItems || !response.data.items?.length) {
      return null;
    }

    const volumeInfo = response.data.items[0].volumeInfo;

    return {
      title: volumeInfo.title || "",
      authors: Array.isArray(volumeInfo.authors)
        ? volumeInfo.authors.join(", ")
        : volumeInfo.authors || "",
      description: volumeInfo.description || "",
      publisher: volumeInfo.publisher || "",
      publishedDate: volumeInfo.publishedDate || "",
      pageCount: volumeInfo.pageCount || 0,
      thumbnail: volumeInfo.imageLinks?.thumbnail || "",
    };
  } catch (error) {
    console.error("Google Books API Error:", error.message);

    // Lỗi 429: Quota exceeded
    if (error.response?.status === 429) {
      throw new Error(
        "Google Books API đã hết quota. Vui lòng thêm API Key hoặc thử lại sau."
      );
    }

    throw new Error(
      error.response?.data?.error?.message ||
        "Không thể kết nối tới Google Books API. Vui lòng thử lại."
    );
  }
};

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
  return await flashsaleService.attachFlashSaleToProducts(product);
};

const getAllProducts = async (queryParms) => {
  const { qNew, qCategory, qSearch, qBestSeller, qTopRated, qRandom } = queryParms;

  if (qRandom) {
    let products = await Product.aggregate([{ $sample: { size: 10 } }]);
    return await Product.populate(products, { path: "category" });
  } 
  
  if (qTopRated) {
    const products = await Product.find({
      rating: { $gte: 4.0 },
      numReviews: { $gt: 0 },
    })
      .sort({ rating: -1, numReviews: -1 })
      .limit(10)
      .populate("category")
      .lean();
    return await flashsaleService.attachFlashSaleToProducts(products);
  }
  
  let filter = {};
  if (qCategory) {
    const categories = qCategory.split(",");
    filter.category = { $in: categories };
  }
  if (qSearch) filter.title = { $regex: qSearch, $options: "i" };

  let query = Product.find(filter).populate("category").lean();

  if (qNew) {
    query = query.sort({ createdAt: -1 });
  } else if (qBestSeller) {
    query = query.sort({ sold: -1 });
  } else {
    query = query.sort({ createdAt: -1 });
  }
  const products = await query;
  return await flashsaleService.attachFlashSaleToProducts(products);
};

const getNewProducts = async () => {
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("category")
    .lean();
  return await flashsaleService.attachFlashSaleToProducts(products);
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

  const populatedProducts = await Product.populate(products, { path: "category" });
  return await flashsaleService.attachFlashSaleToProducts(populatedProducts);
};

const getTrendingProducts = async (period) => {
  // Trạng thái đơn hàng: 1 (PROCESSING), 2 (DELIVERED)
  let matchStage = { status: { $in: [1, 2] } };
  
  if (period && period !== "all") {
    const now = new Date();
    let startDate = new Date();
    if (period === "day") startDate.setDate(now.getDate() - 1);
    else if (period === "week") startDate.setDate(now.getDate() - 7);
    else if (period === "month") startDate.setMonth(now.getMonth() - 1);
    else if (period === "year") startDate.setFullYear(now.getFullYear() - 1);
    
    matchStage.createdAt = { $gte: startDate };
  }

  const trendingAggregation = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.productId",
        totalSold: { $sum: "$products.quantity" }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 }
  ]);

  // Fallback: Nếu không có đơn hàng nào trong khoảng thời gian đó, lấy best seller mặc định
  if (trendingAggregation.length === 0) {
    const fallbackProducts = await Product.find()
      .sort({ sold: -1 })
      .limit(10)
      .populate("category")
      .lean();
    return await flashsaleService.attachFlashSaleToProducts(fallbackProducts);
  }

  const productIds = trendingAggregation.map(item => item._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .populate("category")
    .lean();

  // Map lại mảng theo đúng thứ tự đã sort
  const sortedProducts = trendingAggregation.map(item => {
    const p = products.find(p => p._id.toString() === item._id.toString());
    if (p) {
      // Clone object to avoid modifying the original if it's cached, though lean() makes it a plain object
      return { ...p, periodSold: item.totalSold };
    }
    return null;
  }).filter(p => p != null);

  return await flashsaleService.attachFlashSaleToProducts(sortedProducts);
};

export {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
  getNewProducts,
  getRelatedProducts,
  fetchBookInfoFromGoogle,
  getTrendingProducts,
};
