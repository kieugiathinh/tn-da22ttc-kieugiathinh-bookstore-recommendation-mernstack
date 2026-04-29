import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

const ROWS_PER_PAGE = 10;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Tải dữ liệu sản phẩm
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Backend cần có .populate("category") để lấy được tên thể loại
      const res = await userRequest.get("/products");
      setProducts(res.data.map((p) => ({ ...p, id: p._id })));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Xử lý Xóa sản phẩm
  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Sản phẩm này sẽ bị xóa vĩnh viễn khỏi hệ thống!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/products/${productId}`);
        Swal.fire("Đã xóa!", "Sản phẩm đã bị xóa.", "success");
        fetchProducts(); // Tải lại danh sách sau khi xóa
      } catch (error) {
        Swal.fire("Lỗi!", "Xóa thất bại. Vui lòng thử lại.", "error");
      }
    }
  };

  // 3. Logic Phân trang
  const totalPages = Math.ceil(products.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const currentProducts = products.slice(
    startIndex,
    startIndex + ROWS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  if (loading)
    return (
      <div className="p-8 text-center text-xl text-purple-600">
        Đang tải danh sách sản phẩm...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-red-500 bg-red-100 border border-red-300 rounded-lg">
        {error}
      </div>
    );

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto">
      {/* HEADER VÀ NÚT TẠO MỚI */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📚 Quản lý Sách</h1>
        <Link to="/admin/newproduct">
          <button className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition duration-300">
            <FaPlus className="mr-2" />
            Thêm Sách Mới
          </button>
        </Link>
      </div>

      {/* BẢNG DỮ LIỆU SẢN PHẨM */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {/* HEADER BẢNG */}
          <thead className="bg-purple-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Sách & Tác giả
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Thể loại
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Giá Bán
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Tồn kho
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Đã bán
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>

          {/* BODY BẢNG */}
          <tbody className="divide-y divide-gray-100">
            {currentProducts.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 transition duration-150"
              >
                {/* Cột Sản phẩm & Tác giả */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img
                      className="h-14 w-10 object-cover rounded-sm mr-3 shadow-sm"
                      src={product.img || "https://via.placeholder.com/100"}
                      alt={product.title}
                    />
                    <div className="flex flex-col">
                      <div
                        className="text-sm font-bold text-gray-900 max-w-xs truncate"
                        title={product.title}
                      >
                        {product.title}
                      </div>
                      <div className="text-xs text-gray-500 italic">
                        {product.author || "Không rõ tác giả"}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Cột Thể loại (MỚI) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                    {/* Kiểm tra xem category có tồn tại và có name không */}
                    {product.category?.name || "Chưa phân loại"}
                  </span>
                </td>

                {/* Cột Giá Bán */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                  {product.discountedPrice
                    ? product.discountedPrice.toLocaleString("vi-VN")
                    : product.originalPrice?.toLocaleString("vi-VN") ||
                      "0"}{" "}
                  VND
                </td>

                {/* Cột Tồn kho (Đã sửa logic đếm số lượng) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      product.countInStock > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.countInStock > 0
                      ? `${product.countInStock} cuốn`
                      : "Hết hàng"}
                  </span>
                </td>

                {/* Đã bán */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600">
                    {product.sold || 0}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex justify-center space-x-4">
                    <Link to={`/admin/product/${product._id}`}>
                      <FaEdit
                        className="text-blue-500 cursor-pointer text-lg hover:text-blue-700 mx-auto"
                        title="Chỉnh sửa"
                      />
                    </Link>
                    <FaTrash
                      className="text-red-500 cursor-pointer text-lg hover:text-red-700 mx-auto"
                      title="Xóa"
                      onClick={() => handleDelete(product._id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER PHÂN TRANG */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị từ{" "}
                <span className="font-medium">
                  {Math.min(startIndex + 1, products.length)}
                </span>{" "}
                đến{" "}
                <span className="font-medium">
                  {Math.min(startIndex + ROWS_PER_PAGE, products.length)}
                </span>{" "}
                của <span className="font-medium">{products.length}</span> đầu
                sách
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>

                <span className="relative inline-flex items-center px-4 py-2 border border-purple-500 bg-purple-50 text-sm font-medium text-purple-700">
                  Trang {currentPage} / {totalPages || 1}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FaChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
