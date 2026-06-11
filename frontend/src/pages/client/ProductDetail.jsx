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
import { useState, useEffect } from "react";
import { userRequest } from "../../requestMethods";
import { useDispatch } from "react-redux";
import { addProduct } from "../../redux/cartRedux";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import moment from "moment";
import RelatedProducts from "../../components/client/RelatedProducts";
import SimilarProducts from "../../components/client/SimilarProducts";
import RecommendedForYou from "../../components/client/RecommendedForYou";

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

  // Trigger CF retrain sau khi user đã đăng nhập xem sản phẩm
  // → cập nhật danh sách "Dành Riêng Cho Bạn" khi quay lại trang chủ
  useEffect(() => {
    if (!user || !id) return;

    // Fire and forget — không await, không hiện loading, không block UX
    userRequest
      .post("/recommend/refresh", {}, { withCredentials: true })
      .then((res) => {
        if (res.data?.status !== "SKIPPED") {
          console.log("[CF] Retrain triggered — gợi ý sẽ cập nhật sau vài giây.");
        }
      })
      .catch(() => {
        // Silent fail — không làm hỏng trải nghiệm xem sản phẩm
      });
  }, [id, user?._id]);

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
        toast.warning(`Bạn chỉ có thể mua tối đa ${flashSaleRemaining} suất giá sốc!`);
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

  const discountPercent = product.originalPrice > finalPrice
    ? Math.round((1 - finalPrice / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (product.countInStock === 0) {
      toast.error("Sản phẩm đã hết hàng!");
      return;
    }

    const remainingFS = product.isFlashSale
      ? product.flashSaleLimit - product.flashSaleSold
      : 0;

    if (!product.isFlashSale || remainingFS <= 0) {
      dispatch(addProduct({ ...product, price: product.originalPrice, quantity, isFlashSale: false }));
      toast.success(`Đã thêm ${quantity} cuốn vào giỏ`);
      return;
    }

    if (quantity <= remainingFS) {
      dispatch(addProduct({ ...product, price: product.discountedPrice, quantity, isFlashSale: true }));
      toast.success(`Đã thêm ${quantity} cuốn giá Flash Sale`);
    } else {
      const normalQty = quantity - remainingFS;
      dispatch(addProduct({ ...product, price: product.discountedPrice, quantity: remainingFS, isFlashSale: true }));
      dispatch(addProduct({ ...product, price: product.originalPrice, quantity: normalQty, isFlashSale: false }));
      toast.info("Đã tách đơn hàng do vượt quá suất Flash Sale");
    }
  };

  // Loading skeleton
  if (loading)
    return (
      <div className="bg-slate-50 min-h-screen py-10">
        <div className="max-w-6xl mx-auto px-4">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===== MAIN CARD ===== */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10 flex flex-col md:flex-row gap-10">

          {/* CỘT ẢNH */}
          <div className="w-full md:w-2/5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden
                            shadow-lg border border-slate-100 bg-slate-50">
              {/* Flash Sale badge overlay */}
              {product.isFlashSale && (
                <div className="absolute top-3 left-3 z-10
                               bg-gradient-to-r from-rose-500 to-orange-500
                               text-white px-3 py-1.5 rounded-full
                               font-bold text-xs flex items-center gap-1.5
                               shadow-lg shadow-rose-300/40 animate-pulse">
                  <FaBolt className="text-yellow-200" /> FLASH SALE
                </div>
              )}
              {/* Discount badge */}
              {discountPercent > 0 && !product.isFlashSale && (
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
                <span className="text-violet-600 font-semibold">
                  {product.author || "Đang cập nhật"}
                </span>
              </span>
              <span className="text-slate-300">|</span>
              <span>
                NXB:{" "}
                <span className="text-violet-600 font-semibold">
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
                            hover:text-violet-600 transition-colors"
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
                product.isFlashSale
                  ? "bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200"
                  : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100"
              }`}
            >
              {product.isFlashSale && (
                <div className="flex items-center gap-2 text-rose-600 font-bold mb-3 text-sm uppercase tracking-wide">
                  <FaClock className="animate-pulse" />
                  <span>Kết thúc sớm — Số lượng có hạn</span>
                </div>
              )}

              <div className="flex items-end gap-3 mb-1">
                <span
                  className={`text-4xl font-black ${
                    product.isFlashSale ? "text-rose-600" : "text-amber-600"
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
              {product.isFlashSale && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-rose-500 mb-1.5">
                    <span className="flex items-center gap-1">
                      <FaFire /> Đã bán {product.flashSaleSold}
                    </span>
                    <span>Chỉ còn {flashSaleRemaining} suất</span>
                  </div>
                  <div className="w-full bg-rose-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(
                          (product.flashSaleSold / product.flashSaleLimit) * 100,
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
                <span className="px-5 py-3 font-bold text-slate-800 min-w-[48px] text-center">
                  {quantity}
                </span>
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

        {/* ===== MÔ TẢ & REVIEWS ===== */}
        <div className="mt-8 space-y-6">

          {/* Mô tả sản phẩm */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="w-1 h-6 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-full" />
              <h2 className="text-xl font-extrabold text-slate-800">Mô tả sản phẩm</h2>
            </div>
            <div className="text-slate-700 leading-loose whitespace-pre-line text-sm">
              {product.desc || "Chưa có mô tả chi tiết."}
            </div>
          </div>

          {/* Đánh giá */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                <h2 className="text-xl font-extrabold text-slate-800">
                  Đánh giá của khách hàng
                </h2>
              </div>
              <span className="text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full">
                {reviews.length} đánh giá
              </span>
            </div>

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
                {reviews.map((rev) => (
                  <div key={rev._id} className="flex gap-4 pb-6 border-b border-slate-100 last:border-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0
                                   bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
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
                      <p className="text-slate-600 text-sm bg-slate-50 p-3.5 rounded-xl leading-relaxed">
                        {rev.comment}
                      </p>
                      {rev.reply && (
                        <div className="mt-3 ml-4 bg-violet-50 p-3.5 rounded-xl border-l-4 border-violet-400">
                          <p className="text-xs font-bold text-violet-700 mb-1">
                            💬 Phản hồi của Nhà sách:
                          </p>
                          <p className="text-sm text-slate-700">{rev.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-14 text-slate-400">
                <div className="text-5xl mb-3">📚</div>
                <p className="font-medium">Chưa có đánh giá nào</p>
                <p className="text-sm">Hãy là người đầu tiên nhận xét về cuốn sách này!</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Similar Products — Content-Based Filtering */}
        {/* Gộp cả SimilarProducts + RelatedProducts thành 1 section duy nhất.
            SimilarProducts đã có fallback query cùng category khi AI unavailable. */}
        {product._id && <SimilarProducts productId={product._id} topK={10} />}

        {/* Gợi ý cá nhân hóa — chỉ hiện khi đăng nhập, giống Fahasa */}
        <RecommendedForYou topK={10} />
      </div>
    </div>
  );
};

export default Product;
