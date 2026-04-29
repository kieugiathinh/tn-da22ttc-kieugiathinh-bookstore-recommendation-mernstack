import { useEffect, useState } from "react";
import { userRequest } from "../requestMethods";
import { FaBookOpen, FaListAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Category = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const getCats = async () => {
      try {
        const res = await userRequest.get("/categories");
        setCategories(res.data);
      } catch (err) {}
    };
    getCats();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
      <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
        <FaListAlt className="text-purple-600 text-xl mr-2" />
        <h2 className="text-xl font-extrabold text-gray-800 uppercase tracking-wide">
          Thể Loại Sách
        </h2>
      </div>

      {/* Điều chỉnh Grid để các thẻ sách có khoảng cách thoáng hơn */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
        {categories.map((cat) => (
          // Link đã sửa đúng logic (products/ID)
          <Link to={`/products/${cat._id}`} key={cat._id}>
            <div className="group cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-2">
              {/* --- KHU VỰC HIỂN THỊ ẢNH (ĐÃ SỬA SANG HÌNH CHỮ NHẬT) --- */}
              {/* Thay đổi:
                  - Bỏ rounded-full (tròn) -> thay bằng rounded-lg (bo góc nhẹ)
                  - Đổi kích thước w-20 h-20 -> w-full aspect-[2/3] (Tỉ lệ chuẩn bìa sách)
                  - Thêm shadow để tạo cảm giác sách nổi lên
              */}
              <div className="w-24 md:w-28 aspect-[2/3] rounded-lg bg-gray-100 flex items-center justify-center mb-3 shadow-sm group-hover:shadow-xl border border-gray-200 group-hover:border-purple-300 transition-all overflow-hidden relative">
                {cat.img ? (
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  // Nếu không có ảnh, hiện icon nhưng vẫn trong khung chữ nhật
                  <div className="flex flex-col items-center justify-center text-purple-300 group-hover:text-purple-600 transition-colors">
                    <FaBookOpen className="text-3xl mb-1" />
                    <span className="text-[10px] uppercase font-bold">
                      No Image
                    </span>
                  </div>
                )}

                {/* Hiệu ứng bóng sáng quét qua khi hover (Optional - làm cho đẹp) */}
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </div>
              {/* -------------------------------------------------------- */}

              <span className="text-xs md:text-sm font-bold text-gray-700 text-center group-hover:text-purple-700 transition-colors line-clamp-2 px-1 leading-tight">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Category;
