import clsx from "clsx";
import { FaTimes } from "react-icons/fa";

/**
 * Modal – Overlay + Container + Header dùng chung.
 *
 * @param {boolean}  isOpen   – Hiển thị modal hay không
 * @param {Function} onClose  – Callback đóng modal
 * @param {string}   title    – Tiêu đề trong header
 * @param {"sm"|"md"|"lg"|"xl"|"2xl"} size – Chiều rộng tối đa
 * @param {string}   className – Override class cho container
 */
const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

const Modal = ({
  isOpen,
  onClose,
  title,
  size = "md",
  className,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div
        className={clsx(
          "w-full overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col",
          sizeMap[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
