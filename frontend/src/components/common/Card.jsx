import clsx from "clsx";

/**
 * Card – Wrapper container chuẩn TailAdmin.
 *
 * @param {string} className – Override / merge thêm class
 */
const Card = ({ className, children, ...rest }) => {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
