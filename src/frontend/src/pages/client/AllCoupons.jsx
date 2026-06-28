import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { updateWallet } from "../../redux/userRedux";
import { FaCheck, FaGift, FaTimesCircle } from "react-icons/fa";

const AllCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser: user } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    const getCoupons = async () => {
      try {
        setLoading(true);
        const res = await userRequest.get("/coupons?isActive=true");
        // Lọc các mã còn hạn
        const validCoupons = res.data.filter(
          (c) => new Date(c.endDate) > new Date()
        );
        setCoupons(validCoupons);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách mã giảm giá!");
      } finally {
        setLoading(false);
      }
    };
    getCoupons();
  }, []);

  const handleSaveCoupon = async (couponId) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu mã!");
      return;
    }
    try {
      const res = await userRequest.post("/coupons/save", { couponId });
      toast.success("Đã lưu vào kho voucher!");
      dispatch(updateWallet(res.data.wallet));
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi lưu mã");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-primary to-orange-600 p-4 rounded-2xl shadow-lg shadow-orange-200 text-white">
            <FaGift className="text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-600 uppercase tracking-tight">
              Tất Cả Quà Tặng Từ Ong Vàng
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Sưu tầm ngay các mã giảm giá cực hot để mua sách với giá siêu hời!
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20">
          <FaGift className="text-6xl text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-500">Hiện chưa có mã giảm giá nào.</h3>
          <p className="text-gray-400">Vui lòng quay lại sau nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const isSaved = user?.wallet?.some(
              (item) => item.coupon === coupon._id || item.coupon?._id === coupon._id
            );
            const isOutOfLimit = coupon.usedCount >= coupon.usageLimit;
            const isPercent = coupon.discountType === "PERCENT";
            const valueDisplay = isPercent ? coupon.discountValue : coupon.discountValue / 1000;
            const unitDisplay = isPercent ? "%" : "K";
            const subText = isPercent ? "GIẢM TỐI ĐA" : "GIẢM TRỰC TIẾP";

            return (
              <div
                key={coupon._id}
                className={`group relative w-full h-[150px] flex bg-white rounded-2xl
                            shadow-md hover:shadow-2xl hover:shadow-orange-200/50
                            transition-all duration-300 transform hover:-translate-y-1
                            overflow-hidden border ${
                              isOutOfLimit
                                ? "border-gray-200 grayscale-[0.8] opacity-80"
                                : "border-orange-100"
                            }`}
              >
                {/* LEFT — Gradient panel */}
                <div
                  className={`w-[35%] relative flex flex-col items-center justify-center text-white p-2
                              ${
                                isSaved || isOutOfLimit
                                  ? "bg-gray-400"
                                  : "bg-gradient-to-br from-primary via-orange-500 to-red-500"
                              }`}
                >
                  <div className="text-4xl font-black tracking-tighter drop-shadow-md">
                    {valueDisplay}
                    <span className="text-lg align-top ml-0.5">{unitDisplay}</span>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider opacity-90 mt-1 text-center bg-black/10 px-2 py-0.5 rounded-full">
                    {subText}
                  </span>
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                </div>

                {/* Dashed divider */}
                <div className="relative w-0 border-l-2 border-dashed border-gray-200 h-full" />
                <div className="absolute top-0 left-[35%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-inner z-10 border-b border-gray-200" />
                <div className="absolute bottom-0 left-[35%] -translate-x-1/2 translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-inner z-10 border-t border-gray-200" />

                {/* RIGHT — Content */}
                <div className="flex-1 p-3 md:p-4 flex flex-col justify-between bg-white">
                  <div>
                    <span
                      className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded border mb-1 ${
                        isOutOfLimit
                          ? "bg-gray-100 text-gray-500 border-gray-200"
                          : "bg-orange-50 text-primary border-orange-200"
                      }`}
                    >
                      {coupon.code}
                    </span>
                    <h3
                      className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight"
                      title={coupon.description}
                    >
                      {coupon.description}
                    </h3>
                  </div>

                  <div className="flex items-end justify-between mt-2">
                    <div className="text-xs text-gray-400 font-medium">
                      <p className={`flex items-center gap-1 font-bold ${isOutOfLimit ? "text-gray-400" : "text-primary"}`}>
                        HSD:{" "}
                        {new Date(coupon.endDate).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                      {isPercent && coupon.maxDiscountAmount > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Tối đa {coupon.maxDiscountAmount / 1000}k
                        </p>
                      )}
                    </div>

                    {/* Save button */}
                    <button
                      onClick={() => handleSaveCoupon(coupon._id)}
                      disabled={isSaved || isOutOfLimit}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-md
                                 transition-all transform active:scale-95
                                 flex items-center gap-1 uppercase tracking-wide whitespace-nowrap
                                 ${
                                   isSaved
                                     ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                     : isOutOfLimit
                                     ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-200 opacity-80"
                                     : "bg-gradient-to-r from-primary to-orange-600 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-200 cursor-pointer"
                                 }`}
                    >
                      {isSaved ? (
                        <><FaCheck /> Đã Lưu</>
                      ) : isOutOfLimit ? (
                        <><FaTimesCircle /> Hết lượt</>
                      ) : (
                        "Lưu"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllCoupons;
