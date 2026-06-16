import { Link } from "react-router-dom";

const Announcement = () => {
  return (
    <div className="bg-primary text-white text-xs md:text-sm py-2 px-4 flex justify-center items-center font-medium relative z-50">
      🔥 Mùa Hè Rực Rỡ - Giảm giá lên đến 50% mọi đầu sách.
      <Link to="/products" className="ml-2 font-bold underline hover:text-white/80">
        Xem ngay!
      </Link>
    </div>
  );
};

export default Announcement;
