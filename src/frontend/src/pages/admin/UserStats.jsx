import React, { useState, useEffect } from "react";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import StatsPageHeader from "../../components/admin/StatsPageHeader";
import StatCard from "../../components/admin/StatCard";
import ChartCard from "../../components/admin/ChartCard";
import DataTableCard from "../../components/admin/DataTableCard";
import EmptyState from "../../components/admin/EmptyState";
import { userRequest } from "../../requestMethods";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  FaUsers, FaUserPlus, FaUserSlash, FaRedo,
  FaCrown, FaChartBar, FaUserClock
} from "react-icons/fa";

const DONUT_COLORS = ["#f97316", "#94a3b8"];

const UserStats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const [neverBoughtFilter, setNeverBoughtFilter] = useState("all");

  const fetchData = async (type) => {
    try {
      setLoading(true);
      const res = await userRequest.get(`/stats/user-analytics?type=${type}`);
      setData(res.data);
    } catch (err) {
      console.error("Lỗi tải thống kê khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(timeRange); }, [timeRange]);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;

  const donutData = [
    { name: "Đã mua hàng", value: data?.totalBuyers ?? 0 },
    { name: "Chưa mua hàng", value: data?.neverBought ?? 0 },
  ];

  let filteredNeverBought = data?.neverBoughtList || [];
  if (neverBoughtFilter === ">30") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filteredNeverBought = filteredNeverBought.filter(u => new Date(u.createdAt) < thirtyDaysAgo);
  } else if (neverBoughtFilter === ">7") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filteredNeverBought = filteredNeverBought.filter(u => new Date(u.createdAt) < sevenDaysAgo);
  }

  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(v);

  return (
    <div className="space-y-6">
      <StatsPageHeader
        title="Thống kê Khách hàng"
        subtitle="Phân tích hành vi và giá trị khách hàng"
        timeFilter={timeRange}
        onTimeFilterChange={setTimeRange}
      />

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Tổng Khách Hàng"
          value={data?.totalUsers?.toLocaleString() ?? 0}
          trend={data?.changes?.totalUsers}
          icon={FaUsers}
          colorClass="text-blue-500"
          bgClass="bg-blue-50"
          subtitle="Tích lũy đến hiện tại"
        />
        <StatCard
          title="Khách Hàng Mới"
          value={data?.newUsers ?? 0}
          trend={data?.changes?.newUsers}
          icon={FaUserPlus}
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
          subtitle="Đăng ký trong kỳ"
        />
        <StatCard
          title="Chưa Mua Hàng"
          value={data?.neverBought ?? 0}
          trend={data?.changes?.neverBought}
          icon={FaUserSlash}
          colorClass="text-rose-500"
          bgClass="bg-rose-50"
          subtitle={`${data?.totalUsers ? Math.round((data.neverBought / data.totalUsers) * 100) : 0}% tổng khách`}
        />
        <StatCard
          title="Tỷ Lệ Quay Lại"
          value={data?.returnRate ?? 0}
          trend={data?.changes?.returnRate}
          suffix="%"
          icon={FaRedo}
          colorClass="text-emerald-500"
          bgClass="bg-emerald-50"
          subtitle={`${data?.repeatCount ?? 0} khách mua ≥ 2 lần`}
        />
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard
          className="xl:col-span-2"
          title="Phân tích lượng khách mua sắm"
          icon={FaChartBar}
          subtitle="Khách mua mới vs quay lại trong kỳ"
          rightContent={
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-orange-500"></span><span className="text-xs font-bold text-gray-500">Khách mua mới</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500"></span><span className="text-xs font-bold text-gray-500">Khách quay lại</span></div>
            </div>
          }
        >
          {data?.timeChartData && data.timeChartData.length > 0 ? (
            <div className="h-[280px] min-h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={280} minWidth={100}>
                <AreaChart data={data.timeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="newBuyers" name="Khách mua mới" stackId="1" stroke="#f97316" strokeWidth={2} fill="url(#colorNew)" />
                  <Area type="monotone" dataKey="returning" name="Khách quay lại" stackId="1" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState icon={FaChartBar} />}
        </ChartCard>

        <ChartCard title="Phân bố khách hàng" icon={FaUsers} subtitle="Lũy kế toàn hệ thống">
          <div className="flex flex-col items-center justify-center mt-4 h-[280px]">
            <div className="h-[200px] w-full min-h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%" minHeight={200} minWidth={100}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-orange-600">
                  {data?.totalUsers ? Math.round((data.totalBuyers / data.totalUsers) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-xs font-bold text-gray-600">Đã mua ({data?.totalBuyers ?? 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span className="text-xs font-bold text-gray-600">Chưa mua ({data?.neverBought ?? 0})</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── TABLES ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DataTableCard
          title={`Top ${data?.topCustomers?.length ?? 0} Khách hàng VIP`}
          icon={FaCrown}
          headers={[{ label: "#" }, { label: "Khách hàng" }, { label: "Tổng chi tiêu", className: "text-right" }, { label: "Số đơn", className: "text-center" }]}
        >
          {data?.topCustomers?.length > 0 ? (
            data.topCustomers.map((c, i) => (
              <tr key={i} className="hover:bg-amber-50/50 transition-colors">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center font-black shadow-sm ${i < 3 ? "w-8 h-8 rounded-full text-sm" : "w-7 h-7 rounded-lg text-xs"
                    } ${i === 0 ? "bg-amber-100 text-amber-600" : i === 1 ? "bg-gray-200 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-gray-50 text-gray-400"
                    }`}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </span>
                </td>
                <td className="px-4 py-3 font-bold text-gray-800">{c.name || "Khách hàng"}</td>
                <td className="px-4 py-3 text-right font-bold text-orange-600">{formatCurrency(c.totalSpent)} ₫</td>
                <td className="px-4 py-3 text-center text-gray-600 font-bold">{c.orderCount}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="4"><EmptyState message="Chưa có khách hàng VIP" /></td></tr>
          )}
        </DataTableCard>

        <DataTableCard
          title="Khách hàng chưa mua"
          icon={FaUserClock}
          rightContent={
            <select
              className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500"
              value={neverBoughtFilter}
              onChange={(e) => setNeverBoughtFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value=">7">Đăng ký {'>'} 7 ngày</option>
              <option value=">30">Đăng ký {'>'} 30 ngày</option>
            </select>
          }
          headers={[{ label: "Khách hàng" }, { label: "Email" }, { label: "Ngày ĐK", className: "text-right" }]}
        >
          {filteredNeverBought.length > 0 ? (
            filteredNeverBought.map((u, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-bold text-gray-800">{u.fullname || "N/A"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="3"><EmptyState message="Không có khách hàng phù hợp" /></td></tr>
          )}
        </DataTableCard>
      </div>
    </div>
  );
};

export default UserStats;
