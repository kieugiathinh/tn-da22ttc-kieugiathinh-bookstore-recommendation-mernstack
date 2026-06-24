import { useEffect, useState } from "react";
import { FaTrophy, FaArrowUp, FaArrowRight, FaStar } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import { Link } from "react-router-dom";

const BestSeller = () => {
  const [products, setProducts] = useState([]);
  const [period, setPeriod] = useState("week"); // week, month, year
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        let days = 30;
        if (period === "week") days = 7;
        else if (period === "month") days = 30;
        else if (period === "year") days = 365;

        // Fetch sách nổi bật (Độ phổ biến) từ Recommendation AI Proxy thay vì lấy đơn thuần theo số lượng bán
        const res = await userRequest.get(`/recommend/popular?limit=5&days=${days}`);
        setProducts(res.data?.products || []);
        if (res.data?.products && res.data.products.length > 0) {
          setActiveProduct(res.data.products[0]); // Mặc định chọn top 1
        }
      } catch (err) {
        console.error("Lỗi khi lấy sách phổ biến:", err);
      }
    };
    fetchTrends();
  }, [period]);

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
      {/* ===== HEADER & TABS (Dark Slate + Amber Theme) ===== */}
      <div className="bg-slate-900 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/50 rounded-full flex items-center justify-center">
            <FaTrophy className="text-amber-400 text-xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          </div>
          <h2 className="text-2xl font-extrabold text-amber-400 uppercase tracking-tight drop-shadow-sm">
            Bảng Vàng Mật Ngọt
          </h2>
        </div>

        <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
          {[
            { id: "week", label: "Tuần này" },
            { id: "month", label: "Tháng này" },
            { id: "year", label: "Năm nay" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${period === tab.id
                ? "bg-amber-500 text-slate-900 shadow-md mr-1"
                : "text-slate-400 hover:text-amber-400 hover:bg-slate-700 mr-1"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== BODY (MASTER-DETAIL LAYOUT) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 p-6 lg:p-8">

        {/* === CỘT TRÁI: DANH SÁCH TOP 5 === */}
        <div className="md:col-span-2 flex flex-col gap-2 relative">
          {products.slice(0, 5).map((item, index) => {
            const isActive = activeProduct?._id === item._id;
            return (
              <div
                key={item._id}
                onMouseEnter={() => setActiveProduct(item)}
                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 h-[108px] ${isActive
                  ? "bg-slate-50 border-amber-300 shadow-sm"
                  : "border-transparent hover:bg-slate-50 border-b-slate-100"
                  }`}
              >
                {/* Cột Rank */}
                <div className="flex flex-col items-center justify-center w-10 shrink-0">
                  <span className={`text-2xl font-black ${index < 3 ? "text-amber-500" : "text-slate-400"}`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <FaArrowUp className="text-emerald-500 text-xs mt-1" />
                </div>

                {/* Thumbnail */}
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-14 h-20 object-cover rounded shadow-sm shrink-0"
                />

                {/* Thông tin gọn */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base truncate transition-colors ${isActive ? "text-amber-600" : "text-slate-800"}`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">{item.author}</p>

                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <FaTrophy className="text-xs" /> Độ HOT: {item.popularityScore ? Math.round(item.popularityScore) : (item.sold || 0)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                      <FaStar /> {item.rating?.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* === CỘT PHẢI: CHI TIẾT SÁCH (Cố định chiều cao theo cột trái) === */}
        <div className="md:col-span-3 hidden md:block">
          {activeProduct && (
            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[572px] overflow-hidden">

              {/* === TOP SECTION: Ảnh + Thông tin === */}
              <div className="flex gap-6 mb-5 shrink-0 h-[220px]">
                {/* Cột Ảnh */}
                <div className="w-5/12 h-full flex justify-center items-center">
                  <img
                    src={activeProduct.img}
                    alt={activeProduct.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                </div>

                {/* Cột Thông Tin */}
                <div className="w-7/12 flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-slate-800 line-clamp-3 leading-snug mb-3">
                    {activeProduct.title}
                  </h2>

                  {/* Tác giả & NXB */}
                  <div className="flex flex-col gap-1 text-sm text-slate-500 mb-4">
                    <span>Tác giả: <strong className="text-slate-700">{activeProduct.author}</strong></span>
                    <span>NXB: <strong className="text-slate-700">{activeProduct.publisher}</strong></span>
                  </div>

                  {/* Price - 1 hàng ngang */}
                  <div className="flex items-baseline gap-3 mt-auto">
                    <span className="text-3xl font-black text-amber-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeProduct.discountedPrice || activeProduct.originalPrice)}
                    </span>
                    {activeProduct.discountedPrice > 0 && activeProduct.discountedPrice < activeProduct.originalPrice && (
                      <span className="text-base font-semibold text-slate-400 line-through">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeProduct.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* === BOTTOM SECTION: Description === */}
              <div className="text-sm text-slate-600 leading-relaxed text-justify mb-4 border-t border-slate-100 pt-4 flex-1 relative overflow-hidden">
                <div
                  className="line-clamp-[7]"
                  dangerouslySetInnerHTML={{ __html: activeProduct.desc }}
                />
                {/* Lớp gradient làm mờ phần text bị cắt */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
              </div>

              {/* Button */}
              <Link
                to={`/product/${activeProduct._id}`}
                className="mt-auto shrink-0 w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-200"
              >
                Xem chi tiết
                <FaArrowRight className="text-sm" />
              </Link>
            </div>
          )}
        </div>

      </div>

      {/* Button Xem Thêm Toàn Bộ Bảng Xếp Hạng */}
      <div className="flex justify-center pb-6">
        <Link
          to="/products?sort=bestseller"
          className="py-2.5 px-8 font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-amber-600 rounded-full transition-colors border border-slate-300 shadow-sm flex items-center gap-2"
        >
          Xem tất cả bảng xếp hạng
          <FaArrowRight className="text-xs" />
        </Link>
      </div>
    </div>
  );
};

export default BestSeller;
