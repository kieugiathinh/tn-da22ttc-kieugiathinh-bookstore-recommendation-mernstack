import { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import ProductCard from "../../components/client/ProductCard";
import { FaFilter, FaListUl, FaChevronRight, FaChevronLeft } from "react-icons/fa";

const ProductList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const catId = location.pathname.split("/")[2];

  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search");
  const initialSort = queryParams.get("sort") || "newest";
  const initialCategoryParam = queryParams.get("category");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState(initialSort);
  const [categoryName, setCategoryName] = useState("Tất cả sách");

  // ĐA CHỌN DANH MỤC
  const [selectedCategories, setSelectedCategories] = useState(() => {
    if (catId) return [catId];
    if (initialCategoryParam) return initialCategoryParam.split(",");
    return [];
  });

  // PHÂN TRANG (PAGINATION)
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  useEffect(() => {
    const currentSort = new URLSearchParams(location.search).get("sort");
    if (currentSort) setSort(currentSort);
  }, [location.search]);

  // Reset về trang 1 khi đổi bộ lọc hoặc sort
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, sort, searchTerm]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // 1. Lấy danh sách thể loại
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await userRequest.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getCategories();
  }, []);

  // 2. Lấy danh sách sản phẩm
  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        let url = "/products?";
        const params = new URLSearchParams();
        if (selectedCategories.length > 0) {
          params.append("category", selectedCategories.join(","));
        }
        if (searchTerm) {
          params.append("search", searchTerm);
        }
        url += params.toString();

        const res = await userRequest.get(url);
        setProducts(res.data);

        // Cập nhật tiêu đề trang
        if (selectedCategories.length === 1) {
          const currentCat = categories.find((c) => c._id === selectedCategories[0]);
          if (currentCat) setCategoryName(currentCat.name);
          else if (res.data.length > 0 && res.data[0].category)
            setCategoryName(res.data[0].category.name);
        } else if (selectedCategories.length > 1) {
          setCategoryName(`Đã chọn ${selectedCategories.length} danh mục`);
        } else if (searchTerm) {
          setCategoryName(`Kết quả tìm kiếm: "${searchTerm}"`);
        } else {
          setCategoryName("Tất cả sách");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (categories.length > 0 || selectedCategories.length === 0) {
      getProducts();
    }
  }, [selectedCategories, searchTerm, categories]);

  // Xử lý Checkbox danh mục
  const handleCategoryChange = (id) => {
    const updated = selectedCategories.includes(id)
      ? selectedCategories.filter((c) => c !== id)
      : [...selectedCategories, id];

    setSelectedCategories(updated);

    // Xóa catId trên URL nếu đang ở route /products/:catId để chuyển về /products?category=...
    if (catId) {
      navigate(`/products?category=${updated.join(",")}`);
    } else {
      const params = new URLSearchParams(location.search);
      if (updated.length > 0) params.set("category", updated.join(","));
      else params.delete("category");
      navigate(`/products?${params.toString()}`);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    navigate("/products");
  };

  // 3. Logic Sắp xếp & Phân Trang (Chạy trực tiếp lúc Render)
  const sortedProducts = [...products].sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sort === "asc") return (a.discountedPrice || a.price) - (b.discountedPrice || b.price);
    if (sort === "desc") return (b.discountedPrice || b.price) - (a.discountedPrice || a.price);
    if (sort === "toprated") return (b.rating || 0) - (a.rating || 0) || (b.numReviews || 0) - (a.numReviews || 0);
    if (sort === "bestseller") return (b.sold || 0) - (a.sold || 0);
    return 0;
  });

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-orange-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-orange-500 transition-colors">
            Trang chủ
          </Link>
          <FaChevronRight className="mx-2 text-[10px]" />
          <span className="font-bold text-orange-600">{categoryName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- SIDEBAR (CỘT TRÁI - DANH MỤC) --- */}
          <div className="lg:w-1/4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 sticky top-24">
              <div className="flex items-center justify-between border-b border-orange-100 pb-3 mb-4">
                <h3 className="font-extrabold text-slate-800 flex items-center uppercase tracking-wide">
                  <FaListUl className="mr-2 text-orange-500" /> Bộ Lọc
                </h3>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              <h4 className="font-semibold text-slate-700 mb-3">Danh Mục Sách</h4>
              <ul className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={selectedCategories.includes(cat._id)}
                          onChange={() => handleCategoryChange(cat._id)}
                        />
                        <div className="w-5 h-5 rounded-md border-2 border-slate-200 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center group-hover:border-orange-400">
                          <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className={`text-sm font-medium transition-colors ${selectedCategories.includes(cat._id) ? "text-orange-600" : "text-slate-600 group-hover:text-orange-500"
                        }`}>
                        {cat.name}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* --- MAIN CONTENT (CỘT PHẢI - SẢN PHẨM) --- */}
          <div className="lg:w-3/4">
            {/* Toolbar: Tiêu đề & Sắp xếp */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
              <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">
                {categoryName}
                <span className="ml-2 text-sm font-semibold text-orange-500 lowercase bg-orange-50 px-2 py-0.5 rounded-full">
                  {sortedProducts.length} kết quả
                </span>
              </h1>

              <div className="flex items-center mt-3 sm:mt-0 gap-2">
                <span className="text-sm font-medium text-slate-500 flex items-center">
                  <FaFilter className="mr-1 text-orange-400" /> Sắp xếp:
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-orange-200 rounded-lg p-1.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-orange-500/50 outline-none bg-white cursor-pointer hover:border-orange-400 transition-colors"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="bestseller">Bán chạy nhất</option>
                  <option value="toprated">Đánh giá cao nhất</option>
                  <option value="asc">Giá: Thấp đến Cao</option>
                  <option value="desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>

            {/* Lưới sản phẩm */}
            {loading ? (
              <div className="flex justify-center items-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-100 border-t-orange-500"></div>
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-orange-100">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaFilter className="text-4xl text-orange-300" />
                </div>
                <p className="text-slate-500 text-lg font-medium mb-4">
                  Không tìm thấy sách nào phù hợp với bộ lọc.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold hover:bg-orange-600 transition-colors shadow-sm hover:shadow-md"
                >
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-6">
                  {currentProducts.map((item) => (
                    <ProductCard key={item._id} product={item} />
                  ))}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12 mb-8">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border border-orange-200 text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-50"
                    >
                      <FaChevronLeft className="text-sm" />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all shadow-sm
                          ${currentPage === i + 1
                            ? "bg-orange-500 text-white shadow-orange-500/40 border-none scale-110"
                            : "bg-white text-slate-600 border border-slate-200 hover:border-orange-400 hover:text-orange-500"
                          }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all border border-orange-200 text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-50"
                    >
                      <FaChevronRight className="text-sm" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
