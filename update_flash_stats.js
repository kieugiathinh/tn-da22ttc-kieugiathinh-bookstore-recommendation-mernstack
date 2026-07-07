const fs = require('fs');
const content = fs.readFileSync('src/backend/services/statsService.js', 'utf8');

const newFlashSaleStats = `const getFlashSaleStatsAnalytics = async (input = {}) => {
  const { campaignId, status } = input;
  const match = {};

  if (campaignId) match._id = campaignId;

  if (status) {
    const now = new Date();
    if (status === "active") {
      match.startDate = { $lte: now };
      match.endDate = { $gte: now };
    } else if (status === "upcoming") {
      match.startDate = { $gt: now };
    } else if (status === "ended") {
      match.endDate = { $lt: now };
    }
  }

  // Nếu không có status và campaignId cụ thể, lọc thêm thời gian
  if (!campaignId) {
    const range = getTimeRange(input);
    const dateMatch = makeDateMatch(range);
    if (Object.keys(dateMatch).length > 0) {
      match.createdAt = dateMatch.createdAt;
    }
  }

  const allFlashSales = await FlashSale.find(match).lean();

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

  const topSoldProducts = [...productStatsList].sort((a, b) => b.soldCount - a.soldCount).slice(0, 10); // tăng lên 10

  const slowSellingProducts = [...productStatsList]
    .filter(p => p.quantityLimit > 0)
    .sort((a, b) => a.sellThroughRate - b.sellThroughRate)
    .slice(0, 10);

  // Đề xuất các sản phẩm phù hợp cho Flash Sale (Tồn cao > 10, chưa chạy hoặc bán ế)
  const recommendedForSale = await Product.aggregate([
    { $match: { countInStock: { $gte: 10 }, sold: { $lte: 5 } } },
    { $sort: { createdAt: 1 } },
    { $limit: 10 },
    { $project: { title: 1, img: 1, originalPrice: 1, countInStock: 1, sold: 1 } }
  ]);

  // Tổng số lượng đã bán & quota
  const totalSoldQty = productStatsList.reduce((s, p) => s + p.soldCount, 0);
  const totalQuota = productStatsList.reduce((s, p) => s + p.quantityLimit, 0);
  const avgSellThroughRate = totalQuota > 0 ? ((totalSoldQty / totalQuota) * 100).toFixed(1) : 0;
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
};`;

const startIndex = content.indexOf('const getFlashSaleStatsAnalytics = async');
const endIndexStr = 'recommendedForSale,\n  };\n};';
const endIndex = content.indexOf(endIndexStr, startIndex);
if (startIndex !== -1 && endIndex !== -1) {
  const finalIndex = endIndex + endIndexStr.length;
  const updatedContent = content.slice(0, startIndex) + newFlashSaleStats + content.slice(finalIndex);
  fs.writeFileSync('src/backend/services/statsService.js', updatedContent);
  console.log('Replaced getFlashSaleStatsAnalytics successfully.');
} else {
  console.log('Could not find bounds of getFlashSaleStatsAnalytics.');
}
