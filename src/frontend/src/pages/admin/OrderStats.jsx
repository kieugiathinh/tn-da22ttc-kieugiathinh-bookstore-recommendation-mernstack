import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import StatsPageHeader from "../../components/admin/StatsPageHeader";
import StatCard from "../../components/admin/StatCard";
import ChartCard from "../../components/admin/ChartCard";
import EmptyState from "../../components/admin/EmptyState";
import { userRequest } from "../../requestMethods";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  FaShoppingBag, FaTimesCircle, FaClock,
  FaMoneyBillWave, FaChartLine, FaCheckDouble, FaCreditCard
} from "react-icons/fa";

const STATUS_LABELS = {
  0: "Chờ xác nhận", 1: "Đã xác nhận", 2: "Đang chuẩn bị",
  3: "Đang giao", 4: "Đã giao", 5: "Đã hủy",
};
const STATUS_COLORS_MAP = {
  0: "#f59e0b", 1: "#3b82f6", 2: "#8b5cf6",
  3: "#6366f1", 4: "#10b981", 5: "#ef4444",
};

const OrderStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  const fetchData = async (type) => {
    try {
      setLoading(true);
      const res = await userRequest.get(`/stats/order-analytics?type=${type}`);
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(timeRange); }, [timeRange]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;

  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(v);

  const paymentBarData = (data?.paymentDistribution ?? []).map((p, idx) => ({
    name: p._id,
    count: p.count,
    revenue: p.revenue,
    color: ["#f97316", "#8b5cf6", "#06b6d4"][idx % 3],
  }));

  return (
    <div className="space-y-6">
      <StatsPageHeader 
        title="Thống kê Đơn hàng" 
        subtitle="Phân tích hiệu suất bán hàng và xu hướng đơn hàng"
        timeFilter={timeRange}
        onTimeFilterChange={setTimeRange}
      />

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Doanh Thu Thực Tế"
          value={`${formatCurrency(data?.revenue ?? 0)} ₫`}
          trend={data?.changes?.revenue}
          icon={FaMoneyBillWave}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-50"
          subtitle={`${data?.deliveredOrders ?? 0} đơn đã giao thành công`}
        />
        <StatCard
          title="Tổng Đơn Hàng"
          value={(data?.totalOrders ?? 0).toLocaleString()}
          trend={data?.changes?.totalOrders}
          icon={FaShoppingBag}
          colorClass="text-blue-500"
          bgClass="bg-blue-50"
          subtitle="Tất cả trạng thái"
        />
        <StatCard
          title="Giá Trị Trung Bình"
          value={`${formatCurrency(data?.avgOrderValue ?? 0)} ₫`}
          trend={data?.changes?.avgOrderValue}
          icon={FaChartLine}
          colorClass="text-violet-500"
          bgClass="bg-violet-50"
          subtitle="Trên mỗi đơn thành công"
        />
        <StatCard
          title="Tỷ Lệ Hủy Đơn"
          value={data?.cancelRate ?? 0}
          trend={data?.changes?.cancelRate}
          suffix="%"
          icon={FaTimesCircle}
          colorClass="text-rose-500"
          bgClass="bg-rose-50"
          subtitle={`${data?.canceledOrders ?? 0} đơn bị hủy`}
        />
      </div>

      {/* ── DOANH THU & SỐ ĐƠN (2 BIỂU ĐỒ RIÊNG) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Doanh thu theo thời gian" icon={FaChartLine} subtitle="Đơn đã giao thành công">
          {data?.revenueOverTime && data.revenueOverTime.length > 0 ? (
            <div className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${formatCurrency(value)} ₫`, "Doanh thu"]} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={FaChartLine} />
          )}
        </ChartCard>

        <ChartCard title="Số đơn hàng theo thời gian" icon={FaShoppingBag} subtitle="Tất cả trạng thái">
          {data?.revenueOverTime && data.revenueOverTime.length > 0 ? (
            <div className="h-[280px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.revenueOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="orders" name="Số đơn" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={FaShoppingBag} />
          )}
        </ChartCard>
      </div>

      {/* ── TRẠNG THÁI VÀ THANH TOÁN ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Trạng thái đơn hàng" icon={FaCheckDouble} subtitle="Tỷ lệ trạng thái trong kỳ">
           {data ? (
            <div className="h-[250px] mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Đã giao", value: data.deliveredOrders, color: "#10b981" },
                      { name: "Đang xử lý", value: data.processingOrders, color: "#3b82f6" },
                      { name: "Đã hủy", value: data.canceledOrders, color: "#ef4444" }
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none"
                  >
                    {[
                      { color: "#10b981" }, { color: "#3b82f6" }, { color: "#ef4444" }
                    ].map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => [`${v} đơn`, "Số lượng"]} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
           ) : <EmptyState icon={FaCheckDouble} />}
        </ChartCard>

        <ChartCard title="Phương thức thanh toán" icon={FaCreditCard} subtitle="Theo số lượng đơn">
          {paymentBarData.length > 0 ? (
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentBarData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [name === 'revenue' ? `${formatCurrency(value)} ₫` : value, name === 'revenue' ? 'Doanh thu' : 'Số đơn']} />
                  <Bar dataKey="count" name="Số đơn" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={FaCreditCard} />
          )}
        </ChartCard>
      </div>

    </div>
  );
};

export default OrderStats;
