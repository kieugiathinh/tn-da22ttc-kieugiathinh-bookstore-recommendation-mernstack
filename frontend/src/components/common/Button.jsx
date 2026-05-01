import clsx from "clsx";

/**
 * Button – Nút bấm đa năng dùng chung toàn dự án.
 *
 * @param {"primary"|"secondary"|"danger"|"ghost"} variant  – Kiểu hiển thị
 * @param {"sm"|"md"|"lg"} size                             – Kích thước
 * @param {boolean} isLoading                               – Hiển thị trạng thái loading
 * @param {React.ReactNode} icon                            – Icon bên trái
 * @param {"button"|"submit"|"reset"} type                  – type của thẻ <button>
 * @param {string} className                                – Override / merge thêm class
 */
const variantStyles = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-hover border-transparent",
  secondary:
    "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 border-transparent",
  ghost:
    "border-transparent bg-transparent text-gray-600 hover:bg-gray-100",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon,
  type = "button",
  className,
  ...rest
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl border font-semibold transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...rest}
    >
      {isLoading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang xử lý…
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
