import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

// Shared Pagination component dùng chung cho tất cả trang CRUD admin
const Pagination = ({ currentPage, totalPages, total, rowsPerPage, onPrev, onNext, unit = "bản ghi" }) => {
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, total);

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
      <p className="text-sm text-gray-500">
        Hiển thị <span className="font-semibold text-gray-700">{total > 0 ? start : 0}–{end}</span> của{" "}
        <span className="font-semibold text-gray-700">{total}</span> {unit}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronLeft size={12} />
        </button>
        <span className="px-3 text-sm font-semibold text-gray-700">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FaChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
