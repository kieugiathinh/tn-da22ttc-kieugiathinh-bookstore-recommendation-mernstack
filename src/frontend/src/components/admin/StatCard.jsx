import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass = "text-orange-500", bgClass = "bg-orange-50", subtitle, suffix, trend }) => {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-110 transition-transform`}>
          <Icon className={`text-xl ${colorClass}`} />
        </div>
        {trend !== undefined && (
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-2xl font-extrabold text-gray-900">{value}</h3>
          {suffix && <span className="text-sm font-bold text-gray-500">{suffix}</span>}
        </div>
        {subtitle && <p className="text-xs text-gray-400 font-medium mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
