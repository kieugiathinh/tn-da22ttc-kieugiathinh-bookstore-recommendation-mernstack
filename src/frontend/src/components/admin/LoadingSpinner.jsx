import React from 'react';
import { FaSync } from 'react-icons/fa';

const LoadingSpinner = ({ text = "Đang tải dữ liệu..." }) => (
  <div className="flex min-h-[50vh] items-center justify-center gap-3 text-amber-500 w-full">
    <FaSync className="animate-spin text-3xl" />
    <span className="font-bold text-lg">{text}</span>
  </div>
);

export default LoadingSpinner;
