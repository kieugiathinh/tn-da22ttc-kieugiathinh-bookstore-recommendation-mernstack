import { useEffect, useState } from "react";
import { userRequest } from "../../requestMethods";
import { FaBookOpen, FaListAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

// Hệ màu pastel đa sắc cho từng thể loại — đủ để phân biệt rõ ràng
const CATEGORY_COLORS = [
  { bg: "bg-violet-100",  border: "border-violet-200",  text: "text-violet-700",  icon: "text-violet-500",  hover: "group-hover:border-violet-400 group-hover:bg-violet-50"  },
  { bg: "bg-rose-100",    border: "border-rose-200",    text: "text-rose-700",    icon: "text-rose-500",    hover: "group-hover:border-rose-400 group-hover:bg-rose-50"      },
  { bg: "bg-emerald-100", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500", hover: "group-hover:border-emerald-400 group-hover:bg-emerald-50" },
  { bg: "bg-amber-100",   border: "border-amber-200",   text: "text-amber-700",   icon: "text-amber-500",   hover: "group-hover:border-amber-400 group-hover:bg-amber-50"    },
  { bg: "bg-sky-100",     border: "border-sky-200",     text: "text-sky-700",     icon: "text-sky-500",     hover: "group-hover:border-sky-400 group-hover:bg-sky-50"        },
  { bg: "bg-fuchsia-100", border: "border-fuchsia-200", text: "text-fuchsia-700", icon: "text-fuchsia-500", hover: "group-hover:border-fuchsia-400 group-hover:bg-fuchsia-50" },
  { bg: "bg-teal-100",    border: "border-teal-200",    text: "text-teal-700",    icon: "text-teal-500",    hover: "group-hover:border-teal-400 group-hover:bg-teal-50"      },
  { bg: "bg-orange-100",  border: "border-orange-200",  text: "text-orange-700",  icon: "text-orange-500",  hover: "group-hover:border-orange-400 group-hover:bg-orange-50"  },
];

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
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-100">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-sm shadow-violet-300/40">
          <FaListAlt className="text-white text-sm" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">
          Thể Loại Sách
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-violet-100 to-transparent ml-2" />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {categories.map((cat, index) => {
          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
          return (
            <Link to={`/products/${cat._id}`} key={cat._id}>
              <div className="group cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-2">
                {/* Khung ảnh — màu pastel theo index */}
                <div
                  className={`w-full aspect-[2/3] rounded-xl
                              ${color.bg} ${color.border} border
                              ${color.hover}
                              flex items-center justify-center mb-2.5
                              shadow-sm group-hover:shadow-lg
                              transition-all duration-300 overflow-hidden relative`}
                >
                  {cat.img ? (
                    <img
                      src={cat.img}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <FaBookOpen className={`text-2xl mb-1 ${color.icon} transition-transform duration-300 group-hover:scale-125`} />
                      <span className={`text-[9px] uppercase font-bold ${color.text}`}>
                        Sách
                      </span>
                    </div>
                  )}

                  {/* Shimmer overlay */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                </div>

                <span className={`text-xs font-bold text-slate-700 text-center group-hover:${color.text} transition-colors duration-200 line-clamp-2 px-1 leading-tight`}>
                  {cat.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Category;
