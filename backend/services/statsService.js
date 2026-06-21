import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Category from "../models/categoryModel.js";
import FlashSale from "../models/flashsaleModel.js";

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
    return { start: new Date(0), end: new Date() };
  }
  return { start, end };
};

const getDashboardStats = async (type) => {
  const { start, end } = getTimeRange(type || "month");

  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();

  const stats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: { $ne: 5 }, // 5 = Đã hủy (hệ thống mới)
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

  const canceled = await Order.countDocuments({
    createdAt: { $gte: start, $lte: end },
    status: 5, // 5 = Đã hủy
  });

  return {
    users: totalUsers,
    products: totalProducts,
    revenue: stats[0]?.revenue || 0,
    orders: stats[0]?.orders || 0,
    avgOrder: Math.round(stats[0]?.avgOrder || 0),
    canceled,
  };
};

const getRevenueChart = async () => {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const data = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 3 } } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$total" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return Array.from({ length: 12 }, (_, i) => {
    const found = data.find((d) => d._id === i + 1);
    return {
      month: `T${i + 1}`,
      revenue: found ? found.total : 0,
      orders: found ? found.count : 0,
    };
  });
};

const getRevenueComparison = async (year1, year2) => {
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
  return { year1: d1, year2: d2 };
};

const getCategoryStats = async () => {
  return await Product.aggregate([
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
  ]);
};

