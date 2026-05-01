import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaTicketAlt,
  FaFire,
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const MyVouchers = () => {
  const { currentUser: user } = useAuth();
  const wallet = user?.wallet || [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 flex items-center gap-3">
            <span className="bg-orange-100 p-3 rounded-2xl text-orange-600">
              <FaTicketAlt />
            </span>
            KHO MÃ GIẢM GIÁ CỦA TÔI
          </h1>
          <span className="text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hidden sm:block">
            Bạn đang có{" "}
            <b className="text-orange-600">
              {wallet.filter((i) => !i.isUsed).length}
            </b>{" "}
            mã khả dụng
          </span>
        </div>

        {wallet.length === 0 ? (
          // EMPTY STATE
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 text-4xl">
              <FaTicketAlt />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Ví voucher trống trơn!
            </h3>
            <p className="text-gray-500 mb-6">
              Bạn chưa lưu mã giảm giá nào cả.
            </p>
            <Link to="/">
              <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-bold shadow-lg hover:shadow-orange-200 transform hover:-translate-y-1 transition-all">
                Săn Mã Ngay
              </button>
            </Link>
          </div>
        ) : (
          // LIST VOUCHERS
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {wallet.map((item, index) => {
              const coupon = item.coupon;

              // Handle coupon null (bị xóa khỏi DB)
              if (!coupon) return null;

              // Logic hiển thị
              const isPercent = coupon.discountType === "PERCENT";
              const valueDisplay = isPercent
                ? coupon.discountValue
                : coupon.discountValue / 1000;
              const unitDisplay = isPercent ? "%" : "K";
              const subText = isPercent ? "GIẢM TỐI ĐA" : "GIẢM TRỰC TIẾP";

              // Logic trạng thái
              const isUsed = item.isUsed;
              const isExpired = new Date() > new Date(coupon.endDate);
              const isInactive = !coupon.isActive;

              // Xác định trạng thái cuối cùng để hiển thị màu sắc
              // Màu xám nếu: Đã dùng OR Hết hạn OR Bị khóa
              const isDisabled = isUsed || isExpired || isInactive;

              return (
                <div
                  key={index}
                  className="relative w-full h-[140px] flex bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* --- PHẦN TRÁI (VALUE) --- */}
                  <div
                    className={`w-[35%] relative flex flex-col items-center justify-center text-white p-2
                    ${
                      isDisabled
                        ? "bg-gray-400" // Màu xám (Disabled)
                        : "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600" // Màu Lửa (Active)
                    }`}
                  >
                    <div className="text-3xl md:text-4xl font-black tracking-tighter drop-shadow-md">
                      {valueDisplay}
                      <span className="text-base md:text-lg align-top ml-0.5">
                        {unitDisplay}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-1 text-center bg-black/10 px-2 py-0.5 rounded-full">
                      {subText}
                    </span>
                    {/* Họa tiết nền */}
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                  </div>

                  {/* --- ĐƯỜNG CẮT (RĂNG CƯA) --- */}
                  <div className="relative w-0 border-l-2 border-dashed border-gray-200 h-full"></div>
                  <div className="absolute top-0 left-[35%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-gray-50 rounded-full border-b border-gray-200 z-10"></div>
                  <div className="absolute bottom-0 left-[35%] -translate-x-1/2 translate-y-1/2 w-5 h-5 bg-gray-50 rounded-full border-t border-gray-200 z-10"></div>

                  {/* --- PHẦN PHẢI (INFO) --- */}
                  <div className="flex-1 p-4 flex flex-col justify-between bg-white relative">
                    {/* Header: Code */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span
                          className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded border mb-1
                                ${
                                  isDisabled
                                    ? "bg-gray-100 text-gray-500 border-gray-200"
                                    : "bg-orange-50 text-orange-700 border-orange-200"
                                }`}
                        >
                          {coupon.code}
                        </span>
                        <h3
                          className="text-sm font-bold text-gray-800 line-clamp-1"
                          title={coupon.description}
                        >
                          {coupon.description}
                        </h3>
                      </div>
                    </div>

                    {/* Footer: Date & Status Badge */}
                    <div className="flex items-end justify-between mt-1">
                      <div className="text-xs text-gray-400 font-medium">
                        <p>
                          HSD:{" "}
                          {new Date(coupon.endDate).toLocaleDateString("vi-VN")}
                        </p>
                        {isPercent && coupon.maxDiscountAmount > 0 && (
                          <p className="text-[10px]">
                            Tối đa {coupon.maxDiscountAmount / 1000}k
                          </p>
                        )}
                      </div>

                      {/* STATUS BADGE */}
                      <div>
                        {isUsed ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                            <FaCheckCircle /> Đã dùng
                          </span>
                        ) : isExpired ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                            <FaTimesCircle /> Hết hạn
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 animate-pulse">
                            <FaFire /> Sẵn sàng
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVouchers;

