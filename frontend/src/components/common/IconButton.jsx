import clsx from "clsx";

/**
 * IconButton – Nút icon nhỏ 32×32 cho hành động trong bảng / danh sách.
 *
 * @param {"edit"|"delete"|"view"|"toggle"|"default"} variant – Phối màu
 * @param {React.ReactNode} icon    – Icon hiển thị
 * @param {string}          title   – Tooltip
 * @param {string}          className – Override class
 */
const variantStyles = {
  edit: "border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100",
  delete: "border-red-100 bg-red-50 text-red-500 hover:bg-red-100",
  view: "border-green-100 bg-green-50 text-green-600 hover:bg-green-100",
  toggle: "border-yellow-100 bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
  default: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
};

const IconButton = ({
  variant = "default",
  icon,
  className,
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
        variantStyles[variant],
        className
      )}
      {...rest}
    >
      {icon || children}
    </button>
  );
};

export default IconButton;
