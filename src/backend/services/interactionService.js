import mongoose from "mongoose";
import UserInteraction, { INTERACTION_TYPE } from "../models/userInteractionModel.js";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";

export const getInteractions = async (pageNumber, limitNumber, type, source, keyword, days) => {
  const page = Number(pageNumber) || 1;
  const limit = Number(limitNumber) || 20;
  const skip = (page - 1) * limit;

  const query = { isDeleted: { $ne: true } };
  if (type && type !== "all") {
    query.interactionType = type;
  }
  if (source && source !== "all") {
    query.source = source;
  }
  
  if (days && days !== "all") {
    const daysNum = Number(days);
    if (!isNaN(daysNum)) {
      query.createdAt = { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) };
    }
  }
  
  if (keyword) {
    const users = await User.find({
      $or: [
        { fullname: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } }
      ]
    }).select("_id");
    const products = await Product.find({ title: { $regex: keyword, $options: "i" } }).select("_id");
    
    query.$or = [
      { userId: { $in: users.map(u => u._id) } },
      { productId: { $in: products.map(p => p._id) } }
    ];

    if (mongoose.Types.ObjectId.isValid(keyword)) {
      query.$or.push({ userId: keyword });
      query.$or.push({ productId: keyword });
    }
  }

  const interactions = await UserInteraction.find(query)
    .populate("userId", "fullname email avatar")
    .populate("productId", "title img")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const count = await UserInteraction.countDocuments(query);

  return {
    interactions,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  };
};

export const trackUserInteraction = async (userId, productId, interactionType, source, durationSeconds) => {
  if (!productId || !interactionType) {
    throw new Error("Missing productId or interactionType");
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid productId format");
  }

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    throw new Error("Product does not exist");
  }

  if (!Object.values(INTERACTION_TYPE).includes(interactionType)) {
    throw new Error("Invalid interactionType");
  }

  if (durationSeconds !== undefined && durationSeconds !== null && durationSeconds < 0) {
    throw new Error("durationSeconds must be greater than or equal to 0");
  }

  const interaction = await UserInteraction.create({
    userId,
    productId,
    interactionType,
    source: source || "direct",
    durationSeconds: durationSeconds || null
  });

  return interaction;
};

export const deleteInteraction = async (id) => {
  const interaction = await UserInteraction.findById(id);

  if (!interaction) {
    throw new Error("Không tìm thấy hành vi");
  }

  interaction.isDeleted = true;
  await interaction.save();
  return { message: "Xóa hành vi thành công" };
};

export const getCategoryAnalytics = async (userId = null) => {
  const matchStage = { isDeleted: { $ne: true } };
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  // Aggregate user interactions -> lookup product -> group by product.categoryName
  const result = await UserInteraction.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "categoryDoc"
      }
    },
    {
      $unwind: {
        path: "$categoryDoc",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: "$categoryDoc.name",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  return result.map(item => ({
    category: item._id || "Chưa phân loại",
    count: item.count
  }));
};
