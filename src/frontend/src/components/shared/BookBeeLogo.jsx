/**
 * BookBee Logo Component
 * Hiển thị logo từ file ảnh /logo.png (đã bao gồm hình con ong + chữ BookBee).
 * Chỉ cần truyền className để tùy chỉnh kích thước ở từng vị trí.
 */
const BookBeeLogo = ({ className = "h-10" }) => {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      <img
        src="/logobookbee.jpg"
        alt="BookBee Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default BookBeeLogo;
