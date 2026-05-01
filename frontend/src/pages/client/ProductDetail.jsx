import {
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar, // Import thêm FaRegStar
  FaBolt,
  FaFire,
  FaClock,
} from "react-icons/fa";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { userRequest } from "../../requestMethods";
import { useDispatch, useSelector } from "react-redux";
import { addProduct } from "../../redux/cartRedux";
import { toast } from "sonner";
import moment from "moment";
import RelatedProducts from "../../components/client/RelatedProducts";

// --- COMPONENT HIỂN THỊ SAO (MỚI) ---
const StarRating = ({ rating, size = "text-sm" }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      stars.push(<FaStar key={i} className={`text-yellow-400 ${size}`} />);
    } else if (rating >= i - 0.5) {
      stars.push(
        <FaStarHalfAlt key={i} className={`text-yellow-400 ${size}`} />
      );
    } else {
      stars.push(<FaRegStar key={i} className={`text-gray-300 ${size}`} />);
    }
  }
  return <div className="flex flex-row gap-0.5">{stars}</div>;
};
// ------------------------------------

const Product = () => {
  const location = useLocation();
  const id = location.pathname.split("/")[2];
  const user = useSelector((state) => state.user.currentUser);
  const [product, setProduct] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // --- STATE CHO REVIEW ---
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  // ------------------------

  const dispatch = useDispatch();

  // 1. Fetch Product
  useEffect(() => {
    const getProduct = async () => {
      try {
        const res = await userRequest.get("/products/find/" + id);
        setProduct(res.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    getProduct();
  }, [id]);

  // 2. Fetch Reviews
  const fetchReviews = async () => {
    try {
      const res = await userRequest.get("/reviews/" + id);
      setReviews(res.data);
      setLoadingReviews(false);
    } catch (error) {
      console.error(error);
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [id]);

  // --- CÁC LOGIC CŨ (Flash Sale, Cart...) ---
  const flashSaleRemaining = product.isFlashSale
    ? product.flashSaleLimit - product.flashSaleSold
    : 0;

  const handleQuantity = (action) => {
    if (action === "dec") {
      setQuantity(quantity === 1 ? 1 : quantity - 1);
    }
    if (action === "inc") {
      if (product.countInStock && quantity >= product.countInStock) {
        toast.warning(`Kho chỉ còn ${product.countInStock} sản phẩm!`);
        return;
      }
      if (product.isFlashSale && quantity >= flashSaleRemaining) {
        toast.warning(
          `Bạn chỉ có thể mua tối đa ${flashSaleRemaining} suất giá sốc!`
        );
        return;
      }
      setQuantity(quantity + 1);
    }
  };

  const calculatePrice = () => {
    if (product.isFlashSale) return product.discountedPrice;
    if (product.wholesalePrice && quantity >= product.wholesaleMinimumQuantity)
      return product.wholesalePrice;
    if (product.discountedPrice > 0) return product.discountedPrice;
    return product.originalPrice;
  };
  const finalPrice = calculatePrice();

  const handleAddToCart = () => {
    if (product.countInStock === 0) {
      toast.error("Sản phẩm đã hết hàng!");
      return;
    }

    const remainingFS = product.isFlashSale
      ? product.flashSaleLimit - product.flashSaleSold
      : 0;

    if (!product.isFlashSale || remainingFS <= 0) {
      dispatch(
        addProduct({
          ...product,
          price: product.originalPrice,
          quantity,
          isFlashSale: false,
        })
      );
      toast.success(`Đã thêm ${quantity} cuốn vào giỏ`);
      return;
    }

    if (quantity <= remainingFS) {
      dispatch(
        addProduct({
          ...product,
          price: product.discountedPrice,
          quantity,
          isFlashSale: true,
        })
      );
      toast.success(`Đã thêm ${quantity} cuốn giá Flash Sale`);
    } else {
      const normalQty = quantity - remainingFS;
      dispatch(
        addProduct({
          ...product,
          price: product.discountedPrice,
          quantity: remainingFS,
          isFlashSale: true,
        })
      );
      dispatch(
        addProduct({
          ...product,
          price: product.originalPrice,
          quantity: normalQty,
          isFlashSale: false,
        })
      );
      toast.info("Đã tách đơn hàng do vượt quá suất Flash Sale");
    }
  };

  if (loading)
    return <div className="p-10 text-center">Đang tải dữ liệu sách...</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 flex flex-col md:flex-row gap-10">
          {/* CỘT ẢNH */}
          <div className="w-full md:w-2/5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-gray-100">
              {product.isFlashSale && (
                <div className="absolute top-0 left-0 bg-red-600 text-white px-3 py-1 rounded-br-lg z-10 font-bold flex items-center shadow-md animate-pulse">
                  <FaBolt className="mr-1 text-yellow-300" /> FLASH SALE
                </div>
              )}
              <img
                src={product.img}
                alt={product.title}
                className="absolute inset-0 w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* CỘT THÔNG TIN */}
          <div className="w-full md:w-3/5 flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 leading-tight">
              {product.title}
            </h1>
            <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
              <span>
                Tác giả:{" "}
                <span className="text-purple-600 font-medium">
                  {product.author || "Đang cập nhật"}
                </span>
              </span>
              <span className="border-l border-gray-300 pl-4">
                NXB:{" "}
                <span className="text-purple-600 font-medium">
                  {product.publisher || "Đang cập nhật"}
                </span>
              </span>
            </div>

            {/* --- Rating hiển thị MỚI (Dùng Component StarRating) --- */}
            {/* --- Rating hiển thị MỚI --- */}
            <div className="flex items-center mb-6 gap-2">
              {/* 1. Hiển thị Dải sao TRƯỚC */}
              <div className="flex flex-row items-center pb-1">
                <StarRating rating={product.rating || 0} size="text-lg" />
              </div>

              {/* 2. Hiển thị số điểm cụ thể SAU (Sẽ nằm bên phải sao) */}
              {/* <span className="text-sm font-medium text-gray-800 ml-1">
                {product.rating ? Number(product.rating).toFixed(1) : "0"}
              </span> */}

              {/* 3. Số lượng đánh giá & Đã bán */}
              <span className="ml-2 text-sm text-gray-500 underline cursor-pointer hover:text-purple-600">
                (Xem {product.numReviews || 0} đánh giá)
              </span>
              <span className="border-l ml-4 text-sm text-gray-500 border-gray-300 pl-4">
                Đã bán:{" "}
                <span className="text-purple-600 font-medium">
                  {product.sold || 0}
                </span>
              </span>
            </div>

            {/* --- KHU VỰC GIÁ --- */}
            <div
              className={`rounded-xl p-4 mb-6 ${
                product.isFlashSale
                  ? "bg-red-50 border border-red-100"
                  : "bg-gray-50"
              }`}
            >
              {product.isFlashSale && (
                <div className="flex items-center text-red-600 font-bold mb-2 text-sm uppercase tracking-wide">
                  <FaClock className="mr-1" /> Kết thúc sớm - Số lượng có hạn
                </div>
              )}
              <div className="flex items-end gap-3">
                <span
                  className={`text-3xl font-extrabold ${
                    product.isFlashSale ? "text-red-600" : "text-purple-700"
                  }`}
                >
                  {finalPrice?.toLocaleString("vi-VN")} ₫
                </span>
                {product.originalPrice > finalPrice && (
                  <span className="text-lg text-gray-400 line-through mb-1">
                    {product.originalPrice?.toLocaleString("vi-VN")} ₫
                  </span>
                )}
                {product.originalPrice > finalPrice && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full mb-2">
                    -
                    {Math.round((1 - finalPrice / product.originalPrice) * 100)}
                    %
                  </span>
                )}
              </div>
              {product.isFlashSale && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-red-500 mb-1">
                    <span className="flex items-center">
                      <FaFire className="mr-1" /> Đã bán {product.flashSaleSold}
                    </span>
                    <span>Chỉ còn {flashSaleRemaining} suất</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          (product.flashSaleSold / product.flashSaleLimit) *
                            100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Nút Mua */}
            <div className="mb-4 flex items-center text-sm">
              <span className="text-gray-500 mr-2">Tình trạng kho:</span>
              {product.countInStock > 0 ? (
                <span className="text-green-600 font-medium">
                  Còn hàng (Tổng {product.countInStock})
                </span>
              ) : (
                <span className="text-red-500 font-medium">Hết hàng</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantity("dec")}
                  className="px-4 py-2 hover:bg-gray-100 transition text-gray-600"
                >
                  <FaMinus size={12} />
                </button>
                <span className="px-4 py-2 font-semibold text-gray-800 w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantity("inc")}
                  className="px-4 py-2 hover:bg-gray-100 transition text-gray-600"
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.countInStock === 0}
                className={`flex-1 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                  product.countInStock > 0
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-xl hover:scale-[1.02]"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                <FaShoppingCart className="text-xl" />
                {product.countInStock > 0 ? "THÊM VÀO GIỎ HÀNG" : "HẾT HÀNG"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 border-t pt-4">
              <div className="flex items-center">
                <FaStar className="text-yellow-400 mr-2" /> Cam kết chính hãng
                100%
              </div>
              <div className="flex items-center">
                <FaStar className="text-yellow-400 mr-2" /> Miễn phí vận chuyển
                đơn 300k
              </div>
              <div className="flex items-center">
                <FaStar className="text-yellow-400 mr-2" /> Đổi trả trong 7 ngày
              </div>
              <div className="flex items-center">
                <FaStar className="text-yellow-400 mr-2" /> Hoàn tiền 200% nếu
                giả
              </div>
            </div>
          </div>
        </div>

        {/* --- PHẦN DƯỚI: MÔ TẢ & REVIEW --- */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10 mb-8">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">
                Mô tả sản phẩm
              </h2>
              <div className="text-gray-700 leading-loose whitespace-pre-line">
                {product.desc || "Chưa có mô tả chi tiết."}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-10">
              <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex justify-between items-center">
                <span>Đánh giá của khách hàng</span>
                <span className="text-sm font-normal bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  {reviews.length} đánh giá
                </span>
              </h2>

              {/* DANH SÁCH ĐÁNH GIÁ */}
              {loadingReviews ? (
                <div className="text-center py-5 text-gray-400">
                  Đang tải bình luận...
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((rev) => (
                    <div
                      key={rev._id}
                      className="flex gap-4 pb-6 border-b border-gray-100 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden flex-shrink-0">
                        {rev.user?.avatar ? (
                          <img
                            src={rev.user.avatar}
                            alt="Ava"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold">
                            {rev.user?.fullname
                              ? rev.user.fullname.charAt(0)
                              : "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-gray-800">
                            {rev.user?.fullname || "Người dùng ẩn danh"}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {moment(rev.createdAt).fromNow()}
                          </span>
                        </div>

                        {/* Rating Item MỚI */}
                        <div className="mb-2">
                          <StarRating rating={rev.rating} size="text-xs" />
                        </div>

                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg inline-block">
                          {rev.comment}
                        </p>
                        {rev.reply && (
                          <div className="mt-3 ml-4 bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                            <p className="text-xs font-bold text-purple-700 mb-1">
                              Phản hồi của Nhà sách:
                            </p>
                            <p className="text-sm text-gray-700">{rev.reply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-lg">
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </div>
              )}
            </div>
          </div>
        </div>

        <RelatedProducts
          categoryId={product.category?._id || product.category}
          currentProductId={product._id}
        />
      </div>
    </div>
  );
};

export default Product;

