import React from 'react';

const EmptyState = ({ icon: Icon, message = "Chưa có dữ liệu", subMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50/30 rounded-xl border border-dashed border-gray-200">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Icon className="text-gray-400 text-xl" />
        </div>
      )}
      <p className="text-gray-500 font-semibold text-sm">{message}</p>
      {subMessage && <p className="text-gray-400 text-xs mt-1">{subMessage}</p>}
    </div>
  );
};

export default EmptyState;
