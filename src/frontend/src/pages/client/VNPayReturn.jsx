import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { publicRequest } from "../../requestMethods";
import { FaCheckCircle, FaTimesCircle, FaSpinner } from "react-icons/fa";

const VNPayReturn = () => {
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Gửi toàn bộ query string (vnp_...) lên backend để kiểm tra chữ ký
        const res = await publicRequest.get(`/payment/vnpay_return${location.search}`);
        if (res.data.success) {
          setStatus("success");
          setMessage("Thanh toán thành công! Đơn hàng của bạn đã được ghi nhận.");
        } else {
          setStatus("error");
          setMessage(res.data.message || "Giao dịch thất bại.");
        }
      } catch (err) {
        console.error("Lỗi verify VNPay:", err);
        setStatus("error");
        setMessage(err.response?.data?.message || "Đã xảy ra lỗi khi xác minh giao dịch.");
      }
    };

    if (location.search) {
      verifyPayment();
    } else {
      setStatus("error");
      setMessage("Không tìm thấy dữ liệu giao dịch.");
    }
  }, [location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center relative overflow-hidden">
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>

        {/* VNPay Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-white px-4 rounded-xl shadow-sm border border-slate-100 h-14 flex items-center justify-center">
            <img
              src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png"
              alt="VNPay"
              className="h-7 object-contain"
            />
          </div>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center py-6">
            <FaSpinner className="animate-spin text-5xl text-primary mb-6" />
            <h2 className="text-xl font-black text-slate-800">Đang xác minh giao dịch...</h2>
            <p className="text-slate-500 mt-2 text-sm">Vui lòng không đóng trình duyệt lúc này.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-4 animate-fadeIn">
            <FaCheckCircle className="text-6xl text-emerald-500 mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-black text-slate-800">Thanh Toán Hoàn Tất!</h2>
            <p className="text-slate-600 mt-2 font-medium">{message}</p>
            <div className="mt-8 flex flex-col gap-3 w-full">
              <Link to="/myorders" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md shadow-orange-200 hover:scale-105 transition-transform">
                Xem Đơn Hàng Của Bạn
              </Link>
              <Link to="/products" className="w-full py-3 bg-orange-50 text-primary font-bold rounded-xl hover:bg-orange-100 transition-colors">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-4 animate-fadeIn">
            <FaTimesCircle className="text-6xl text-rose-500 mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-black text-slate-800">Giao Dịch Thất Bại</h2>
            <p className="text-slate-600 mt-2 font-medium">{message}</p>
            <div className="mt-8 flex flex-col gap-3 w-full">
              <button onClick={() => navigate(-1)} className="w-full py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-colors">
                Thử Lại Thanh Toán
              </button>
              <Link to="/" className="w-full py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                Về Trang Chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VNPayReturn;