const getOrderStatusStats = async () => {
  return await Order.aggregate([
    { $group: { _id: "$status", value: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

const getProductAnalytics = async () => {
  const lowStock = await Product.find({ countInStock: { $lt: 10 } })
    .sort({ countInStock: 1 })
    .limit(5)
    .select("title countInStock img originalPrice discountedPrice")
    .lean();

  const topSelling = await Product.find()
    .sort({ sold: -1 })
    .limit(5)
    .select("title sold img originalPrice discountedPrice")
    .lean();

  return { lowStock, topSelling };
};

const getTopCustomers = async () => {
  return await Order.aggregate([
    {
      $group: {
        _id: "$userId",
        total: { $sum: "$total" },
        count: { $sum: 1 },
        name: { $first: "$name" },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);
};

const getLatestOrders = async () => {
  return await Order.find().sort({ createdAt: -1 }).limit(6).lean();
};

// ─── THỐNG KÊ KHÁCH HÀNG ───────────────────────────────────────────────────────
const getUserAnalytics = async (type) => {
  const { start, end } = getTimeRange(type || "month");

  // 1. Tổng số khách hàng
  const totalUsers = await User.countDocuments({ role: 0 });

  // 2. Khách hàng mới trong kỳ
  const newUsers = await User.countDocuments({
    role: 0,
    createdAt: { $gte: start, $lte: end },
  });

  // 3. Khách hàng đã từng mua (có đơn hàng không bị hủy)
  const buyerIds = await Order.distinct("userId", { status: { $ne: 5 } });
  const totalBuyers = buyerIds.length;

  // 4. Khách hàng chưa mua
  const neverBought = totalUsers - totalBuyers;

  // 5. Tỷ lệ quay lại (khách đặt >= 2 đơn)
  const repeatBuyers = await Order.aggregate([
    { $match: { status: { $ne: 5 } } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $match: { count: { $gte: 2 } } },
    { $count: "total" },
  ]);
  const repeatCount = repeatBuyers[0]?.total || 0;
  const returnRate = totalBuyers > 0 ? Math.round((repeatCount / totalBuyers) * 100) : 0;

  // 6. Top 10 khách hàng VIP
  const topCustomers = await Order.aggregate([
    { $match: { status: { $ne: 5 } } },
    {
      $group: {
        _id: "$userId",
        totalSpent: { $sum: "$total" },
        orderCount: { $sum: 1 },
        name: { $first: "$name" },
        email: { $first: "$email" },
        lastOrder: { $max: "$createdAt" },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
  ]);

  // 7. Danh sách khách chưa mua (tối đa 20 người)
  const allUserIds = await User.find({ role: 0 }).select("_id fullname email createdAt").limit(100).lean();
  const buyerIdSet = new Set(buyerIds.map(String));
  const neverBoughtList = allUserIds
    .filter(u => !buyerIdSet.has(String(u._id)))
    .slice(0, 20);

  // 8. Khách hàng mới theo tháng (năm hiện tại)
  const currentYear = new Date().getFullYear();
  const newByMonth = await User.aggregate([
    {
      $match: {
        role: 0,
        createdAt: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31, 23, 59, 59) },
      },
    },
    { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const newUsersByMonth = Array.from({ length: 12 }, (_, i) => {
    const found = newByMonth.find(d => d._id === i + 1);
    return { month: `T${i + 1}`, count: found ? found.count : 0 };
  });

  return {
    totalUsers,
    newUsers,
    totalBuyers,
    neverBought,
    returnRate,
    topCustomers,
    neverBoughtList,
    newUsersByMonth,
    repeatCount,
  };
};

// ─── THỐNG KÊ ĐƠN HÀNG ──────────────────────────────────────────────────────────
const getOrderAnalytics = async (type) => {
  const { start, end } = getTimeRange(type || "month");
  const now = new Date();

  // 1. Tổng số đơn trong kỳ
  const totalOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });

  // 2. Đơn đã giao (status=4) — dùng làm doanh thu thực
  const deliveredOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 4 });

  // 3. Đơn đã hủy
  const canceledOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 5 });

  // 4. Đơn đang xử lý (0..3)
  const processingOrders = await Order.countDocuments({
    createdAt: { $gte: start, $lte: end },
    status: { $in: [0, 1, 2, 3] },
  });

  // 5. Doanh thu thực tế (chỉ đơn đã giao)
  const revenueResult = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: 4 } },
    { $group: { _id: null, total: { $sum: "$total" }, avgOrder: { $avg: "$total" } } },
  ]);
  const revenue = revenueResult[0]?.total || 0;
  const avgOrderValue = Math.round(revenueResult[0]?.avgOrder || 0);

  // 6. Tỷ lệ hủy
  const cancelRate = totalOrders > 0 ? Math.round((canceledOrders / totalOrders) * 100) : 0;

  // 7. Phân bố theo trạng thái
  const statusDistribution = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // 8. Doanh thu theo ngày (30 ngày gần nhất)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const dailyRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 4 } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  // Map 30 ngày, điền 0 nếu không có
  const dailyMap = {};
  dailyRevenue.forEach(d => {
    const key = `${d._id.year}-${String(d._id.month).padStart(2, "0")}-${String(d._id.day).padStart(2, "0")}`;
    dailyMap[key] = { revenue: d.revenue, orders: d.orders };
  });

  const revenueByDay = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(thirtyDaysAgo);
    date.setDate(thirtyDaysAgo.getDate() + i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      revenue: dailyMap[key]?.revenue || 0,
      orders: dailyMap[key]?.orders || 0,
    };
  });

  // 9. Phân bố phương thức thanh toán
  const paymentDistribution = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$total" } } },
    { $sort: { count: -1 } },
  ]);

  // 10. Top 5 sản phẩm được đặt nhiều nhất trong kỳ
  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 5 } } },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.productId",
        title: { $first: "$products.title" },
        img: { $first: "$products.img" },
        totalQty: { $sum: "$products.quantity" },
        totalRevenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: 5 },
  ]);

  return {
    totalOrders,
    deliveredOrders,
    canceledOrders,
    processingOrders,
    revenue,
    avgOrderValue,
    cancelRate,
    statusDistribution,
    revenueByDay,
    paymentDistribution,
    topProducts,
  };
};

