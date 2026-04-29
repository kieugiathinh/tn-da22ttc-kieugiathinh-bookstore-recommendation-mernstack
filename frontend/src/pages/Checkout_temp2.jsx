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
  FaEdit,
} from "react-icons/fa";

const Checkout = () => {
  const location = useLocation();
  const reduxCart = useSelector((state) => state.cart);

  // Dữ liệu giỏ hàng
  const checkoutItems = location.state?.checkoutItems || reduxCart.products;
  const checkoutTotal = location.state?.checkoutTotal || reduxCart.total;

  const user = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- CONSTANT ---
  const SHIPPING_FEE = 30000; // Định nghĩa phí ship cố định

  // --- STATE ---
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [subTotalAfterDiscount, setSubTotalAfterDiscount] =
    useState(checkoutTotal); // Đổi tên cho rõ nghĩa
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);

  // Form inputs...
  const [defaultInputs] = useState({
    name: user?.fullname || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [alternateInputs, setAlternateInputs] = useState({
    otherPhone: "",
    otherAddress: "",
  });
  const [showAlternate, setShowAlternate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  useEffect(() => {
    setSubTotalAfterDiscount(checkoutTotal);
  }, [checkoutTotal]);

  const availableVouchers =
    user?.wallet?.filter((item) => !item.isUsed && item.coupon) || [];

  const handleAlternateChange = (e) => {
    setAlternateInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // --- LOGIC COUPON ---
  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) return;

    setIsCheckingCode(true);
    try {
      const res = await userRequest.post("/coupons/apply", {
        couponCode: code,
        cartTotal: checkoutTotal,
      });

      // Backend trả về: discountAmount và finalPrice (là giá sau giảm chưa tính ship)
      setDiscountAmount(res.data.discountAmount);
      setSubTotalAfterDiscount(res.data.finalPrice);
      setCouponCode(code);
      setShowVoucherList(false);
      toast.success(`Giảm ${res.data.discountAmount.toLocaleString()}đ`);
    } catch (err) {
      setDiscountAmount(0);
      setSubTotalAfterDiscount(checkoutTotal);
      toast.error(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setSubTotalAfterDiscount(checkoutTotal);
    toast("Đã bỏ mã giảm giá");
  };

  // --- PLACE ORDER (SỬA LỖI LOGIC TẠI ĐÂY) ---
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const shippingName = defaultInputs.name;
    const shippingEmail = defaultInputs.email;
    const shippingPhone =
      alternateInputs.otherPhone.trim() || defaultInputs.phone;
    const shippingAddress =
      alternateInputs.otherAddress.trim() || defaultInputs.address;

    if (!shippingName || !shippingPhone || !shippingAddress) {
      toast.error("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    // TÍNH TỔNG TIỀN CUỐI CÙNG ĐỂ LƯU DB (Bao gồm cả Ship)
    const grandTotal = subTotalAfterDiscount + SHIPPING_FEE;

    const orderData = {
      userId: user._id,
      products: checkoutItems.map((item) => ({
        productId: item._id || item.productId,
        title: item.title,
        img: item.img,
        quantity: item.quantity,
        price: item.price,
      })),
      total: grandTotal, // Gửi tổng tiền ĐÃ CỘNG SHIP lên server
      couponCode: discountAmount > 0 ? couponCode : null,
      name: shippingName,
      email: shippingEmail,
      phone: shippingPhone,
      address: shippingAddress,
      paymentMethod: paymentMethod,
    };

    if (paymentMethod === "COD") {
      try {
        await userRequest.post("/orders", { ...orderData, status: 0 });
        dispatch(clearCart());
        navigate("/myorders");
        toast.success("Đặt hàng thành công!");
      } catch (err) {
        console.log(err);
        toast.error("Đặt hàng thất bại!");
      }
    } else if (paymentMethod === "Stripe") {
      // Logic Stripe giữ nguyên
      try {
        localStorage.setItem("tempOrderData", JSON.stringify(orderData));
        const res = await userRequest.post("/stripe/create-checkout-session", {
          cart: { products: checkoutItems, total: grandTotal }, // Gửi grandTotal
          userId: user._id,
          email: shippingEmail,
          name: shippingName,
        });
        if (res.data.url) window.location.href = res.data.url;
      } catch (err) {
        toast.error("Lỗi kết nối Stripe!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {/* ... Phần UI bên trái giữ nguyên ... */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* ... (Các block thông tin, form sửa đổi, phương thức thanh toán giữ nguyên) ... */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-4 border border-gray-100">
            {/* Copy lại nội dung block thông tin từ code cũ vào đây */}
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span>Thông tin nhận hàng</span>
              <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded-full border border-purple-100">
                Mặc định
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ... Render thông tin ... */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Họ tên
                </label>
                <div className="font-medium text-gray-800">
                  {defaultInputs.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Số điện thoại
                </label>
                <div className="font-medium text-gray-800">
                  {defaultInputs.phone || "Chưa cập nhật"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Email
                </label>
                <div className="font-medium text-gray-800">
                  {defaultInputs.email}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Địa chỉ
                </label>
                <div className="font-medium text-gray-800">
                  {defaultInputs.address || "Chưa cập nhật"}
                </div>
              </div>
            </div>
          </div>

          {/* Block thay đổi thông tin */}
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            <div
              onClick={() => setShowAlternate(!showAlternate)}
              className="p-4 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 transition select-none"
            >
              <div className="flex items-center text-gray-700">
                <FaEdit className="mr-3 text-purple-500" />
                <span className="font-semibold text-sm md:text-base">
                  Thay đổi địa chỉ / SĐT nhận hàng
                </span>
              </div>
              <div className="text-gray-500">
                {showAlternate ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>
            {showAlternate && (
              <div className="p-6 border-t border-gray-100 animate-fadeIn">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaPhoneAlt className="mr-2 text-purple-500 text-xs" /> Số
                      điện thoại mới
                    </label>
                    <input
                      type="text"
                      name="otherPhone"
                      value={alternateInputs.otherPhone}
                      onChange={handleAlternateChange}
                      placeholder="Nhập SĐT người nhận..."
                      className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-purple-500 text-xs" />{" "}
                      Địa chỉ nhận hàng mới
                    </label>
                    <textarea
                      name="otherAddress"
                      rows="2"
                      value={alternateInputs.otherAddress}
                      onChange={handleAlternateChange}
                      placeholder="Nhập địa chỉ giao hàng cụ thể..."
                      className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Block thanh toán */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "COD"
                    ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                    : "border-gray-200 hover:border-purple-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="w-5 h-5 text-purple-600 accent-purple-600"
                />
                <div className="ml-4 flex items-center">
                  <FaMoneyBillWave className="text-green-600 text-2xl mr-3" />
                  <div>
                    <span className="block font-bold text-gray-800">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                  </div>
                </div>
              </label>
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "Stripe"
                    ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500"
                    : "border-gray-200 hover:border-purple-200"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="Stripe"
                  checked={paymentMethod === "Stripe"}
                  onChange={() => setPaymentMethod("Stripe")}
                  className="w-5 h-5 text-purple-600 accent-purple-600"
                />
                <div className="ml-4 flex items-center">
                  <FaCreditCard className="text-blue-600 text-2xl mr-3" />
                  <div>
                    <span className="block font-bold text-gray-800">
                      Thanh toán Online (Stripe)
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT & TÍNH TIỀN */}
        <div>
          <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Đơn hàng
            </h2>

            {/* List Items */}
            <div className="max-h-60 overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-1">
              {checkoutItems.map((item) => (
                <div
                  key={item._id || item.productId}
                  className="flex justify-between text-sm group"
                >
                  <div className="flex gap-2 items-start">
                    <div className="relative">
                      <img
                        src={item.img}
                        alt=""
                        className="w-10 h-14 object-cover rounded border border-gray-100"
                      />
                      <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {item.quantity}
                      </span>
                    </div>
                    <p className="font-medium text-gray-700 line-clamp-2 w-28 text-xs">
                      {item.title}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-700 text-xs">
                    {(item.price * item.quantity).toLocaleString()} ₫
                  </span>
                </div>
              ))}
            </div>

            {/* Voucher Section */}
            <div className="border-t border-dashed pt-4 pb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-gray-700 flex items-center">
                  <FaTicketAlt className="mr-2 text-purple-600" /> Voucher
                </label>
                {availableVouchers.length > 0 && (
                  <button
                    onClick={() => setShowVoucherList(!showVoucherList)}
                    className="text-xs text-purple-600 font-bold hover:underline"
                    disabled={discountAmount > 0}
                  >
                    {showVoucherList ? "Đóng" : "Chọn mã"}
                  </button>
                )}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Mã giảm giá"
                  disabled={discountAmount > 0}
                  className="w-full p-2 border border-gray-300 rounded text-sm uppercase outline-none focus:border-purple-500 disabled:bg-gray-100"
                />
                {discountAmount > 0 ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="bg-red-50 text-red-500 px-3 rounded border border-red-100 hover:bg-red-100"
                  >
                    <FaTimes />
                  </button>
                ) : (
                  <button
                    onClick={() => handleApplyCoupon()}
                    disabled={!couponCode || isCheckingCode}
                    className="bg-purple-600 text-white px-3 rounded text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                )}
              </div>
              {/* List Voucher Dropdown (giữ nguyên logic render) */}
              {showVoucherList && discountAmount === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {availableVouchers.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setCouponCode(item.coupon.code);
                        handleApplyCoupon(item.coupon.code);
                      }}
                      className="bg-white p-2 mb-1 rounded border border-gray-100 hover:border-purple-300 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-xs text-purple-700">
                          {item.coupon.code}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {item.coupon.description}
                        </p>
                      </div>
                      <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                        Dùng
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals Section (ĐÃ SỬA LOGIC HIỂN THỊ) */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span>{checkoutTotal?.toLocaleString()} ₫</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Phí vận chuyển</span>
                <span>{SHIPPING_FEE.toLocaleString()} ₫</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Voucher</span>
                  <span>-{discountAmount.toLocaleString()} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-gray-800 border-t pt-2 mt-2">
                <span>Tổng tiền</span>
                <span className="text-purple-600">
                  {/* Hiển thị Tổng cuối cùng = SubTotal (đã trừ voucher) + Ship */}
                  {(subTotalAfterDiscount + SHIPPING_FEE).toLocaleString()} ₫
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg mt-6 font-bold hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95"
            >
              ĐẶT HÀNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
