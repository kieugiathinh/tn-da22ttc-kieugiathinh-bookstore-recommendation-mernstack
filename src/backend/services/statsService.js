import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Category from "../models/categoryModel.js";
import FlashSale from "../models/flashsaleModel.js";

const TIMEZONE = "Asia/Ho_Chi_Minh";
const ONE_DAY = 24 * 60 * 60 * 1000;

const STATUS_LABELS = {
  0: "Chờ xác nhận",
  1: "Đã xác nhận",
  2: "Đang chuẩn bị",
  3: "Đang giao",
  4: "Đã giao",
  5: "Đã hủy",
};

const STATUS_COLORS = {
  0: "#f59e0b",
  1: "#3b82f6",
  2: "#8b5cf6",
  3: "#6366f1",
  4: "#10b981",
  5: "#ef4444",
};

const pad = (n) => String(n).padStart(2, "0");

const isValidDate = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime());

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return isValidDate(date) ? date : null;
};

const calcChange = (current, previous) => {
  const cur = Number(current || 0);
  const prev = Number(previous || 0);

  if (prev === 0) {
    return cur > 0 ? 100 : 0;
  }

  return Math.round(((cur - prev) / prev) * 1000) / 10;
};

const normalizeQuery = (input) => {
  if (typeof input === "string") {
    return { type: input };
  }

  return input || {};
};

const getTimeRange = (input = {}) => {
  const query = normalizeQuery(input);
  const now = new Date();
  const type = query.type || "month";

  if (type === "custom") {
    let from = toDateOrNull(query.from);
    let to = toDateOrNull(query.to);

    if (!from && !to) {
      from = startOfMonth(now);
      to = now;
    }

    if (from && !to) to = from;
    if (!from && to) from = to;

    let start = startOfDay(from);
    let end = endOfDay(to);

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    if (end > now) end = now;

    return {
      type,
      start,
      end,
      label: "Tùy chỉnh",
    };
  }

  let start = new Date(now);
  let end = new Date(now);

  if (type === "day") {
    start = startOfDay(now);
    end = now;
  } else if (type === "week") {
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start = startOfDay(start);
    end = now;
  } else if (type === "last7") {
    start = startOfDay(addDays(now, -6));
    end = now;
  } else if (type === "last30") {
    start = startOfDay(addDays(now, -29));
    end = now;
  } else if (type === "month") {
    start = startOfMonth(now);
    end = now;
  } else if (type === "prev_month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    start = startOfDay(start);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
    end = endOfDay(end);
  } else if (type === "quarter") {
    const currentMonth = now.getMonth();
    const quarterStartMonth = currentMonth - (currentMonth % 3);
    start = new Date(now.getFullYear(), quarterStartMonth, 1);
    start = startOfDay(start);
    end = now;
  } else if (type === "year") {
    start = new Date(now.getFullYear(), 0, 1);
    start = startOfDay(start);
    end = now;
  } else if (type === "all") {
    start = new Date(0);
    end = now;
  } else {
    start = startOfMonth(now);
    end = now;
  }

  return {
    type,
    start,
    end,
    label: type,
  };
};

const getPreviousTimeRange = (typeOrRange, currentStart) => {
  if (currentStart) {
    const type = typeOrRange || "month";
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
      return { start: new Date(0), end: new Date(0) };
    }

    return { start, end };
  }

  const range = typeOrRange;

  if (!range || range.type === "all") {
    return null;
  }

  const duration = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - duration);

  return {
    type: range.type,
    start,
    end,
    label: "Kỳ trước",
  };
};

const getSamePeriodLastYear = (range) => {
  if (!range || range.type === "all") return null;

  return {
    type: range.type,
    start: addYears(range.start, -1),
    end: addYears(range.end, -1),
    label: "Cùng kỳ năm trước",
  };
};

const getComparisonRange = (query, currentRange) => {
  const compareType = query.compareType || query.compare || "previous";

  if (compareType === "none") return null;

  if (compareType === "same_period_last_year") {
    return getSamePeriodLastYear(currentRange);
  }

  if (compareType === "custom_compare") {
    const from = toDateOrNull(query.compareFrom);
    const to = toDateOrNull(query.compareTo);

    if (!from || !to) return null;

    return {
      type: "custom_compare",
      start: startOfDay(from),
      end: endOfDay(to),
      label: "Kỳ so sánh tùy chỉnh",
    };
  }

  return getPreviousTimeRange(currentRange);
};

