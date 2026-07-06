import LoadingSpinner from "../../components/admin/LoadingSpinner";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import { toast } from "react-toastify";
import {
  FaBoxOpen,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaCoins,
  FaCube,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaRedoAlt,
  FaShoppingBag,
  FaShoppingCart,
  FaSync,
  FaTimesCircle,
  FaTruck,
  FaUserAstronaut,
  FaUsers,
  FaChevronDown,
  FaCalendarAlt,
  FaFilter,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
  FaChartPie,
  FaChartArea,
  FaFire,
  FaSearchDollar,
  FaRegFrown,
  FaBook,
  FaStar,
  FaStore,
  FaLightbulb,
  FaLayerGroup,
  FaEye,
  FaMousePointer,
  FaCrown,
  FaExclamationCircle,
  FaUserFriends,
  FaClipboardList
} from "react-icons/fa";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  ComposedChart
} from "recharts";
import { format, subDays, startOfDay, endOfDay, parseISO, subYears, formatDistanceToNow, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";

// ==========================================
// --- From dashboardUtils.js ---
// ==========================================
const TIME_FILTERS = [
  { label: "Hôm nay", value: "day", compareLabel: "so với hôm qua" },
  { label: "Tuần này", value: "week", compareLabel: "so với tuần trước" },
  { label: "7 ngày qua", value: "last7", compareLabel: "so với 7 ngày trước" },
  { label: "30 ngày qua", value: "last30", compareLabel: "so với 30 ngày trước" },
  { label: "Tháng này", value: "month", compareLabel: "so với tháng trước" },
  { label: "Tháng trước", value: "prev_month", compareLabel: "so với tháng trước đó" },
  { label: "Quý này", value: "quarter", compareLabel: "so với quý trước" },
  { label: "Năm nay", value: "year", compareLabel: "so với năm trước" },
  { label: "Tất cả", value: "all", compareLabel: "toàn bộ dữ liệu" },
  { label: "Tùy chỉnh", value: "custom", compareLabel: "so với kỳ trước" },
];

const COMPARE_OPTIONS = [
  { label: "Không so sánh", value: "none" },
  { label: "So với kỳ trước", value: "previous" },
  { label: "Cùng kỳ năm trước", value: "same_period_last_year" },
  { label: "Khoảng ngày tùy chỉnh", value: "custom_compare" },
  { label: "So sánh 2 năm", value: "year" },
];

const CATEGORY_TAB_OPTIONS = [
  { key: "revenue", label: "Doanh thu" },
  { key: "sold", label: "Số bán" },
  { key: "orders", label: "Số đơn" },
];

const CATEGORY_COLORS = [
  "#f97316",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#64748b",
];

const STATUS_CONFIG = {
  0: {
    label: "Chờ xác nhận",
    color: "#f59e0b",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
  },
  1: {
    label: "Đã xác nhận",
    color: "#3b82f6",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
  },
  2: {
    label: "Đang chuẩn bị",
    color: "#8b5cf6",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
  },
  3: {
    label: "Đang giao",
    color: "#6366f1",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
  4: {
    label: "Đã giao",
    color: "#10b981",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  5: {
    label: "Đã hủy",
    color: "#ef4444",
    badge: "bg-red-50 text-red-700 border-red-100",
  },
};

const getTodayInputValue = () => new Date().toISOString().split("T")[0];

const getDefaultFromDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
};

const safeNumber = (value) => Number(value || 0);

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(Number(value || 0)));

const formatCompactCurrency = (value) => {
  const num = Number(value || 0);

  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}tỷ`;
  }

  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}tr`;
  }

  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(0)}k`;
  }

  return `${num}`;
};

const getPeriodLabel = (timeRange) =>
  TIME_FILTERS.find((item) => item.value === timeRange)?.label || "Tháng này";

const getCompareLabel = (timeRange, compareMode) => {
  if (compareMode === "none") return "";

  if (compareMode === "same_period_last_year") {
    return "so với cùng kỳ năm trước";
  }

  if (compareMode === "custom_compare") {
    return "so với khoảng ngày tùy chỉnh";
  }

  if (compareMode === "year") {
    return "so sánh 2 năm";
  }

  return (
    TIME_FILTERS.find((item) => item.value === timeRange)?.compareLabel ||
    "so với kỳ trước"
  );
};


const getChangeConfig = (value, isReverseGood = false) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return {
      icon: null,
      text: "",
      className: "",
    };
  }

  const number = Number(value);

  if (number === 0) {
    return {
      icon: FaMinus,
      text: "0%",
      className: "bg-gray-50 text-gray-500 border-gray-100",
    };
  }

  const isPositive = number > 0;
  const isGood = isReverseGood ? !isPositive : isPositive;

  return {
    icon: isPositive ? FaArrowUp : FaArrowDown,
    text: `${isPositive ? "+" : "-"}${Math.abs(number).toFixed(1)}%`,
    className: isGood
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-rose-50 text-rose-600 border-rose-100",
  };
};

// ==========================================
// --- From DashboardUI.jsx ---
// ==========================================
const SelectField = ({ label, value, onChange, children }) => (
  <label className="flex min-w-[150px] flex-col gap-1">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-all duration-200 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
    >
      {children}
    </select>
  </label>
);

const DateField = ({ label, value, onChange }) => (
  <label className="flex min-w-[145px] flex-col gap-1">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {label}
    </span>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-2xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-all duration-200 focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
    />
  </label>
);

const Badge = ({ children, color = "gray" }) => {
  const map = {
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${map[color] || map.gray
        }`}
    >
      {children}
    </span>
  );
};

