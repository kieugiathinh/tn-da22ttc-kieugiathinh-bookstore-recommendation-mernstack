import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaTrash, FaEdit, FaPlus } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";
import Button from "../../components/common/Button";
import IconButton from "../../components/common/IconButton";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";

const ROWS_PER_PAGE = 10;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await userRequest.get("/products");
      setProducts(res.data.map((p) => ({ ...p, id: p._id })));
    } catch {
      Swal.fire("Lỗi", "Không thể tải dữ liệu sản phẩm.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Xác nhận xóa?", text: "Sách sẽ bị xóa vĩnh viễn!",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (isConfirmed) {
      try {
        await userRequest.delete(`/products/${id}`);
        Swal.fire("Đã xóa!", "", "success");
        fetchProducts();
      } catch {
        Swal.fire("Lỗi!", "Xóa thất bại.", "error");
      }
    }
  };

  const filtered = products.filter((p) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.author?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const pageData = filtered.slice(startIdx, startIdx + ROWS_PER_PAGE);

  const stockVariant = (count) =>
    count > 10 ? "success" : count > 0 ? "warning" : "danger";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Sách"
        subtitle={`${products.length} đầu sách trong hệ thống`}
        action={
          <Link to="/admin/newproduct">
            <Button icon={<FaPlus size={12} />}>Thêm sách mới</Button>
          </Link>
        }
      />

      {/* Thanh tìm kiếm */}
      <div className="relative max-w-xs">
        <input type="text" placeholder="Tìm kiếm tên sách, tác giả..."
          value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200/30"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" />
        </svg>
      </div>

      {/* Bảng sản phẩm */}
      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3.5">Sách & Tác giả</th>
                    <th className="px-5 py-3.5">Thể loại</th>
                    <th className="px-5 py-3.5">Giá bán</th>
                    <th className="px-5 py-3.5">Tồn kho</th>
                    <th className="px-5 py-3.5">Đã bán</th>
                    <th className="px-5 py-3.5 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={p.img || "https://placehold.co/40x56?text=Book"}
                            onError={(e) => { e.target.src = "https://placehold.co/40x56?text=Book"; }}
                            className="h-14 w-10 flex-shrink-0 rounded-lg object-cover border border-gray-100"
                            alt={p.title} />
                          <div className="min-w-0">
                            <p className="truncate max-w-[180px] font-semibold text-gray-900">{p.title}</p>
                            <p className="text-xs italic text-gray-400">{p.author || "Không rõ tác giả"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {p.category?.name || "Chưa phân loại"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-red-600">
                        {(p.discountedPrice || p.originalPrice || 0).toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={stockVariant(p.countInStock)}>
                          {p.countInStock > 0 ? `${p.countInStock} cuốn` : "Hết hàng"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-brand-600">{p.sold || 0}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-3">
                          <Link to={`/admin/product/${p._id}`}>
                            <IconButton variant="edit" icon={<FaEdit size={13} />} title="Sửa" />
                          </Link>
                          <IconButton variant="delete" icon={<FaTrash size={13} />} onClick={() => handleDelete(p._id)} title="Xóa" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageData.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      {search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có sản phẩm nào"}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages}
              total={filtered.length} rowsPerPage={ROWS_PER_PAGE}
              onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              unit="đầu sách" />
          </>
        )}
      </Card>
    </div>
  );
};

export default Products;
