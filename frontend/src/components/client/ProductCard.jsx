import { Link } from "react-router-dom";
import { FaFire, FaStar, FaLeaf, FaBolt } from "react-icons/fa";

const ProductCard = ({ product, isFlashSale = false, isNew = false, isBestSeller = false }) => {
  // Ưu tiên dữ liệu flash sale từ API
  const hasFlashSale = Boolean(product.flashSale) || isFlashSale;
  const fsSoldCount = product.flashSale ? product.flashSale.soldCount : product.sold;
  const fsQuantityLimit = product.flashSale ? product.flashSale.quantityLimit : (product.countInStock || 1);
  const isFsSoldOut = hasFlashSale && fsSoldCount >= fsQuantityLimit;

  const displayPrice = hasFlashSale && !isFsSoldOut 
    ? (product.flashSale ? product.flashSale.discountPrice : product.discountedPrice)
    : product.discountedPrice;

  // Tính phần trăm giảm giá
  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - displayPrice) /
          product.originalPrice) *
          100
      )
    : 0;

  return (
    <div
      className="bg-white p-3 rounded-2xl border border-slate-100 cursor-pointer relative group h-full flex flex-col
                 transition-all duration-300
                 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-violet-200/50
                 hover:border-violet-100"
    >
      {/* ===== BADGES LAYER ===== */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {hasFlashSale && (
          <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-rose-300/50">
            <FaBolt className="text-[8px]" /> Flash
          </span>
        )}
        {isNew && !hasFlashSale && (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <FaLeaf className="text-[8px]" /> Mới
          </span>
        )}
        {isBestSeller && !hasFlashSale && (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            🏆 Hot
          </span>
        )}
      </div>

      {/* Discount badge — soft-solid style */}
      {discountPercent > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-rose-100 text-rose-600 font-bold text-[11px] px-2 py-0.5 rounded-full">
          -{discountPercent}%
        </div>
      )}

      <Link to={`/product/${product._id}`} className="flex-1 flex flex-col">
        {/* Ảnh sản phẩm */}
        <div className="h-48 w-full flex items-center justify-center overflow-hidden mb-3 rounded-xl bg-slate-50">
          <img
            src={product.img}
            alt={product.title}
            className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-400"
          />
        </div>

        {/* Tên sách */}
        <h3 className="text-sm font-medium text-slate-700 line-clamp-2 mb-2 min-h-[40px] group-hover:text-violet-700 transition-colors duration-200">
          {product.title}
        </h3>

        {/* Giá tiền */}
        <div className="mt-auto">
          <div className="flex items-end gap-2">
            <span className="text-amber-600 font-bold text-lg leading-none">
              {displayPrice?.toLocaleString("vi-VN")}đ
            </span>
            {product.originalPrice > 0 && discountPercent > 0 && (
              <span className="text-slate-400 text-xs line-through mb-0.5">
                {product.originalPrice?.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>

          {/* Flash Sale Progress Bar */}
          {hasFlashSale ? (
            <div className="mt-3 relative">
              <div className="w-full bg-rose-100 rounded-full h-4 relative overflow-hidden">
                <div
                  className={`${isFsSoldOut ? "bg-slate-400" : "bg-gradient-to-r from-rose-400 to-orange-500"} h-full absolute top-0 left-0`}
                  style={{
                    width: `${Math.min(
                      (fsSoldCount / Math.max(fsQuantityLimit, 1)) * 100,
                      100
                    )}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white z-10 uppercase tracking-wide gap-1">
                  {isFsSoldOut ? (
                    "ĐÃ HẾT"
                  ) : (
                    <>
                      <FaFire className="text-[8px]" /> Đã bán {fsSoldCount}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Rating + sold count
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-1 text-amber-400">
                <FaStar />
                <span className="text-slate-500 font-medium">
                  {product.rating ? product.rating.toFixed(1) : "0.0"}
                </span>
              </div>
              <span className="text-slate-400">Đã bán {product.sold || 0}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
