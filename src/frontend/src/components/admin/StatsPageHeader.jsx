import React from 'react';
import TimeRangeFilter from './TimeRangeFilter';

const StatsPageHeader = ({ title, subtitle, timeFilter, onTimeFilterChange, rightContent }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {timeFilter !== undefined && onTimeFilterChange && (
          <TimeRangeFilter value={timeFilter} onChange={onTimeFilterChange} />
        )}
        {rightContent}
      </div>
    </div>
  );
};

export default StatsPageHeader;
