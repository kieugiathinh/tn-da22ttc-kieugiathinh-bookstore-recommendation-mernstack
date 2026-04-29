import { useState, useEffect } from "react";
import {
  FaClock,
  FaCheckDouble,
  FaShippingFast,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";

const ROWS_PER_PAGE = 10;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Hàm Tải dữ liệu Đơn hàng
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/orders");
      // Đảm bảo có trường 'id' cho React key
      setOrders(res.data.map((order) => ({ ...order, id: order._id })));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Hàm Cập nhật trạng thái Đơn hàng
  const handleUpdateOrder = async (id, currentStatus) => {
    let newStatus;
    let confirmationTitle;

    // Tùy chỉnh trạng thái dựa trên business logic của bạn (VD: 0=Pending, 1=Processing/Shipping, 2=Delivered)
    if (currentStatus === 0) {
      newStatus = 1;
      confirmationTitle = "Xác nhận XỬ LÝ Đơn hàng?";
    } else if (currentStatus === 1) {
      newStatus = 2;
      confirmationTitle = "Xác nhận ĐÃ GIAO HÀNG (Delivered)?";
    } else {
      return;
    }

    const result = await Swal.fire({
      title: confirmationTitle,
      text: "Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4c51bf",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await userRequest.put(`/orders/${id}`, { status: newStatus });
        Swal.fire(
          "Thành công!",
          "Trạng thái đơn hàng đã được cập nhật.",
          "success"
        );
        fetchOrders(); // Tải lại dữ liệu
      } catch (error) {
        Swal.fire("Lỗi!", "Cập nhật thất bại.", "error");
      }
    }
  };

  // 3. Hàm hiển thị Trạng thái (đã cải tiến)
  const renderStatus = (status) => {
    switch (status) {
      case 0:
        return (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <FaClock className="mr-1 mt-0.5" /> Chờ xác nhận
          </span>
        );
      case 1:
        return (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            <FaShippingFast className="mr-1 mt-0.5" /> Đang vận chuyển
          </span>
        );
      case 2:
        return (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            <FaCheckDouble className="mr-1 mt-0.5" /> Đã giao hàng
          </span>
        );
      case 3:
        return (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1 mt-0.5" /> Đã hủy
          </span>
        );
      default:
        return "Không xác định";
    }
  };

  // 4. Logic Phân trang
  const totalPages = Math.ceil(orders.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentOrders = orders.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  if (loading)
    return (
      <div className="p-8 text-center text-xl text-purple-600">
        Đang tải danh sách đơn hàng...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-red-500 bg-red-100 border border-red-300 rounded-lg">
        {error}
      </div>
    );

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          🛒 Quản lý Đơn hàng
        </h1>
      </div>

      {/* BẢNG DỮ LIỆU ĐƠN HÀNG */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {/* HEADER BẢNG */}
          <thead className="bg-purple-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Mã đơn hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>

          {/* BODY BẢNG */}
          <tbody className="divide-y divide-gray-100">
            {currentOrders.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate max-w-xs">
                  {order._id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {order.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-xs">
                    {order.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  {order.total ? order.total.toLocaleString("vi-VN") : 0} VND
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {renderStatus(order.status)}
                </td>

                {/* CỘT HÀNH ĐỘNG */}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  {order.status < 2 ? (
                    <button
                      onClick={() => handleUpdateOrder(order._id, order.status)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none transition duration-150"
                      title={
                        order.status === 0
                          ? "Xác nhận và Xử lý đơn hàng"
                          : "Đánh dấu đã giao hàng"
                      }
                    >
                      <FaCheckCircle className="mr-1" />
                      {order.status === 0 ? "Xử lý đơn" : "Đã giao"}
                    </button>
                  ) : (
                    <span className="text-gray-400">Hoàn tất</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER PHÂN TRANG */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị từ{" "}
                <span className="font-medium">
                  {Math.min(startIndex + 1, orders.length)}
                </span>{" "}
                đến{" "}
                <span className="font-medium">
                  {Math.min(startIndex + ROWS_PER_PAGE, orders.length)}
                </span>{" "}
                của <span className="font-medium">{orders.length}</span> đơn
                hàng
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                <span className="relative inline-flex items-center px-4 py-2 border border-purple-500 bg-purple-50 text-sm font-medium text-purple-700">
                  Trang {currentPage} / {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