const InsightBox = ({ children, tone = "orange" }) => {
  const map = {
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <div
      className={`mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs font-medium leading-relaxed ${map[tone] || map.orange
        }`}
    >
      <FaLightbulb className="mt-0.5 flex-shrink-0" />
      <p>{children}</p>
    </div>
  );
};

const ChartEmpty = ({ message = "Chưa có dữ liệu trong kỳ lọc này" }) => (
  <div className="flex h-full min-h-[200px] items-center justify-center rounded-2xl bg-gray-50 text-sm font-medium text-gray-400">
    {message}
  </div>
);

const SectionCard = ({ title, subtitle, icon: Icon, badge, children }) => (
  <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4">
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
          {Icon && <Icon className="text-orange-500" />}
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs font-medium leading-relaxed text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {badge}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

// ==========================================
// --- From DashboardHeader.jsx ---
// ==========================================
const DashboardHeader = ({
  timeRange,
  setTimeRange,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  compareMode,
  setCompareMode,
  compareFrom,
  setCompareFrom,
  compareTo,
  setCompareTo,
  year1,
  setYear1,
  year2,
  setYear2,
  yearOptions,
  refreshing,
  fetchDashboardData,
}) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-3 py-1 text-xs font-medium text-orange-600 shadow-sm">
            <FaStore />
            BookBee Business Dashboard
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Tổng quan kinh doanh
          </h1>

          <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-gray-500">
            Theo dõi doanh thu, đơn hàng, danh mục, sản phẩm và các cảnh báo vận hành quan trọng.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white bg-white/90 px-4 text-sm font-medium text-gray-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:scale-95"
        >
          <FaSync
            className={refreshing ? "animate-spin text-orange-500" : "text-gray-400"}
          />
          Làm mới
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <FaFilter className="text-orange-500" />
          Bộ lọc báo cáo
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Khoảng thời gian"
            value={timeRange}
            onChange={setTimeRange}
          >
            {TIME_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="So sánh"
            value={compareMode}
            onChange={setCompareMode}
          >
            {COMPARE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </SelectField>

          {timeRange === "custom" && (
            <>
              <DateField label="Từ ngày" value={fromDate} onChange={setFromDate} />
              <DateField label="Đến ngày" value={toDate} onChange={setToDate} />
            </>
          )}

          {compareMode === "custom_compare" && (
            <>
              <DateField
                label="So sánh từ"
                value={compareFrom}
                onChange={setCompareFrom}
              />
              <DateField
                label="So sánh đến"
                value={compareTo}
                onChange={setCompareTo}
              />
            </>
          )}

          {compareMode === "year" && (
            <>
              <SelectField label="Năm hiện tại" value={year1} onChange={setYear1}>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                ))}
              </SelectField>

              <SelectField label="Năm so sánh" value={year2} onChange={setYear2}>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                ))}
              </SelectField>
            </>
          )}
        </div>
      </div>
    </div>
  );
};



// ==========================================
// --- From KPICards.jsx ---
// ==========================================
const MetricCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  accent = "orange",
  change,
  compareLabel,
  isReverseGood = false,
}) => {
  const changeCfg = getChangeConfig(change, isReverseGood);
  const ChangeIcon = changeCfg.icon;

  const accentMap = {
    orange: {
      border: "border-orange-100",
      icon: "bg-orange-50 text-orange-600",
      gradient: "from-orange-50 via-white to-amber-50",
      glow: "bg-orange-200",
    },
    blue: {
      border: "border-blue-100",
      icon: "bg-blue-50 text-blue-600",
      gradient: "from-blue-50 via-white to-cyan-50",
      glow: "bg-blue-200",
    },
    violet: {
      border: "border-violet-100",
      icon: "bg-violet-50 text-violet-600",
      gradient: "from-violet-50 via-white to-purple-50",
      glow: "bg-violet-200",
    },
    emerald: {
      border: "border-emerald-100",
      icon: "bg-emerald-50 text-emerald-600",
      gradient: "from-emerald-50 via-white to-teal-50",
      glow: "bg-emerald-200",
    },
    rose: {
      border: "border-rose-100",
      icon: "bg-rose-50 text-rose-600",
      gradient: "from-rose-50 via-white to-pink-50",
      glow: "bg-rose-200",
    },
  };

  const style = accentMap[accent] || accentMap.orange;

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border ${style.border} bg-gradient-to-br ${style.gradient} p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div
        className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${style.glow} opacity-30 blur-3xl transition-transform duration-500 group-hover:scale-125`}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {title}
          </p>

          <div className="mt-2 flex flex-wrap items-end gap-2">
            <h3 className="text-[24px] font-bold tracking-tight text-gray-900">
              {value}
            </h3>

            {ChangeIcon && (
              <span
                className={`mb-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${changeCfg.className}`}
                title={compareLabel}
              >
                <ChangeIcon size={10} />
                {changeCfg.text}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">
              {subtitle}
            </p>
          )}

          {compareLabel && change !== undefined && (
            <p className="mt-1 text-[11px] font-medium text-gray-400">
              {compareLabel}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${style.icon} shadow-sm transition-transform duration-300 group-hover:scale-105`}
        >
          <Icon className="text-base" />
        </div>
      </div>
    </div>
  );
};