const makeDateMatch = (range) => ({
  createdAt: {
    $gte: range.start,
    $lte: range.end,
  },
});

const getGranularity = (range) => {
  const days = Math.ceil((range.end.getTime() - range.start.getTime()) / ONE_DAY);

  if (range.type === "day" || days <= 1) return "hour";
  if (days <= 62) return "day";
  if (days <= 730) return "month";
  return "year";
};

const getMongoDateFormat = (granularity) => {
  if (granularity === "hour") return "%Y-%m-%d-%H";
  if (granularity === "day") return "%Y-%m-%d";
  if (granularity === "month") return "%Y-%m";
  return "%Y";
};

const getBucketStart = (date, granularity) => {
  const d = new Date(date);

  if (granularity === "hour") {
    d.setMinutes(0, 0, 0);
    return d;
  }

  if (granularity === "day") {
    return startOfDay(d);
  }

  if (granularity === "month") {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const incrementBucket = (date, granularity) => {
  if (granularity === "hour") {
    const d = new Date(date);
    d.setHours(d.getHours() + 1);
    return d;
  }

  if (granularity === "day") {
    return addDays(date, 1);
  }

  if (granularity === "month") {
    return addMonths(date, 1);
  }

  return addYears(date, 1);
};

const getBucketKey = (date, granularity) => {
  if (granularity === "hour") {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}-${pad(date.getHours())}`;
  }

  if (granularity === "day") {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`;
  }

  if (granularity === "month") {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  }

  return `${date.getFullYear()}`;
};

const getBucketLabel = (key, granularity) => {
  if (granularity === "hour") {
    const hour = key.split("-")[3];
    return `${hour}:00`;
  }

  if (granularity === "day") {
    const [, month, day] = key.split("-");
    return `${day}/${month}`;
  }

  if (granularity === "month") {
    const [year, month] = key.split("-");
    return `T${Number(month)}/${year}`;
  }

  return key;
};

const buildBuckets = (range, granularity) => {
  const buckets = [];
  let cursor = getBucketStart(range.start, granularity);
  const end = range.end;

  let guard = 0;

  while (cursor <= end && guard < 500) {
    const key = getBucketKey(cursor, granularity);

    buckets.push({
      key,
      label: getBucketLabel(key, granularity),
    });

    cursor = incrementBucket(cursor, granularity);
    guard += 1;
  }

  return buckets;
};

const resolveAllRangeByOrders = async (range, match = {}) => {
  if (range.type !== "all") return range;

  const earliestOrder = await Order.findOne(match)
    .sort({ createdAt: 1 })
    .select("createdAt")
    .lean();

  if (!earliestOrder?.createdAt) {
    return {
      ...range,
      start: startOfMonth(new Date()),
    };
  }

  return {
    ...range,
    start: startOfMonth(earliestOrder.createdAt),
  };
};

const aggregateRevenueSeries = async (range, granularity) => {
  const format = getMongoDateFormat(granularity);
  const buckets = buildBuckets(range, granularity);

  const raw = await Order.aggregate([
    {
      $match: {
        ...makeDateMatch(range),
        status: 4,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format,
            date: "$createdAt",
            timezone: TIMEZONE,
          },
        },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const map = {};
  raw.forEach((item) => {
    map[item._id] = item;
  });

  return buckets.map((bucket) => {
    const found = map[bucket.key];

    const revenue = found?.revenue || 0;
    const orders = found?.orders || 0;

    return {
      key: bucket.key,
      month: bucket.label,
      time: bucket.label,
      label: bucket.label,
      revenue,
      orders,
      aov: orders > 0 ? Math.round(revenue / orders) : 0,
    };
  });
};

const getOrderSummaryInRange = async (range) => {
  const deliveredStats = await Order.aggregate([
    {
      $match: {
        ...makeDateMatch(range),
        status: 4,
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

  const totalOrders = await Order.countDocuments(makeDateMatch(range));

  const canceled = await Order.countDocuments({
    ...makeDateMatch(range),
    status: 5,
  });

  const revenue = deliveredStats[0]?.revenue || 0;
  const orders = deliveredStats[0]?.orders || 0;
  const avgOrder = Math.round(deliveredStats[0]?.avgOrder || 0);
  const cancelRate = totalOrders > 0 ? Math.round((canceled / totalOrders) * 1000) / 10 : 0;

  return {
    revenue,
    orders,
    avgOrder,
    canceled,
    totalOrders,
    cancelRate,
  };
};

const getDashboardStats = async (input = {}) => {
  const range = getTimeRange(input);
  const previousRange = getPreviousTimeRange(range);

  const [totalUsers, totalProducts, currentStats] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    getOrderSummaryInRange(range),
  ]);

  const currentNewUsers = await User.countDocuments(makeDateMatch(range));
  const currentNewProducts = await Product.countDocuments(makeDateMatch(range));

  let changes = {
    revenue: 0,
    orders: 0,
    avgOrder: 0,
    canceled: 0,
    cancelRate: 0,
    users: 0,
    products: 0,
  };

  if (previousRange) {
    const previousStats = await getOrderSummaryInRange(previousRange);

    const previousNewUsers = await User.countDocuments(makeDateMatch(previousRange));
    const previousNewProducts = await Product.countDocuments(makeDateMatch(previousRange));

    changes = {
      revenue: calcChange(currentStats.revenue, previousStats.revenue),
      orders: calcChange(currentStats.orders, previousStats.orders),
      avgOrder: calcChange(currentStats.avgOrder, previousStats.avgOrder),
      canceled: calcChange(currentStats.canceled, previousStats.canceled),
      cancelRate: Math.round((currentStats.cancelRate - previousStats.cancelRate) * 10) / 10,
      users: calcChange(currentNewUsers, previousNewUsers),
      products: calcChange(currentNewProducts, previousNewProducts),
    };
  }

  return {
    users: totalUsers,
    products: totalProducts,
    revenue: currentStats.revenue,
    orders: currentStats.orders,
    avgOrder: currentStats.avgOrder,
    canceled: currentStats.canceled,
    totalOrders: currentStats.totalOrders,
    cancelRate: currentStats.cancelRate,
    newUsers: currentNewUsers,
    newProducts: currentNewProducts,
    changes,
    range: {
      type: range.type,
      start: range.start,
      end: range.end,
    },
  };
};

const getRevenueChart = async (input = {}) => {
  let range = getTimeRange(input);

  range = await resolveAllRangeByOrders(range, {
    status: 4,
  });

  const granularity = getGranularity(range);

  return await aggregateRevenueSeries(range, granularity);
};

const getRevenueComparison = async (input = {}) => {
  const query = normalizeQuery(input);

  if (query.year1 && query.year2) {
    const year1 = parseInt(query.year1, 10);
    const year2 = parseInt(query.year2, 10);

    const getDataByYear = async (year) => {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);

      const data = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            status: 4,
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            total: { $sum: "$total" },
          },
        },
      ]);

      const arr = Array(12).fill(0);
      data.forEach((item) => {
        arr[item._id - 1] = item.total;
      });

      return arr;
    };

    const [data1, data2] = await Promise.all([
      getDataByYear(year1),
      getDataByYear(year2),
    ]);

    return {
      year1: data1,
      year2: data2,
    };
  }

  const currentRange = getTimeRange(query);
  const compareRange = getComparisonRange(query, currentRange);

  if (!compareRange) {
    return {
      current: await aggregateRevenueSeries(
        currentRange,
        getGranularity(currentRange)
      ),
      compare: [],
    };
  }

  const granularity = getGranularity(currentRange);

  const [current, compare] = await Promise.all([
    aggregateRevenueSeries(currentRange, granularity),
    aggregateRevenueSeries(compareRange, granularity),
  ]);

  return {
    current,
    compare,
    meta: {
      current: {
        start: currentRange.start,
        end: currentRange.end,
      },
      compare: {
        start: compareRange.start,
        end: compareRange.end,
      },
    },
  };
};

