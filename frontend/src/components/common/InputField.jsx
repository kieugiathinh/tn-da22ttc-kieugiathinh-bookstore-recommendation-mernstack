import clsx from "clsx";

/**
 * InputField – Label + Input/Textarea/Select + Error message.
 *
 * @param {string}  label       – Nhãn trường
 * @param {boolean} required    – Hiện dấu * đỏ bên cạnh label
 * @param {string}  error       – Thông báo lỗi (nếu có)
 * @param {"input"|"textarea"|"select"} as – Loại thẻ render
 * @param {number}  rows        – Số dòng (chỉ dùng khi as="textarea")
 * @param {Array}   options     – Mảng { value, label } (chỉ dùng khi as="select")
 * @param {string}  className   – Override class cho thẻ input
 */

// Base input style – single source of truth (thay thế inputCls cũ)
export const inputBaseClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-light/30";

const InputField = ({
  label,
  required = false,
  error,
  as = "input",
  rows = 3,
  options = [],
  className,
  children,
  ...rest
}) => {
  const Tag = as === "textarea" ? "textarea" : as === "select" ? "select" : "input";

  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      {as === "select" ? (
        <Tag
          className={clsx(inputBaseClass, className)}
          {...rest}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Tag>
      ) : (
        <Tag
          rows={as === "textarea" ? rows : undefined}
          className={clsx(
            inputBaseClass,
            as === "textarea" && "resize-none",
            className
          )}
          {...rest}
        />
      )}

      {error && (
        <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
      )}
    </div>
  );
};

export default InputField;