const KPICards = ({ kpi, timeRange, periodLabel, compareLabel, cancelRate }) => {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Doanh thu"
        value={`${formatCurrency(kpi?.revenue || 0)} ₫`}
        icon={FaMoneyBillWave}
        accent="orange"
        change={kpi?.changes?.revenue}
        compareLabel={compareLabel}
        subtitle={`${formatCurrency(kpi?.orders || 0)} đơn đã giao trong ${periodLabel.toLowerCase()}`}
      />

      <MetricCard
        title="Đơn thành công"
        value={formatCurrency(kpi?.orders || 0)}
        icon={FaShoppingBag}
        accent="blue"
        change={kpi?.changes?.orders ?? kpi?.changes?.totalOrders}
        compareLabel={compareLabel}
        subtitle={`${formatCurrency(kpi?.totalOrders || 0)} tổng đơn trong kỳ`}
      />

      <MetricCard
        title="Giá trị trung bình"
        value={`${formatCurrency(kpi?.avgOrder || 0)} ₫`}
        icon={FaCrown}
        accent="violet"
        change={kpi?.changes?.avgOrder ?? kpi?.changes?.avgOrderValue}
        compareLabel={compareLabel}
        subtitle="AOV: doanh thu bình quân mỗi đơn thành công"
      />

      <MetricCard
        title="Tỷ lệ hủy đơn"
        value={`${cancelRate}%`}
        icon={FaTimesCircle}
        accent="rose"
        change={kpi?.changes?.cancelRate}
        compareLabel={compareLabel}
        isReverseGood
        subtitle={`${formatCurrency(kpi?.canceled || 0)} đơn bị hủy trong kỳ`}
      />
    </div>
  );
};



// ==========================================
// --- From RevenueChart.jsx ---
// ==========================================
const DashboardTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>

      <div className="space-y-1.5 text-xs font-medium">
        <div className="flex items-center justify-between gap-8">
          <span className="text-gray-500">Doanh thu</span>
          <span className="font-semibold text-orange-600">
            {formatCurrency(row.rawRevenue || 0)} ₫
          </span>
        </div>

        <div className="flex items-center justify-between gap-8">
          <span className="text-gray-500">Đơn thành công</span>
          <span className="font-semibold text-blue-600">
            {formatCurrency(row.orders || 0)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-8">
          <span className="text-gray-500">AOV</span>
          <span className="font-semibold text-violet-600">
            {formatCurrency(row.aov || 0)} ₫
          </span>
        </div>
      </div>
    </div>
  );
};

const CompareTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>

      <div className="space-y-1.5 text-xs font-medium">
        {payload.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-center justify-between gap-8"
          >
            <span className="text-gray-500">{item.name}</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(Number(item.value || 0) * 1_000_000)} ₫
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RevenueChart = ({
  compareMode,
  periodLabel,
  compareLabel,
  compareChart,
  revenueChart,
  revenueInsight,
  compareInsight,
  year1,
  year2,
}) => {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <FaChartPie className="text-orange-500" />
            {compareMode === "none"
              ? "Doanh thu và số đơn theo thời gian"
              : "So sánh doanh thu theo kỳ"}
          </h3>

          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {compareMode === "none"
              ? "Doanh thu tăng do nhiều đơn hơn hay do giá trị đơn cao hơn?"
              : "Kỳ hiện tại đang tốt hơn hay kém hơn kỳ so sánh?"}
          </p>
        </div>

        <Badge color={compareMode === "none" ? "orange" : "blue"}>
          {compareMode === "none" ? periodLabel : compareLabel}
        </Badge>
      </div>

      <div className="h-[330px] w-full flex-1">
        {compareMode !== "none" ? (
          compareChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={compareChart}
                margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                  tickFormatter={(value) => `${value}tr`}
                />

                <RechartsTooltip content={<CompareTooltip />} />

                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    fontWeight: 500,
                    paddingTop: "10px",
                  }}
                />

                <Bar
                  dataKey="currentRevenue"
                  name={compareMode === "year" ? `Năm ${year1}` : "Kỳ hiện tại"}
                  fill="#f97316"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={34}
                />

                <Bar
                  dataKey="compareRevenue"
                  name={compareMode === "year" ? `Năm ${year2}` : "Kỳ so sánh"}
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty message="Chưa có dữ liệu so sánh" />
          )
        ) : revenueChart.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={revenueChart}
              margin={{ top: 10, right: 30, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="dashboardRevenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }}
              />

              <YAxis
                yAxisId="revenue"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                tickFormatter={(value) => `${value}tr`}
              />

              <YAxis
                yAxisId="orders"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                allowDecimals={false}
              />

              <RechartsTooltip content={<DashboardTooltip />} />

              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: "12px",
                  fontWeight: 500,
                  paddingTop: "10px",
                }}
              />

              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenueMillion"
                name="Doanh thu"
                stroke="#f97316"
                strokeWidth={2.8}
                fillOpacity={1}
                fill="url(#dashboardRevenueGradient)"
                activeDot={{ r: 5, strokeWidth: 0 }}
              />

              <Bar
                yAxisId="orders"
                dataKey="orders"
                name="Số đơn"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
                barSize={22}
                opacity={0.76}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty />
        )}
      </div>

      <InsightBox tone={compareMode === "none" ? "orange" : "blue"}>
        {compareMode === "none" ? revenueInsight : compareInsight}
      </InsightBox>
    </div>
  );
};



// ==========================================
// --- From CategoryPerformance.jsx ---
// ==========================================
const CategoryPerformance = ({
  categoryTab,
  setCategoryTab,
  topCategoryData,
  categoryInsight,
}) => {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-gray-900">
            <FaLayerGroup className="text-violet-500" />
            Hiệu suất danh mục
          </h3>

          <p className="mt-1 text-xs font-medium text-gray-400">
            Danh mục nào đang kéo doanh thu?
          </p>
        </div>

        <select
          value={categoryTab}
          onChange={(e) => setCategoryTab(e.target.value)}
          className="h-9 rounded-2xl border border-gray-200 bg-white px-2 text-xs font-medium text-gray-600 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
        >
          {CATEGORY_TAB_OPTIONS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="h-[270px] w-full flex-1">
        {topCategoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topCategoryData}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#f3f4f6"
              />

              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 500 }}
                tickFormatter={(value) =>
                  categoryTab === "revenue" ? formatCompactCurrency(value) : value
                }
              />

              <YAxis
                type="category"
                dataKey="name"
                width={115}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#374151", fontWeight: 500 }}
              />

              <RechartsTooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value) =>
                  categoryTab === "revenue"
                    ? [`${formatCurrency(value)} ₫`, "Doanh thu"]
                    : [
                      formatCurrency(value),
                      categoryTab === "sold" ? "Số bán" : "Số đơn",
                    ]
                }
              />

              <Bar dataKey={categoryTab} radius={[0, 10, 10, 0]} maxBarSize={24}>
                {topCategoryData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty />
        )}
      </div>

      <InsightBox tone="violet">{categoryInsight}</InsightBox>
    </div>
  );
};