const getCategoryStats = async (input = {}) => {
  const range = getTimeRange(input);

  const revenueByCategory = await Order.aggregate([
    {
      $match: {
        ...makeDateMatch(range),
        status: 4,
      },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "products",
        localField: "products.productId",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    {
      $unwind: {
        path: "$productInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$productInfo.category",
        revenue: {
          $sum: {
            $multiply: ["$products.price", "$products.quantity"],
          },
        },
        sold: {
          $sum: "$products.quantity",
        },
        orders: {
          $addToSet: "$_id",
        },
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
    {
      $unwind: {
        path: "$catInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        name: {
          $ifNull: ["$catInfo.name", "Chưa phân loại"],
        },
        value: "$revenue",
        revenue: "$revenue",
        sold: "$sold",
        orders: {
          $size: "$orders",
        },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
    {
      $limit: 10,
    },
  ]);

  if (revenueByCategory.length > 0) {
    return revenueByCategory;
  }

  return await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: {
          $sum: 1,
        },
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
    {
      $unwind: {
        path: "$catInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        name: {
          $ifNull: ["$catInfo.name", "Chưa phân loại"],
        },
        value: "$count",
        revenue: 0,
        sold: 0,
        orders: 0,
      },
    },
    {
      $sort: {
        value: -1,
      },
    },
  ]);
};

const getOrderStatusStats = async (input = {}) => {
  const range = getTimeRange(input);

  const raw = await Order.aggregate([
    {
      $match: makeDateMatch(range),
    },
    {
      $group: {
        _id: "$status",
        value: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const map = {};
  raw.forEach((item) => {
    map[item._id] = item.value;
  });

  return [0, 1, 2, 3, 4, 5].map((status) => ({
    _id: status,
    status,
    name: STATUS_LABELS[status],
    value: map[status] || 0,
    color: STATUS_COLORS[status],
  }));
};

const getProductAnalytics = async (input = {}) => {
  const range = getTimeRange(input);

  const topSelling = await Order.aggregate([
    {
      $match: {
        ...makeDateMatch(range),
        status: 4,
      },
    },
    {
      $unwind: "$products",
    },
    {
      $group: {
        _id: "$products.productId",
        sold: {
          $sum: "$products.quantity",
        },
        revenue: {
          $sum: {
            $multiply: ["$products.price", "$products.quantity"],
          },
        },
      },
    },
    {
      $sort: {
        sold: -1,
        revenue: -1,
      },
    },
    {
      $limit: 8,
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    {
      $unwind: {
        path: "$product",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: "$product._id",
        title: "$product.title",
        img: "$product.img",
        countInStock: "$product.countInStock",
        originalPrice: "$product.originalPrice",
        discountedPrice: "$product.discountedPrice",
        rating: "$product.rating",
        numReviews: "$product.numReviews",
        sold: "$sold",
        revenue: "$revenue",
      },
    },
  ]);

  const lowStock = await Product.find({
    countInStock: {
      $gt: 0,
      $lte: 10,
    },
  })
    .sort({
      countInStock: 1,
      sold: -1,
    })
    .limit(8)
    .select("title countInStock img originalPrice discountedPrice sold rating numReviews")
    .lean();

  const highViewLowPurchaseRaw = await Product.find({
    viewCount: {
      $gt: 0,
    },
  })
    .sort({
      viewCount: -1,
    })
    .limit(20)
    .select("title img sold viewCount countInStock originalPrice discountedPrice rating numReviews")
    .lean();

  const highViewLowPurchase = highViewLowPurchaseRaw
    .map((product) => ({
      ...product,
      conversionRate:
        product.viewCount > 0
          ? Math.round((product.sold / product.viewCount) * 1000) / 10
          : 0,
    }))
    .filter((product) => product.viewCount >= 10 && product.conversionRate < 10)
    .slice(0, 8);

  const needSale = await Product.find({
    countInStock: {
      $gte: 20,
    },
    sold: {
      $lte: 5,
    },
  })
    .sort({
      countInStock: -1,
      sold: 1,
    })
    .limit(8)
    .select("title img sold countInStock originalPrice discountedPrice rating numReviews")
    .lean();

  return {
    lowStock,
    topSelling,
    highViewLowPurchase,
    needSale,
  };
};

const getTopCustomers = async (input = {}) => {
  const range = getTimeRange(input);

  return await Order.aggregate([
    {
      $match: {
        ...makeDateMatch(range),
        status: 4,
      },
    },
    {
      $group: {
        _id: "$userId",
        total: {
          $sum: "$total",
        },
        count: {
          $sum: 1,
        },
        name: {
          $first: "$name",
        },
        email: {
          $first: "$email",
        },
      },
    },
    {
      $sort: {
        total: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);
};

const getLatestOrders = async (input = {}) => {
  const range = getTimeRange(input);

  return await Order.find(makeDateMatch(range))
    .sort({
      createdAt: -1,
    })
    .limit(6)
    .lean();
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
    if (uid) orderCountByUserId[uid] = (orderCountByUserId[uid] || 0) + 1;
  });

  const repeatCount = validBuyersInPeriod.filter(id => orderCountByUserId[id] >= 2).length;
  const returnRate = totalBuyersInPeriod > 0 ? Math.round((repeatCount / totalBuyersInPeriod) * 100) : 0;

  const ordersInPrevPeriod = allOrdersToPrevEnd.filter(o => o.createdAt >= prevStart && o.createdAt <= prevEnd);
  const buyersInPrevPeriodSet = new Set(ordersInPrevPeriod.map(o => o.userId?.toString()).filter(Boolean));
  const validBuyersInPrevPeriod = [...buyersInPrevPeriodSet].filter(id => allUserIdsSet.has(id));

  const orderCountByUserIdPrev = {};
  allOrdersToPrevEnd.forEach(o => {
    const uid = o.userId?.toString();
    if (uid) orderCountByUserIdPrev[uid] = (orderCountByUserIdPrev[uid] || 0) + 1;
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
    if (uid && allUserIdsSet.has(uid)) {
      if (!topMap[uid]) {
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
      const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
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
      const dStart = new Date(d); dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
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
  const totalProducts = await Product.countDocuments();
  const outOfStock = await Product.countDocuments({ countInStock: 0 });
  const lowStock = await Product.countDocuments({ countInStock: { $gt: 0, $lte: 10 } });
  const inStock = totalProducts - outOfStock - lowStock;

  // 2. Tổng tồn kho + tổng đã bán
  const summaryResult = await Product.aggregate([
    { $group: { _id: null, totalStock: { $sum: "$countInStock" }, totalSold: { $sum: "$sold" } } },
  ]);
  const totalStock = summaryResult[0]?.totalStock ?? 0;
  const totalSold = summaryResult[0]?.totalSold ?? 0;

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
const getRecommendationFunnel = async (query = {}) => {
  const UserInteraction = (await import("../models/userInteractionModel.js")).default;
  const days = Number(query.days) || 30; // Mặc định 30 ngày
  
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  // Helper để lấy count theo khoảng thời gian
  const getCount = async (source, type, start, end) => {
    const q = { source, createdAt: { $gte: start, $lt: end }, isDeleted: { $ne: true } };
    if (type) q.interactionType = type;
    return await UserInteraction.countDocuments(q);
  };

  // Kỳ hiện tại
  const recViews = await getCount("recommendation", null, currentPeriodStart, now);
  const recCarts = await getCount("recommendation", "add_to_cart", currentPeriodStart, now);
  const recPurchases = await getCount("recommendation", "purchase", currentPeriodStart, now);

  // Kỳ trước
  const prevViews = await getCount("recommendation", null, previousPeriodStart, currentPeriodStart);
  const prevCarts = await getCount("recommendation", "add_to_cart", previousPeriodStart, currentPeriodStart);
  const prevPurchases = await getCount("recommendation", "purchase", previousPeriodStart, currentPeriodStart);

  // Tính phần trăm thay đổi
  const calcTrend = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return (((curr - prev) / prev) * 100).toFixed(1);
  };

  return {
    funnel: [
      { step: "Xem từ Gợi ý", count: recViews, prevCount: prevViews, trend: calcTrend(recViews, prevViews), fill: "#8b5cf6" },
      { step: "Thêm giỏ (từ GY)", count: recCarts, prevCount: prevCarts, trend: calcTrend(recCarts, prevCarts), fill: "#f59e0b" },
      { step: "Mua (từ GY)", count: recPurchases, prevCount: prevPurchases, trend: calcTrend(recPurchases, prevPurchases), fill: "#10b981" },
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
