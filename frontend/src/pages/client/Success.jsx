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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      {isProcessing ? (
        <div className="flex flex-col items-center">
          <FaSpinner className="text-primary text-6xl animate-spin mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            Đang xử lý đơn hàng của bạn...
          </h2>
          <p className="text-gray-500">Vui lòng không tắt trình duyệt.</p>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full border border-green-100">
          <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-6 animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã mua sắm tại BookBee.
          </p>

          {orderId && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
              <p className="text-sm text-gray-500 uppercase font-bold">
                Mã đơn hàng
              </p>
              <p className="text-xl font-mono text-primary font-bold">
                #{orderId.slice(-8).toUpperCase()}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/myorders")}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-hover transition shadow-lg"
            >
              Xem Đơn Hàng Của Tôi
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-white border-2 border-primary text-primary py-3 rounded-lg font-bold hover:bg-primary-light transition"
            >
              Tiếp Tục Mua Sắm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Success;

