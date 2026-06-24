import { useState, useEffect, useMemo } from "react";
import {
  FaClock, FaShippingFast, FaCheckDouble, FaTimesCircle,
  FaCheckCircle, FaBoxOpen, FaEye, FaSearch, FaCalendarAlt,
  FaFilter, FaSortAmountDown, FaChevronDown
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  0: { label: "Chờ xác nhận", icon: FaClock, color: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  1: { label: "Đã xác nhận", icon: FaCheckCircle, color: "bg-blue-50 text-blue-700 border border-blue-200" },
  2: { label: "Đang chuẩn bị", icon: FaBoxOpen, color: "bg-purple-50 text-purple-700 border border-purple-200" },
  3: { label: "Đang giao", icon: FaShippingFast, color: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  4: { label: "Đã giao", icon: FaCheckDouble, color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  5: { label: "Đã hủy", icon: FaTimesCircle, color: "bg-red-50 text-red-600 border border-red-200" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/orders");
      setOrders(
        res.data
          .map(o => ({ ...o, id: o._id }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } catch {
      Swal.fire("Lỗi", "Không thể tải dữ liệu đơn hàng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // ── Update Status ──────────────────────────────────────────────────────────
  const handleUpdateOrder = async (id, newStatus) => {
    const statusLabel = STATUS_CONFIG[newStatus]?.label ?? "Trạng thái mới";
    const { isConfirmed } = await Swal.fire({
      title: "Cập nhật trạng thái?",
      text: `Chuyển sang: "${statusLabel}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });
    if (!isConfirmed) return;
    try {
      await userRequest.put(`/orders/${id}`, { status: newStatus });
      Swal.fire({ title: "Đã cập nhật!", icon: "success", timer: 1200, showConfirmButton: false });
      fetchOrders();
    } catch {
      Swal.fire("Lỗi!", "Cập nhật thất bại.", "error");
    }
  };

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const matchStatus = filterStatus === "all" || o.status === Number(filterStatus);
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        o._id.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        (o.phone ?? "").includes(q);

      const orderDate = new Date(o.createdAt);
      let matchDate = true;
      if (filterDate === "today") {
        matchDate = orderDate.toDateString() === now.toDateString();
      } else if (filterDate === "week") {
        const day = now.getDay() || 7;
        const mon = new Date(now);
        mon.setHours(0, 0, 0, 0);
        mon.setDate(now.getDate() - day + 1);
        matchDate = orderDate >= mon;
      } else if (filterDate === "month") {
        matchDate = orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
      } else if (filterDate === "year") {
        matchDate = orderDate.getFullYear() === now.getFullYear();
      }
      let matchPayment = true;
      if (filterPayment !== "all") {
        if (filterPayment === "STRIPE") {
          matchPayment = o.paymentMethod === "Stripe" || o.paymentMethod === "STRIPE";
        } else {
          matchPayment = o.paymentMethod === filterPayment;
        }
      }

      return matchStatus && matchSearch && matchDate && matchPayment;
    });
  }, [orders, filterStatus, searchTerm, filterDate, filterPayment]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // ── Count per status ───────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = { all: filtered.length };
    Object.keys(STATUS_CONFIG).forEach(k => { c[k] = 0; });
    filtered.forEach(o => { if (c[o.status] !== undefined) c[o.status]++; });
    return c;
  }, [filtered]);

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs = [
    { value: "all", label: "Tất cả" },
    ...Object.entries(STATUS_CONFIG).map(([v, cfg]) => ({ value: v, label: cfg.label })),
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterDate("all");
    setFilterPayment("all");
    setCurrentPage(1);
  };
  const hasFilter = searchTerm || filterStatus !== "all" || filterDate !== "all" || filterPayment !== "all";

  return (
    <div className="space-y-5">
      {/* ── PAGE HEADER ── */}
      <PageHeader
        title="Quản lý Đơn hàng"
        subtitle={`${filtered.length} đơn hàng`}
      />

      {/* ── STATUS TABS ── */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilterStatus(tab.value); setCurrentPage(1); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all border ${filterStatus === tab.value
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center ${filterStatus === tab.value ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
              }`}>
              {counts[tab.value] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* ── TOOLBAR: Tìm kiếm + Lọc ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 space-y-3">
        {/* Row 1: Search + Add */}
        <div className="flex gap-3 flex-col sm:flex-row items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, SĐT khách hàng..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          {hasFilter && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-gray-500 hover:text-primary px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
            >
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap gap-2.5">
          {/* Payment filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterPayment}
              onChange={e => { setFilterPayment(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterPayment !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả thanh toán</option>
              <option value="COD">💵 Tiền mặt (COD)</option>
              <option value="VNPay">📱 VNPay</option>
              <option value="STRIPE">💳 Stripe</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Date filter */}
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterDate !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Rows per page */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Hiển thị:</span>
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-primary cursor-pointer appearance-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm font-medium">Đang tải đơn hàng...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-100">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Mã đơn</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Khách hàng</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Thời gian</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Tổng tiền</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">PT Thanh toán</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Trạng thái</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map(order => {
                    const d = new Date(order.createdAt);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/70 transition-colors group">
                        {/* Mã đơn */}
                        <td className="px-5 py-4">
                          <code className="font-mono text-xs font-bold text-gray-700 bg-gray-100 rounded-lg px-2 py-1">
                            #{order._id.slice(-8).toUpperCase()}
                          </code>
                        </td>

                        {/* Khách hàng */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-sm font-black text-primary">
                              {order.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{order.name}</p>
                              <p className="text-[11px] text-gray-400 font-medium font-mono">{order.phone || "—"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Thời gian */}
                        <td className="px-5 py-4">
                          <p className="text-[13px] font-bold text-gray-700">
                            {d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {d.toLocaleDateString("vi-VN")}
                          </p>
                        </td>

                        {/* Tổng tiền */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-emerald-600">
                            {(order.total ?? 0).toLocaleString("vi-VN")}₫
                          </p>
                          {order.shippingFee > 0 && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Ship: {order.shippingFee.toLocaleString("vi-VN")}₫
                            </p>
                          )}
                        </td>

                        {/* PT thanh toán */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold border ${order.paymentMethod === "STRIPE" || order.paymentMethod === "Stripe"
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : order.paymentMethod === "VNPay"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}>
                            {order.paymentMethod === "STRIPE" || order.paymentMethod === "Stripe" ? (
                              <div className="flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 object-contain" /></div>
                            ) : order.paymentMethod === "VNPay" ? (
                              <div className="flex items-center gap-2"><img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png" alt="VNPay" className="h-4 object-contain" /></div>
                            ) : "💵 COD"}
                          </span>
                        </td>

                        {/* Trạng thái */}
                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>

                        {/* Hành động */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Select đổi trạng thái */}
                            <select
                              value={order.status}
                              onChange={e => handleUpdateOrder(order._id, Number(e.target.value))}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
                            >
                              {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                <option key={val} value={val}>{cfg.label}</option>
                              ))}
                            </select>

                            {/* Xem chi tiết */}
                            <button
                              onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-primary hover:bg-orange-50 transition-all border border-gray-200 hover:border-primary"
                              title="Xem chi tiết"
                            >
                              <FaEye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <FaFilter size={28} className="text-gray-200" />
                          <p className="text-sm font-medium">
                            {hasFilter ? `Không tìm thấy đơn hàng nào phù hợp` : "Chưa có đơn hàng nào"}
                          </p>
                          {hasFilter ? (
                            <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                              Xóa bộ lọc
                            </button>
                          ) : (
                            <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                total={filtered.length}
                rowsPerPage={rowsPerPage}
                onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
                onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                unit="đơn"
              />
            )}
          </>
        )}
      </div>

      {/* ── MODAL CHI TIẾT ── */}
      {showModal && selectedOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
              <div>
                <h3 className="text-base font-bold text-gray-900">Chi tiết đơn hàng</h3>
                <p className="text-xs text-gray-500 mt-0.5 font-mono font-semibold text-primary">
                  #{selectedOrder._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedOrder.status} />
                <button
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <FaTimesCircle size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thông tin khách hàng</h4>
                  <p className="font-bold text-gray-800 text-sm">{selectedOrder.name}</p>
                  <p className="text-sm text-gray-600 font-mono">{selectedOrder.phone ?? "—"}</p>
                  <p className="text-xs text-gray-400">{selectedOrder.email}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Giao hàng & Thanh toán</h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    <span className="font-semibold text-gray-500">Địa chỉ: </span>{selectedOrder.address}
                  </p>
                  <div className="text-xs text-gray-700 flex items-center gap-1">
                    <span className="font-semibold text-gray-500">Phương thức: </span>
                    <span className="font-bold text-primary flex items-center gap-2">
                      {selectedOrder.paymentMethod === "Stripe" || selectedOrder.paymentMethod === "STRIPE" ? (
                        <><img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5 object-contain" /> Stripe</>
                      ) : selectedOrder.paymentMethod === "VNPay" ? (
                        <><img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png" alt="VNPay" className="h-5 object-contain" /> VNPay</>
                      ) : "Tiền mặt (COD)"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3">
                  Danh sách sản phẩm ({selectedOrder.products?.length ?? 0} loại)
                </h4>
                <div className="space-y-2.5">
                  {selectedOrder.products?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white border border-gray-100 rounded-xl p-3.5 hover:shadow-sm transition-shadow">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                        <img
                          src={item.img || "https://placehold.co/56x56?text=Book"}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          SL: <span className="font-bold text-gray-600">{item.quantity}</span>
                          {item.isFlashSale && (
                            <span className="ml-2 bg-red-100 text-red-600 text-[10px] font-bold rounded px-1.5 py-0.5">⚡ Flash Sale</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-emerald-600">
                          {((item.price ?? 0) * item.quantity).toLocaleString("vi-VN")}₫
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {(item.price ?? 0).toLocaleString("vi-VN")}₫ / cuốn
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng kết */}
              <div className="bg-orange-50/60 rounded-xl p-4 border border-orange-100">
                <div className="flex justify-between items-center text-sm mb-1.5">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span className="font-medium">{(selectedOrder.shippingFee ?? 0).toLocaleString("vi-VN")}₫</span>
                </div>
                <div className="flex justify-between items-center border-t border-orange-200/50 pt-2 mt-1">
                  <span className="font-bold text-gray-800">Tổng thanh toán</span>
                  <span className="text-xl font-black text-primary">
                    {(selectedOrder.total ?? 0).toLocaleString("vi-VN")}₫
                  </span>
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
