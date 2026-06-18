import { useEffect, useState, useRef } from "react";
import { userRequest } from "../../requestMethods";
import { FaBookOpen, FaListAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const sliderRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const getCats = async () => {
      try {
        const res = await userRequest.get("/categories");
        setCategories(res.data);
      } catch (err) {}
    };
    getCats();
  }, []);

  // Logic tự động trượt (Auto-play)
  useEffect(() => {
    if (categories.length === 0 || isHovered) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        const maxScroll = scrollWidth - clientWidth;

        // Nếu đã trượt đến cuối cùng, quay lại từ đầu
        if (scrollLeft >= maxScroll - 10) {
          sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Trượt sang phải 1 khoảng tương đương chiều rộng 1 thẻ (khoảng 160px)
          sliderRef.current.scrollBy({ left: 166, behavior: "smooth" });
        }
      }
    }, 3000); // Tự động trượt mỗi 3 giây

    return () => clearInterval(interval);
  }, [categories.length, isHovered]);

  const slideLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -332, behavior: "smooth" }); // Lùi 2 thẻ
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 332, behavior: "smooth" }); // Tiến 2 thẻ
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-slate-100">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-orange-100">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-300/40">
          <FaListAlt className="text-white text-lg" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">
          Danh Mục Sản Phẩm
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-orange-200 to-transparent ml-4" />
      </div>

      {/* Horizontal Slider Danh Mục */}
      <div 
        className="relative group px-1"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Nút điều hướng */}
        {categories.length > 0 && (
          <>
            <button 
              onClick={slideLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white text-orange-500 shadow-md border border-orange-100 opacity-0 group-hover:opacity-100 hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              <FaChevronLeft size={14} className="mr-0.5" />
            </button>
            <button 
              onClick={slideRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white text-orange-500 shadow-md border border-orange-100 opacity-0 group-hover:opacity-100 hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              <FaChevronRight size={14} className="ml-0.5" />
            </button>
          </>
        )}

        <div 
          ref={sliderRef}
          className="flex overflow-x-auto gap-4 py-3 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
        >
          {categories.map((cat) => (
            <Link to={`/products/${cat._id}`} key={cat._id} className="w-[130px] sm:w-[150px] flex-shrink-0 snap-start">
              <div className="group cursor-pointer flex flex-col items-center bg-white border border-slate-100 rounded-2xl p-3 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300 h-full">
                
                {/* Image Container (Rounded Rectangle) */}
                <div className="w-full aspect-square bg-orange-50/60 rounded-xl flex items-center justify-center mb-3 overflow-hidden p-2">
                  {cat.img ? (
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  ) : (
                    <FaBookOpen className="text-4xl text-orange-300" />
                  )}
                </div>

                {/* Text */}
                <span className="text-sm font-semibold text-slate-700 text-center leading-snug group-hover:text-orange-600 transition-colors duration-200 line-clamp-2 mt-auto">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Category;
