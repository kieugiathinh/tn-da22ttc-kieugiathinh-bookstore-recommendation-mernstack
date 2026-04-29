import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import asyncHandler from "express-async-handler";

// Helper: Lấy khoảng thời gian
const getTimeRange = (type) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (type === "day") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === "week") {
    const day = start.getDay() || 7;
    if (day !== 1) start.setHours(-24 * (day - 1));
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  } else if (type === "all") {
    // Thêm trường hợp lấy tất cả thời gian
    return { start: new Date(0), end: new Date() };
  }
  return { start, end };
};

// 1. KPI TỔNG QUAN (Đã Fix)
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const { start, end } = getTimeRange(type || "month");

  // Đếm tổng số lượng (Toàn thời gian)
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();

  // Tính toán doanh thu và đơn hàng trong khoảng thời gian chọn
  // LƯU Ý: Giả sử status: 3 là Đã hủy. Chỉ tính tiền các đơn CHƯA HỦY.
  const stats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 3 }, // Không tính đơn đã hủy vào doanh thu
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
        avgOrder: { $avg: "$total" },
      },
    },
  ]);

  // Đếm riêng số đơn đã hủy để hiển thị cảnh báo
  const canceled = await Order.countDocuments({
    createdAt: { $gte: start, $lte: end },
    status: 3,
  });

  res.status(200).json({
    users: totalUsers,
    products: totalProducts,
    revenue: stats[0]?.revenue || 0,
    orders: stats[0]?.orders || 0,
    avgOrder: Math.round(stats[0]?.avgOrder || 0),
    canceled,
  });
});

// 2. DATA BIỂU ĐỒ DOANH THU (Giữ nguyên)
export const getRevenueChart = asyncHandler(async (req, res) => {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 3 } } }, // Fix: Không vẽ biểu đồ đơn hủy
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$total" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const result = Array.from({ length: 12 }, (_, i) => {
    const found = data.find((d) => d._id === i + 1);
    return {
      month: `T${i + 1}`,
      revenue: found ? found.total : 0,
      orders: found ? found.count : 0,
    };
  });

  res.status(200).json(result);
});

// 3. SO SÁNH DOANH THU (Giữ nguyên)
export const getRevenueComparison = asyncHandler(async (req, res) => {
  const year1 = parseInt(req.query.year1);
  const year2 = parseInt(req.query.year2);

  const getDataByYear = async (y) => {
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59);
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 3 } } },
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$total" } } },
    ]);
    const arr = Array(12).fill(0);
    data.forEach((d) => (arr[d._id - 1] = d.total));
    return arr;
  };

  const [d1, d2] = await Promise.all([
    getDataByYear(year1),
    getDataByYear(year2),
  ]);
  res.status(200).json({ year1: d1, year2: d2 });
});

// 4. DANH MỤC (Giữ nguyên logic Lookup)
export const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "catInfo",
      },
    },
    { $unwind: "$catInfo" },
    {
      $project: {
        _id: 0,
        name: "$catInfo.name",
        value: "$count",
      },
    },
    { $sort: { value: -1 } },
    // { $limit: 6 }, // Tạm thời bỏ limit để xem hết danh mục nếu muốn test
  ]);
  res.status(200).json(stats);
});

// 5. TRẠNG THÁI ĐƠN HÀNG (Giữ nguyên)
export const getOrderStatusStats = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    { $group: { _id: "$status", value: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.status(200).json(stats);
});

// 6. TOP SẢN PHẨM & TỒN KHO (FIX LỖI NaN)
export const getProductAnalytics = asyncHandler(async (req, res) => {
  const lowStock = await Product.find({ countInStock: { $lt: 10 } })
    .sort({ countInStock: 1 })
    .limit(5)
    .select("title countInStock img originalPrice discountedPrice"); // FIX: Lấy đúng trường giá

  const topSelling = await Product.find()
    .sort({ sold: -1 })
    .limit(5)
    .select("title sold img originalPrice discountedPrice"); // FIX: Lấy đúng trường giá

  res.status(200).json({ lowStock, topSelling });
});

// ... Các hàm khác giữ nguyên
export const getTopCustomers = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: "$userId",
        total: { $sum: "$total" },
        count: { $sum: 1 },
        name: { $first: "$name" }, // Lưu ý: Order phải có trường name, nếu không sẽ null
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);
  res.status(200).json(stats);
});

export const getLatestOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(6);
  res.status(200).json(orders);
});
