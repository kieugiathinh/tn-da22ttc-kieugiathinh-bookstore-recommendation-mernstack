import React from 'react';

const DataTableCard = ({ title, icon: Icon, rightContent, headers, children, className = "" }) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
              <Icon className="text-orange-500 text-lg" />
            </div>
          )}
          <h3 className="font-bold text-gray-900">{title}</h3>
        </div>
        {rightContent}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {headers && (
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 bg-white">
                {headers.map((h, i) => (
                  <th key={i} className={`px-4 py-3.5 ${h.className || ''}`}>{h.label}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-50 bg-white">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTableCard;
