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
  FaShieldAlt,
  FaLock,
} from "react-icons/fa";

// ── Progress Step component ───────────────────────────────────────────────────
const CheckoutStep = ({ step, label, active, done }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
        ${done
          ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-300/40"
          : active
          ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-300/40"
          : "bg-slate-100 text-slate-400"
        }`}
    >
      {done ? <FaCheck className="text-xs" /> : step}
    </div>
    <span className={`text-xs font-semibold ${active || done ? "text-slate-700" : "text-slate-400"}`}>
      {label}
    </span>
  </div>
);

const CheckoutProgressBar = ({ currentStep }) => {
  // currentStep: 1 = address, 2 = payment, 3 = confirm
  return (
    <div className="flex items-center justify-center mb-8">
      <CheckoutStep step={1} label="Địa chỉ" active={currentStep === 1} done={currentStep > 1} />
      {/* Connector */}
      <div className="flex-1 max-w-[80px] mx-2 h-1 rounded-full overflow-hidden bg-slate-100 mx-3">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-violet-500"
          style={{ width: currentStep > 1 ? "100%" : "0%" }}
        />
      </div>
      <CheckoutStep step={2} label="Thanh toán" active={currentStep === 2} done={currentStep > 2} />
      <div className="flex-1 max-w-[80px] mx-2 h-1 rounded-full overflow-hidden bg-slate-100 mx-3">
        <div
          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-400 to-violet-500"
          style={{ width: currentStep > 2 ? "100%" : "0%" }}
        />
      </div>
      <CheckoutStep step={3} label="Xác nhận" active={currentStep === 3} done={currentStep > 3} />
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Checkout = () => {
  const location = useLocation();
  const reduxCart = useSelector((state) => state.cart);

  const checkoutItems = location.state?.checkoutItems || reduxCart.products;

  const calculateProductsTotal = () =>
    checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const initialProductsTotal = calculateProductsTotal();

  const { currentUser: user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- STATEs ---
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [subTotalAfterDiscount, setSubTotalAfterDiscount] = useState(initialProductsTotal);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [showVoucherList, setShowVoucherList] = useState(false);

  const [defaultInputs] = useState({
    name: user?.fullname || user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [alternateInputs, setAlternateInputs] = useState({ otherPhone: "" });
  const [showAlternate, setShowAlternate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Smart Address
  const userAddresses = user?.addresses || [];
  const defaultAddr = userAddresses.find((a) => a.isDefault) || userAddresses[0] || null;
  const [selectedAddress, setSelectedAddress] = useState(defaultAddr);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(!defaultAddr);

  // Inline form
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

  // Shipping
  const [shippingFee, setShippingFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Derive progress step for progress bar
  const progressStep = selectedAddress && !showInlineForm ? 2 : 1;

  useEffect(() => {
    setSubTotalAfterDiscount(calculateProductsTotal());
  }, [checkoutItems]);

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

  useEffect(() => {
    if (selectedAddress) calculateFee(selectedAddress.districtId, selectedAddress.wardCode);
    else setShippingFee(0);
  }, [selectedAddress, calculateFee]);

  useEffect(() => {
    if (!showInlineForm) return;
    const fetch = async () => {
      setLoadingProv(true);
      try { const res = await publicRequest.get("/shipping/provinces"); setProvinces(res.data?.data || []); }
      catch (e) { console.error(e); } finally { setLoadingProv(false); }
    };
    fetch();
  }, [showInlineForm]);

  useEffect(() => {
    if (!selProv) { setDistricts([]); setSelDist(null); setWards([]); setSelWard(null); return; }
    const fetch = async () => {
      setLoadingDist(true); setSelDist(null); setWards([]); setSelWard(null);
      try { const res = await publicRequest.get(`/shipping/districts?province_id=${selProv.ProvinceID}`); setDistricts(res.data?.data || []); }
      catch (e) { console.error(e); } finally { setLoadingDist(false); }
    };
    fetch();
  }, [selProv]);

  useEffect(() => {
    if (!selDist) { setWards([]); setSelWard(null); return; }
    const fetch = async () => {
      setLoadingWard(true); setSelWard(null);
      try { const res = await publicRequest.get(`/shipping/wards?district_id=${selDist.DistrictID}`); setWards(res.data?.data || []); }
      catch (e) { console.error(e); } finally { setLoadingWard(false); }
    };
    fetch();
  }, [selDist]);

  useEffect(() => {
    if (showInlineForm && selDist && selWard) calculateFee(selDist.DistrictID, selWard.WardCode);
  }, [selDist, selWard, showInlineForm, calculateFee]);

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

  const getFullAddress = useCallback(() => {
    if (selectedAddress) {
      return `${selectedAddress.street}, ${selectedAddress.wardName}, ${selectedAddress.districtName}, ${selectedAddress.provinceName}`;
    }
    if (showInlineForm && selWard && selDist && selProv && inlineStreet.trim()) {
      return `${inlineStreet.trim()}, ${selWard.WardName}, ${selDist.DistrictName}, ${selProv.ProvinceName}`;
    }
    return "";
  }, [selectedAddress, showInlineForm, selWard, selDist, selProv, inlineStreet]);

  const availableVouchers = user?.wallet?.filter((item) => !item.isUsed && item.coupon) || [];

  const handleAlternateChange = (e) => {
    setAlternateInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyCoupon = async (codeToApply) => {
    const code = codeToApply || couponCode;
    if (!code.trim()) return;
    setIsCheckingCode(true);
    try {
      const res = await userRequest.post("/coupons/apply", {
        couponCode: code,
        cartTotal: initialProductsTotal,
      });
      setDiscountAmount(res.data.discountAmount);
      setSubTotalAfterDiscount(res.data.finalPrice);
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
    setSubTotalAfterDiscount(initialProductsTotal);
    toast("Đã bỏ mã giảm giá");
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const addrSource = selectedAddress || null;
    const shippingName = addrSource?.name || inlineName.trim() || defaultInputs.name;
    const shippingEmail = defaultInputs.email;
    const shippingPhone = alternateInputs.otherPhone.trim() || addrSource?.phone || defaultInputs.phone;
    const shippingAddress = getFullAddress();

    if (!shippingAddress) { toast.error("Vui lòng chọn hoặc thêm địa chỉ giao hàng!"); return; }
    if (!shippingName || !shippingPhone) { toast.error("Vui lòng nhập đầy đủ thông tin giao hàng!"); return; }

    const totalWeight = checkoutItems.reduce((acc, item) => acc + (item.weight || 300) * item.quantity, 0);
    const grandTotal = subTotalAfterDiscount + shippingFee;

    const orderData = {
      userId: user._id,
      products: checkoutItems.map((item) => ({
        productId: item._id || item.productId,
        title: item.title, img: item.img,
        quantity: item.quantity, price: item.price,
        isFlashSale: item.isFlashSale,
      })),
      total: grandTotal, shippingFee, totalWeight,
      couponCode: discountAmount > 0 ? couponCode : null,
      name: shippingName, email: shippingEmail, phone: shippingPhone,
      address: shippingAddress, paymentMethod,
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
          userId: user._id, email: shippingEmail, name: shippingName,
        });
        if (res.data.url) window.location.href = res.data.url;
      } catch (err) {
        toast.error("Lỗi kết nối Stripe!");
      }
    }
  };

  // ── Select styles helper ──
  const selectCls = "w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/50 appearance-none bg-white disabled:bg-slate-50 pr-8 text-sm text-slate-700 transition-all";
  const inputCls  = "w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/50 text-sm text-slate-700 transition-all";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ── Page Header ── */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-800 mb-1">Thanh toán đơn hàng</h1>
          <p className="text-sm text-slate-500">Kiểm tra thông tin và hoàn tất đặt hàng</p>
        </div>

        {/* ── Progress Bar ── */}
        <CheckoutProgressBar currentStep={progressStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ════ CỘT TRÁI ════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── SMART ADDRESS CARD ── */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg
                               flex items-center justify-center shadow-sm shadow-violet-300/40">
                  <FaMapMarkerAlt className="text-white text-xs" />
                </div>
                Địa chỉ nhận hàng
              </h2>

              {/* Đã chọn địa chỉ */}
              {selectedAddress && !showInlineForm && (
                <div className="p-4 rounded-xl border-2 border-violet-300 bg-violet-50/50
                               flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-bold text-slate-800">{selectedAddress.name}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-600 text-sm">{selectedAddress.phone}</span>
                      {selectedAddress.isDefault && (
                        <span className="text-[10px] font-bold text-violet-700 bg-violet-100
                                        px-2 py-0.5 rounded-full border border-violet-200">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {selectedAddress.street}, {selectedAddress.wardName},{" "}
                      {selectedAddress.districtName}, {selectedAddress.provinceName}
                    </p>
                    {shippingFee > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                        <FaTruck className="text-xs" />
                        Phí ship:{" "}
                        {isCalculatingFee
                          ? <FaSpinner className="animate-spin inline ml-1" />
                          : `${shippingFee.toLocaleString()} ₫`}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="text-violet-600 font-bold text-sm hover:text-violet-700
                               hover:underline cursor-pointer ml-4 shrink-0 transition-colors"
                  >
                    Thay đổi
                  </button>
                </div>
              )}

              {/* Inline address form */}
              {showInlineForm && (
                <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3.5">
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <FaPlus className="text-violet-500" /> Thêm địa chỉ giao hàng
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      placeholder="Họ tên người nhận *" className={inputCls} />
                    <input type="text" value={inlinePhone}
                      onChange={(e) => setInlinePhone(e.target.value)}
                      placeholder="Số điện thoại *" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Tỉnh */}
                    <div className="relative">
                      <select value={selProv?.ProvinceID || ""}
                        onChange={(e) => { const p = provinces.find(x => x.ProvinceID === Number(e.target.value)); setSelProv(p || null); }}
                        disabled={loadingProv} className={selectCls}>
                        <option value="">{loadingProv ? "Đang tải..." : "-- Tỉnh/Thành --"}</option>
                        {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                    </div>
                    {/* Quận */}
                    <div className="relative">
                      <select value={selDist?.DistrictID || ""}
                        onChange={(e) => { const d = districts.find(x => x.DistrictID === Number(e.target.value)); setSelDist(d || null); }}
                        disabled={!selProv || loadingDist} className={selectCls}>
                        <option value="">{loadingDist ? "Đang tải..." : !selProv ? "-- Chọn Tỉnh trước --" : "-- Quận/Huyện --"}</option>
                        {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                    </div>
                    {/* Phường */}
                    <div className="relative">
                      <select value={selWard?.WardCode || ""}
                        onChange={(e) => { const w = wards.find(x => x.WardCode === e.target.value); setSelWard(w || null); }}
                        disabled={!selDist || loadingWard} className={selectCls}>
                        <option value="">{loadingWard ? "Đang tải..." : !selDist ? "-- Chọn Quận trước --" : "-- Phường/Xã --"}</option>
                        {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                    </div>
                  </div>
                  <input type="text" value={inlineStreet}
                    onChange={(e) => setInlineStreet(e.target.value)}
                    placeholder="Số nhà, tên đường *" className={inputCls} />

                  {selWard && shippingFee > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <FaTruck />
                        <span className="text-sm font-medium">Phí vận chuyển (GHN):</span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        {isCalculatingFee
                          ? <FaSpinner className="animate-spin inline" />
                          : `${shippingFee.toLocaleString()} ₫`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    {userAddresses.length > 0 && (
                      <button type="button"
                        onClick={() => { setShowInlineForm(false); setSelectedAddress(defaultAddr); }}
                        className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200
                                   rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        Hủy
                      </button>
                    )}
                    <button type="button" onClick={handleSaveInlineAddress}
                      className="px-5 py-2 text-sm font-bold text-white rounded-xl cursor-pointer
                                 flex items-center gap-2
                                 bg-gradient-to-r from-violet-500 to-indigo-600
                                 hover:from-violet-600 hover:to-indigo-700
                                 shadow-sm shadow-violet-300/40 transition-all">
                      <FaCheck /> Lưu & chọn địa chỉ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── ADDRESS PICKER MODAL ── */}
            {showAddressModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50
                             flex items-center justify-center p-4"
                onClick={() => setShowAddressModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between
                                 bg-gradient-to-r from-violet-50 to-indigo-50">
                    <h3 className="text-lg font-extrabold text-slate-800">Chọn địa chỉ giao hàng</h3>
                    <button onClick={() => setShowAddressModal(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer
                                 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                      <FaTimes size={16} />
                    </button>
                  </div>
                  <div className="p-5 overflow-y-auto max-h-[55vh] space-y-3">
                    {userAddresses.map((addr) => (
                      <div key={addr._id}
                        onClick={() => { setSelectedAddress(addr); setShowInlineForm(false); setShowAddressModal(false); }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${selectedAddress?._id === addr._id
                            ? "border-violet-400 bg-violet-50 shadow-sm"
                            : "border-slate-100 hover:border-violet-200 hover:bg-violet-50/30"
                          }`}>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{addr.name}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-600 text-sm">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                              Mặc định
                            </span>
                          )}
                          {selectedAddress?._id === addr._id && (
                            <FaCheck className="text-violet-600 text-xs ml-auto" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {addr.street}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 border-t border-slate-100">
                    <button
                      onClick={() => { setShowAddressModal(false); setShowInlineForm(true); setSelectedAddress(null); }}
                      className="w-full py-2.5 border-2 border-dashed border-violet-300 text-violet-600
                                 rounded-xl font-bold text-sm hover:bg-violet-50 transition-colors
                                 cursor-pointer flex items-center justify-center gap-2">
                      <FaPlus /> Thêm địa chỉ mới
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PAYMENT METHOD ── */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg
                               flex items-center justify-center shadow-sm shadow-amber-300/40">
                  <FaLock className="text-white text-xs" />
                </div>
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                {/* COD */}
                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${paymentMethod === "COD"
                      ? "border-emerald-400 bg-emerald-50/60 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <input type="radio" name="payment" value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="w-4 h-4 accent-emerald-500" />
                  <div className="ml-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FaMoneyBillWave className="text-emerald-600 text-xl" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 text-sm">Thanh toán khi nhận hàng (COD)</span>
                      <span className="text-xs text-slate-500">Trả tiền mặt khi nhận được hàng</span>
                    </div>
                  </div>
                  {paymentMethod === "COD" && (
                    <FaCheck className="ml-auto text-emerald-500" />
                  )}
                </label>

                {/* Stripe */}
                <label
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all
                    ${paymentMethod === "Stripe"
                      ? "border-indigo-400 bg-indigo-50/60 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <input type="radio" name="payment" value="Stripe"
                    checked={paymentMethod === "Stripe"}
                    onChange={() => setPaymentMethod("Stripe")}
                    className="w-4 h-4 accent-indigo-500" />
                  <div className="ml-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <FaCreditCard className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 text-sm">Thanh toán Online (Stripe)</span>
                      <span className="text-xs text-slate-500">Thẻ Visa, Mastercard, JCB...</span>
                    </div>
                  </div>
                  {paymentMethod === "Stripe" && (
                    <FaCheck className="ml-auto text-indigo-500" />
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* ════ CỘT PHẢI ════ */}
          <div>
            <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-24 border border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-full inline-block" />
                Đơn hàng ({checkoutItems.length} sản phẩm)
              </h2>

              {/* Product list */}
              <div className="max-h-60 overflow-y-auto mb-4 space-y-3 pr-1">
                {checkoutItems.map((item) => (
                  <div key={item._id || item.productId} className="flex justify-between text-sm gap-2">
                    <div className="flex gap-2.5 items-start">
                      <div className="relative flex-shrink-0">
                        <img src={item.img} alt=""
                          className="w-10 h-14 object-cover rounded-lg border border-slate-100" />
                        <span className="absolute -top-1.5 -right-1.5 bg-violet-500 text-white
                                        text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <p className="font-medium text-slate-700 line-clamp-2 w-28 text-xs leading-relaxed">
                        {item.title}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-700 text-xs whitespace-nowrap">
                      {(item.price * item.quantity).toLocaleString()} ₫
                    </span>
                  </div>
                ))}
              </div>

              {/* Voucher Section */}
              <div className="border-t border-dashed border-slate-200 pt-4 pb-4">
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FaTicketAlt className="text-violet-500" /> Voucher giảm giá
                  </label>
                  {availableVouchers.length > 0 && (
                    <button onClick={() => setShowVoucherList(!showVoucherList)}
                      className="text-xs text-violet-600 font-bold hover:underline"
                      disabled={discountAmount > 0}>
                      {showVoucherList ? "Đóng" : "Chọn mã"}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá..."
                    disabled={discountAmount > 0}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm uppercase
                               outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300/50
                               disabled:bg-slate-50 text-slate-700 transition-all" />
                  {discountAmount > 0 ? (
                    <button onClick={handleRemoveCoupon}
                      className="bg-rose-50 text-rose-500 px-3 rounded-xl border border-rose-100
                                 hover:bg-rose-100 transition-colors">
                      <FaTimes />
                    </button>
                  ) : (
                    <button onClick={() => handleApplyCoupon()}
                      disabled={!couponCode || isCheckingCode}
                      className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white
                                 px-4 rounded-xl text-sm font-bold
                                 hover:from-violet-600 hover:to-indigo-700
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                                 whitespace-nowrap shadow-sm shadow-violet-300/30">
                      {isCheckingCode ? <FaSpinner className="animate-spin" /> : "Áp dụng"}
                    </button>
                  )}
                </div>

                {showVoucherList && discountAmount === 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2
                                 max-h-40 overflow-y-auto space-y-1.5">
                    {availableVouchers.map((item) => (
                      <div key={item._id}
                        onClick={() => { setCouponCode(item.coupon.code); handleApplyCoupon(item.coupon.code); }}
                        className="bg-white p-2.5 rounded-lg border border-slate-100
                                   hover:border-violet-300 hover:bg-violet-50/50
                                   cursor-pointer flex justify-between items-center transition-all">
                        <div>
                          <p className="font-bold text-xs text-violet-700">{item.coupon.code}</p>
                          <p className="text-[10px] text-slate-500">{item.coupon.description}</p>
                        </div>
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                          Dùng
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính</span>
                  <span>{initialProductsTotal.toLocaleString()} ₫</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <FaTruck className="text-xs" /> Phí vận chuyển
                  </span>
                  <span>
                    {isCalculatingFee ? (
                      <FaSpinner className="animate-spin inline text-violet-500" />
                    ) : shippingFee > 0 ? (
                      `${shippingFee.toLocaleString()} ₫`
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chọn địa chỉ để tính</span>
                    )}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>🎟 Voucher</span>
                    <span>-{discountAmount.toLocaleString()} ₫</span>
                  </div>
                )}
                {/* Grand total */}
                <div className="flex justify-between items-center text-lg font-black
                               border-t border-slate-100 pt-3 mt-1">
                  <span className="text-slate-800">Tổng tiền</span>
                  <span className="text-2xl font-black text-amber-600">
                    {(subTotalAfterDiscount + shippingFee).toLocaleString()} ₫
                  </span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isCalculatingFee || !getFullAddress()}
                className="w-full py-4 rounded-2xl mt-5 font-black text-white text-sm uppercase tracking-wide
                           bg-gradient-to-r from-amber-400 to-orange-500
                           hover:from-amber-500 hover:to-orange-600
                           shadow-lg shadow-amber-300/40
                           hover:shadow-xl hover:shadow-amber-400/40
                           hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           disabled:shadow-none"
              >
                {isCalculatingFee
                  ? <span className="flex items-center justify-center gap-2"><FaSpinner className="animate-spin" /> Đang tính phí...</span>
                  : "🛒 Đặt hàng ngay"
                }
              </button>

              {/* Security notice */}
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
                <FaShieldAlt className="text-emerald-500" />
                <span>Bảo mật thanh toán — SSL/TLS Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
