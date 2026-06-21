import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaShippingFast,
  FaBoxOpen,
  FaPen,
  FaStar,
  FaClipboardList,
  FaSpinner,
  FaTruck,
  FaBan,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Swal from "sweetalert2";

// --- COMPONENT CON: ĐÁNH GIÁ SAO ---
const EditableStarRating = ({ rating, setRating }) => {
  return (
    <div className="flex flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={24}
          className={`cursor-pointer transition-colors ${star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};

const Order = () => {
  const user = useSelector((state) => state.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // State quản lý đánh giá
  const [ratingData, setRatingData] = useState({});
  const [showRatingFor, setShowRatingFor] = useState(null);


  const tabs = [
    { id: "all", label: "Tất cả", icon: <FaClipboardList /> },
    {
      id: 0,
      label: "Chờ xác nhận",
      icon: <FaSpinner className={activeTab === 0 ? "animate-spin" : ""} />,
    },
    { id: 1, label: "Đã xác nhận", icon: <FaCheckCircle /> },
    { id: 2, label: "Đang chuẩn bị", icon: <FaBoxOpen /> },
    { id: 3, label: "Đang giao", icon: <FaTruck /> },
    { id: 4, label: "Hoàn thành", icon: <FaCheckCircle /> },
    { id: 5, label: "Đã hủy", icon: <FaBan /> },
  ];

  // --- LẤY DỮ LIỆU ĐƠN HÀNG ---
  useEffect(() => {
    const getUserOrder = async () => {
      try {
        const res = await userRequest.get(
          `/orders/find/${user.currentUser._id}`
        );
        // Sắp xếp đơn mới nhất lên đầu
        setOrders(
          res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };
    if (user.currentUser) getUserOrder();
  }, [user]);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  // --- XỬ LÝ ĐÁNH GIÁ ---
  const handleRatingChange = (productId, field, value) => {
    setRatingData((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const submitRating = async (productId, orderId) => {
    const data = ratingData[productId];
    if (!data || !data.star) {
      toast.warning("Vui lòng chọn số sao để đánh giá!");
      return;
    }
    try {
      await userRequest.post(`/reviews/${productId}`, {
        rating: data.star,
        comment: data.comment || "",
        orderId: orderId,
      });

      // Ghi lại hành vi review
      try {
        await userRequest.post('/interactions/track', {
          productId: productId,
          interactionType: "review",
          source: "order"
        });
      } catch (err) {
        console.log("Track error:", err);
      }

      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      setShowRatingFor(null);
      // Cập nhật lại UI ngay lập tức
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order._id === orderId) {
            return {
              ...order,
              products: order.products.map((p) =>
                p.productId === productId ? { ...p, isReviewed: true } : p
              ),
            };
          }
          return order;
        })
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi gửi đánh giá.");
    }
  };

  // --- XỬ LÝ HỦY ĐƠN ---
  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: "Hủy đơn hàng?",
      text: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý hủy",
      cancelButtonText: "Không",
    });

    if (result.isConfirmed) {
      try {
        await userRequest.put(`/orders/${orderId}/cancel`);
        toast.success("Đã hủy đơn hàng thành công");
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, status: 3 } : order
          )
        );
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng");
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-gray-500 font-medium">
        <FaSpinner className="animate-spin mr-3 text-primary" /> Đang tải
        lịch sử đơn hàng...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
            <h1 className="text-xl font-extrabold text-slate-800">Lịch Sử Đơn Hàng</h1>
          </div>

          {/* --- TABS --- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-8 flex flex-wrap justify-center gap-2 sticky top-20 z-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id
                  ? "bg-primary text-white shadow-md transform scale-105"
                  : "text-gray-500 hover:bg-gray-100 hover:text-primary"
                  }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
                <span
                  className={`ml-2 text-xs py-0.5 px-2 rounded-full font-bold ${activeTab === tab.id
                    ? "bg-white text-primary"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {tab.id === "all"
                    ? orders.length
                    : orders.filter((o) => o.status === tab.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* --- DANH SÁCH ĐƠN HÀNG --- */}
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <FaBoxOpen className="text-gray-300 text-6xl mb-4" />
              <h2 className="text-xl font-bold text-gray-600">
                Chưa có đơn hàng nào
              </h2>
              {activeTab !== "all" && (
                <button
                  onClick={() => setActiveTab("all")}
                  className="mt-4 text-primary font-bold hover:underline"
                >
                  Xem tất cả đơn hàng
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                // --- LOGIC TÍNH TOÁN HIỂN THỊ (QUAN TRỌNG) ---
                const subtotal = order.products.reduce(
                  (acc, item) => acc + item.price * item.quantity,
                  0
                );

                const orderShipFee = order.shippingFee || 0;

                // Tổng thực tế (Tiền hàng + Ship)
                const realTotalWithoutDiscount = subtotal + orderShipFee;

                // Voucher = (Tiền hàng + Ship) - (Số tiền khách trả thực trong DB)
                // Dùng Math.max(0, ...) để tránh số âm nếu dữ liệu cũ bị sai
                const discountAmount = Math.max(
                  0,
                  realTotalWithoutDiscount - order.total
                );
                // ----------------------------------------------

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    {/* HEADER ITEM */}
                    <div className="bg-gray-50/60 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Mã đơn hàng
                          </span>
                          <p className="font-mono text-sm font-bold text-slate-700">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Ngày đặt
                          </span>
                          <p className="text-sm font-medium text-slate-700">
                            {new Date(order.createdAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end w-full sm:w-auto">
                        {/* CHI TIẾT TIỀN (Chỉ hiện nếu có) */}
                        <div className="text-right mb-1 space-y-0.5">
                          <p className="text-xs text-gray-500">
                            Tạm tính:{" "}
                            <span className="font-medium text-slate-700">
                              {subtotal.toLocaleString()}đ
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Phí vận chuyển:{" "}
                            <span className="font-medium text-slate-700">
                              {orderShipFee.toLocaleString()}đ
                            </span>
                          </p>
                          {discountAmount > 0 && (
                            <p className="text-xs text-green-600 flex items-center justify-end font-bold">
                              <span className="bg-green-100 px-1.5 rounded mr-1 text-[10px] border border-green-200">
                                {order.couponCode || "VOUCHER"}
                              </span>
                              -{discountAmount.toLocaleString()}đ
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-right">
                            Tổng thanh toán
                          </span>
                          <p className="text-lg font-extrabold text-primary text-right">
                            {order.total?.toLocaleString("vi-VN")} ₫
                          </p>
                        </div>

                        {order.status === 0 && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="mt-2 text-red-500 hover:bg-red-50 px-4 py-1.5 rounded-full text-xs font-bold border border-red-200 transition-colors"
                          >
                            Hủy Đơn Hàng
                          </button>
                        )}
                      </div>
                    </div>

                    {/* BODY ITEM */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* DANH SÁCH SẢN PHẨM */}
                      <div className="lg:col-span-2 space-y-6">
                        {order.products?.map((item, idx) => (
                          <div
                            key={idx}
                            className="border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                          >
                            <div className="flex gap-4">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={item.img}
                                  alt={item.title}
                                  className="w-20 h-28 object-cover rounded-lg border border-gray-200 shadow-sm"
                                />
                                <span className="absolute -top-2 -right-2 bg-slate-800 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md border-2 border-white">
                                  {item.quantity}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-slate-800 line-clamp-2 text-sm sm:text-base hover:text-primary cursor-pointer transition-colors">
                                  <Link to={`/product/${item.productId}`}>
                                    {item.title}
                                  </Link>
                                </h4>
                                <p className="text-sm text-primary font-bold mt-1">
                                  {item.price?.toLocaleString("vi-VN")} ₫
                                </p>

                                {/* BUTTON ĐÁNH GIÁ (Chỉ hiện khi hoàn thành: status === 4) */}
                                {order.status === 4 && (
                                  <div className="mt-3">
                                    {item.isReviewed ? (
                                      <span className="inline-flex items-center text-green-600 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-md border border-green-100 select-none">
                                        <FaCheckCircle className="mr-1.5" /> Đã
                                        đánh giá
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setShowRatingFor(
                                            showRatingFor === item.productId
                                              ? null
                                              : item.productId
                                          )
                                        }
                                        className="text-xs flex items-center text-primary border border-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-white transition-all font-bold"
                                      >
                                        <FaPen className="mr-1.5" /> Viết đánh giá
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* FORM ĐÁNH GIÁ */}
                            {showRatingFor === item.productId &&
                              !item.isReviewed && (
                                <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fadeIn relative">
                                  {/* Mũi tên trỏ lên */}
                                  <div className="absolute top-0 left-10 -mt-2 w-4 h-4 bg-gray-50 border-t border-l border-gray-200 transform rotate-45"></div>

                                  <div className="flex flex-col gap-3 relative z-10">
                                    <p className="text-xs font-bold text-gray-500 uppercase">
                                      Chất lượng sản phẩm:
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <EditableStarRating
                                        rating={
                                          ratingData[item.productId]?.star || 0
                                        }
                                        setRating={(val) =>
                                          handleRatingChange(
                                            item.productId,
                                            "star",
                                            val
                                          )
                                        }
                                      />
                                      <span className="text-sm font-bold text-yellow-500 ml-2">
                                        {ratingData[item.productId]?.star
                                          ? `${ratingData[item.productId]?.star
                                          } Sao`
                                          : ""}
                                      </span>
                                    </div>
                                    <textarea
                                      rows="3"
                                      placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé..."
                                      className="w-full text-sm p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                      onChange={(e) =>
                                        handleRatingChange(
                                          item.productId,
                                          "comment",
                                          e.target.value
                                        )
                                      }
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setShowRatingFor(null)}
                                        className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        onClick={() =>
                                          submitRating(item.productId, order._id)
                                        }
                                        className="bg-primary text-white text-sm font-bold py-2 px-6 rounded-lg hover:bg-primary-hover transition shadow-md hover:shadow-lg transform active:scale-95"
                                      >
                                        Gửi Đánh Giá
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>

                      {/* THÔNG TIN NHẬN HÀNG */}
                      <div className="space-y-6 border-l border-gray-100 lg:pl-8 flex flex-col justify-between h-full">
                        <div>
                          <h3 className="font-bold text-slate-800 border-b border-gray-100 pb-2 mb-3 flex items-center text-xs uppercase tracking-wider">
                            <FaShippingFast className="mr-2 text-primary" />{" "}
                            Thông tin nhận hàng
                          </h3>
                          <div className="text-sm text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="font-bold text-slate-800 text-base">
                              {order.name || user.currentUser.fullname}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="text-xs bg-white border border-gray-200 px-1 rounded text-gray-500">
                                SĐT
                              </span>
                              {order.phone || "Chưa cập nhật"}
                            </p>
                            <p className="line-clamp-3 text-xs leading-relaxed">
                              <span className="font-bold text-gray-500 mr-1">
                                Đ/c:
                              </span>
                              {order.address || order.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Trạng thái:</span>
                            <span
                              className={`font-bold px-2 py-1 rounded text-xs ${order.status === 4
                                ? "bg-green-100 text-green-700"
                                : order.status === 5
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                                }`}
                            >
                              {order.status === 0
                                ? "Chờ xác nhận"
                                : order.status === 1
                                  ? "Đã xác nhận"
                                  : order.status === 2
                                    ? "Đang chuẩn bị"
                                    : order.status === 3
                                      ? "Đang giao"
                                      : order.status === 4
                                        ? "Giao thành công"
                                        : "Đã hủy"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Thanh toán:</span>
                            <span className="font-bold text-slate-800">
                              {order.paymentMethod === "COD"
                                ? "Tiền mặt (COD)"
                                : "Chuyển khoản / Stripe"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/products">
              <button className="bg-white border-2 border-primary text-primary font-bold py-3 px-8 rounded-full hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1">
                Tiếp Tục Mua Sắm
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;

