import clsx from "clsx";

/**
 * Badge – Status badge dạng pill (rounded-full).
 *
 * @param {"success"|"warning"|"danger"|"info"|"neutral"} variant – Phối màu
 * @param {string} className – Override class
 */
const variantStyles = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
  brand: "bg-primary-light text-primary-hover border-primary-light",
};

const Badge = ({
  variant = "neutral",
  className,
  children,
  ...rest
}) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variantStyles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;