// ==========================================
// --- From OrderOperations.jsx ---
// ==========================================
const StatusDonut = ({ data, total }) => {
  const chartData = data.filter((item) => item.value > 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[150px_1fr]">
      <div className="relative h-[150px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={46}
                outerRadius={66}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmpty />
        )}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{total}</span>
          <span className="text-[11px] font-medium text-gray-400">đơn</span>
        </div>
      </div>

      <div className="space-y-2">
        {data.map((status) => {
          const pct = total > 0 ? (status.value / total) * 100 : 0;

          return (
            <div key={status.status} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: status.color }}
              />

              <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-600">
                {status.name}
              </span>

              <span className="text-xs font-semibold text-gray-800">
                {status.value}
              </span>

              <span className="w-10 text-right text-[11px] font-medium text-gray-400">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const OrderOperations = ({ statusData, totalStatus, statusInsight }) => {
  return (
    <SectionCard
      title="Tình trạng đơn hàng"
      subtitle="Đơn hàng có đang bị nghẽn ở bước xử lý nào không?"
      icon={FaBoxOpen}
      badge={<Badge color="green">Vận hành</Badge>}
    >
      <div className="p-5 flex h-full flex-col justify-between">
        <StatusDonut data={statusData} total={totalStatus} />
        <InsightBox tone="green">{statusInsight}</InsightBox>
      </div>
    </SectionCard>
  );
};



// ==========================================
// --- From ProductInsights.jsx ---
// ==========================================
const ProductSignalRow = ({ product, type = "stock" }) => (
  <div className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 transition-all duration-200 hover:border-orange-100 hover:bg-orange-50/40">
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={product.img}
        onError={(e) => {
          e.target.src = "https://placehold.co/40x40?text=Book";
        }}
        className="h-10 w-10 rounded-xl border border-gray-100 object-cover"
        alt={product.title || "Book"}
      />

      <div className="min-w-0">
        <p className="line-clamp-1 text-xs font-medium text-gray-800">
          {product.title}
        </p>

        {type === "stock" ? (
          <p className="mt-1 text-[11px] font-medium text-red-500">
            Còn lại {product.countInStock || 0} cuốn
          </p>
        ) : (
          <p className="mt-1 flex items-center gap-3 text-[11px] font-medium text-gray-500">
            <span className="inline-flex items-center gap-1 text-blue-600">
              <FaEye size={10} />
              {product.viewCount || 0}
            </span>

            <span className="inline-flex items-center gap-1 text-orange-600">
              <FaMousePointer size={10} />
              {product.sold || 0}
            </span>
          </p>
        )}
      </div>
    </div>

    {type === "stock" ? (
      <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-medium text-red-600">
        Nhập hàng
      </span>
    ) : (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600">
        {product.conversionRate || 0}%
      </span>
    )}
  </div>
);

const ProductWarnings = ({ lowStockItems, viewLowItems }) => {
  return (
    <>
      <SectionCard
        title="Cảnh báo tồn kho"
        subtitle="Sách cần nhập thêm để tránh mất doanh thu"
        icon={FaExclamationCircle}
        badge={<Badge color="red">Cần xử lý</Badge>}
      >
        <div className="max-h-[330px] space-y-3 overflow-y-auto p-4">
          {lowStockItems.length > 0 ? (
            lowStockItems
              .slice(0, 5)
              .map((product, index) => (
                <ProductSignalRow
                  key={product._id || index}
                  product={product}
                  type="stock"
                />
              ))
          ) : (
            <div className="flex h-[210px] items-center justify-center text-sm font-medium text-emerald-600">
              Kho hàng đang ổn định
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="View cao, mua thấp"
        subtitle="Sản phẩm cần tối ưu chuyển đổi"
        icon={FaEye}
        badge={<Badge color="blue">Tối ưu</Badge>}
      >
        <div className="max-h-[330px] space-y-3 overflow-y-auto p-4">
          {viewLowItems.length > 0 ? (
            viewLowItems
              .slice(0, 5)
              .map((product, index) => (
                <ProductSignalRow
                  key={product._id || index}
                  product={product}
                  type="view"
                />
              ))
          ) : (
            <div className="flex h-[210px] items-center justify-center text-sm font-medium text-gray-400">
              Chưa có sản phẩm cần tối ưu
            </div>
          )}
        </div>
      </SectionCard>
    </>
  );
};

const TopSellingProducts = ({ topSelling }) => {
  return (
    <SectionCard
      title="Sản phẩm bán chạy"
      subtitle="Những đầu sách tạo doanh thu tốt trong kỳ lọc"
      icon={FaCrown}
      badge={<Badge color="orange">Top bán</Badge>}
    >
      <div className="overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3 text-right">Đã bán</th>
              <th className="px-4 py-3 text-right">Doanh thu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {topSelling.length > 0 ? (
              topSelling.slice(0, 6).map((product, index) => (
                <tr
                  key={product._id || index}
                  className="group transition-colors hover:bg-orange-50/50"
                >
                  <td className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[11px] font-medium ${index === 0
                          ? "bg-amber-100 text-amber-600"
                          : index === 1
                            ? "bg-gray-100 text-gray-600"
                            : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-50 text-gray-400"
                        }`}
                    >
                      {index + 1}
                    </span>
                    <img
                      src={product.img}
                      onError={(e) => {
                        e.target.src = "https://placehold.co/40x40?text=Book";
                      }}
                      className="h-10 w-10 flex-shrink-0 rounded-xl border border-gray-200 object-cover"
                      alt={product.title || "Book"}
                    />
                    <span
                      className="max-w-[260px] truncate font-medium text-gray-700 group-hover:text-orange-600"
                      title={product.title}
                    >
                      {product.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-base font-medium text-orange-600">
                    {formatCurrency(product.sold || 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(product.revenue || 0)} ₫
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">
                  Chưa có dữ liệu sản phẩm
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

// ==========================================
// --- From SourceAnalytics.jsx ---
// ==========================================
// Assume STATUS_CONFIG is imported or passed if needed.
// For simplicity we will import it from dashboardUtils.

const TopCustomers = ({ customers }) => {
  return (
    <SectionCard
      title="Khách hàng giá trị cao"
      subtitle="Khách hàng đóng góp doanh thu lớn trong kỳ lọc"
      icon={FaUserFriends}
      badge={<Badge color="blue">Top chi tiêu</Badge>}
    >
      <div className="max-h-[340px] space-y-2 overflow-y-auto p-4">
        {customers.length > 0 ? (
          customers.map((customer, index) => (
            <div
              key={customer._id || index}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/40"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-medium text-blue-600">
                  {customer.name ? customer.name.charAt(0).toUpperCase() : "K"}
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-medium text-gray-800">
                    {customer.name || "Khách vãng lai"}
                  </p>

                  <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                    {formatCurrency(customer.count || 0)} đơn hàng thành công
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
                {formatCurrency(customer.total || 0)} ₫
              </span>
            </div>
          ))
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm font-medium text-gray-400">
            Chưa có dữ liệu khách hàng
          </div>
        )}
      </div>
    </SectionCard>
  );
};

const LatestOrders = ({ latestOrders }) => {
  return (
    <SectionCard
      title="Đơn hàng gần đây"
      subtitle="Theo dõi đơn mới nhất trong kỳ lọc để xử lý kịp thời"
      icon={FaClipboardList}
      badge={<Badge color="orange">Theo kỳ lọc</Badge>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-medium uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Mã đơn</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3 text-right">Tổng tiền</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {latestOrders.length > 0 ? (
              latestOrders.map((order, index) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG[0];
                return (
                  <tr
                    key={order._id || index}
                    className="transition-colors hover:bg-orange-50/30"
                  >
                    <td className="px-6 py-3 font-mono text-xs font-medium text-gray-500">
                      #{order._id?.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {order.name || "Khách"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-orange-600">
                      {formatCurrency(order.total || 0)} ₫
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${status.badge}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}{" "}
                      {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm font-medium text-gray-400">
                  Chưa có đơn hàng trong kỳ lọc
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};



// Bố cục mới: Nhập các components con


const buildQueryString = ({ timeRange, fromDate, toDate }) => {
  const params = new URLSearchParams();
  params.set("type", timeRange);
  if (timeRange === "custom") {
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
  }
  return `?${params.toString()}`;
};

const buildCompareQueryString = ({
  timeRange,
  fromDate,
  toDate,
  compareMode,
  compareFrom,
  compareTo,
  year1,
  year2,
}) => {
  const params = new URLSearchParams();

  if (compareMode === "year") {
    params.set("year1", year1);
    params.set("year2", year2);
    return `?${params.toString()}`;
  }

  params.set("type", timeRange);
  params.set("compare", compareMode);

  if (timeRange === "custom") {
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
  }

  if (compareMode === "custom_compare") {
    if (compareFrom) params.set("compareFrom", compareFrom);
    if (compareTo) params.set("compareTo", compareTo);
  }

  return `?${params.toString()}`;
};

const normalizeRevenueChart = (data = []) =>
  data.map((item) => ({
    ...item,
    label: item.label || item.month || item.time || item._id || "N/A",
    revenueMillion: safeNumber(item.revenue) / 1_000_000,
    rawRevenue: safeNumber(item.revenue),
    orders: safeNumber(item.orders || item.orderCount || item.count),
    aov: safeNumber(item.aov || item.avgOrder),
  }));

const normalizeCategoryData = (data = []) =>
  data.map((item, index) => {
    const CATEGORY_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#06b6d4", "#64748b"];
    return {
      ...item,
      name: item.name || item._id || item.categoryName || "Khác",
      revenue: safeNumber(item.revenue || item.totalRevenue || item.value),
      sold: safeNumber(item.sold || item.totalSold || item.quantity),
      orders: safeNumber(item.orders || item.orderCount || item.count),
      color: item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    };
  });

const normalizeStatusData = (data = []) =>
  data.map((item) => {
    const STATUS_CONFIG = {
      0: { label: "Chờ xác nhận", color: "#f59e0b" },
      1: { label: "Đã xác nhận", color: "#3b82f6" },
      2: { label: "Đang chuẩn bị", color: "#8b5cf6" },
      3: { label: "Đang giao", color: "#6366f1" },
      4: { label: "Đã giao", color: "#10b981" },
      5: { label: "Đã hủy", color: "#ef4444" },
    };
    const status = item._id ?? item.status;
    const cfg = STATUS_CONFIG[status] || {};
    return {
      ...item,
      status,
      name: item.name || cfg.label || `Trạng thái ${status ?? "khác"}`,
      value: safeNumber(item.value || item.count || item.total),
      color: item.color || cfg.color || "#94a3b8",
    };
  });

const normalizeProductStats = (data = {}) => ({
  topSelling: Array.isArray(data.topSelling) ? data.topSelling : [],
  lowStock: Array.isArray(data.lowStock) ? data.lowStock : [],
  highViewLowPurchase: Array.isArray(data.highViewLowPurchase)
    ? data.highViewLowPurchase
    : Array.isArray(data.viewHighBuyLow)
      ? data.viewHighBuyLow
      : [],
  needSale: Array.isArray(data.needSale)
    ? data.needSale
    : Array.isArray(data.slowMoving)
      ? data.slowMoving
      : [],
});

const Dashboard = () => {
  const today = getTodayInputValue();

  // State cho bộ lọc
  const [timeRange, setTimeRange] = useState("month");
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(today);

  const [compareMode, setCompareMode] = useState("none");
  const [compareFrom, setCompareFrom] = useState(getDefaultFromDate());
  const [compareTo, setCompareTo] = useState(today);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const [year1, setYear1] = useState(currentYear);
  const [year2, setYear2] = useState(currentYear - 1);

  const [categoryTab, setCategoryTab] = useState("revenue");

  // State dữ liệu
  const [kpi, setKpi] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [compareChart, setCompareChart] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [prodStats, setProdStats] = useState({
    lowStock: [],
    topSelling: [],
    highViewLowPurchase: [],
    needSale: [],
  });
  const [customers, setCustomers] = useState([]);
  const [latestOrders, setLatestOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const periodLabel = getPeriodLabel(timeRange);
  const compareLabel = getCompareLabel(timeRange, compareMode);

  const queryString = useMemo(
    () => buildQueryString({ timeRange, fromDate, toDate }),
    [timeRange, fromDate, toDate]
  );

  const compareQueryString = useMemo(
    () =>
      buildCompareQueryString({
        timeRange,
        fromDate,
        toDate,
        compareMode,
        compareFrom,
        compareTo,
        year1,
        year2,
      }),
    [timeRange, fromDate, toDate, compareMode, compareFrom, compareTo, year1, year2]
  );

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [resKpi, resRev, resCat, resStatus, resProd, resCus, resLatest] = await Promise.all([
        userRequest.get(`/stats/summary${queryString}`),
        userRequest.get(`/stats/revenue-chart${queryString}`),
        userRequest.get(`/stats/categories${queryString}`),
        userRequest.get(`/stats/order-status${queryString}`),
        userRequest.get(`/stats/products-analytics${queryString}`),
        userRequest.get(`/stats/top-customers${queryString}`),
        userRequest.get(`/stats/latest-orders${queryString}`),
      ]);

      setKpi(resKpi.data || null);
      setRevenueChart(normalizeRevenueChart(resRev.data || []));
      setCategoryData(normalizeCategoryData(resCat.data || []));
      setStatusData(normalizeStatusData(resStatus.data || []));
      setProdStats(normalizeProductStats(resProd.data || {}));
      setCustomers(Array.isArray(resCus.data) ? resCus.data : []);
      setLatestOrders(Array.isArray(resLatest.data) ? resLatest.data : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu Dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCompareData = async () => {
    if (compareMode === "none") {
      setCompareChart([]);
      return;
    }
    try {
      const res = await userRequest.get(`/stats/revenue-comparison${compareQueryString}`);
      if (compareMode === "year") {
        const formatted = Array.from({ length: 12 }, (_, i) => ({
          label: `T${i + 1}`,
          currentRevenue: safeNumber(res.data?.year1?.[i]) / 1_000_000,
          compareRevenue: safeNumber(res.data?.year2?.[i]) / 1_000_000,
        }));
        setCompareChart(formatted);
        return;
      }

      const current = normalizeRevenueChart(res.data?.current || []);
      const compare = normalizeRevenueChart(res.data?.compare || []);
      const formatted = current.map((item, index) => ({
        label: item.label,
        currentRevenue: item.rawRevenue / 1_000_000,
        compareRevenue: safeNumber(compare[index]?.rawRevenue) / 1_000_000,
      }));
      setCompareChart(formatted);
    } catch (err) {
      console.error("Lỗi tải dữ liệu so sánh:", err);
      setCompareChart([]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    fetchCompareData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMode, compareQueryString]);

  // Insights Logic
  const revenueInsight = useMemo(() => {
    if (!revenueChart.length) return "Chưa có dữ liệu doanh thu trong kỳ lọc này.";
    const totalRevenue = revenueChart.reduce((sum, item) => sum + item.rawRevenue, 0);
    const totalOrders = revenueChart.reduce((sum, item) => sum + item.orders, 0);
    const avgAov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const best = [...revenueChart].sort((a, b) => b.rawRevenue - a.rawRevenue)[0];
    return `${best.label} là giai đoạn có doanh thu cao nhất trong kỳ. Tổng doanh thu đạt ${formatCurrency(
      totalRevenue
    )} ₫ với ${formatCurrency(totalOrders)} đơn, AOV trung bình khoảng ${formatCurrency(avgAov)} ₫.`;
  }, [revenueChart]);

  const compareInsight = useMemo(() => {
    if (compareMode === "none") return "";
    if (!compareChart.length) return "Chưa có dữ liệu so sánh cho kỳ đã chọn.";
    const currentTotal = compareChart.reduce((sum, item) => sum + safeNumber(item.currentRevenue), 0);
    const compareTotal = compareChart.reduce((sum, item) => sum + safeNumber(item.compareRevenue), 0);
    const diff = currentTotal - compareTotal;
    const pct = compareTotal > 0 ? Math.round((diff / compareTotal) * 1000) / 10 : 0;

    if (diff > 0) return `Kỳ hiện tại đang cao hơn kỳ so sánh khoảng ${formatCurrency(diff * 1_000_000)} ₫, tương đương tăng ${pct}%.`;
    if (diff < 0) return `Kỳ hiện tại đang thấp hơn kỳ so sánh khoảng ${formatCurrency(Math.abs(diff) * 1_000_000)} ₫, tương đương giảm ${Math.abs(pct)}%.`;
    return "Doanh thu kỳ hiện tại gần như tương đương kỳ so sánh.";
  }, [compareChart, compareMode]);

  const categoryInsight = useMemo(() => {
    if (!categoryData.length) return "Chưa có dữ liệu danh mục trong kỳ lọc này.";
    const top = [...categoryData].sort((a, b) => safeNumber(b[categoryTab]) - safeNumber(a[categoryTab]))[0];
    const value = categoryTab === "revenue" ? `${formatCurrency(top.revenue)} ₫` : `${formatCurrency(top[categoryTab])}`;
    return `${top.name} đang dẫn đầu với ${value}. Đây là nhóm nên ưu tiên hiển thị.`;
  }, [categoryData, categoryTab]);

  const statusInsight = useMemo(() => {
    if (!statusData.length) return "Chưa có dữ liệu trạng thái đơn hàng trong kỳ lọc này.";
    const total = statusData.reduce((sum, item) => sum + item.value, 0);
    const canceled = statusData.find((item) => Number(item.status) === 5)?.value || 0;
    const processing = statusData.filter((item) => [0, 1, 2, 3].includes(Number(item.status))).reduce((sum, item) => sum + item.value, 0);
    const cancelRate = total > 0 ? (canceled / total) * 100 : 0;
    const processingRate = total > 0 ? (processing / total) * 100 : 0;

    if (cancelRate >= 15) return `Tỷ lệ hủy đơn đang ở mức ${cancelRate.toFixed(1)}%, cần kiểm tra nguyên nhân.`;
    if (processingRate >= 30) return `${processingRate.toFixed(1)}% đơn đang trong quá trình xử lý.`;
    return `Tình trạng xử lý đơn ổn định. Tỷ lệ hủy khoảng ${cancelRate.toFixed(1)}%.`;
  }, [statusData]);

  const topCategoryData = useMemo(() => {
    return [...categoryData]
      .sort((a, b) => safeNumber(b[categoryTab]) - safeNumber(a[categoryTab]))
      .slice(0, 6);
  }, [categoryData, categoryTab]);

  const totalStatus = useMemo(() => statusData.reduce((sum, item) => sum + item.value, 0), [statusData]);
  const cancelRate = kpi?.cancelRate ?? (safeNumber(kpi?.totalOrders) > 0 ? Math.round((safeNumber(kpi?.canceled) / safeNumber(kpi?.totalOrders)) * 1000) / 10 : 0);

  if (loading) return <LoadingSpinner text="Đang tải dữ liệu..." />;


  return (
    <div className="space-y-5 pb-10 text-gray-800">
      {/* 1. Header & Filters */}
      <DashboardHeader
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        compareMode={compareMode}
        setCompareMode={setCompareMode}
        compareFrom={compareFrom}
        setCompareFrom={setCompareFrom}
        compareTo={compareTo}
        setCompareTo={setCompareTo}
        year1={year1}
        setYear1={setYear1}
        year2={year2}
        setYear2={setYear2}
        yearOptions={yearOptions}
        refreshing={refreshing}
        fetchDashboardData={fetchDashboardData}
      />

      {/* 2. KPI Cards */}
      <KPICards
        kpi={kpi}
        timeRange={timeRange}
        periodLabel={periodLabel}
        compareLabel={compareLabel}
        cancelRate={cancelRate}
      />

      {/* 3. Main Analytics (Revenue & Status) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart
            compareMode={compareMode}
            periodLabel={periodLabel}
            compareLabel={compareLabel}
            compareChart={compareChart}
            revenueChart={revenueChart}
            revenueInsight={revenueInsight}
            compareInsight={compareInsight}
            year1={year1}
            year2={year2}
          />
        </div>
        <div className="xl:col-span-1">
          <OrderOperations
            statusData={statusData}
            totalStatus={totalStatus}
            statusInsight={statusInsight}
          />
        </div>
      </div>

      {/* 4. Operation Details (Category, Warnings, Top Sellers) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <CategoryPerformance
          categoryTab={categoryTab}
          setCategoryTab={setCategoryTab}
          topCategoryData={topCategoryData}
          categoryInsight={categoryInsight}
        />
        <ProductWarnings
          lowStockItems={prodStats.lowStock}
          viewLowItems={prodStats.highViewLowPurchase}
        />
      </div>

      {/* 5. Source Row (Top Sellers & Customers & Latest) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopSellingProducts topSelling={prodStats.topSelling} />
        <TopCustomers customers={customers} />
      </div>

      <LatestOrders latestOrders={latestOrders} />
    </div>
  );
};

export default Dashboard;
