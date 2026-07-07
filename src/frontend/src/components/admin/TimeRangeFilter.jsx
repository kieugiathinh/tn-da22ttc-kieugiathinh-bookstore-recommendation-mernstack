import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

const TimeRangeFilter = ({ value, onChange }) => {
  return (
    <div className="relative">
      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        <FaCalendarAlt className="text-gray-400 mr-2 text-sm" />
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent border-none text-sm font-semibold text-gray-700 outline-none cursor-pointer focus:ring-0 w-full pr-4 appearance-none"
        >
          <option value="today">Hôm nay</option>
          <option value="last7">7 ngày qua</option>
          <option value="last30">30 ngày qua</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
          <option value="all">Tất cả thời gian</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TimeRangeFilter;
