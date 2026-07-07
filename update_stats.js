const fs = require('fs');
const content = fs.readFileSync('src/backend/services/statsService.js', 'utf8');

const newProductStats = `const getProductStatsAnalytics = async (input = {}) => {
  const range = getTimeRange(input);
  const dateMatch = makeDateMatch(range);
  const isAllTime = Object.keys(dateMatch).length === 0;

  // 1. Tổng quan kho
  const totalProducts = await Product.countDocuments();
  const outOfStock = await Product.countDocuments({ countInStock: 0 });
  const lowStock = await Product.countDocuments({ countInStock: { $gt: 0, $lte: 10 } });
  const inStock = totalProducts - outOfStock - lowStock;

  // 2. Tổng tồn kho + tổng đã bán (lũy kế)
  const summaryResult = await Product.aggregate([
    { $group: { _id: null, totalStock: { $sum: "$countInStock" }, totalSold: { $sum: "$sold" } } },
  ]);
  const totalStock = summaryResult[0]?.totalStock ?? 0;
  const totalSold = summaryResult[0]?.totalSold ?? 0;

  // Tính Top Selling, Category Distribution, và Views trong khoảng thời gian
  let topSelling = [];
  let categoryDistribution = [];
  let highViewLowSold = [];

  if (isAllTime) {
    topSelling = await Product.find({ sold: { $gt: 0 } })
      .sort({ sold: -1 })
      .limit(10)
      .populate("category", "name")
      .select("title author img sold countInStock originalPrice discountedPrice rating numReviews category")
      .lean();
      
    categoryDistribution = await Product.aggregate([
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "catInfo" } },
      { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$catInfo.name", count: { $sum: 1 }, totalSold: { $sum: "$sold" }, totalStock: { $sum: "$countInStock" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    highViewLowSold = await Product.find({ viewCount: { $gt: 10 }, status: "active" })
      .sort({ viewCount: -1 })
      .limit(20)
      .populate("category", "name")
      .select("title author img sold viewCount countInStock originalPrice discountedPrice rating numReviews category")
      .lean();
  } else {
    // Top selling
    const orderAgg = await Order.aggregate([
      { $match: { ...dateMatch, status: 4 } },
      { $unwind: "$products" },
      { $group: { _id: "$products.productId", periodSold: { $sum: "$products.quantity" } } },
      { $sort: { periodSold: -1 } },
      { $limit: 10 }
    ]);
    const pIds = orderAgg.map(x => x._id);
    const pDetails = await Product.find({ _id: { $in: pIds } }).populate("category", "name").lean();
    topSelling = orderAgg.map(oa => {
      const p = pDetails.find(d => d._id.toString() === oa._id.toString());
      return p ? { ...p, sold: oa.periodSold } : null;
    }).filter(Boolean);

    // Category Distribution (by Revenue/Sold in period)
    categoryDistribution = await Order.aggregate([
      { $match: { ...dateMatch, status: 4 } },
      { $unwind: "$products" },
      { $lookup: { from: "products", localField: "products.productId", foreignField: "_id", as: "pInfo" } },
      { $unwind: { path: "$pInfo", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "categories", localField: "pInfo.category", foreignField: "_id", as: "catInfo" } },
      { $unwind: { path: "$catInfo", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$catInfo.name", totalSold: { $sum: "$products.quantity" }, count: { $addToSet: "$pInfo._id" } } },
      { $project: { _id: 1, totalSold: 1, count: { $size: "$count" } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Views
    const viewAgg = await UserInteraction.aggregate([
      { $match: { ...dateMatch, interactionType: "view", isDeleted: { $ne: true } } },
      { $group: { _id: "$productId", periodViews: { $sum: 1 } } },
      { $match: { periodViews: { $gt: 5 } } },
      { $sort: { periodViews: -1 } },
      { $limit: 20 }
    ]);
    const vIds = viewAgg.map(v => v._id);
    const vDetails = await Product.find({ _id: { $in: vIds }, status: "active" }).populate("category", "name").lean();
    highViewLowSold = viewAgg.map(va => {
      const p = vDetails.find(d => d._id.toString() === va._id.toString());
      return p ? { ...p, viewCount: va.periodViews } : null;
    }).filter(Boolean);
  }

  // 4. Bán ế / không bán được
  const slowMoving = await Product.find({ countInStock: { $gt: 0 } })
    .sort({ sold: 1, viewCount: 1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold countInStock originalPrice discountedPrice createdAt category")
    .lean();

  // 5. Sách sắp hết hàng
  const needRestock = await Product.find({ countInStock: { $gt: 0, $lte: 10 } })
    .sort({ sold: -1 })
    .limit(10)
    .populate("category", "name")
    .select("title author img sold countInStock originalPrice discountedPrice category")
    .lean();

  // 7. Sản phẩm đánh giá cao nhất
  const topRated = await Product.find({ numReviews: { $gte: 1 }, rating: { $gte: 4 } })
    .sort({ rating: -1, numReviews: -1 })
    .limit(5)
    .populate("category", "name")
    .select("title author img rating numReviews sold originalPrice discountedPrice category")
    .lean();

  // 8. Sách cần nhập thêm
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

  // Tính conversion rate
  const lowConversionProducts = highViewLowSold
    .map(p => ({
      ...p,
      conversionRate: p.viewCount > 0 ? ((p.sold / p.viewCount) * 100).toFixed(1) : "0.0",
    }))
    .filter(p => parseFloat(p.conversionRate) < 5)
    .slice(0, 10);

  // 10. Sách rating thấp
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

  // 11. Đề xuất Flash Sale
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
    totalProducts, outOfStock, lowStock, inStock, totalStock, totalSold,
    topSelling, slowMoving, needRestock, categoryDistribution, topRated,
    restockRecommended, lowConversionProducts, lowRatedProducts, flashSaleRecommended,
  };
};`;

const startIndex = content.indexOf('const getProductStatsAnalytics = async');
const endIndex = content.indexOf('};', content.indexOf('categoryDistribution,', startIndex));
if (startIndex !== -1 && endIndex !== -1) {
  const finalIndex = content.indexOf('};', endIndex) + 2;
  const updatedContent = content.slice(0, startIndex) + newProductStats + content.slice(finalIndex);
  fs.writeFileSync('src/backend/services/statsService.js', updatedContent);
  console.log('Replaced getProductStatsAnalytics successfully.');
} else {
  console.log('Could not find bounds of getProductStatsAnalytics.');
}
