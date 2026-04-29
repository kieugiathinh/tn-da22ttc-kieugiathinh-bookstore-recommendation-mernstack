import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { userRequest } from "../requestMethods";
import ProductCard from "../components/ProductCard";
import { FaFilter, FaListUl, FaChevronRight } from "react-icons/fa";

const ProductList = () => {
  const location = useLocation();
  const catId = location.pathname.split("/")[2];

  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("search");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [categoryName, setCategoryName] = useState("Tất cả sách");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [catId, searchTerm]);

  // 1. Lấy danh sách thể loại (cho Sidebar bên trái)
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

  // 2. Lấy danh sách sản phẩm (Logic quan trọng)
  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        let url = "/products";

        // ƯU TIÊN 1: Nếu có catId -> Lọc theo thể loại
        if (catId) {
          url = `/products?category=${catId}`;
        }
        // ƯU TIÊN 2: Nếu có searchTerm -> Tìm kiếm
        else if (searchTerm) {
          url = `/products?search=${encodeURIComponent(searchTerm)}`;
        }

        const res = await userRequest.get(url);
        setProducts(res.data);

        // Cập nhật tiêu đề trang
        if (catId) {
          const currentCat = categories.find((c) => c._id === catId);
          if (currentCat) setCategoryName(currentCat.name);
          else if (res.data.length > 0 && res.data[0].category)
            setCategoryName(res.data[0].category.name);
        } else if (searchTerm) {
          // Hiển thị từ khóa tìm kiếm
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
    getProducts();
  }, [catId, searchTerm, categories]); // Thêm categories vào dependency để cập nhật tên khi load xong

  // 3. Logic Sắp xếp (Frontend Sort)
  useEffect(() => {
    if (sort === "newest") {
      setProducts((prev) =>
        [...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } else if (sort === "asc") {
      setProducts((prev) =>
        [...prev].sort((a, b) => a.discountedPrice - b.discountedPrice)
      );
    } else {
      setProducts((prev) =>
        [...prev].sort((a, b) => b.discountedPrice - a.discountedPrice)
      );
    }
  }, [sort]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb (Đường dẫn) */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-purple-600">
            Trang chủ
          </Link>
          <FaChevronRight className="mx-2 text-xs" />
          <span className="font-semibold text-gray-800">{categoryName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- SIDEBAR (CỘT TRÁI - DANH MỤC) --- */}
          <div className="lg:w-1/4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                <FaListUl className="mr-2 text-purple-600" /> Danh Mục
              </h3>
              <ul className="space-y-2">
                {/* Link về trang Tất cả */}
                <li>
                  <Link
                    to="/products"
                    className={`block px-3 py-2 rounded-lg transition-colors ${
                      !catId
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                    }`}
                  >
                    Tất cả sách
                  </Link>
                </li>
                {/* Render các thể loại */}
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <Link
                      to={`/products/${cat._id}`}
                      className={`block px-3 py-2 rounded-lg transition-colors ${
                        catId === cat._id
                          ? "bg-purple-50 text-purple-700 font-bold"
                          : "text-gray-600 hover:bg-gray-50 hover:text-purple-600"
                      }`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* --- MAIN CONTENT (CỘT PHẢI - SẢN PHẨM) --- */}
          <div className="lg:w-3/4">
            {/* Toolbar: Tiêu đề & Sắp xếp */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h1 className="text-xl font-bold text-gray-800 uppercase">
                {categoryName}
                <span className="ml-2 text-sm font-normal text-gray-500 lowercase">
                  ({products.length} sản phẩm)
                </span>
              </h1>

              <div className="flex items-center mt-3 sm:mt-0">
                <span className="text-sm text-gray-500 mr-2 flex items-center">
                  <FaFilter className="mr-1" /> Sắp xếp:
                </span>
                <select
                  onChange={(e) => setSort(e.target.value)}
                  className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="asc">Giá: Thấp đến Cao</option>
                  <option value="desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>

            {/* Lưới sản phẩm */}
            {loading ? (
              <div className="text-center py-20 text-gray-500">
                Đang tải sách...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-sm">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png"
                  alt="Empty"
                  className="w-24 mx-auto mb-4 opacity-50"
                />
                <p className="text-gray-500 text-lg">
                  Không tìm thấy sách nào.
                </p>
                <Link
                  to="/products"
                  className="text-purple-600 font-semibold mt-2 inline-block"
                >
                  Xem tất cả sách
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((item) => (
                  <ProductCard key={item._id} product={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
