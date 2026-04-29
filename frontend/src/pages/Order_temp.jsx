import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaShippingFast,
  FaBoxOpen,
  FaPen,
  FaTimesCircle,
  FaStar,
  FaClipboardList,
  FaSpinner,
  FaTruck,
  FaBan,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { userRequest } from "../requestMethods";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import Swal from "sweetalert2";

// Component chọn sao
const EditableStarRating = ({ rating, setRating }) => {
  return (
    <div className="flex flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={24}
          className={`cursor-pointer transition-colors ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
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
  const [ratingData, setRatingData] = useState({});
  const [showRatingFor, setShowRatingFor] = useState(null);

  const tabs = [
    { id: "all", label: "Tất cả", icon: <FaClipboardList /> },
    {
      id: 0,
      label: "Chờ xác nhận",
      icon: <FaSpinner className={activeTab === 0 ? "animate-spin" : ""} />,
    },
    { id: 1, label: "Đang giao", icon: <FaTruck /> },
    { id: 2, label: "Hoàn thành", icon: <FaCheckCircle /> },
    { id: 3, label: "Đã hủy", icon: <FaBan /> },
  ];

  useEffect(() => {
    const getUserOrder = async () => {
      try {
        const res = await userRequest.get(
          `/orders/find/${user.currentUser._id}`
        );
        setOrders(res.data);
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

  const handleRatingChange = (productId, field, value) => {
    setRatingData((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const submitRating = async (productId, orderId) => {
    const data = ratingData[productId];
    if (!data || !data.star) {
      toast.warning("Vui lòng chọn số sao đánh giá!");
      return;
    }
    try {
      await userRequest.post(`/reviews/${productId}`, {
        rating: data.star,
        comment: data.comment || "",
        orderId: orderId,
      });
      toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
      setShowRatingFor(null);
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

  const handleCancelOrder = async (orderId) => {
    const result = await Swal.fire({
      title: "Hủy đơn hàng?",
      text: "Bạn có chắc chắn muốn hủy đơn này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý hủy",
      cancelButtonText: "Giữ lại",
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
      <div className="p-10 text-center text-gray-500">
        Đang tải lịch sử đơn hàng...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            LỊCH SỬ ĐƠN HÀNG
          </h1>
          <p className="text-gray-500">
            Theo dõi và quản lý các đơn hàng của bạn
          </p>
        </div>

        {/* TABS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-8 flex flex-wrap justify-center gap-2 sticky top-4 z-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-md transform scale-105"
                  : "text-gray-500 hover:bg-gray-100 hover:text-purple-600"
              }`}
            >
              <span className="mr-2 text-lg">{tab.icon}</span>
              {tab.label}
              <span
                className={`ml-2 text-xs py-0.5 px-2 rounded-full ${
                  activeTab === tab.id
                    ? "bg-white text-purple-600"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab.id === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === tab.id).length}
              </span>
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <FaBoxOpen className="text-gray-300 text-6xl mb-4" />
            <h2 className="text-xl font-bold text-gray-600">
              Chưa có đơn hàng nào ở mục này
            </h2>
            {activeTab !== "all" && (
              <button
                onClick={() => setActiveTab("all")}
                className="mt-4 text-purple-600 font-bold hover:underline"
              >
                Xem tất cả đơn hàng
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredOrders.map((order) => {
              // --- LOGIC TÍNH TOÁN ĐƯỢC CHUYỂN VÀO ĐÂY ---
              const subtotal = order.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
                0
              );
              const shippingFee = 30000;
              // Nếu (Tạm tính + Ship) lớn hơn Tổng tiền thực trả => Có giảm giá
              const discountAmount = subtotal + shippingFee - order.total;
              // -------------------------------------------

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  {/* HEADER ĐƠN HÀNG */}
                  <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Mã đơn
                        </span>
                        <p className="font-mono text-sm font-bold text-gray-800">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Ngày đặt
                        </span>
                        <p className="text-sm text-gray-800">
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end w-full sm:w-auto">
                      {/* HIỂN THỊ GIẢM GIÁ */}
                      {discountAmount > 0 && (
                        <div className="text-right mb-1">
                          <p className="text-xs text-gray-500">
                            Tạm tính:{" "}
                            <span className="font-medium">
                              {subtotal.toLocaleString()}đ
                            </span>
                          </p>
                          <p className="text-xs text-green-600 flex items-center justify-end font-bold">
                            <span className="bg-green-100 px-1.5 rounded mr-1 text-[10px] border border-green-200">
                              {order.couponCode || "VOUCHER"}
                            </span>
                            -{discountAmount.toLocaleString()}đ
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block text-right">
                          Tổng thanh toán
                        </span>
                        <p className="text-lg font-extrabold text-purple-600 text-right">
                          {order.total?.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>

                      {order.status === 0 && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="mt-2 text-red-500 hover:bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-200 transition"
                        >
                          Hủy Đơn
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BODY ĐƠN HÀNG */}
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      {order.products?.map((item, idx) => (
                        <div
                          key={idx}
                          className="border-b border-gray-50 pb-6 last:border-0 last:pb-0"
                        >
                          <div className="flex gap-4">
                            <div className="relative">
                              <img
                                src={item.img}
                                alt={item.title}
                                className="w-20 h-28 object-cover rounded-md border border-gray-200 shadow-sm"
                              />
                              <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md">
                                {item.quantity}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800 line-clamp-2 text-sm sm:text-base hover:text-purple-600 cursor-pointer transition">
                                <Link to={`/product/${item.productId}`}>
                                  {item.title}
                                </Link>
                              </h4>
                              <p className="text-sm text-purple-600 font-bold mt-1">
                                {item.price?.toLocaleString("vi-VN")} ₫
                              </p>

                              {order.status === 2 && (
                                <div className="mt-3">
                                  {item.isReviewed ? (
                                    <span className="inline-flex items-center whitespace-nowrap text-green-600 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-md border border-green-100">
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
                                      className="text-xs flex items-center text-purple-600 border border-purple-600 px-3 py-1.5 rounded-md hover:bg-purple-50 transition font-bold"
                                    >
                                      <FaPen className="mr-1.5" /> Viết đánh giá
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {showRatingFor === item.productId &&
                            !item.isReviewed && (
                              <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100 animate-fadeIn">
                                <div className="flex flex-col gap-3">
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
                                  </div>
                                  <textarea
                                    rows="3"
                                    placeholder="Chia sẻ cảm nhận..."
                                    className="w-full text-sm p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                                    onChange={(e) =>
                                      handleRatingChange(
                                        item.productId,
                                        "comment",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <div className="flex justify-end">
                                    <button
                                      onClick={() =>
                                        submitRating(item.productId, order._id)
                                      }
                                      className="bg-purple-600 text-white text-sm font-bold py-2 px-6 rounded-lg cursor-pointer hover:bg-purple-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                      Gửi đánh giá
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6 border-l border-gray-100 lg:pl-8 flex flex-col justify-between h-full">
                      <div>
                        <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 flex items-center text-xs uppercase tracking-wider text-gray-500">
                          <FaShippingFast className="mr-2" /> Thông tin nhận
                          hàng
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
                          <p className="font-bold text-gray-800">
                            {order.name || user.currentUser.fullname}
                          </p>
                          <p>{order.phone || "SĐT: Chưa cập nhật"}</p>
                          <p className="line-clamp-2">
                            {order.address || order.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-500">Trạng thái:</span>
                          <span
                            className={`font-bold ${
                              order.status === 2
                                ? "text-green-600"
                                : order.status === 3
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          >
                            {order.status === 0
                              ? "Chờ xác nhận"
                              : order.status === 1
                              ? "Đang vận chuyển"
                              : order.status === 2
                              ? "Giao thành công"
                              : "Đã hủy"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">Thanh toán:</span>
                          <span className="font-bold text-gray-800">
                            {order.paymentMethod || "COD"}
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
          <Link to="/">
            <button className="bg-white border-2 border-purple-600 text-purple-600 font-bold py-3 px-8 rounded-full hover:bg-purple-50 transition">
              Tiếp tục mua sắm
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Order;
