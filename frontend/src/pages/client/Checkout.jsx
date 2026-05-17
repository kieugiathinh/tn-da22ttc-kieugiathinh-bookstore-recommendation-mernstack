import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { publicRequest, userRequest } from "../../requestMethods";
import { useNavigate, useLocation } from "react-router-dom";
import { clearCart } from "../../redux/cartRedux";
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
  FaTruck,
  FaSpinner,
} from "react-icons/fa";

const Checkout = () => {
  const location = useLocation();
  const reduxCart = useSelector((state) => state.cart);

  // Lấy danh sách sản phẩm
  const checkoutItems = location.state?.checkoutItems || reduxCart.products;

  // --- SỬA LỖI TÍNH TOÁN TẠI ĐÂY ---
  // Thay vì lấy 'reduxCart.total' (có thể bị sai), ta tính lại tổng tiền hàng từ danh sách sản phẩm
  const calculateProductsTotal = () => {
    return checkoutItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
  };

  const initialProductsTotal = calculateProductsTotal(); // Đây là Tạm tính chuẩn (405.000đ)

  const { currentUser: user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- STATE ---
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // State này lưu "Tiền hàng sau khi giảm giá" (chưa tính ship)
  const [subTotalAfterDiscount, setSubTotalAfterDiscount] =
    useState(initialProductsTotal);

  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);

  // Form inputs...
  const [defaultInputs] = useState({
    name: user?.fullname || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [alternateInputs, setAlternateInputs] = useState({
    otherPhone: "",
  });
  const [showAlternate, setShowAlternate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // --- GHN ADDRESS STATES ---
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [streetAddress, setStreetAddress] = useState("");

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // --- DYNAMIC SHIPPING FEE ---
  const [shippingFee, setShippingFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Reset lại tổng tiền nếu danh sách sản phẩm thay đổi (phòng hờ)
  useEffect(() => {
    setSubTotalAfterDiscount(calculateProductsTotal());
  }, [checkoutItems]);

  // --- GHN: Load Tỉnh/Thành khi mount ---
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const res = await publicRequest.get("/shipping/provinces");
        setProvinces(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load tỉnh/thành:", err);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // --- GHN: Load Quận/Huyện khi chọn Tỉnh ---
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      setShippingFee(0);
      return;
    }
    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      setShippingFee(0);
      try {
        const res = await publicRequest.get(
          `/shipping/districts?province_id=${selectedProvince.ProvinceID}`
        );
        setDistricts(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load quận/huyện:", err);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // --- GHN: Load Phường/Xã khi chọn Quận ---
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard(null);
      setShippingFee(0);
      return;
    }
    const fetchWards = async () => {
      setIsLoadingWards(true);
      setSelectedWard(null);
      setShippingFee(0);
      try {
        const res = await publicRequest.get(
          `/shipping/wards?district_id=${selectedDistrict.DistrictID}`
        );
        setWards(res.data?.data || []);
      } catch (err) {
        console.error("Lỗi load phường/xã:", err);
      } finally {
        setIsLoadingWards(false);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // --- GHN: Tự động tính phí ship khi chọn xong Phường/Xã ---
  useEffect(() => {
    if (!selectedDistrict || !selectedWard || checkoutItems.length === 0) {
      setShippingFee(0);
      return;
    }
    const calcFee = async () => {
      setIsCalculatingFee(true);
      try {
        // Tính tổng weight từ checkoutItems (default 300g nếu không có)
        const totalWeight = checkoutItems.reduce(
          (acc, item) => acc + (item.weight || 300) * item.quantity,
          0
        );
        const res = await publicRequest.post("/shipping/fee", {
          to_district_id: selectedDistrict.DistrictID,
          to_ward_code: selectedWard.WardCode,
          weight: totalWeight,
          insurance_value: initialProductsTotal,
        });
        setShippingFee(res.data?.data?.total || 0);
      } catch (err) {
        console.error("Lỗi tính phí ship:", err);
        toast.error("Không thể tính phí vận chuyển");
        setShippingFee(0);
      } finally {
        setIsCalculatingFee(false);
      }
    };
    calcFee();
  }, [selectedDistrict, selectedWard, checkoutItems]);

  // --- Tạo chuỗi địa chỉ đầy đủ từ dropdown ---
  const getFullAddress = useCallback(() => {
    const parts = [];
    if (streetAddress.trim()) parts.push(streetAddress.trim());
    if (selectedWard) parts.push(selectedWard.WardName);
    if (selectedDistrict) parts.push(selectedDistrict.DistrictName);
    if (selectedProvince) parts.push(selectedProvince.ProvinceName);
    return parts.join(", ");
  }, [streetAddress, selectedWard, selectedDistrict, selectedProvince]);

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
      // Gửi lên server tổng tiền hàng gốc (405k) để tính giảm giá
      const res = await userRequest.post("/coupons/apply", {
        couponCode: code,
        cartTotal: initialProductsTotal,
      });

      setDiscountAmount(res.data.discountAmount);
      setSubTotalAfterDiscount(res.data.finalPrice); // Server trả về giá sau giảm (chưa ship)
      setCouponCode(code);
      setShowVoucherList(false);
      toast.success(`Giảm ${res.data.discountAmount.toLocaleString()}đ`);
    } catch (err) {
      setDiscountAmount(0);
      setSubTotalAfterDiscount(initialProductsTotal);
      toast.error(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setSubTotalAfterDiscount(initialProductsTotal); // Reset về giá gốc 405k
    toast("Đã bỏ mã giảm giá");
  };

  // --- PLACE ORDER ---
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const shippingName = defaultInputs.name;
    const shippingEmail = defaultInputs.email;
    const shippingPhone =
      alternateInputs.otherPhone.trim() || defaultInputs.phone;
    const shippingAddress = getFullAddress();

    if (!shippingName || !shippingPhone) {
      toast.error("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Quận/Phường!");
      return;
    }

    if (!streetAddress.trim()) {
      toast.error("Vui lòng nhập số nhà / tên đường!");
      return;
    }

    // Tính tổng khối lượng
    const totalWeight = checkoutItems.reduce(
      (acc, item) => acc + (item.weight || 300) * item.quantity,
      0
    );

    // TỔNG TIỀN CUỐI CÙNG = (Tiền hàng đã trừ voucher) + SHIP
    const grandTotal = subTotalAfterDiscount + shippingFee;

    const orderData = {
      userId: user._id,
      products: checkoutItems.map((item) => ({
        productId: item._id || item.productId,
        title: item.title,
        img: item.img,
        quantity: item.quantity,
        price: item.price,
      })),
      total: grandTotal,
      shippingFee: shippingFee,
      totalWeight: totalWeight,
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
      try {
        localStorage.setItem("tempOrderData", JSON.stringify(orderData));
        const res = await userRequest.post("/stripe/create-checkout-session", {
          cart: { products: checkoutItems, total: grandTotal },
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI (Giữ nguyên UI) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm mb-4 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
              <span>Thông tin nhận hàng</span>
              <span className="text-xs font-normal text-primary bg-primary-light px-2 py-1 rounded-full border border-primary-light">
                Mặc định
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* ĐỊA CHỈ GIAO HÀNG - GHN Dropdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-4 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-primary" />
              Địa chỉ giao hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Tỉnh / Thành */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tỉnh / Thành phố <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="province-select"
                    value={selectedProvince?.ProvinceID || ""}
                    onChange={(e) => {
                      const prov = provinces.find(
                        (p) => p.ProvinceID === Number(e.target.value)
                      );
                      setSelectedProvince(prov || null);
                    }}
                    disabled={isLoadingProvinces}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed pr-8"
                  >
                    <option value="">
                      {isLoadingProvinces ? "Đang tải..." : "-- Chọn Tỉnh/Thành --"}
                    </option>
                    {provinces.map((p) => (
                      <option key={p.ProvinceID} value={p.ProvinceID}>
                        {p.ProvinceName}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                </div>
              </div>

              {/* Quận / Huyện */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quận / Huyện <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="district-select"
                    value={selectedDistrict?.DistrictID || ""}
                    onChange={(e) => {
                      const dist = districts.find(
                        (d) => d.DistrictID === Number(e.target.value)
                      );
                      setSelectedDistrict(dist || null);
                    }}
                    disabled={!selectedProvince || isLoadingDistricts}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed pr-8"
                  >
                    <option value="">
                      {isLoadingDistricts
                        ? "Đang tải..."
                        : !selectedProvince
                        ? "-- Chọn Tỉnh trước --"
                        : "-- Chọn Quận/Huyện --"}
                    </option>
                    {districts.map((d) => (
                      <option key={d.DistrictID} value={d.DistrictID}>
                        {d.DistrictName}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                </div>
              </div>

              {/* Phường / Xã */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phường / Xã <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="ward-select"
                    value={selectedWard?.WardCode || ""}
                    onChange={(e) => {
                      const ward = wards.find(
                        (w) => w.WardCode === e.target.value
                      );
                      setSelectedWard(ward || null);
                    }}
                    disabled={!selectedDistrict || isLoadingWards}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed pr-8"
                  >
                    <option value="">
                      {isLoadingWards
                        ? "Đang tải..."
                        : !selectedDistrict
                        ? "-- Chọn Quận trước --"
                        : "-- Chọn Phường/Xã --"}
                    </option>
                    {wards.map((w) => (
                      <option key={w.WardCode} value={w.WardCode}>
                        {w.WardName}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Số nhà / Đường */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số nhà, tên đường <span className="text-red-500">*</span>
              </label>
              <input
                id="street-address-input"
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Ví dụ: 123 Nguyễn Văn A"
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
              />
            </div>

            {/* Hiển thị phí ship (preview) */}
            {selectedWard && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center text-green-700">
                  <FaTruck className="mr-2" />
                  <span className="text-sm font-medium">Phí vận chuyển (GHN):</span>
                </div>
                <span className="font-bold text-green-700">
                  {isCalculatingFee ? (
                    <FaSpinner className="animate-spin inline" />
                  ) : (
                    `${shippingFee.toLocaleString()} ₫`
                  )}
                </span>
              </div>
            )}
          </div>

          {/* SĐT thay thế */}
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-100">
            <div
              onClick={() => setShowAlternate(!showAlternate)}
              className="p-4 flex items-center justify-between cursor-pointer bg-gray-50 hover:bg-gray-100 transition select-none"
            >
              <div className="flex items-center text-gray-700">
                <FaEdit className="mr-3 text-primary" />
                <span className="font-semibold text-sm md:text-base">
                  Thay đổi SĐT nhận hàng
                </span>
              </div>
              <div className="text-gray-500">
                {showAlternate ? <FaChevronUp /> : <FaChevronDown />}
              </div>
            </div>
            {showAlternate && (
              <div className="p-6 border-t border-gray-100 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaPhoneAlt className="mr-2 text-primary text-xs" /> Số
                    điện thoại mới
                  </label>
                  <input
                    type="text"
                    name="otherPhone"
                    value={alternateInputs.otherPhone}
                    onChange={handleAlternateChange}
                    placeholder="Nhập SĐT người nhận..."
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary-light"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${
                  paymentMethod === "COD"
                    ? "border-primary bg-primary-light ring-1 ring-primary"
                    : "border-gray-200 hover:border-primary-light"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                  className="w-5 h-5 text-primary accent-primary"
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
                    ? "border-primary bg-primary-light ring-1 ring-primary"
                    : "border-gray-200 hover:border-primary-light"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="Stripe"
                  checked={paymentMethod === "Stripe"}
                  onChange={() => setPaymentMethod("Stripe")}
                  className="w-5 h-5 text-primary accent-primary"
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
                    <p className="font-medium text-gray-700 line-clamp-2 w-28 text-xs group-hover:text-primary transition">
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
                  <FaTicketAlt className="mr-2 text-primary" /> Voucher
                </label>
                {availableVouchers.length > 0 && (
                  <button
                    onClick={() => setShowVoucherList(!showVoucherList)}
                    className="text-xs text-primary font-bold hover:underline"
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
                  className="w-full p-2 border border-gray-300 rounded text-sm uppercase outline-none focus:border-primary disabled:bg-gray-100"
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
                    className="bg-primary text-white px-3 rounded text-sm font-bold hover:bg-primary-hover disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                )}
              </div>
              {showVoucherList && discountAmount === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {availableVouchers.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        setCouponCode(item.coupon.code);
                        handleApplyCoupon(item.coupon.code);
                      }}
                      className="bg-white p-2 mb-1 rounded border border-gray-100 hover:border-primary cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-xs text-primary-hover">
                          {item.coupon.code}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {item.coupon.description}
                        </p>
                      </div>
                      <span className="text-[10px] bg-primary-light text-primary px-2 py-0.5 rounded-full font-bold">
                        Dùng
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals Section */}
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Tạm tính</span>
                <span>{initialProductsTotal.toLocaleString()} ₫</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span className="flex items-center">
                  <FaTruck className="mr-1 text-xs" /> Phí vận chuyển
                </span>
                <span>
                  {isCalculatingFee ? (
                    <FaSpinner className="animate-spin inline text-primary" />
                  ) : shippingFee > 0 ? (
                    `${shippingFee.toLocaleString()} ₫`
                  ) : (
                    <span className="text-xs text-gray-400 italic">Chọn địa chỉ để tính</span>
                  )}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Voucher</span>
                  <span>-{discountAmount.toLocaleString()} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-extrabold text-gray-800 border-t pt-2 mt-2">
                <span>Tổng tiền</span>
                <span className="text-primary">
                  {(subTotalAfterDiscount + shippingFee).toLocaleString()} ₫
                </span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isCalculatingFee || !selectedWard}
              className="w-full bg-gradient-to-r from-primary to-indigo-600 text-white py-3 rounded-lg mt-6 font-bold hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isCalculatingFee ? "Đang tính phí..." : "ĐẶT HÀNG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

