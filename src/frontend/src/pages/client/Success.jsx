import { useEffect, useState, useRef } from "react"; // 1. Import useRef
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import { clearCart } from "../../redux/cartRedux";
import { useAuth } from "../../context/AuthContext";
import { FaCheckCircle, FaSpinner } from "react-icons/fa";

const Success = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { currentUser } = useAuth();

  const [orderId, setOrderId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Dùng state toàn cục module thay vì useRef để tránh lỗi StrictMode mount 2 lần
  useEffect(() => {
    const createOrder = async () => {
      // Nếu giỏ hàng trống HOẶC đã bắt đầu xử lý tạo đơn rồi thì dừng ngay
      if (cart.products.length === 0 || window.isOrderCreatingStripe) {
        setIsProcessing(false);
        return;
      }

      // Đánh dấu là đang chạy để lần sau không chạy nữa
      window.isOrderCreatingStripe = true;

      const tempShipping =
        JSON.parse(localStorage.getItem("tempOrderData")) || {};

      // Xây dựng địa chỉ fallback từ Address Book nếu tempShipping không có
      const defaultAddr =
        currentUser.addresses?.find((a) => a.isDefault) ||
        currentUser.addresses?.[0];
      const fallbackAddress = defaultAddr
        ? `${defaultAddr.street}, ${defaultAddr.wardName}, ${defaultAddr.districtName}, ${defaultAddr.provinceName}`
        : "";

      const orderData = {
        userId: currentUser._id,
        products: cart.products.map((item) => ({
          productId: item._id,
          title: item.title,
          img: item.img,
          quantity: item.quantity,
          price: item.price,
        })),
        total: cart.total,
        name: tempShipping.name || currentUser.fullname,
        email: tempShipping.email || currentUser.email,
        address: tempShipping.address || fallbackAddress,
        phone: tempShipping.phone || currentUser.phone,
        paymentMethod: "Stripe",
        status: 1,
      };

      try {
        const res = await userRequest.post("/orders", orderData);
        setOrderId(res.data._id);
        dispatch(clearCart());
        localStorage.removeItem("tempOrderData");
      } catch (err) {
        console.error(err);
        window.isOrderCreatingStripe = false; // reset nếu lỗi để thử lại
      } finally {
        setIsProcessing(false);
      }
    };

    if (currentUser) {
      createOrder();
    } else {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Để dependency rỗng [] để chỉ chạy 1 lần khi mount

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center relative overflow-hidden">
        {/* Decorative Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-amber-500"></div>

        {/* Stripe Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-white px-4 rounded-xl shadow-sm border border-slate-100 h-14 flex items-center justify-center">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
              alt="Stripe"
              className="h-7 object-contain"
            />
          </div>
        </div>

        {isProcessing ? (
          <div className="flex flex-col items-center py-6">
            <FaSpinner className="animate-spin text-5xl text-primary mb-6" />
            <h2 className="text-xl font-black text-slate-800">Đang xử lý đơn hàng...</h2>
            <p className="text-slate-500 mt-2 text-sm">Vui lòng không đóng trình duyệt lúc này.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4 animate-fadeIn">
            <FaCheckCircle className="text-6xl text-emerald-500 mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-black text-slate-800">Thanh Toán Hoàn Tất!</h2>
            <p className="text-slate-600 mt-2 font-medium">Cảm ơn bạn đã mua sắm tại BookBee.</p>

            {orderId && (
              <div className="bg-slate-50 p-4 rounded-xl mt-6 w-full border border-slate-100">
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Mã đơn hàng</p>
                <p className="text-lg font-mono text-slate-800 font-bold">
                  #{orderId.slice(-8).toUpperCase()}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 w-full">
              <button
                onClick={() => navigate("/myorders")}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md shadow-orange-200 hover:scale-105 transition-transform"
              >
                Xem Đơn Hàng Của Bạn
              </button>
              <button
                onClick={() => navigate("/products")}
                className="w-full py-3 bg-orange-50 text-primary font-bold rounded-xl hover:bg-orange-100 transition-colors"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Success;

