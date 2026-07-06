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

const getPreviousTimeRange = (type, currentStart) => {
  const start = new Date(currentStart);
  const end = new Date(currentStart);
  end.setMilliseconds(-1);

  if (type === "day") {
    start.setDate(start.getDate() - 1);
  } else if (type === "week") {
    start.setDate(start.getDate() - 7);
  } else if (type === "month") {
    start.setMonth(start.getMonth() - 1);
  } else if (type === "year") {
    start.setFullYear(start.getFullYear() - 1);
  } else if (type === "all") {
    return { start: new Date(0), end: new Date(0) }; // Không có kỳ trước cho All
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
    { $match: { createdAt: { $gte: start, $lte: end }, status: { $ne: 5 } } },
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
    const revenue = found ? found.total : 0;
    const orders = found ? found.count : 0;
    return {
      month: `T${i + 1}`,
      revenue,
      orders,
      aov: orders > 0 ? Math.round(revenue / orders) : 0,
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
  // Aggregate doanh thu thực tế theo danh mục từ đơn hàng đã giao
  const revenueByCategory = await Order.aggregate([
    { $match: { status: 4 } }, // chỉ đơn đã giao
    { $unwind: "$products" },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$productInfo.category",
        revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
        sold: { $sum: "$products.quantity" },
        orders: { $addToSet: "$_id" },
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
    { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        name: { $ifNull: ["$catInfo.name", "Chưa phân loại"] },
        value: "$revenue", // giữ 'value' để tương thích Home.jsx
        revenue: "$revenue",
        sold: "$sold",
        orders: { $size: "$orders" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  // Nếu không có doanh thu, fallback theo số sách
  if (revenueByCategory.length === 0) {
    return await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "catInfo" } },
      { $unwind: "$catInfo" },
      { $project: { _id: 0, name: "$catInfo.name", value: "$count", revenue: 0, sold: 0, orders: 0 } },
      { $sort: { value: -1 } },
    ]);
  }
  return revenueByCategory;
};

const getOrderStatusStats = async () => {
  const STATUS_LABELS = {
    0: "Chờ xác nhận",
    1: "Đã xác nhận",
    2: "Đang chuẩn bị",
    3: "Đang giao",
    4: "Đã giao",
    5: "Đã hủy",
  };
  const STATUS_COLORS = {
    0: "#fbbf24", // amber
    1: "#3b82f6", // blue
    2: "#8b5cf6", // violet
    3: "#06b6d4", // cyan
    4: "#10b981", // emerald
    5: "#ef4444", // red
  };
  const raw = await Order.aggregate([
    { $group: { _id: "$status", value: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  return raw.map(item => ({
    _id: item._id,
    name: STATUS_LABELS[item._id] ?? "Khác",
    value: item.value,
    color: STATUS_COLORS[item._id] ?? "#94a3b8",
  }));
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
  const { start: prevStart, end: prevEnd } = getPreviousTimeRange(type || "month", start);

  // 1. Tổng khách hàng hiện tại (đăng ký tính đến end)
  const allUsers = await User.find({ role: 0, createdAt: { $lte: end } }).select("_id createdAt").lean();
  const totalUsers = allUsers.length;
  const allUserIdsSet = new Set(allUsers.map(u => u._id.toString()));

  const prevTotalUsers = allUsers.filter(u => u.createdAt <= prevEnd).length;

  // 2. Khách hàng mới trong kỳ
  const newUsers = allUsers.filter(u => u.createdAt >= start && u.createdAt <= end).length;
  const prevNewUsers = allUsers.filter(u => u.createdAt >= prevStart && u.createdAt <= prevEnd).length;

  // 3. Khách hàng đã mua (tính đến end) -> Để tính "chưa mua toàn hệ thống"
  const allOrdersToEnd = await Order.find({ createdAt: { $lte: end }, status: { $ne: 5 } }).select("userId createdAt total name email").lean();
  const allBuyersSet = new Set(allOrdersToEnd.map(o => o.userId?.toString()).filter(Boolean));
  const validBuyersToEnd = [...allBuyersSet].filter(id => allUserIdsSet.has(id));
  const totalBuyersToEnd = validBuyersToEnd.length;

  // 4. Khách chưa mua toàn hệ thống
  const neverBought = totalUsers - totalBuyersToEnd;
  
  const allOrdersToPrevEnd = allOrdersToEnd.filter(o => o.createdAt <= prevEnd);
  const prevBuyersSet = new Set(allOrdersToPrevEnd.map(o => o.userId?.toString()).filter(Boolean));
  const prevValidBuyers = [...prevBuyersSet].filter(id => allUserIdsSet.has(id));
  const prevNeverBought = prevTotalUsers - prevValidBuyers.length;

  // 5. Khách mua trong kỳ (để phân tích mua lần đầu/quay lại)
  const ordersInPeriod = allOrdersToEnd.filter(o => o.createdAt >= start && o.createdAt <= end);
  const buyersInPeriodSet = new Set(ordersInPeriod.map(o => o.userId?.toString()).filter(Boolean));
  const validBuyersInPeriod = [...buyersInPeriodSet].filter(id => allUserIdsSet.has(id));
  const totalBuyersInPeriod = validBuyersInPeriod.length;

  const orderCountByUserId = {};
  allOrdersToEnd.forEach(o => {
    const uid = o.userId?.toString();
    if(uid) orderCountByUserId[uid] = (orderCountByUserId[uid] || 0) + 1;
  });

  const repeatCount = validBuyersInPeriod.filter(id => orderCountByUserId[id] >= 2).length;
  const returnRate = totalBuyersInPeriod > 0 ? Math.round((repeatCount / totalBuyersInPeriod) * 100) : 0;

  const ordersInPrevPeriod = allOrdersToPrevEnd.filter(o => o.createdAt >= prevStart && o.createdAt <= prevEnd);
  const buyersInPrevPeriodSet = new Set(ordersInPrevPeriod.map(o => o.userId?.toString()).filter(Boolean));
  const validBuyersInPrevPeriod = [...buyersInPrevPeriodSet].filter(id => allUserIdsSet.has(id));
  
  const orderCountByUserIdPrev = {};
  allOrdersToPrevEnd.forEach(o => {
    const uid = o.userId?.toString();
    if(uid) orderCountByUserIdPrev[uid] = (orderCountByUserIdPrev[uid] || 0) + 1;
  });
  const prevRepeatCount = validBuyersInPrevPeriod.filter(id => orderCountByUserIdPrev[id] >= 2).length;
  const prevReturnRate = validBuyersInPrevPeriod.length > 0 ? Math.round((prevRepeatCount / validBuyersInPrevPeriod.length) * 100) : 0;

  const calcChange = (cur, prev) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const changes = {
    totalUsers: calcChange(totalUsers, prevTotalUsers),
    newUsers: calcChange(newUsers, prevNewUsers),
    neverBought: calcChange(neverBought, prevNeverBought),
    returnRate: returnRate - prevReturnRate, // Absolute diff
  };

  // 6. Top 10 khách hàng VIP (luỹ kế đến end)
  const topMap = {};
  allOrdersToEnd.forEach(o => {
    const uid = o.userId?.toString();
    if(uid && allUserIdsSet.has(uid)) {
      if(!topMap[uid]) {
        topMap[uid] = { _id: uid, totalSpent: 0, orderCount: 0, name: o.name, email: o.email, lastOrder: o.createdAt };
      }
      topMap[uid].totalSpent += o.total;
      topMap[uid].orderCount += 1;
      if (o.createdAt > topMap[uid].lastOrder) topMap[uid].lastOrder = o.createdAt;
      if (o.name && !topMap[uid].name) topMap[uid].name = o.name;
    }
  });
  const validTopCustomers = Object.values(topMap).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
  const finalTopCustomers = validTopCustomers.map(c => ({
    ...c,
    avgOrder: Math.round(c.totalSpent / c.orderCount)
  }));

  // 7. Danh sách khách chưa mua toàn hệ thống
  const neverBoughtSet = new Set([...allUserIdsSet].filter(x => !allBuyersSet.has(x)));
  const neverBoughtListFull = await User.find({ _id: { $in: Array.from(neverBoughtSet) } })
    .select("_id fullname email createdAt")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const nowTime = new Date().getTime();
  const neverBoughtList = neverBoughtListFull.map(u => ({
    ...u,
    daysSinceRegister: Math.floor((nowTime - new Date(u.createdAt).getTime()) / (1000 * 3600 * 24)),
    source: "Website"
  }));

  // 8. Biểu đồ Khách mới & Khách quay lại theo thời gian
  const timeChartData = [];
  if (type === "year" || type === "all") {
    const yearToUse = type === "year" ? start.getFullYear() : new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(yearToUse, i, 1);
      const monthEnd = new Date(yearToUse, i + 1, 0, 23, 59, 59);
      const newU = allUsers.filter(u => u.createdAt >= monthStart && u.createdAt <= monthEnd).length;
      
      const ordersInMonth = allOrdersToEnd.filter(o => o.createdAt >= monthStart && o.createdAt <= monthEnd);
      const buyersInMonth = [...new Set(ordersInMonth.map(o => o.userId?.toString()).filter(Boolean))].filter(id => allUserIdsSet.has(id));
      const returningAccurate = buyersInMonth.filter(id => {
         const count = allOrdersToEnd.filter(o => o.userId?.toString() === id && o.createdAt <= monthEnd).length;
         return count >= 2;
      }).length;
      const newBuyers = buyersInMonth.length - returningAccurate;

      timeChartData.push({
        time: `T${i + 1}`,
        newUsers: newU,
        newBuyers: newBuyers,
        returning: returningAccurate
      });
    }
  } else {
    const days = Math.round((end - start) / (1000 * 3600 * 24));
    for (let i = 0; i <= days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dStart = new Date(d); dStart.setHours(0,0,0,0);
      const dEnd = new Date(d); dEnd.setHours(23,59,59,999);
      if (dStart > end) break;

      const newU = allUsers.filter(u => u.createdAt >= dStart && u.createdAt <= dEnd).length;
      const ordersInDay = allOrdersToEnd.filter(o => o.createdAt >= dStart && o.createdAt <= dEnd);
      const buyersInDay = [...new Set(ordersInDay.map(o => o.userId?.toString()).filter(Boolean))].filter(id => allUserIdsSet.has(id));
      const returningAccurate = buyersInDay.filter(id => {
         const count = allOrdersToEnd.filter(o => o.userId?.toString() === id && o.createdAt <= dEnd).length;
         return count >= 2;
      }).length;
      const newBuyers = buyersInDay.length - returningAccurate;

      timeChartData.push({
        time: `${d.getDate()}/${d.getMonth() + 1}`,
        newUsers: newU,
        newBuyers: newBuyers,
        returning: returningAccurate
      });
    }
  }

  return {
    totalUsers,
    newUsers,
    totalBuyers: totalBuyersToEnd,
    neverBought,
    returnRate,
    repeatCount,
    changes,
    topCustomers: finalTopCustomers,
    neverBoughtList,
    timeChartData,
  };
};

// ─── THỐNG KÊ ĐƠN HÀNG ──────────────────────────────────────────────────────────
// ─── THỐNG KÊ ĐƠN HÀNG ──────────────────────────────────────────────────────────
const getOrderAnalytics = async (type) => {
  const { start, end } = getTimeRange(type || "month");
  const { start: prevStart, end: prevEnd } = getPreviousTimeRange(type || "month", start);

  // --- KỲ HIỆN TẠI ---
  const totalOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });
  const deliveredOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 4 });
  const canceledOrders = await Order.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 5 });
  const processingOrders = await Order.countDocuments({
    createdAt: { $gte: start, $lte: end },
    status: { $in: [0, 1, 2, 3] },
  });

  const revenueResult = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: 4 } },
    { $group: { _id: null, total: { $sum: "$total" }, avgOrder: { $avg: "$total" } } },
  ]);
  const revenue = revenueResult[0]?.total || 0;
  const avgOrderValue = Math.round(revenueResult[0]?.avgOrder || 0);
  const cancelRate = totalOrders > 0 ? Math.round((canceledOrders / totalOrders) * 100) : 0;

  // --- KỲ TRƯỚC ---
  const prevTotalOrders = await Order.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd } });
  const prevDeliveredOrders = await Order.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd }, status: 4 });
  const prevCanceledOrders = await Order.countDocuments({ createdAt: { $gte: prevStart, $lte: prevEnd }, status: 5 });
  
  const prevRevenueResult = await Order.aggregate([
    { $match: { createdAt: { $gte: prevStart, $lte: prevEnd }, status: 4 } },
    { $group: { _id: null, total: { $sum: "$total" }, avgOrder: { $avg: "$total" } } },
  ]);
  const prevRevenue = prevRevenueResult[0]?.total || 0;
  const prevAvgOrderValue = Math.round(prevRevenueResult[0]?.avgOrder || 0);
  const prevCancelRate = prevTotalOrders > 0 ? Math.round((prevCanceledOrders / prevTotalOrders) * 100) : 0;

  const calcChange = (cur, prev) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const changes = {
    revenue: calcChange(revenue, prevRevenue),
    totalOrders: calcChange(totalOrders, prevTotalOrders),
    avgOrderValue: calcChange(avgOrderValue, prevAvgOrderValue),
    cancelRate: cancelRate - prevCancelRate, // Absolute change for %
  };

  // 7. Phân bố theo trạng thái
  const statusDistribution = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // 8 & Biểu đồ Status theo thời gian (Đồng bộ bộ lọc thời gian)
  const allOrdersInPeriod = await Order.find({ createdAt: { $gte: start, $lte: end } }).select("status total createdAt").lean();
  
  const revenueOverTime = [];
  const statusByTime = [];

  if (type === "year" || type === "all") {
    const yearToUse = type === "year" ? start.getFullYear() : new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(yearToUse, i, 1);
      const monthEnd = new Date(yearToUse, i + 1, 0, 23, 59, 59);
      
      const ordersInMonth = allOrdersInPeriod.filter(o => o.createdAt >= monthStart && o.createdAt <= monthEnd);
      const delivered = ordersInMonth.filter(o => o.status === 4);
      const processing = ordersInMonth.filter(o => o.status >= 0 && o.status <= 3);
      const canceled = ordersInMonth.filter(o => o.status === 5);

      const rev = delivered.reduce((sum, o) => sum + o.total, 0);

      revenueOverTime.push({
        time: `T${i + 1}`,
        revenue: rev,
        orders: ordersInMonth.length,
      });

      statusByTime.push({
        time: `T${i + 1}`,
        delivered: delivered.length,
        processing: processing.length,
        canceled: canceled.length,
      });
    }
  } else {
    const days = Math.round((end - start) / (1000 * 3600 * 24));
    for (let i = 0; i <= days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dStart = new Date(d); dStart.setHours(0,0,0,0);
      const dEnd = new Date(d); dEnd.setHours(23,59,59,999);
      if (dStart > end) break;

      const ordersInDay = allOrdersInPeriod.filter(o => o.createdAt >= dStart && o.createdAt <= dEnd);
      const delivered = ordersInDay.filter(o => o.status === 4);
      const processing = ordersInDay.filter(o => o.status >= 0 && o.status <= 3);
      const canceled = ordersInDay.filter(o => o.status === 5);

      const rev = delivered.reduce((sum, o) => sum + o.total, 0);

      revenueOverTime.push({
        time: `${d.getDate()}/${d.getMonth() + 1}`,
        revenue: rev,
        orders: ordersInDay.length,
      });

      statusByTime.push({
        time: `${d.getDate()}/${d.getMonth() + 1}`,
        delivered: delivered.length,
        processing: processing.length,
        canceled: canceled.length,
      });
    }
  }

  // 9. Phân bố phương thức thanh toán (CHỈ TÍNH ĐƠN ĐÃ GIAO)
  const paymentDistribution = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: 4 } },
    { $group: { _id: "$paymentMethod", count: { $sum: 1 }, revenue: { $sum: "$total" } } },
    { $sort: { revenue: -1 } },
  ]);

  return {
    totalOrders,
    deliveredOrders,
    canceledOrders,
    processingOrders,
    revenue,
    avgOrderValue,
    cancelRate,
    changes,
    statusDistribution,
    revenueOverTime,
    statusByTime,
    paymentDistribution,
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

  // 8. Sách cần nhập thêm: sold cao + tồn thấp + rating ổn
  const restockRecommended = await Product.find({
    countInStock: { $gt: 0, $lte: 15 },
    sold: { $gt: 5 },
    rating: { $gte: 3.5 },
    status: "active",
  })
    .sort({ sold: -1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold countInStock originalPrice discountedPrice rating numReviews category")
    .lean();

  // 9. Sách view cao nhưng bán thấp (tỉ lệ chuyển đổi kém)
  const highViewLowSold = await Product.find({
    viewCount: { $gt: 10 },
    status: "active",
  })
    .sort({ viewCount: -1 })
    .limit(20)
    .populate("category", "name")
    .select("title author img sold viewCount countInStock originalPrice discountedPrice rating numReviews category")
    .lean();
  // Tính conversion rate và lọc những sách có CR thấp
  const lowConversionProducts = highViewLowSold
    .map(p => ({
      ...p,
      conversionRate: p.viewCount > 0 ? ((p.sold / p.viewCount) * 100).toFixed(1) : "0.0",
    }))
    .filter(p => parseFloat(p.conversionRate) < 5) // Dưới 5% conversion
    .slice(0, 10);

  // 10. Sách rating thấp (cần kiểm tra)
  const lowRatedProducts = await Product.find({
    numReviews: { $gte: 3 },
    rating: { $gt: 0, $lt: 3.5 },
    status: "active",
  })
    .sort({ rating: 1, numReviews: -1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold rating numReviews countInStock originalPrice discountedPrice category")
    .lean();

  // 11. Đề xuất Flash Sale: tồn cao + bán chậm + rating ổn
  const flashSaleRecommended = await Product.find({
    countInStock: { $gt: 20 },
    sold: { $lte: 5 },
    rating: { $gte: 3.0 },
    status: "active",
  })
    .sort({ countInStock: -1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold countInStock originalPrice discountedPrice rating numReviews category createdAt")
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
    restockRecommended,
    lowConversionProducts,
    lowRatedProducts,
    flashSaleRecommended,
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

  // Tổng số lượng đã bán & quota
  const totalSoldQty = productStatsList.reduce((s, p) => s + p.soldCount, 0);
  const totalQuota = productStatsList.reduce((s, p) => s + p.quantityLimit, 0);
  const avgSellThroughRate = totalQuota > 0 ? Math.round((totalSoldQty / totalQuota) * 100) : 0;
  const totalFlashSaleProducts = productStatsList.length;

  return {
    totalCampaigns,
    totalRevenue,
    totalSoldQty,
    totalQuota,
    avgSellThroughRate,
    totalFlashSaleProducts,
    topSoldProducts,
    slowSellingProducts,
    recommendedForSale,
  };
};

// ─── FUNNEL TƯƠNG TÁC (View → Cart → Purchase) ───────────────────────────────
const getInteractionFunnel = async () => {
  const UserInteraction = (await import("../models/userInteractionModel.js")).default;
  const counts = await UserInteraction.aggregate([
    { $group: { _id: "$interactionType", count: { $sum: 1 } } },
  ]);
  const map = {};
  counts.forEach(c => { map[c._id] = c.count; });

  const views = map["view"] || 0;
  const carts = map["add_to_cart"] || 0;
  const purchases = map["purchase"] || 0;

  return {
    funnel: [
      { step: "Xem sản phẩm", count: views, fill: "#3b82f6" },
      { step: "Thêm giỏ hàng", count: carts, fill: "#f59e0b" },
      { step: "Mua thành công", count: purchases, fill: "#10b981" },
    ],
    viewToCart: views > 0 ? ((carts / views) * 100).toFixed(1) : "0.0",
    cartToPurchase: carts > 0 ? ((purchases / carts) * 100).toFixed(1) : "0.0",
    viewToPurchase: views > 0 ? ((purchases / views) * 100).toFixed(1) : "0.0",
    allCounts: map,
  };
};

// ─── FUNNEL GỢI Ý (Recommendation → Cart → Purchase) ────────────────────────
const getRecommendationFunnel = async () => {
  const UserInteraction = (await import("../models/userInteractionModel.js")).default;
  const recViews = await UserInteraction.countDocuments({ source: "recommendation" });
  const recCarts = await UserInteraction.countDocuments({ source: "recommendation", interactionType: "add_to_cart" });
  const recPurchases = await UserInteraction.countDocuments({ source: "recommendation", interactionType: "purchase" });

  return {
    funnel: [
      { step: "Xem từ Gợi ý", count: recViews, fill: "#8b5cf6" },
      { step: "Thêm giỏ (từ GY)", count: recCarts, fill: "#f59e0b" },
      { step: "Mua (từ GY)", count: recPurchases, fill: "#10b981" },
    ],
    viewToCart: recViews > 0 ? ((recCarts / recViews) * 100).toFixed(1) : "0.0",
    cartToPurchase: recCarts > 0 ? ((recPurchases / recCarts) * 100).toFixed(1) : "0.0",
    viewToPurchase: recViews > 0 ? ((recPurchases / recViews) * 100).toFixed(1) : "0.0",
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
  getInteractionFunnel,
  getRecommendationFunnel,
};
