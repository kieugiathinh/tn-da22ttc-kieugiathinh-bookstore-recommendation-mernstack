import FlashSale from "../models/flashsale.model.js";
import Product from "../models/product.model.js"; // Import model sách
import asyncHandler from "express-async-handler";

// 1. Tạo đợt Flash Sale mới (Chưa có sản phẩm)
// POST /api/v1/flash-sales
const createFlashSale = asyncHandler(async (req, res) => {
  const { name, startTime, endTime } = req.body;

  const flashSale = await FlashSale.create({
    name,
    startTime,
    endTime,
    products: [], // Mới tạo thì chưa có sản phẩm
  });

  res.status(201).json(flashSale);
});

// 2. Thêm Sách vào Flash Sale (Thao tác N-N)
// POST /api/v1/flash-sales/:id/add-product
const addProductToFlashSale = asyncHandler(async (req, res) => {
  const { productId, discountPrice, quantityLimit } = req.body;
  const flashSaleId = req.params.id;

  // Kiểm tra sách có tồn tại không
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Sách không tồn tại");
  }

  // Tìm đợt sale
  const flashSale = await FlashSale.findById(flashSaleId);
  if (!flashSale) {
    res.status(404);
    throw new Error("Đợt Flash Sale không tồn tại");
  }

  // Kiểm tra xem sản phẩm đã có trong đợt sale này chưa
  const productExists = flashSale.products.find(
    (item) => item.product.toString() === productId
  );

  if (productExists) {
    res.status(400);
    throw new Error("Sản phẩm này đã có trong đợt Flash Sale này");
  }

  // Push vào mảng products
  flashSale.products.push({
    product: productId,
    discountPrice,
    quantityLimit,
    soldCount: 0,
  });

  await flashSale.save();
  res.status(200).json(flashSale);
});

// 3. Lấy Flash Sale ĐANG DIỄN RA (Cho trang chủ)
// GET /api/v1/flash-sales/active
const getActiveFlashSale = asyncHandler(async (req, res) => {
  const now = new Date();

  // Tìm đợt sale nào đang bật, thời gian hiện tại nằm giữa Start và End
  const activeSale = await FlashSale.findOne({
    isActive: true,
    startTime: { $lte: now }, // Bắt đầu trước hoặc bằng bây giờ
    endTime: { $gte: now }, // Kết thúc sau hoặc bằng bây giờ
  }).populate({
    path: "products.product", // Populate để lấy thông tin chi tiết sách (Tên, Ảnh...)
    select: "title img originalPrice author", // Chỉ lấy các trường cần thiết
  });

  if (!activeSale) {
    // Không có lỗi, chỉ là không có sale nào
    res.status(200).json(null);
  } else {
    res.status(200).json(activeSale);
  }
});

// 4. Lấy danh sách TẤT CẢ Flash Sale (Cho Admin)
// GET /api/v1/flash-sales/all
const getAllFlashSales = asyncHandler(async (req, res) => {
  // Sắp xếp cái mới tạo lên đầu
  const flashSales = await FlashSale.find()
    .sort({ createdAt: -1 })
    .populate("products.product", "title img originalPrice"); // Lấy tên và ảnh sách để hiển thị cho đẹp
  res.status(200).json(flashSales);
});

// 5. Xóa Flash Sale
const deleteFlashSale = asyncHandler(async (req, res) => {
  const flashSale = await FlashSale.findByIdAndDelete(req.params.id);
  if (!flashSale) {
    res.status(404);
    throw new Error("Không tìm thấy Flash Sale");
  }
  res.status(200).json({ message: "Đã xóa thành công" });
});

// 6. Cập nhật Flash Sale (Tên, Ngày, Bật/Tắt)
// PUT /api/v1/flash-sales/:id
const updateFlashSale = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, isActive } = req.body;
  const flashSale = await FlashSale.findById(req.params.id);

  if (flashSale) {
    flashSale.name = name || flashSale.name;
    flashSale.startTime = startTime || flashSale.startTime;
    flashSale.endTime = endTime || flashSale.endTime;
    // Kiểm tra isActive có được gửi lên không (vì boolean false cũng là giá trị)
    if (isActive !== undefined) flashSale.isActive = isActive;

    const updatedFlashSale = await flashSale.save();
    res.status(200).json(updatedFlashSale);
  } else {
    res.status(404);
    throw new Error("Flash Sale not found");
  }
});

// 7. Xóa Sách KHỎI Flash Sale
// DELETE /api/v1/flash-sales/:id/remove-product/:productId
const removeProductFromFlashSale = asyncHandler(async (req, res) => {
  const { id, productId } = req.params;

  const flashSale = await FlashSale.findById(id);
  if (!flashSale) {
    res.status(404);
    throw new Error("Flash Sale not found");
  }

  // Lọc bỏ sản phẩm có ID trùng khớp
  flashSale.products = flashSale.products.filter(
    (item) => item.product.toString() !== productId
  );

  await flashSale.save();
  res.status(200).json({ message: "Removed product from flash sale" });
});

export {
  createFlashSale,
  addProductToFlashSale,
  getActiveFlashSale,
  getAllFlashSales,
  deleteFlashSale,
  updateFlashSale,
  removeProductFromFlashSale,
};
