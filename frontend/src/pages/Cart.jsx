import { useState, useEffect } from "react";
import { FaMinus, FaPlus, FaTrashAlt, FaArrowLeft } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { clearCart, removeProduct, updateQuantity } from "../redux/cartRedux";
import { userRequest } from "../requestMethods";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ SẢN PHẨM ĐƯỢC CHỌN ---
  const [selectedIds, setSelectedIds] = useState([]);

  // Tự động chọn tất cả khi mới vào giỏ hàng (UX phổ biến)
  // Bạn có thể bỏ useEffect này nếu muốn mặc định là không chọn gì
  useEffect(() => {
    if (cart.products && cart.products.length > 0) {
      // Mặc định chọn hết
      setSelectedIds(cart.products.map((p) => p._id));
    }
  }, [cart.products.length]); // Chỉ chạy lại khi số lượng sp thay đổi

  // --- LOGIC CHỌN SẢN PHẨM ---
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Chọn tất cả
      const allIds = cart.products.map((p) => p._id);
      setSelectedIds(allIds);
    } else {
      // Bỏ chọn tất cả
      setSelectedIds([]);
    }
  };

  const handleSelectProduct = (id) => {
    if (selectedIds.includes(id)) {
      // Nếu đã có -> Bỏ chọn
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      // Nếu chưa có -> Thêm vào
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- HANDLERS CŨ ---
  const handleRemoveProduct = (productId) => {
    dispatch(removeProduct(productId));
    // Xóa khỏi danh sách đã chọn nếu đang chọn
    setSelectedIds((prev) => prev.filter((id) => id !== productId));
    toast.info("Đã xóa sản phẩm khỏi giỏ hàng");
  };

  const handleClearCart = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?")) {
      dispatch(clearCart());
      setSelectedIds([]);
      toast.info("Đã dọn sạch giỏ hàng");
    }
  };

  const handleQuantityChange = (
    productId,
    currentQuantity,
    change,
    countInStock
  ) => {
    const newQuantity = currentQuantity + change;

    if (newQuantity < 1) {
      if (window.confirm("Bạn muốn xóa sản phẩm này?")) {
        handleRemoveProduct(productId);
      }
      return;
    }

    if (countInStock !== undefined && newQuantity > countInStock) {
      toast.warning(`Kho chỉ còn ${countInStock} cuốn!`);
      return;
    }

    dispatch(updateQuantity({ _id: productId, quantity: newQuantity }));
  };

  // --- LOGIC TÍNH TIỀN (CHỈ TÍNH SP ĐƯỢC CHỌN) ---
  const selectedProducts = cart.products.filter((p) =>
    selectedIds.includes(p._id)
  );

  const subtotal = selectedProducts.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const shipping = subtotal > 0 ? 30000 : 0;
  const total = subtotal + shipping;

  // --- LOGIC CHUYỂN TRANG THANH TOÁN ---
  const handleCheckout = () => {
    if (!user.currentUser) {
      toast.error("Vui lòng đăng nhập để thanh toán!");
      return;
    }

    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }

    // Chuyển hướng sang Checkout và gửi kèm danh sách hàng ĐÃ CHỌN
    // (Ở trang Checkout bạn cần sửa lại để nhận state này thay vì lấy toàn bộ cart)
    navigate("/checkout", {
      state: {
        checkoutItems: selectedProducts,
        checkoutTotal: total, // Gửi luôn tổng tiền đã tính
      },
    });
  };

  // --- EMPTY CART UI ---
  if (cart.products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <img
          src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png"
          alt="Empty Cart"
          className="w-64 h-64 object-contain mb-6 opacity-80"
        />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Giỏ hàng của bạn đang trống
        </h2>
        <Link to="/">
          <button className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition shadow-lg flex items-center">
            <FaArrowLeft className="mr-2" /> Tiếp tục mua sắm
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center">
          Giỏ Hàng
          <span className="text-lg font-normal text-gray-500 ml-2">
            ({cart.quantity} sản phẩm)
          </span>
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- LEFT COLUMN: PRODUCT LIST --- */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Header Bảng */}
              <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-gray-600 font-semibold text-sm items-center">
                {/* Checkbox Select All */}
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === cart.products.length &&
                      cart.products.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                  />
                </div>
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-right">Thành tiền</div>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="divide-y divide-gray-100">
                {cart.products?.map((product) => (
                  <div
                    key={product._id}
                    className={`p-4 sm:grid sm:grid-cols-12 gap-4 items-center transition ${
                      selectedIds.includes(product._id)
                        ? "bg-purple-50/30"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Checkbox Individual */}
                    <div className="col-span-1 flex justify-center mb-4 sm:mb-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                        className="w-5 h-5 accent-purple-600 cursor-pointer"
                      />
                    </div>

                    {/* Cột 1: Ảnh & Tên */}
                    <div className="col-span-5 flex items-center space-x-4 mb-4 sm:mb-0">
                      <img
                        src={product.img}
                        alt={product.title}
                        className="w-20 h-24 object-cover rounded-md shadow-sm border border-gray-200"
                      />
                      <div>
                        <h3 className="text-base font-bold text-gray-800 line-clamp-2 mb-1">
                          <Link
                            to={`/product/${product._id}`}
                            className="hover:text-purple-600 transition"
                          >
                            {product.title}
                          </Link>
                        </h3>
                        {product.countInStock < 5 && (
                          <p className="text-xs text-red-500 font-medium mb-1">
                            Chỉ còn {product.countInStock} sản phẩm
                          </p>
                        )}

                        <button
                          onClick={() => handleRemoveProduct(product._id)}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center mt-1 transition"
                        >
                          <FaTrashAlt className="mr-1" /> Xóa
                        </button>
                      </div>
                    </div>

                    {/* Cột 2: Đơn giá */}
                    <div className="col-span-2 text-center text-gray-600 font-medium hidden sm:block">
                      {product.price?.toLocaleString("vi-VN")} ₫
                    </div>

                    {/* Cột 3: Số lượng */}
                    <div className="col-span-2 flex justify-center items-center">
                      <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              product._id,
                              product.quantity,
                              -1,
                              product.countInStock
                            )
                          }
                          className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition rounded-l-lg"
                        >
                          <FaMinus size={10} />
                        </button>

                        <span className="px-3 py-1 font-semibold text-gray-700 border-l border-r border-gray-300 min-w-[40px] text-center">
                          {product.quantity}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(
                              product._id,
                              product.quantity,
                              1,
                              product.countInStock
                            )
                          }
                          disabled={
                            product.countInStock !== undefined &&
                            product.quantity >= product.countInStock
                          }
                          className={`px-3 py-1 transition rounded-r-lg ${
                            product.quantity >= product.countInStock
                              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                              : "hover:bg-gray-100 text-gray-600"
                          }`}
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                    </div>

                    {/* Cột 4: Thành tiền */}
                    <div className="col-span-2 text-right font-bold text-purple-600 text-lg mt-4 sm:mt-0">
                      {(product.price * product.quantity).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      ₫
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <Link
                to="/"
                className="text-purple-600 hover:text-purple-800 font-semibold flex items-center transition"
              >
                <FaArrowLeft className="mr-2" /> Tiếp tục mua sắm
              </Link>
              <button
                onClick={handleClearCart}
                className="text-gray-500 hover:text-red-500 transition text-sm font-semibold border border-gray-300 px-4 py-2 rounded-lg hover:border-red-500"
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
          <div className="w-full lg:w-96">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">
                Thanh toán
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Đã chọn</span>
                  <span className="font-medium text-purple-600">
                    {selectedIds.length} sản phẩm
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium">
                    {subtotal.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium">
                    {shipping > 0
                      ? `${shipping.toLocaleString("vi-VN")} ₫`
                      : "Miễn phí"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-200 pt-4 mb-6">
                <span className="text-lg font-bold text-gray-800">
                  Tổng cộng
                </span>
                <span className="text-2xl font-extrabold text-red-600">
                  {total.toLocaleString("vi-VN")} ₫
                </span>
              </div>

              {/* NÚT THANH TOÁN */}
              <button
                onClick={handleCheckout}
                disabled={selectedIds.length === 0}
                className={`w-full font-bold py-3.5 rounded-lg shadow-lg transition transform active:scale-95 ${
                  selectedIds.length > 0
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:-translate-y-0.5"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                MUA HÀNG ({selectedIds.length})
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Chấp nhận thanh toán qua thẻ Visa, Master, MoMo...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
