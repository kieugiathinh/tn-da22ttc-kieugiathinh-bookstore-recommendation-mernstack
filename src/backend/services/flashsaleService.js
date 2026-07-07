import FlashSale from "../models/flashsaleModel.js";
import Product from "../models/productModel.js";

const createFlashSale = async (data) => {
  const { name, startTime, endTime } = data;
  return await FlashSale.create({
    name,
    startTime,
    endTime,
    products: [],
  });
};

const addProductToFlashSale = async (flashSaleId, data) => {
  const { productId, discountPrice, quantityLimit } = data;

  const product = await Product.findById(productId).lean();
  if (!product) throw new Error("Sách không tồn tại");

  const flashSale = await FlashSale.findById(flashSaleId);
  if (!flashSale) throw new Error("Đợt Flash Sale không tồn tại");

  const productExists = flashSale.products.find((item) => item.product.toString() === productId);
  if (productExists) {
    if (productExists.discountPrice !== discountPrice) {
      throw new Error("Sản phẩm đã có trong đợt Flash Sale với giá bán khác. Vui lòng cập nhật sản phẩm thay vì thêm mới.");
    }
    // Nếu cùng giá thì cộng dồn số lượng
    productExists.quantityLimit += quantityLimit;
  } else {
    flashSale.products.push({
      product: productId,
      discountPrice,
      quantityLimit,
      soldCount: 0,
    });
  }

  return await flashSale.save();
};

const addMultipleProductsToFlashSale = async (flashSaleId, productsArray) => {
  const flashSale = await FlashSale.findById(flashSaleId);
  if (!flashSale) throw new Error("Đợt Flash Sale không tồn tại");

  let addedCount = 0;
  for (const data of productsArray) {
    const { productId, discountPrice, quantityLimit } = data;
    const productExists = flashSale.products.find((item) => item.product.toString() === productId);
    
    if (productExists) {
      if (productExists.discountPrice !== discountPrice) {
        throw new Error(`Một số sản phẩm đã có trong Flash Sale với giá bán khác. Vui lòng kiểm tra lại.`);
      }
      // Nếu cùng giá thì cộng dồn
      productExists.quantityLimit += quantityLimit;
      addedCount++;
    } else {
      flashSale.products.push({
        product: productId,
        discountPrice,
        quantityLimit,
        soldCount: 0,
      });
      addedCount++;
    }
  }

  await flashSale.save();
  return { flashSale, addedCount };
};

const getActiveFlashSale = async () => {
  const now = new Date();
  const flashSale = await FlashSale.findOne({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  }).populate({
    path: "products.product",
    select: "title img originalPrice author status",
    match: { status: { $ne: "discontinued" } }
  }).lean();

  if (flashSale && flashSale.products) {
    // populate with match sets product to null if it doesn't match
    flashSale.products = flashSale.products.filter(item => item.product !== null);
  }

  return flashSale;
};

const attachFlashSaleToProducts = async (products) => {
  if (!products) return products;
  
  const now = new Date();
  const activeSale = await FlashSale.findOne({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  }).lean();

  if (!activeSale) return products;

  // Create a map of product ID to flash sale details
  const flashSaleMap = new Map();
  activeSale.products.forEach((item) => {
    flashSaleMap.set(item.product.toString(), {
      flashSaleId: activeSale._id,
      discountPrice: item.discountPrice,
      quantityLimit: item.quantityLimit,
      soldCount: item.soldCount,
      endTime: activeSale.endTime,
    });
  });

  const attachToProduct = (product) => {
    if (!product || !product._id) return product;
    const fsInfo = flashSaleMap.get(product._id.toString());
    if (fsInfo) {
      product.flashSale = fsInfo;
    }
    return product;
  };

  if (Array.isArray(products)) {
    return products.map(attachToProduct);
  }
  return attachToProduct(products);
};

const getAllFlashSales = async () => {
  return await FlashSale.find()
    .sort({ createdAt: -1 })
    .populate("products.product", "title img originalPrice")
    .lean();
};

const deleteFlashSale = async (id) => {
  const flashSale = await FlashSale.findByIdAndDelete(id);
  if (!flashSale) throw new Error("Không tìm thấy Flash Sale");
  return flashSale;
};

const updateFlashSale = async (id, data) => {
  const { name, startTime, endTime, isActive } = data;
  const flashSale = await FlashSale.findById(id);

  if (!flashSale) throw new Error("Flash Sale not found");

  if (name) flashSale.name = name;
  if (startTime) flashSale.startTime = startTime;
  if (endTime) flashSale.endTime = endTime;
  if (isActive !== undefined) flashSale.isActive = isActive;

  return await flashSale.save();
};

const removeProductFromFlashSale = async (id, productId) => {
  const flashSale = await FlashSale.findById(id);
  if (!flashSale) throw new Error("Flash Sale not found");

  flashSale.products = flashSale.products.filter(
    (item) => item.product.toString() !== productId
  );

  return await flashSale.save();
};

const updateProductInFlashSale = async (flashSaleId, productId, data) => {
  const { discountPrice, quantityLimit } = data;
  const flashSale = await FlashSale.findById(flashSaleId);
  if (!flashSale) throw new Error("Đợt Flash Sale không tồn tại");

  const productItem = flashSale.products.find((item) => item.product.toString() === productId);
  if (!productItem) throw new Error("Sản phẩm không có trong đợt Flash Sale này");

  if (discountPrice !== undefined) productItem.discountPrice = discountPrice;
  if (quantityLimit !== undefined) productItem.quantityLimit = quantityLimit;

  return await flashSale.save();
};

export {
  createFlashSale,
  addProductToFlashSale,
  addMultipleProductsToFlashSale,
  getActiveFlashSale,
  getAllFlashSales,
  deleteFlashSale,
  updateFlashSale,
  removeProductFromFlashSale,
  updateProductInFlashSale,
  attachFlashSaleToProducts,
};
