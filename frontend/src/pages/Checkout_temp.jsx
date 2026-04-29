import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { userRequest } from "../requestMethods";
import { useNavigate, useLocation } from "react-router-dom";
import { clearCart } from "../redux/cartRedux";
import { toast } from "sonner";
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaTicketAlt,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
  FaPhoneAlt,
} from "react-icons/fa";

const Checkout = () => {
  const location = useLocation();
  const reduxCart = useSelector((state) => state.cart);

  // Ưu tiên lấy items từ state (nếu được chuyển từ Cart qua), nếu không thì lấy từ Redux
  const checkoutItems = location.state?.checkoutItems || reduxCart.products;
  const checkoutTotal = location.state?.checkoutTotal || reduxCart.total;

  const cart = useSelector((state) => state.cart); // Vẫn giữ để check logic cũ nếu cần
  const user = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- STATE CHO VOUCHER ---
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(checkoutTotal); // Dùng checkoutTotal chuẩn hơn cart.total
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);
  // -------------------------

  // --- STATE THÔNG TIN MẶC ĐỊNH (READ-ONLY) ---
  const [defaultInputs] = useState({
    name: user?.fullname || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  // --- STATE THÔNG TIN THAY ĐỔI (OPTIONAL) ---
  const [alternateInputs, setAlternateInputs] = useState({
    otherPhone: "",
    otherAddress: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    // Cập nhật lại total nếu có thay đổi từ props (logic dự phòng)
    setFinalTotal(checkoutTotal);
  }, [checkoutTotal]);

  const availableVouchers =
    user?.wallet?.filter((item) => !item.isUsed && item.coupon) || [];

  const handleAlternateChange = (e) => {
    setAlternateInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // --- HÀM ÁP DỤNG MÃ ---
  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) return;

    setIsCheckingCode(true);
    try {
      const res = await userRequest.post("/coupons/apply", {
        couponCode: code,
        cartTotal: checkoutTotal,
      });

      setDiscountAmount(res.data.discountAmount);
      setFinalTotal(res.data.finalPrice);
      setCouponCode(code);
      setShowVoucherList(false);
      toast.success(
        `Áp dụng mã thành công! Giảm ${res.data.discountAmount.toLocaleString()}đ`
      );
    } catch (err) {
      setDiscountAmount(0);
      setFinalTotal(checkoutTotal);
      toast.error(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setFinalTotal(checkoutTotal);
    toast("Đã bỏ mã giảm giá");
  };

  const handleSelectVoucher = (code) => {
    setCouponCode(code);
    handleApplyCoupon(code);
  };

  // --- HÀM ĐẶT HÀNG ---
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // 1. Xác định thông tin giao hàng cuối cùng (Ưu tiên thông tin mới nếu có)
    const shippingName = defaultInputs.name;
    const shippingEmail = defaultInputs.email;
    const shippingPhone =
      alternateInputs.otherPhone.trim() || defaultInputs.phone;
    const shippingAddress =
      alternateInputs.otherAddress.trim() || defaultInputs.address;

    // 2. Validate
    if (!shippingName || !shippingPhone || !shippingAddress) {
      toast.error("Vui lòng đảm bảo có đủ Tên, SĐT và Địa chỉ giao hàng!");
      return;
    }

    const orderData = {
      userId: user._id,
      products: checkoutItems.map((item) => ({
        productId: item._id || item.productId, // Handle cả 2 trường hợp id
        title: item.title,
        img: item.img,
        quantity: item.quantity,
        price: item.price,
      })),
      total: finalTotal,
      couponCode: discountAmount > 0 ? couponCode : null,
      name: shippingName,
      email: shippingEmail,
      phone: shippingPhone, // Sử dụng SĐT đã chốt
      address: shippingAddress, // Sử dụng Địa chỉ đã chốt
      paymentMethod: paymentMethod,
    };

    if (paymentMethod === "COD") {
      try {
        await userRequest.post("/orders", { ...orderData, status: 0 });

        // Nếu mua từ Cart thì clear cart, nếu mua ngay thì không (tùy logic app bạn)
        // Ở đây giả định clear cart cho đơn giản
        dispatch(clearCart());

        navigate("/myorders");
        toast.success("Đặt hàng thành công!");
      } catch (err) {
        console.log(err);
        toast.error("Đặt hàng thất bại!");
      }
    } else if (paymentMethod === "Stripe") {
      try {
        localStorage.setItem("tempOrderData", JSON.stringify(orderData));

        const res = await userRequest.post("/stripe/create-checkout-session", {
          cart: { products: checkoutItems, total: finalTotal }, // Gửi đúng items cần thanh toán
          userId: user._id,
          email: shippingEmail,
          name: shippingName,
        });

        if (res.data.url) {
          window.location.href = res.data.url;
        }
      } catch (err) {
        console.log(err);
        toast.error("Lỗi kết nối Stripe!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: FORM & PAYMENT */}
        <div className="lg:col-span-2">
          {/* --- BLOCK 1: THÔNG TIN MẶC ĐỊNH (READ-ONLY) --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              Thông tin mặc định
              <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Từ hồ sơ của bạn
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={defaultInputs.name}
                  readOnly
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={defaultInputs.email}
                  readOnly
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Số điện thoại chính
                </label>
                <input
                  type="text"
                  value={defaultInputs.phone}
                  readOnly
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Địa chỉ chính
                </label>
                <input
                  type="text"
                  value={defaultInputs.address}
                  readOnly
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* --- BLOCK 2: THAY ĐỔI THÔNG TIN (OPTIONAL) --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border-l-4 border-purple-500">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Thay đổi thông tin nhận hàng (Tùy chọn)
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Nhập vào bên dưới nếu bạn muốn gửi hàng đến địa chỉ hoặc số điện
              thoại khác.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ô NHẬP SĐT KHÁC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaPhoneAlt className="mr-2 text-purple-500 text-xs" /> Số
                  điện thoại khác
                </label>
                <input
                  type="text"
                  name="otherPhone"
                  value={alternateInputs.otherPhone}
                  onChange={handleAlternateChange}
                  placeholder="Nhập SĐT mới (nếu có)"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white"
                />
              </div>

              {/* Ô NHẬP ĐỊA CHỈ KHÁC */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-purple-500 text-xs" />{" "}
                  Địa chỉ nhận hàng khác
                </label>
                <input
                  type="text"
                  name="otherAddress"
                  value={alternateInputs.otherAddress}
                  onChange={handleAlternateChange}
                  placeholder="Nhập địa chỉ mới (nếu có)"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "COD"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="w-5 h-5 text-purple-600"
                />
                <div className="ml-4 flex items-center">
                  <FaMoneyBillWave className="text-green-600 text-2xl mr-3" />
                  <div>
                    <span className="block font-bold text-gray-800">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="text-sm text-gray-500">
                      Thanh toán bằng tiền mặt khi giao hàng
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "Stripe"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="Stripe"
                  checked={paymentMethod === "Stripe"}
                  onChange={() => setPaymentMethod("Stripe")}
                  className="w-5 h-5 text-purple-600"
                />
                <div className="ml-4 flex items-center">
                  <FaCreditCard className="text-blue-600 text-2xl mr-3" />
                  <div>
                    <span className="block font-bold text-gray-800">
                      Thanh toán Online (Stripe)
                    </span>
                    <span className="text-sm text-gray-500">
                      Visa, Mastercard, thẻ quốc tế
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
        <div>
          <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Đơn hàng của bạn
            </h2>

            {/* List sản phẩm */}
            <div className="max-h-60 overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-1">
              {checkoutItems.map((item) => (
                <div
                  key={item._id || item.productId}
                  className="flex justify-between text-sm"
                >
                  <div className="flex gap-2">
                    <img
                      src={item.img}
                      alt=""
                      className="w-12 h-16 object-cover rounded border border-gray-100"
                    />
                    <div>
                      <p className="font-medium text-gray-800 line-clamp-2 w-32">
                        {item.title}
                      </p>
                      <p className="text-gray-500">x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium text-gray-700">
                    {(item.price * item.quantity).toLocaleString()} ₫
                  </span>
                </div>
              ))}
            </div>

            {/* --- KHU VỰC VOUCHER --- */}
            <div className="border-t pt-4 pb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <FaTicketAlt className="mr-2 text-purple-600" /> Mã giảm giá
                </label>
                {availableVouchers.length > 0 && (
                  <button
                    onClick={() => setShowVoucherList(!showVoucherList)}
                    className="text-xs text-purple-600 font-bold hover:underline flex items-center"
                    disabled={discountAmount > 0}
                  >
                    {showVoucherList ? "Ẩn mã" : "Chọn mã"}
                    {showVoucherList ? (
                      <FaChevronUp className="ml-1" />
                    ) : (
                      <FaChevronDown className="ml-1" />
                    )}
                  </button>
                )}
              </div>

              {/* INPUT NHẬP MÃ */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã voucher"
                  disabled={discountAmount > 0}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm uppercase outline-none focus:border-purple-500 disabled:bg-gray-100"
                />

                {discountAmount > 0 ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition"
                    title="Bỏ mã"
                  >
                    <FaTimes />
                  </button>
                ) : (
                  <button
                    onClick={() => handleApplyCoupon()}
                    disabled={!couponCode || isCheckingCode}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition disabled:opacity-50 whitespace-nowrap"
                  >
                    {isCheckingCode ? "..." : "Áp dụng"}
                  </button>
                )}
              </div>

              {/* LIST VOUCHER */}
              {showVoucherList && discountAmount === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 max-h-48 overflow-y-auto custom-scrollbar animate-fadeIn">
                  <p className="text-xs text-gray-500 mb-2 px-1">
                    Chọn mã từ ví của bạn:
                  </p>
                  <div className="space-y-2">
                    {availableVouchers.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleSelectVoucher(item.coupon.code)}
                        className="bg-white p-2 rounded border border-gray-200 hover:border-purple-400 cursor-pointer flex justify-between items-center transition group"
                      >
                        <div>
                          <p className="font-bold text-sm text-purple-700 group-hover:text-purple-900">
                            {item.coupon.code}
                          </p>
                          <p className="text-[10px] text-gray-500 line-clamp-1">
                            {item.coupon.description}
                          </p>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-bold">
                          Dùng
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{checkoutTotal?.toLocaleString()} ₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>30.000 ₫</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Voucher giảm giá</span>
                  <span>-{discountAmount.toLocaleString()} ₫</span>
                </div>
              )}

              <div className="flex justify-between text-xl font-bold text-purple-600 border-t pt-2 mt-2">
                <span>Tổng cộng</span>
                <span>{(finalTotal + 30000).toLocaleString()} ₫</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full bg-purple-600 text-white py-3 rounded-lg mt-6 font-bold hover:bg-purple-700 transition shadow-lg transform active:scale-95"
            >
              {paymentMethod === "COD" ? "ĐẶT HÀNG NGAY" : "THANH TOÁN STRIPE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
