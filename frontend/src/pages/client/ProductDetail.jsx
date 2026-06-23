import {
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaBolt,
  FaFire,
  FaClock,
  FaShieldAlt,
  FaTruck,
  FaUndo,
  FaCheckCircle,
} from "react-icons/fa";
import { useLocation, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { userRequest } from "../../requestMethods";
import { useDispatch } from "react-redux";
import { addProduct } from "../../redux/cartRedux";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import moment from "moment";
import "moment/locale/vi"; // Import locale tiếng Việt
import SimilarProducts from "../../components/client/SimilarProducts";

// --- Star Rating Component ---
const StarRating = ({ rating, size = "text-sm" }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i)
      stars.push(<FaStar key={i} className={`text-amber-400 ${size}`} />);
    else if (rating >= i - 0.5)
      stars.push(<FaStarHalfAlt key={i} className={`text-amber-400 ${size}`} />);
    else
      stars.push(<FaRegStar key={i} className={`text-slate-300 ${size}`} />);
  }
  return <div className="flex flex-row gap-0.5">{stars}</div>;
};

// --- Trust Badge Item ---
const TrustBadge = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-xs text-slate-600">
    <span className="text-emerald-500">{icon}</span>
    <span>{text}</span>
  </div>
);

const Product = () => {
  const location = useLocation();
  const id = location.pathname.split("/")[2];
  const { currentUser: user } = useAuth();
  const [product, setProduct] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });

  // UI States
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // "description" or "reviews"

  const dispatch = useDispatch();

  // Fetch Product
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

  const trackedProductId = useRef(null);

  // Tracking hành vi (view hoặc search_click)
  useEffect(() => {
    if (!user || !id) return;
    
    // Nếu ID này đã được ghi nhận thành công thì bỏ qua
    if (trackedProductId.current === id) return; 

    // Lấy source từ query string (?source=search)
    const queryParams = new URLSearchParams(location.search);
    const source = queryParams.get("source") || "direct";
    // Nếu source = search, ghi nhận là search_click, ngược lại là view
    const interactionType = source === "search" ? "search_click" : "view";

    const trackInteraction = async () => {
      try {
        await userRequest.post("/interactions/track", {
          productId: id,
          interactionType,
          source
        });
        // Đánh dấu là đã tracking thành công cho sản phẩm này
        trackedProductId.current = id;
      } catch (err) {
        console.error("Lỗi tracking:", err);
      }
    };

    // Thiết lập đếm ngược 10 giây mới tính là 1 lượt xem hợp lệ
    const timerId = setTimeout(() => {
      trackInteraction();
    }, 10000);

    userRequest
      .post("/recommend/refresh", {}, { withCredentials: true })
      .then((res) => {
        if (res.data?.status !== "SKIPPED") {
          console.log("[CF] Retrain triggered.");
        }
      })
      .catch(() => {
      });

    // Dọn dẹp (Cleanup function): Nếu người dùng thoát trang hoặc chuyển sang 
    // sản phẩm khác trước 10s, tiến trình này sẽ bị hủy và không ghi nhận lượt xem.
    return () => {
      clearTimeout(timerId);
    };
  }, [id, user, location.search]);

  // Fetch Reviews
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

  // Countdown timer logic
  useEffect(() => {
    if (!product.flashSale?.endTime) return;
    
    const interval = setInterval(() => {
      const now = moment();
      const end = moment(product.flashSale.endTime);
      const diff = end.diff(now);
      
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      } else {
        const duration = moment.duration(diff);
        const days = String(Math.floor(duration.asDays())).padStart(2, '0');
        const hours = String(duration.hours()).padStart(2, '0');
        const minutes = String(duration.minutes()).padStart(2, '0');
        const seconds = String(duration.seconds()).padStart(2, '0');
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [product.flashSale?.endTime]);

  const flashSaleRemaining = product.flashSale
    ? product.flashSale.quantityLimit - product.flashSale.soldCount
    : 0;
  const isFsSoldOut = product.flashSale && flashSaleRemaining <= 0;

  const handleQuantity = (action) => {
    let currentQty = quantity === "" ? 1 : quantity;
    if (action === "dec") {
      setQuantity(currentQty === 1 ? 1 : currentQty - 1);
    }
    if (action === "inc") {
      if (product.countInStock && currentQty >= product.countInStock) {
        toast.warning(`Kho chỉ còn ${product.countInStock} sản phẩm!`);
        return;
      }
      if (product.flashSale && !isFsSoldOut && currentQty === flashSaleRemaining) {
        toast.info(`Từ sản phẩm thứ ${flashSaleRemaining + 1} sẽ được tính giá gốc!`);
      }
      setQuantity(currentQty + 1);
    }
  };

  const handleQuantityInputChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val);
    if (isNaN(num)) return;
    
    if (product.countInStock && num > product.countInStock) {
      toast.warning(`Kho chỉ còn ${product.countInStock} sản phẩm!`);
      setQuantity(product.countInStock);
      return;
    }
    setQuantity(num);
  };

  const handleQuantityBlur = () => {
    if (quantity === "" || quantity < 1) {
      setQuantity(1);
    }
  };

  const calculatePrice = () => {
    if (product.flashSale && !isFsSoldOut) return product.flashSale.discountPrice;
    if (product.wholesalePrice && quantity >= product.wholesaleMinimumQuantity)
      return product.wholesalePrice;
    if (product.discountedPrice > 0) return product.discountedPrice;
    return product.originalPrice;
  };
  const finalPrice = calculatePrice();

  const discountPercent = product.originalPrice > finalPrice
    ? Math.round((1 - finalPrice / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (product.countInStock === 0) {
      toast.error("Sản phẩm đã hết hàng!");
      return;
    }

    try {
      if (user) {
        await userRequest.post('/interactions/track', {
          productId: id,
          interactionType: "add_to_cart",
          source: "direct"
        });
      }
    } catch (err) {
      console.log("Track error:", err);
    }

    const remainingFS = product.flashSale
      ? product.flashSale.quantityLimit - product.flashSale.soldCount
      : 0;

    const finalQty = quantity === "" ? 1 : quantity;

    if (!product.flashSale || remainingFS <= 0) {
      dispatch(addProduct({ ...product, price: finalPrice, regularPrice: product.originalPrice, quantity: finalQty, isFlashSale: false }));
      toast.success(`Đã thêm ${finalQty} cuốn vào giỏ`);
      return;
    }

    if (finalQty <= remainingFS) {
      dispatch(
        addProduct({
          ...product,
          price: product.flashSale.discountPrice,
          regularPrice: calculateNormalPrice(),
          quantity: finalQty,
          isFlashSale: true,
          flashSaleQuantityLimit: product.flashSale.quantityLimit,
          flashSaleSoldCount: product.flashSale.soldCount,
        })
      );
      toast.success(`Đã thêm ${finalQty} cuốn giá Flash Sale`);
    } else {
      const normalQty = finalQty - remainingFS;
      dispatch(
        addProduct({
          ...product,
          price: product.flashSale.discountPrice,
          regularPrice: calculateNormalPrice(),
          quantity: remainingFS,
          isFlashSale: true,
          flashSaleQuantityLimit: product.flashSale.quantityLimit,
          flashSaleSoldCount: product.flashSale.soldCount,
        })
      );
      dispatch(addProduct({ ...product, price: calculateNormalPrice(), regularPrice: product.originalPrice, quantity: normalQty, isFlashSale: false }));
      toast.info("Đã tách đơn hàng do vượt quá suất Flash Sale");
    }
  };

  const calculateNormalPrice = () => {
    if (product.wholesalePrice && quantity >= product.wholesaleMinimumQuantity)
      return product.wholesalePrice;
    if (product.discountedPrice > 0) return product.discountedPrice;
    return product.originalPrice;
  };

  // Loading skeleton
  if (loading)
    return (
      <div className="bg-slate-50 min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm p-10 flex gap-10 animate-pulse">
            <div className="w-2/5 aspect-[3/4] bg-slate-100 rounded-xl" />
            <div className="w-3/5 space-y-4">
              <div className="h-8 bg-slate-100 rounded-xl w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-12 bg-slate-100 rounded-xl w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===== MAIN CARD ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10 flex flex-col md:flex-row gap-10">

          {/* CỘT ẢNH */}
          <div className="w-full md:w-2/5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden
                            shadow-lg border border-slate-100 bg-slate-50">
              {/* Flash Sale badge overlay */}
              {product.flashSale && (
                <div className={`absolute top-3 left-3 z-10
                               text-white px-3 py-1.5 rounded-full
                               font-bold text-xs flex items-center gap-1.5
                               shadow-lg ${isFsSoldOut ? 'bg-slate-400' : 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-300/40 animate-pulse'}`}>
                  <FaBolt className="text-yellow-200" /> {isFsSoldOut ? "ĐÃ HẾT SUẤT" : "FLASH SALE"}
                </div>
              )}
              {/* Discount badge */}
              {discountPercent > 0 && !product.flashSale && (
                <div className="absolute top-3 right-3 z-10
                               bg-rose-100 text-rose-600 font-bold
                               text-sm px-2.5 py-1 rounded-full shadow-sm">
                  -{discountPercent}%
                </div>
              )}
              <img
                src={product.img}
                alt={product.title}
                className="absolute inset-0 w-full h-full object-contain p-4
                           hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* CỘT THÔNG TIN */}
          <div className="w-full md:w-3/5 flex flex-col">
            {/* Tên sách — font to, đen đậm */}
            <h1 className="text-3xl font-black text-slate-800 mb-2 leading-tight tracking-tight">
              {product.title}
            </h1>

            {/* Meta info */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-4">
              <span>
                Tác giả:{" "}
                <span className="text-orange-600 font-semibold">
                  {product.author || "Đang cập nhật"}
                </span>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                NXB:{" "}
                <span className="text-orange-600 font-semibold">
                  {product.publisher || "Đang cập nhật"}
                </span>
              </span>
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3 mb-6">
              <StarRating rating={product.rating || 0} size="text-lg" />
              <span className="text-sm font-bold text-amber-600">
                {product.rating ? product.rating.toFixed(1) : "0.0"}
              </span>
              <span
                className="text-sm text-slate-500 underline underline-offset-2 cursor-pointer
                            hover:text-orange-600 transition-colors"
              >
                ({product.numReviews || 0} đánh giá)
              </span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-sm text-slate-500 hidden sm:inline">
                Đã bán:{" "}
                <span className="text-slate-800 font-semibold">{product.sold || 0}</span>
              </span>
            </div>

            {/* ===== KHU VỰC GIÁ ===== */}
            <div
              className={`rounded-2xl p-5 mb-6 ${
                product.flashSale && !isFsSoldOut
                  ? "bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200"
                  : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
              }`}
            >
              {product.flashSale && !isFsSoldOut && (
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-sm uppercase tracking-wide">
                    <FaClock className="animate-pulse" />
                    <span>Kết thúc sau</span>
                  </div>
                  {/* Countdown Timer */}
                  <div className="flex items-center gap-1.5 font-bold text-white text-base">
                    {timeLeft.days !== "00" && (
                      <>
                        <div className="bg-black px-2 py-1 rounded shadow-md min-w-[36px] text-center">
                          {timeLeft.days}
                        </div>
                        <span className="text-black">:</span>
                      </>
                    )}
                    <div className="bg-black px-2 py-1 rounded shadow-md min-w-[36px] text-center">
                      {timeLeft.hours}
                    </div>
                    <span className="text-black">:</span>
                    <div className="bg-black px-2 py-1 rounded shadow-md min-w-[36px] text-center">
                      {timeLeft.minutes}
                    </div>
                    <span className="text-black">:</span>
                    <div className="bg-black px-2 py-1 rounded shadow-md min-w-[36px] text-center">
                      {timeLeft.seconds}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-end gap-3 mb-1">
                <span
                  className={`text-4xl font-black ${
                    product.flashSale ? "text-rose-600" : "text-amber-600"
                  }`}
                >
                  {finalPrice?.toLocaleString("vi-VN")} ₫
                </span>
                {product.originalPrice > finalPrice && (
                  <>
                    <span className="text-lg text-slate-400 line-through mb-1">
                      {product.originalPrice?.toLocaleString("vi-VN")} ₫
                    </span>
                    <span className="bg-rose-100 text-rose-600 text-xs font-black px-2.5 py-1 rounded-full mb-1">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* Flash Sale progress bar */}
              {product.flashSale && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-rose-500 mb-1.5">
                    {isFsSoldOut ? (
                      <span className="flex items-center gap-1 text-slate-500">
                        <FaFire /> Đã hết suất Flash Sale
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <FaFire /> Đã bán {product.flashSale.soldCount}
                        </span>
                        <span>Chỉ còn {flashSaleRemaining} suất</span>
                      </>
                    )}
                  </div>
                  <div className={`w-full ${isFsSoldOut ? 'bg-slate-200' : 'bg-rose-100'} rounded-full h-3 overflow-hidden`}>
                    <div
                      className={`${isFsSoldOut ? 'bg-slate-400' : 'bg-gradient-to-r from-rose-400 to-orange-500'} h-3 rounded-full transition-all duration-1000`}
                      style={{
                        width: `${Math.min(
                          (product.flashSale.soldCount / product.flashSale.quantityLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-sm mb-5">
              <span className="text-slate-500">Tình trạng kho:</span>
              {product.countInStock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <FaCheckCircle className="text-xs" />
                  Còn hàng ({product.countInStock} sản phẩm)
                </span>
              ) : (
                <span className="text-rose-500 font-semibold">Hết hàng</span>
              )}
            </div>

            {/* Quantity selector + CTA button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
              {/* Qty control */}
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => handleQuantity("dec")}
                  className="px-4 py-3 hover:bg-slate-50 transition-colors text-slate-600
                             border-r border-slate-200"
                >
                  <FaMinus size={11} />
                </button>
                <input
                  type="text"
                  value={quantity}
                  onChange={handleQuantityInputChange}
                  onBlur={handleQuantityBlur}
                  className="px-2 py-3 font-bold text-slate-800 w-16 text-center outline-none focus:bg-slate-50"
                />
                <button
                  onClick={() => handleQuantity("inc")}
                  className="px-4 py-3 hover:bg-slate-50 transition-colors text-slate-600
                             border-l border-slate-200"
                >
                  <FaPlus size={11} />
                </button>
              </div>

              {/* CTA button — Gradient đa sắc */}
              <button
                onClick={handleAddToCart}
                disabled={product.countInStock === 0}
                className={`flex-1 py-3.5 px-8 rounded-xl font-black text-white
                           flex items-center justify-center gap-2.5 text-sm uppercase tracking-wide
                           shadow-lg transition-all duration-200 group
                           ${product.countInStock > 0
                    ? `bg-gradient-to-r from-amber-400 to-orange-500
                       hover:from-amber-500 hover:to-orange-600
                       shadow-amber-300/50 hover:shadow-xl hover:shadow-amber-400/40
                       hover:scale-[1.02] active:scale-[0.98]`
                    : "bg-slate-300 cursor-not-allowed shadow-none"
                  }`}
              >
                <FaShoppingCart className="text-lg group-hover:scale-110 transition-transform" />
                {product.countInStock > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-100">
              <TrustBadge icon={<FaShieldAlt />} text="Cam kết chính hãng 100%" />
              <TrustBadge icon={<FaTruck />} text="Miễn phí vận chuyển đơn 300k" />
              <TrustBadge icon={<FaUndo />} text="Đổi trả trong 7 ngày" />
              <TrustBadge icon={<FaCheckCircle />} text="Hoàn tiền 200% nếu giả" />
            </div>
          </div>
        </div>

        {/* ===== MÔ TẢ & REVIEWS (TABS) ===== */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab("description")}
              className={`pb-4 px-6 text-lg font-bold whitespace-nowrap transition-all duration-300 border-b-4 ${
                activeTab === "description"
                  ? "text-orange-600 border-orange-500"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              Mô tả sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 px-6 text-lg font-bold whitespace-nowrap transition-all duration-300 border-b-4 flex items-center gap-2 ${
                activeTab === "reviews"
                  ? "text-orange-600 border-orange-500"
                  : "text-slate-400 border-transparent hover:text-slate-600"
              }`}
            >
              Đánh giá khách hàng
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === "reviews" ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"}`}>
                {reviews.length}
              </span>
            </button>
          </div>

          {/* Tab Content: Mô tả */}
          {activeTab === "description" && (
            <div className="animate-fade-in">
              <div className={`relative transition-all duration-500 ease-in-out ${!showFullDesc ? "max-h-[400px] overflow-hidden" : ""}`}>
                <div className="text-slate-700 text-justify leading-loose whitespace-pre-line text-sm pb-4">
                  {product.desc ? (
                    <div dangerouslySetInnerHTML={{ __html: product.desc }} />
                  ) : (
                    "Chưa có mô tả chi tiết cho sản phẩm này."
                  )}
                </div>
                
                {/* Lớp gradient che phủ khi bị thu gọn */}
                {!showFullDesc && product.desc && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                )}
              </div>

              {/* Nút Xem thêm */}
              {product.desc && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowFullDesc(!showFullDesc)}
                    className="px-8 py-2.5 rounded-full border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold text-sm transition-colors shadow-sm"
                  >
                    {showFullDesc ? "Thu gọn mô tả" : "Xem toàn bộ nội dung"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Đánh giá */}
          {activeTab === "reviews" && (
            <div className="animate-fade-in">
              {loadingReviews ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-1/4" />
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {(showAllReviews ? reviews : reviews.slice(0, 3)).map((rev) => (
                    <div key={rev._id} className="flex gap-4 pb-6 border-b border-slate-100 last:border-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0
                                     bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                        {rev.user?.avatar ? (
                          <img src={rev.user.avatar} alt="Ava" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {rev.user?.fullname ? rev.user.fullname.charAt(0).toUpperCase() : "U"}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-slate-800">{rev.user?.fullname || "Người dùng ẩn danh"}</h4>
                          <span className="text-xs text-slate-400">{moment(rev.createdAt).fromNow()}</span>
                        </div>
                        <div className="mb-2.5">
                          <StarRating rating={rev.rating} size="text-xs" />
                        </div>
                        <p className="text-slate-600 text-sm bg-slate-50 p-3.5 rounded-xl leading-relaxed text-justify">
                          {rev.comment}
                        </p>
                        {rev.reply && (
                          <div className="mt-3 ml-4 bg-orange-50 p-3.5 rounded-xl border-l-4 border-orange-400">
                            <p className="text-xs font-bold text-orange-700 mb-1">
                              💬 Phản hồi của Nhà sách:
                            </p>
                            <p className="text-sm text-slate-700">{rev.reply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Nút Xem tất cả đánh giá */}
                  {reviews.length > 3 && (
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="px-8 py-2.5 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-sm transition-colors border border-orange-200"
                      >
                        {showAllReviews ? "Thu gọn đánh giá" : `Xem tất cả ${reviews.length} đánh giá`}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-14 text-slate-400">
                  <div className="text-5xl mb-3">📚</div>
                  <p className="font-medium">Chưa có đánh giá nào</p>
                  <p className="text-sm">Hãy là người đầu tiên nhận xét về cuốn sách này!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- LỌC NỘI DUNG: SÁCH TƯƠNG TỰ --- */}
        <SimilarProducts productId={product._id} topK={10} />
        {/*
        <RecommendedForYou topK={10} />
        */}

      </div>
    </div>
  );
};

export default Product;
