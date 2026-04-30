import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

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
        status: { $ne: 3 },
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
    status: 3,
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

export {
  getDashboardStats,
  getRevenueChart,
  getRevenueComparison,
  getCategoryStats,
  getOrderStatusStats,
  getProductAnalytics,
  getTopCustomers,
  getLatestOrders,
};
