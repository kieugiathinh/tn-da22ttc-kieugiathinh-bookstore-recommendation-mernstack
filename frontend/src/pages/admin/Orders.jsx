import { useState, useEffect, useMemo } from "react";
import { FaClock, FaShippingFast, FaCheckDouble, FaTimesCircle, FaCheckCircle, FaBoxOpen, FaEye, FaSearch, FaCalendarAlt, FaMoneyBillWave, FaChartLine, FaClipboardList } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";

const STATUS_CONFIG = {
  0: { label: "Chờ xác nhận", icon: FaClock, variant: "warning" },
  1: { label: "Đã xác nhận", icon: FaCheckCircle, variant: "info" },
  2: { label: "Đang chuẩn bị", icon: FaBoxOpen, variant: "info" },
  3: { label: "Đang giao", icon: FaShippingFast, variant: "primary" },
  4: { label: "Đã giao", icon: FaCheckDouble, variant: "success" },
  5: { label: "Đã hủy", icon: FaTimesCircle, variant: "danger" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: "Không xác định", icon: FaClock, variant: "neutral" };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1.5 py-1">
      <Icon size={11} /> {cfg.label}
    </Badge>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all"); // Lọc theo thời gian
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State cho Modal chi tiết
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/orders");
      // Mặc định API có thể chưa sort, sort mới nhất lên đầu
      setOrders(res.data.map((o) => ({ ...o, id: o._id })).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      Swal.fire("Lỗi", "Không thể tải dữ liệu đơn hàng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdateOrder = async (id, newStatus) => {
    const statusLabel = STATUS_CONFIG[newStatus]?.label || "Trạng thái mới";
    const { isConfirmed } = await Swal.fire({
      title: "Cập nhật trạng thái?",
      text: `Chuyển đơn hàng sang: "${statusLabel}"?`,
      icon: "question",
      showCancelButton: true, 
      confirmButtonColor: "#f97316",
      confirmButtonText: "Đồng ý", 
      cancelButtonText: "Hủy",
    });
    if (isConfirmed) {
      try {
        await userRequest.put(`/orders/${id}`, { status: newStatus });
        Swal.fire("Thành công!", "Trạng thái đã được cập nhật.", "success");
        fetchOrders();
      } catch {
        Swal.fire("Lỗi!", "Cập nhật thất bại.", "error");
      }
    }
  };

  // --- LỌC THEO THỜI GIAN VÀ TRẠNG THÁI ---
  const filtered = useMemo(() => {
    const now = new Date();
    
    return orders.filter((o) => {
      // 1. Lọc theo trạng thái
      const matchStatus = filterStatus === "all" || o.status === Number(filterStatus);
      
      // 2. Lọc theo chuỗi tìm kiếm
      const matchSearch = o._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 3. Lọc theo thời gian
      const orderDate = new Date(o.createdAt);
      let matchDate = true;
      
      if (filterDate === "today") {
        matchDate = orderDate.toDateString() === now.toDateString();
      } else if (filterDate === "week") {
        // Tuần hiện tại: Tính từ Thứ 2 đến Chủ nhật
        const day = now.getDay() || 7; // getDay() trả về 0 cho CN, ta đổi thành 7
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() - day + 1); // Đưa về Thứ 2
        matchDate = orderDate >= monday;
      } else if (filterDate === "month") {
        matchDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      } else if (filterDate === "year") {
        matchDate = orderDate.getFullYear() === now.getFullYear();
      }
      
      return matchStatus && matchSearch && matchDate;
    });
  }, [orders, filterStatus, searchTerm, filterDate]);

  // --- TÍNH TOÁN DASHBOARD TRÊN TẬP ĐÃ LỌC THỜI GIAN (Trừ filter status) ---
  const dashboardStats = useMemo(() => {
    // Để tính tổng quát cho Dashboard, ta tính trên list orders đã được lọc theo Thời Gian và Tìm kiếm
    // (Bỏ qua lọc trạng thái để bảng luôn hiện tổng số của Hôm nay/Tháng nay)
    const now = new Date();
    const baseOrders = orders.filter(o => {
      const matchSearch = o._id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.name.toLowerCase().includes(searchTerm.toLowerCase());
      const orderDate = new Date(o.createdAt);
      let matchDate = true;
      if (filterDate === "today") matchDate = orderDate.toDateString() === now.toDateString();
      else if (filterDate === "week") {
        const day = now.getDay() || 7;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() - day + 1);
        matchDate = orderDate >= monday;
      } else if (filterDate === "month") matchDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      else if (filterDate === "year") matchDate = orderDate.getFullYear() === now.getFullYear();
      return matchSearch && matchDate;
    });

    let totalOrders = baseOrders.length;
    let completedOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;

    baseOrders.forEach(o => {
      if (o.status === 4) { // Đã giao
        completedOrders++;
        totalRevenue += o.total;
      } else if (o.status >= 0 && o.status <= 3) {
        pendingOrders++;
      }
    });

    return { totalOrders, completedOrders, pendingOrders, totalRevenue, baseOrders };
  }, [orders, filterDate, searchTerm]);

  // --- PHÂN TRANG ---
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const pageData = filtered.slice(startIdx, startIdx + rowsPerPage);

  // Đếm theo trạng thái để hiện Badge trên Tabs (dựa vào baseOrders)
  const counts = { all: dashboardStats.baseOrders.length, 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  dashboardStats.baseOrders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });

  const tabs = [
    { value: "all", label: "Tất cả" },
    ...Object.entries(STATUS_CONFIG).map(([val, cfg]) => ({ value: val, label: cfg.label }))
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Đơn hàng"
        subtitle={`${dashboardStats.totalOrders} đơn hàng đang hiển thị`}
      />

      {/* --- MINI DASHBOARD --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Tổng Đơn Hàng</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dashboardStats.totalOrders}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-xl text-blue-500"><FaClipboardList size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Thành công</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{dashboardStats.completedOrders}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500"><FaCheckDouble size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Đang xử lý</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{dashboardStats.pendingOrders}</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl text-amber-500"><FaClock size={20} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Doanh thu (Thực tế)</p>
            <p className="text-2xl font-bold text-primary mt-1">{dashboardStats.totalRevenue.toLocaleString("vi-VN")} ₫</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-xl text-primary"><FaMoneyBillWave size={20} /></div>
        </div>
      </div>

      {/* --- BỘ LỌC TÌM KIẾM & THỜI GIAN --- */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        
        {/* Tìm kiếm */}
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã đơn, tên khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Lọc thời gian & Phân trang */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400" />
            <select 
              value={filterDate} 
              onChange={(e) => { setFilterDate(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-1.5 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>

          <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <span>Hiển thị:</span>
            <select 
              value={rowsPerPage} 
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg text-sm py-1.5 px-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-gray-50 hover:bg-white transition-colors"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- STATUS TABS --- */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilterStatus(tab.value); setCurrentPage(1); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all border ${
              filterStatus === tab.value
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              filterStatus === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {counts[tab.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* --- BẢNG ĐƠN HÀNG --- */}
      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="px-5 py-3.5">Mã đơn hàng</th>
                    <th className="px-5 py-3.5">Khách hàng</th>
                    <th className="px-5 py-3.5">Thời gian đặt</th>
                    <th className="px-5 py-3.5">Tổng tiền</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((order) => {
                    const orderDate = new Date(order.createdAt);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">
                            #{order._id.slice(-8).toUpperCase()}
                          </code>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-800">{order.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">{order.phone || "Không có SĐT"}</p>
                          {order.email && <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[150px]">{order.email}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-bold text-gray-700">{orderDate.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{orderDate.toLocaleDateString("vi-VN")}</p>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-emerald-600">
                          {(order.total || 0).toLocaleString("vi-VN")} ₫
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-3.5 flex items-center justify-center gap-2">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrder(order._id, Number(e.target.value))}
                            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 bg-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                          >
                            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                              <option key={val} value={val}>{cfg.label}</option>
                            ))}
                          </select>

                          <button 
                            onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-primary hover:bg-orange-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FaEye size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {pageData.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      Không có đơn hàng nào
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages}
                total={filtered.length} rowsPerPage={rowsPerPage}
                onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                unit="đơn" />
            )}
          </>
        )}
      </Card>

      {/* --- MODAL CHI TIẾT ĐƠN HÀNG --- */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                Chi tiết đơn hàng <span className="text-primary font-mono text-sm ml-1">#{selectedOrder._id.slice(-8).toUpperCase()}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                <FaTimesCircle size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Thông tin khách hàng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Thông tin liên hệ</h4>
                  <p className="font-medium text-gray-800 text-sm">{selectedOrder.name}</p>
                  <p className="text-sm text-gray-700 mt-1 font-mono">{selectedOrder.phone || "Không có SĐT"}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedOrder.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Giao hàng & Thanh toán</h4>
                  <p className="text-xs text-gray-700 leading-relaxed"><span className="text-gray-500 font-medium">Địa chỉ:</span> {selectedOrder.address}</p>
                  <p className="text-xs text-gray-700 mt-1"><span className="text-gray-500 font-medium">PT thanh toán:</span> <span className="font-semibold text-primary">{selectedOrder.paymentMethod}</span></p>
                  <p className="text-xs text-gray-700 mt-1"><span className="text-gray-500 font-medium">Ngày đặt:</span> {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">Danh sách sản phẩm</h4>
                <div className="space-y-3">
                  {selectedOrder.products?.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                        <img src={item.img || "/placeholder.jpg"} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate" title={item.title}>{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">Số lượng: <span className="font-bold text-gray-700">{item.quantity}</span></p>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <p className="text-sm font-bold text-emerald-600">{(item.price * item.quantity).toLocaleString("vi-VN")} ₫</p>
                        <p className="text-[10px] text-gray-400 mt-1">Đơn giá: {item.price?.toLocaleString("vi-VN")}₫</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng kết */}
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Phí vận chuyển</span>
                  <span className="text-sm font-medium">{(selectedOrder.shippingFee || 0).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between items-center border-t border-orange-200/50 pt-2 mt-2">
                  <span className="font-bold text-gray-800">Tổng thanh toán</span>
                  <span className="text-xl font-black text-primary">{(selectedOrder.total || 0).toLocaleString("vi-VN")} ₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
