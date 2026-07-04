import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaTicketAlt,
  FaFire,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const MyVouchers = () => {
  const { currentUser: user } = useAuth();
  const wallet = user?.wallet || [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
                  <h1 className="text-xl font-extrabold text-slate-800">
                    Kho Mã Giảm Giá Của Tôi
                  </h1>
                </div>
                <div className="inline-flex items-center px-4 py-2 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-sm font-medium text-orange-800">
                    Bạn đang có{" "}
                    <b className="text-orange-600 text-lg mx-1">
                      {wallet.filter((i) => !i.isUsed).length}
                    </b>{" "}
                    mã khả dụng
                  </span>
                </div>
              </div>

              {wallet.length === 0 ? (
                // EMPTY STATE
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-5 text-slate-300 text-4xl border border-slate-100">
                    <FaTicketAlt />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">
                    Ví voucher trống trơn!
                  </h3>
                  <p className="text-slate-500 mb-8">
                    Bạn chưa lưu mã giảm giá nào cả. Hãy săn mã ngay để tiết kiệm hơn nhé!
                  </p>
                  <Link to="/">
                    <button className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-md shadow-orange-300/40 hover:-translate-y-0.5 transition-all">
                      Săn Mã Ngay
                    </button>
                  </Link>
                </div>
              ) : (
                // LIST VOUCHERS
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        className="relative w-full h-[130px] flex bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group"
                      >
                        {/* --- PHẦN TRÁI (VALUE) --- */}
                        <div
                          className={`w-32 md:w-36 relative flex flex-col items-center justify-center text-white shrink-0
                          ${
                            isDisabled
                              ? "bg-slate-300" // Màu xám (Disabled)
                              : "bg-gradient-to-br from-amber-400 to-orange-500" // Màu Lửa (Active)
                          }`}
                        >
                          <div className="text-3xl md:text-4xl font-black tracking-tighter drop-shadow-sm">
                            {valueDisplay}
                            <span className="text-base md:text-lg align-top ml-0.5 font-bold">
                              {unitDisplay}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-1 text-center bg-black/10 px-2.5 py-0.5 rounded-full">
                            {subText}
                          </span>
                          {/* Họa tiết nền */}
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
                        </div>

                        {/* --- ĐƯỜNG CẮT (RĂNG CƯA) --- */}
                        <div className="relative w-0 border-l-2 border-dashed border-slate-200 h-full"></div>
                        <div className="absolute top-0 left-32 md:left-36 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-b border-slate-200 z-10 shadow-inner"></div>
                        <div className="absolute bottom-0 left-32 md:left-36 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white rounded-full border-t border-slate-200 z-10 shadow-inner"></div>

                        {/* --- PHẦN PHẢI (INFO) --- */}
                        <div className="flex-1 p-4 md:p-5 flex flex-col justify-between bg-white relative min-w-0">
                          {/* Header: Code */}
                          <div className="flex justify-between items-start">
                            <div className="pr-2">
                              <span
                                className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded-md border mb-1.5
                                      ${
                                        isDisabled
                                          ? "bg-slate-50 text-slate-500 border-slate-200"
                                          : "bg-orange-50 text-orange-600 border-orange-200"
                                      }`}
                              >
                                {coupon.code}
                              </span>
                              <h3
                                className="text-sm font-bold text-slate-800 line-clamp-1"
                                title={coupon.description}
                              >
                                {coupon.description}
                              </h3>
                            </div>
                          </div>

                          {/* Footer: Date & Status Badge */}
                          <div className="flex items-end justify-between mt-1">
                            <div className="text-xs text-slate-500 font-medium space-y-0.5">
                              <p>
                                HSD:{" "}
                                {new Date(coupon.endDate).toLocaleDateString("vi-VN")}
                              </p>
                              {isPercent && coupon.maxDiscountAmount > 0 && (
                                <p className="text-[10px] text-slate-400">
                                  Tối đa {(coupon.maxDiscountAmount / 1000).toLocaleString()}k
                                </p>
                              )}
                            </div>

                            {/* STATUS BADGE */}
                            <div className="shrink-0">
                              {isUsed ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                                  <FaCheckCircle /> Đã dùng
                                </span>
                              ) : isExpired ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                                  <FaTimesCircle /> Hết hạn
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 shadow-sm">
                                  <FaFire className="text-orange-500" /> Sẵn sàng
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
    </div>
  );
};

export default MyVouchers;