// ─── THỐNG KÊ SÁCH ────────────────────────────────────────────────────────────
const getProductStatsAnalytics = async () => {
  // 1. Tổng quan kho
  const totalProducts  = await Product.countDocuments();
  const outOfStock     = await Product.countDocuments({ countInStock: 0 });
  const lowStock       = await Product.countDocuments({ countInStock: { $gt: 0, $lte: 10 } });
  const inStock        = totalProducts - outOfStock - lowStock;

  // 2. Tổng tồn kho + tổng đã bán
  const summaryResult = await Product.aggregate([
    { $group: { _id: null, totalStock: { $sum: "$countInStock" }, totalSold: { $sum: "$sold" } } },
  ]);
  const totalStock = summaryResult[0]?.totalStock ?? 0;
  const totalSold  = summaryResult[0]?.totalSold ?? 0;

  // 3. Top 10 bán chạy
  const topSelling = await Product.find({ sold: { $gt: 0 } })
    .sort({ sold: -1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold countInStock originalPrice discountedPrice rating numReviews category")
    .lean();

  // 4. Bán ế / không bán được (sold = 0 và đã thêm > 30 ngày)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const slowMoving = await Product.find({ sold: 0, createdAt: { $lte: thirtyDaysAgo } })
    .sort({ countInStock: -1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold countInStock originalPrice discountedPrice createdAt category")
    .lean();

  // 5. Sách sắp hết hàng (1–10 cuốn, bán nhiều nhất) → cần nhập thêm
  const needRestock = await Product.find({ countInStock: { $gt: 0, $lte: 10 } })
    .sort({ sold: -1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold countInStock originalPrice discountedPrice category")
    .lean();

  // 6. Phân bố theo thể loại (số lượng đầu sách + tổng tồn kho)
  const categoryDistribution = await Product.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "catInfo",
      },
    },
    { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$catInfo.name",
        count: { $sum: 1 },
        totalSold: { $sum: "$sold" },
        totalStock: { $sum: "$countInStock" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // 7. Sản phẩm đánh giá cao nhất (rating >= 4)
  const topRated = await Product.find({ numReviews: { $gte: 1 }, rating: { $gte: 4 } })
    .sort({ rating: -1, numReviews: -1 })
    .limit(5)
    .populate("category", "name")
    .select("title author img rating numReviews sold originalPrice discountedPrice category")
    .lean();

  return {
    totalProducts,
    outOfStock,
    lowStock,
    inStock,
    totalStock,
    totalSold,
    topSelling,
    slowMoving,
    needRestock,
    categoryDistribution,
    topRated,
  };
};

const getFlashSaleStatsAnalytics = async () => {
  const allFlashSales = await FlashSale.find({}).lean();
  
  const productStatsMap = {}; 
  
  let totalRevenue = 0;
  let totalCampaigns = allFlashSales.length;

  for (const fs of allFlashSales) {
    for (const item of fs.products) {
      const pId = item.product.toString();
      if (!productStatsMap[pId]) {
        productStatsMap[pId] = { soldCount: 0, quantityLimit: 0, revenue: 0 };
      }
      productStatsMap[pId].soldCount += item.soldCount;
      productStatsMap[pId].quantityLimit += item.quantityLimit;
      productStatsMap[pId].revenue += (item.soldCount * item.discountPrice);
      totalRevenue += (item.soldCount * item.discountPrice);
    }
  }

  const productIds = Object.keys(productStatsMap);
  const productsInfo = await Product.find({ _id: { $in: productIds } }).select("title img countInStock originalPrice").lean();
  
  const productStatsList = productsInfo.map(p => {
    const stat = productStatsMap[p._id.toString()];
    return {
      _id: p._id,
      title: p.title,
      img: p.img,
      countInStock: p.countInStock,
      originalPrice: p.originalPrice,
      soldCount: stat.soldCount,
      quantityLimit: stat.quantityLimit,
      revenue: stat.revenue,
      sellThroughRate: stat.quantityLimit > 0 ? (stat.soldCount / stat.quantityLimit) * 100 : 0
    };
  });

  const topSoldProducts = [...productStatsList].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5);

  const slowSellingProducts = [...productStatsList]
    .filter(p => p.quantityLimit > 0)
    .sort((a, b) => a.sellThroughRate - b.sellThroughRate)
    .slice(0, 5);

  const recommendedForSale = await Product.aggregate([
    { $match: { countInStock: { $gte: 10 }, sold: { $lte: 5 } } },
    { $sort: { createdAt: 1 } },
    { $limit: 10 },
    { $project: { title: 1, img: 1, originalPrice: 1, countInStock: 1, sold: 1 } }
  ]);

  return {
    totalCampaigns,
    totalRevenue,
    topSoldProducts,
    slowSellingProducts,
    recommendedForSale,
  };
};

export {
  getDashboardStats,
  getRevenueChart,
  getRevenueComparison,
  getCategoryStats,
  getOrderStatusStats,
  getProductAnalytics,
  getTopCustomers,
  getLatestOrders,
  getUserAnalytics,
  getOrderAnalytics,
  getProductStatsAnalytics,
  getFlashSaleStatsAnalytics,
};
