import clsx from "clsx";
import { FaSync } from "react-icons/fa";

/**
 * LoadingSpinner – Trạng thái loading dùng chung.
 *
 * @param {string} text      – Dòng chữ kèm theo (mặc định: "Đang tải…")
 * @param {string} className – Override class cho wrapper
 */
const LoadingSpinner = ({
  text = "Đang tải...",
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-2 py-20 text-gray-400",
        className
      )}
    >
      <FaSync className="animate-spin text-primary" />
      {text}
    </div>
  );
};

export default LoadingSpinner;
