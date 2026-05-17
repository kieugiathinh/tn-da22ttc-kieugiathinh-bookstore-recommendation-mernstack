import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { publicRequest, userRequest } from "../../requestMethods";
import { useNavigate, useLocation } from "react-router-dom";
import { clearCart } from "../../redux/cartRedux";
import { loginSuccess } from "../../redux/userRedux";
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
  FaPlus,
  FaStar,
  FaCheck,
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

  // --- SMART ADDRESS STATES ---
  const userAddresses = user?.addresses || [];
  const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0] || null;
  const [selectedAddress, setSelectedAddress] = useState(defaultAddr);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(!defaultAddr);

  // Inline form states (khi chưa có địa chỉ)
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selProv, setSelProv] = useState(null);
  const [selDist, setSelDist] = useState(null);
  const [selWard, setSelWard] = useState(null);
  const [inlineStreet, setInlineStreet] = useState("");
  const [inlineName, setInlineName] = useState(user?.fullname || "");
  const [inlinePhone, setInlinePhone] = useState(user?.phone || "");
  const [loadingProv, setLoadingProv] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingWard, setLoadingWard] = useState(false);

  // --- DYNAMIC SHIPPING FEE ---
  const [shippingFee, setShippingFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Reset tổng tiền khi sản phẩm thay đổi
  useEffect(() => {
    setSubTotalAfterDiscount(calculateProductsTotal());
  }, [checkoutItems]);

  // --- Hàm tính phí ship dùng chung ---
  const calculateFee = useCallback(
    async (districtId, wardCode) => {
      if (!districtId || !wardCode || checkoutItems.length === 0) {
        setShippingFee(0);
        return;
      }
      setIsCalculatingFee(true);
      try {
        const totalWeight = checkoutItems.reduce(
          (acc, item) => acc + (item.weight || 300) * item.quantity,
          0
        );
        const res = await publicRequest.post("/shipping/fee", {
          to_district_id: districtId,
          to_ward_code: wardCode,
          weight: totalWeight,
          insurance_value: initialProductsTotal,
        });
        setShippingFee(res.data?.data?.total || 0);
      } catch (err) {
        console.error("Lỗi tính phí ship:", err);
        setShippingFee(0);
      } finally {
        setIsCalculatingFee(false);
      }
    },
    [checkoutItems, initialProductsTotal]
  );

  // --- Auto-calculate khi có selectedAddress ---
  useEffect(() => {
    if (selectedAddress) {
      calculateFee(selectedAddress.districtId, selectedAddress.wardCode);
    } else {
      setShippingFee(0);
    }
  }, [selectedAddress, calculateFee]);

  // --- Inline form: load provinces ---
  useEffect(() => {
    if (!showInlineForm) return;
    const fetch = async () => {
      setLoadingProv(true);
      try {
        const res = await publicRequest.get("/shipping/provinces");
        setProvinces(res.data?.data || []);
      } catch (e) { console.error(e); }
      finally { setLoadingProv(false); }
    };
    fetch();
  }, [showInlineForm]);

  // --- Inline form: load districts ---
  useEffect(() => {
    if (!selProv) { setDistricts([]); setSelDist(null); setWards([]); setSelWard(null); return; }
    const fetch = async () => {
      setLoadingDist(true); setSelDist(null); setWards([]); setSelWard(null);
      try {
        const res = await publicRequest.get(`/shipping/districts?province_id=${selProv.ProvinceID}`);
        setDistricts(res.data?.data || []);
      } catch (e) { console.error(e); }
      finally { setLoadingDist(false); }
    };
    fetch();
  }, [selProv]);

  // --- Inline form: load wards ---
  useEffect(() => {
    if (!selDist) { setWards([]); setSelWard(null); return; }
    const fetch = async () => {
      setLoadingWard(true); setSelWard(null);
      try {
        const res = await publicRequest.get(`/shipping/wards?district_id=${selDist.DistrictID}`);
        setWards(res.data?.data || []);
      } catch (e) { console.error(e); }
      finally { setLoadingWard(false); }
    };
    fetch();
  }, [selDist]);

  // --- Inline form: tính phí khi chọn xong ward ---
  useEffect(() => {
    if (showInlineForm && selDist && selWard) {
      calculateFee(selDist.DistrictID, selWard.WardCode);
    }
  }, [selDist, selWard, showInlineForm, calculateFee]);

  // --- Lưu địa chỉ inline vào sổ + chọn luôn ---
  const handleSaveInlineAddress = async () => {
    if (!inlineName.trim() || !inlinePhone.trim() || !inlineStreet.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin!"); return;
    }
    if (!selProv || !selDist || !selWard) {
      toast.error("Vui lòng chọn đầy đủ Tỉnh/Quận/Phường!"); return;
    }
    try {
      const payload = {
        name: inlineName.trim(), phone: inlinePhone.trim(), street: inlineStreet.trim(),
        provinceId: selProv.ProvinceID, provinceName: selProv.ProvinceName,
        districtId: selDist.DistrictID, districtName: selDist.DistrictName,
        wardCode: selWard.WardCode, wardName: selWard.WardName,
        isDefault: userAddresses.length === 0,
      };
      const res = await userRequest.post("/users/addresses", payload);
      dispatch(loginSuccess({ ...user, ...res.data }));
      const newAddresses = res.data.addresses || [];
      const newAddr = newAddresses[newAddresses.length - 1];
      setSelectedAddress(newAddr);
      setShowInlineForm(false);
      toast.success("Đã lưu và chọn địa chỉ!");
    } catch (err) {
      toast.error("Lưu địa chỉ thất bại!");
    }
  };

  // --- Tạo chuỗi địa chỉ ---
  const getFullAddress = useCallback(() => {
    if (selectedAddress) {
      return `${selectedAddress.street}, ${selectedAddress.wardName}, ${selectedAddress.districtName}, ${selectedAddress.provinceName}`;
    }
    if (showInlineForm && selWard && selDist && selProv && inlineStreet.trim()) {
      return `${inlineStreet.trim()}, ${selWard.WardName}, ${selDist.DistrictName}, ${selProv.ProvinceName}`;
    }
    return "";
  }, [selectedAddress, showInlineForm, selWard, selDist, selProv, inlineStreet]);

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

    const addrSource = selectedAddress || null;
    const shippingName = addrSource?.name || inlineName.trim() || defaultInputs.name;
    const shippingEmail = defaultInputs.email;
    const shippingPhone = alternateInputs.otherPhone.trim() || addrSource?.phone || defaultInputs.phone;
    const shippingAddress = getFullAddress();

    if (!shippingAddress) {
      toast.error("Vui lòng chọn hoặc thêm địa chỉ giao hàng!");
      return;
    }

    if (!shippingName || !shippingPhone) {
      toast.error("Vui lòng nhập đầy đủ thông tin giao hàng!");
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
          {/* SMART ADDRESS CARD */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-4 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-primary" />
              Địa chỉ nhận hàng
            </h2>

            {/* CÓ ĐỊA CHỈ ĐÃ CHỌN */}
            {selectedAddress && !showInlineForm && (
              <div className="p-4 rounded-lg border border-primary bg-primary-light/40 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-800">{selectedAddress.name}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">{selectedAddress.phone}</span>
                    {selectedAddress.isDefault && (
                      <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {selectedAddress.street}, {selectedAddress.wardName}, {selectedAddress.districtName}, {selectedAddress.provinceName}
                  </p>
                  {/* Phí ship preview */}
                  {shippingFee > 0 && (
                    <div className="mt-2 flex items-center text-green-700 text-sm">
                      <FaTruck className="mr-1.5 text-xs" />
                      <span className="font-medium">
                        Phí ship: {isCalculatingFee ? <FaSpinner className="animate-spin inline ml-1" /> : `${shippingFee.toLocaleString()} ₫`}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="text-primary font-bold text-sm hover:underline cursor-pointer ml-4 shrink-0"
                >
                  Thay đổi
                </button>
              </div>
            )}

            {/* CHƯA CÓ ĐỊA CHỈ → INLINE FORM */}
            {showInlineForm && (
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-4">
                <h3 className="font-bold text-gray-800 text-sm">Thêm địa chỉ giao hàng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" value={inlineName} onChange={(e) => setInlineName(e.target.value)}
                    placeholder="Họ tên người nhận *"
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary text-sm" />
                  <input type="text" value={inlinePhone} onChange={(e) => setInlinePhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <select value={selProv?.ProvinceID || ""} onChange={(e) => { const p = provinces.find(x => x.ProvinceID === Number(e.target.value)); setSelProv(p || null); }}
                      disabled={loadingProv} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary appearance-none bg-white disabled:bg-gray-100 pr-8 text-sm">
                      <option value="">{loadingProv ? "Đang tải..." : "-- Tỉnh/Thành --"}</option>
                      {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select value={selDist?.DistrictID || ""} onChange={(e) => { const d = districts.find(x => x.DistrictID === Number(e.target.value)); setSelDist(d || null); }}
                      disabled={!selProv || loadingDist} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary appearance-none bg-white disabled:bg-gray-100 pr-8 text-sm">
                      <option value="">{loadingDist ? "Đang tải..." : !selProv ? "-- Chọn Tỉnh trước --" : "-- Quận/Huyện --"}</option>
                      {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select value={selWard?.WardCode || ""} onChange={(e) => { const w = wards.find(x => x.WardCode === e.target.value); setSelWard(w || null); }}
                      disabled={!selDist || loadingWard} className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary appearance-none bg-white disabled:bg-gray-100 pr-8 text-sm">
                      <option value="">{loadingWard ? "Đang tải..." : !selDist ? "-- Chọn Quận trước --" : "-- Phường/Xã --"}</option>
                      {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none" />
                  </div>
                </div>
                <input type="text" value={inlineStreet} onChange={(e) => setInlineStreet(e.target.value)}
                  placeholder="Số nhà, tên đường *"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-primary text-sm" />
                {selWard && shippingFee > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center text-green-700"><FaTruck className="mr-2" /><span className="text-sm font-medium">Phí vận chuyển (GHN):</span></div>
                    <span className="font-bold text-green-700">{isCalculatingFee ? <FaSpinner className="animate-spin inline" /> : `${shippingFee.toLocaleString()} ₫`}</span>
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  {userAddresses.length > 0 && (
                    <button type="button" onClick={() => { setShowInlineForm(false); setSelectedAddress(defaultAddr); }}
                      className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">Hủy</button>
                  )}
                  <button type="button" onClick={handleSaveInlineAddress}
                    className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg cursor-pointer flex items-center">
                    <FaCheck className="mr-1.5" /> Lưu & chọn địa chỉ
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ADDRESS PICKER MODAL */}
          {showAddressModal && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAddressModal(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">Chọn địa chỉ giao hàng</h3>
                  <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><FaTimes size={18} /></button>
                </div>
                <div className="p-5 overflow-y-auto max-h-[55vh] space-y-3">
                  {userAddresses.map((addr) => (
                    <div key={addr._id}
                      onClick={() => { setSelectedAddress(addr); setShowInlineForm(false); setShowAddressModal(false); }}
                      className={`p-4 rounded-lg border cursor-pointer transition hover:shadow-sm ${selectedAddress?._id === addr._id ? "border-primary bg-primary-light/50 ring-1 ring-primary" : "border-gray-200 hover:border-primary/50"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-800 text-sm">{addr.name}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-600 text-sm">{addr.phone}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full border border-primary/20">Mặc định</span>
                        )}
                        {selectedAddress?._id === addr._id && <FaCheck className="text-primary text-xs ml-auto" />}
                      </div>
                      <p className="text-sm text-gray-500">{addr.street}, {addr.wardName}, {addr.districtName}, {addr.provinceName}</p>
                    </div>
                  ))}
                </div>
                <div className="p-5 border-t border-gray-100">
                  <button onClick={() => { setShowAddressModal(false); setShowInlineForm(true); setSelectedAddress(null); }}
                    className="w-full py-2.5 border-2 border-dashed border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary-light transition cursor-pointer flex items-center justify-center">
                    <FaPlus className="mr-2" /> Thêm địa chỉ mới
                  </button>
                </div>
              </div>
            </div>
          )}

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
              disabled={isCalculatingFee || !getFullAddress()}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg mt-6 font-bold hover:shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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

