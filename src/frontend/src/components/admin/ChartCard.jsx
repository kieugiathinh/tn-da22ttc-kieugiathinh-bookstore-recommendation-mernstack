import React from 'react';

const ChartCard = ({ title, icon: Icon, children, className = "", rightContent, subtitle }) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            {Icon && <Icon className="text-orange-500" />} {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-400 font-semibold mt-1">{subtitle}</p>}
        </div>
        {rightContent}
      </div>
      <div className="flex-1 w-full relative">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
