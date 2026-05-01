import { useState, useEffect } from "react";
import { FaClock, FaShippingFast, FaCheckDouble, FaTimesCircle, FaCheckCircle } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";

const ROWS_PER_PAGE = 10;

const STATUS_CONFIG = {
  0: { label: "Chờ xác nhận", icon: FaClock, variant: "warning" },
  1: { label: "Đang vận chuyển", icon: FaShippingFast, variant: "info" },
  2: { label: "Đã giao hàng", icon: FaCheckDouble, variant: "success" },
  3: { label: "Đã hủy", icon: FaTimesCircle, variant: "danger" },
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

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/orders");
      setOrders(res.data.map((o) => ({ ...o, id: o._id })));
    } catch {
      Swal.fire("Lỗi", "Không thể tải dữ liệu đơn hàng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdateOrder = async (id, currentStatus) => {
    if (currentStatus >= 2) return;
    const newStatus = currentStatus + 1;
    const titles = { 0: "Xác nhận xử lý đơn hàng?", 1: "Đánh dấu đã giao hàng?" };
    const { isConfirmed } = await Swal.fire({
      title: titles[currentStatus], icon: "question",
      showCancelButton: true, confirmButtonColor: "#7c3aed",
      confirmButtonText: "Đồng ý", cancelButtonText: "Hủy",
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

  const filtered = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === Number(filterStatus));

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData = filtered.slice(startIdx, startIdx + ROWS_PER_PAGE);

  // Đếm theo trạng thái cho tabs
  const counts = { all: orders.length, 0: 0, 1: 0, 2: 0, 3: 0 };
  orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });

  const tabs = [
    { value: "all", label: "Tất cả" },
    { value: "0", label: "Chờ xác nhận" },
    { value: "1", label: "Đang giao" },
    { value: "2", label: "Đã giao" },
    { value: "3", label: "Đã hủy" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Đơn hàng"
        subtitle={`${orders.length} đơn hàng trong hệ thống`}
      />

      {/* Status Tabs */}
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

      {/* Bảng đơn hàng */}
      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3.5">Mã đơn hàng</th>
                    <th className="px-5 py-3.5">Khách hàng</th>
                    <th className="px-5 py-3.5">Tổng tiền</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs font-mono text-gray-600">
                          #{order._id.slice(-8).toUpperCase()}
                        </code>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-800">{order.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{order.email}</p>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-emerald-600">
                        {(order.total || 0).toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {order.status < 2 ? (
                          <Button size="sm" onClick={() => handleUpdateOrder(order._id, order.status)}
                            icon={<FaCheckCircle size={11} />}>
                            {order.status === 0 ? "Xử lý đơn" : "Đã giao"}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">Hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pageData.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">
                      Không có đơn hàng nào
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages}
              total={filtered.length} rowsPerPage={ROWS_PER_PAGE}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="đơn hàng" />
          </>
        )}
      </Card>
    </div>
  );
};

export default Orders;
