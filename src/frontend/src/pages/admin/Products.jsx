import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaTrash, FaEdit, FaPlus, FaSearch, FaFilter,
  FaSort, FaChevronDown, FaBoxOpen, FaStar,
  FaStoreSlash, FaStore
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import LoadingSpinner from "../../components/admin/LoadingSpinner";
import PageHeader from "../../components/admin/PageHeader";
import Pagination from "../../components/admin/Pagination";

const ROWS_PER_PAGE = 10;

// ─── STOCK BADGE ───────────────────────────────────────────────────────────────
const StockBadge = ({ count }) => {
  if (count === 0)
    return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">Hết hàng</span>;
  if (count <= 10)
    return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">⚠ {count} cuốn</span>;
  return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">✓ {count} cuốn</span>;
};

// ─── MAIN ──────────────────────────────────────────────────────────────────────
const Products = () => {
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE);

  // Filters
  const [search, setSearch]           = useState("");
  const [filterCat, setFilterCat]     = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // Lọc trạng thái
  const [sortBy, setSortBy]           = useState("newest");

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [resProd, resCat] = await Promise.all([
        userRequest.get("/products?status=all"),
        userRequest.get("/categories"),
      ]);
      setProducts(resProd.data.map(p => ({ ...p, id: p._id })));
      setCategories(resCat.data);
    } catch {
      Swal.fire("Lỗi", "Không thể tải dữ liệu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Xác nhận xóa vĩnh viễn?",
      text: "Lưu ý: Chỉ nên xóa vĩnh viễn nếu bạn nhập sai sản phẩm! Nếu sách chỉ ngừng bán, hãy dùng tính năng 'Ngừng KD'. Xóa vĩnh viễn có thể gây lỗi cho các đơn hàng cũ.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa vĩnh viễn",
      cancelButtonText: "Hủy",
    });
    if (!isConfirmed) return;
    try {
      await userRequest.delete(`/products/${id}`);
      Swal.fire({ title: "Đã xóa vĩnh viễn!", icon: "success", timer: 1200, showConfirmButton: false });
      fetchAll();
    } catch {
      Swal.fire("Lỗi!", "Xóa thất bại.", "error");
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const isDiscontinued = currentStatus === "discontinued";
    const newStatus = isDiscontinued ? "active" : "discontinued";
    const title = isDiscontinued ? "Khôi phục kinh doanh sách này?" : "Ngừng kinh doanh sách này?";
    const text = isDiscontinued ? "Sách sẽ hiển thị lại cho khách hàng." : "Sách sẽ bị ẩn khỏi hệ thống khách hàng, nhưng không ảnh hưởng đơn hàng cũ.";
    
    const { isConfirmed } = await Swal.fire({
      title, text, icon: "question",
      showCancelButton: true,
      confirmButtonColor: isDiscontinued ? "#10b981" : "#f59e0b",
      confirmButtonText: isDiscontinued ? "Khôi phục" : "Ngừng KD",
      cancelButtonText: "Hủy",
    });

    if (!isConfirmed) return;
    try {
      await userRequest.put(`/products/${id}`, { status: newStatus });
      Swal.fire({ title: "Đã cập nhật!", icon: "success", timer: 1200, showConfirmButton: false });
      fetchAll();
    } catch {
      Swal.fire("Lỗi!", "Cập nhật trạng thái thất bại.", "error");
    }
  };

  // ── Filter + Sort logic ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.title?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.publisher?.toLowerCase().includes(q);

      const matchCat = filterCat === "all" || p.category?._id === filterCat || p.category === filterCat;

      const stock = p.countInStock ?? 0;
      const matchStock =
        filterStock === "all"     ? true :
        filterStock === "instock" ? stock > 10 :
        filterStock === "low"     ? (stock > 0 && stock <= 10) :
        filterStock === "out"     ? stock === 0 : true;

      const pStatus = p.status || "active";
      const matchStatus = filterStatus === "all" ? true : pStatus === filterStatus;

      return matchSearch && matchCat && matchStock && matchStatus;
    });

    // Sort
    list = [...list].sort((a, b) => {
      const priceA = a.discountedPrice > 0 ? a.discountedPrice : a.originalPrice;
      const priceB = b.discountedPrice > 0 ? b.discountedPrice : b.originalPrice;
      switch (sortBy) {
        case "price_asc":  return priceA - priceB;
        case "price_desc": return priceB - priceA;
        case "sold":       return (b.sold ?? 0) - (a.sold ?? 0);
        case "rating":     return (b.rating ?? 0) - (a.rating ?? 0);
        case "stock_asc":  return (a.countInStock ?? 0) - (b.countInStock ?? 0);
        default:           return new Date(b.createdAt) - new Date(a.createdAt); // newest
      }
    });

    return list;
  }, [products, search, filterCat, filterStock, sortBy, filterStatus]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const pageData   = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Stats nhanh cho toolbar
  const outOfStock  = products.filter(p => (p.countInStock ?? 0) === 0 && p.status !== "discontinued").length;
  const lowStock    = products.filter(p => (p.countInStock ?? 0) > 0 && (p.countInStock ?? 0) <= 10 && p.status !== "discontinued").length;
  const discontinued = products.filter(p => p.status === "discontinued").length;

  const resetFilters = () => {
    setSearch(""); setFilterCat("all"); setFilterStock("all"); setSortBy("newest"); setFilterStatus("all");
    setCurrentPage(1);
  };
  const hasFilter = search || filterCat !== "all" || filterStock !== "all" || sortBy !== "newest" || filterStatus !== "all";

  return (
    <div className="space-y-5">
      {/* ── PAGE HEADER ── */}
      <PageHeader
        title="Quản lý Sách"
        subtitle={`${products.length} đầu sách trong hệ thống`}
        action={
          <Link to="/admin/newproduct">
            <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all">
              <FaPlus size={12} />
              Thêm sách mới
            </button>
          </Link>
        }
      />

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => { setFilterStock("all"); setFilterStatus("all"); setCurrentPage(1); }}
          className={`rounded-xl border p-4 text-left transition-all ${filterStock === "all" ? "border-primary bg-orange-50 shadow-sm" : "border-gray-100 bg-white hover:border-primary/40"}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tổng đầu sách</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{products.length}</p>
        </button>
        <button
          onClick={() => { setFilterStock("low"); setCurrentPage(1); }}
          className={`rounded-xl border p-4 text-left transition-all ${filterStock === "low" ? "border-yellow-400 bg-yellow-50 shadow-sm" : "border-gray-100 bg-white hover:border-yellow-300"}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Tồn kho thấp</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{lowStock}</p>
        </button>
        <button
          onClick={() => { setFilterStock("out"); setCurrentPage(1); }}
          className={`rounded-xl border p-4 text-left transition-all ${filterStock === "out" ? "border-red-400 bg-red-50 shadow-sm" : "border-gray-100 bg-white hover:border-red-300"}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Hết hàng</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{outOfStock}</p>
        </button>
        <button
          onClick={() => { setFilterStatus("discontinued"); setFilterStock("all"); setCurrentPage(1); }}
          className={`rounded-xl border p-4 text-left transition-all ${filterStatus === "discontinued" ? "border-purple-400 bg-purple-50 shadow-sm" : "border-gray-100 bg-white hover:border-purple-300"}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Ngừng KD</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{discontinued}</p>
        </button>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 space-y-3">
        {/* Row 1: Search + Add */}
        <div className="flex gap-3 flex-col sm:flex-row items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
            <input
              type="text"
              placeholder="Tìm tên sách, tác giả, NXB..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          {hasFilter && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-gray-500 hover:text-primary px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
            >
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap gap-2.5">
          {/* Lọc thể loại */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterCat}
              onChange={e => { setFilterCat(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterCat !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả thể loại</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Lọc tồn kho */}
          <div className="relative">
            <FaBoxOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterStock}
              onChange={e => { setFilterStock(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterStock !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="instock">Còn hàng tốt (&gt;10)</option>
              <option value="low">Tồn kho thấp (1–10)</option>
              <option value="out">Hết hàng</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Lọc Trạng thái */}
          <div className="relative">
            <FaStoreSlash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterStatus !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang kinh doanh</option>
              <option value="discontinued">Ngừng kinh doanh</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Sắp xếp */}
          <div className="relative">
            <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
              className={`pl-8 pr-8 py-2 text-xs font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${sortBy !== "newest" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="sold">Bán chạy nhất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="stock_asc">Tồn kho thấp nhất</option>
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
          </div>

          {/* Số hàng/trang */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Hiển thị:</span>
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:border-primary cursor-pointer appearance-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={9} />
            </div>
          </div>
        </div>

        {/* Kết quả */}
        <p className="text-xs text-gray-400">
          Hiển thị <span className="font-bold text-gray-700">{filtered.length}</span> kết quả
          {hasFilter && <> (đã lọc từ <span className="font-bold text-gray-700">{products.length}</span> sản phẩm)</>}
        </p>
      </div>

      {/* ── TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Đang tải dữ liệu..." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left border-b border-gray-100">
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Sách & Tác giả</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Thể loại</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Giá bán</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Tồn kho</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Đã bán</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Đánh giá</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map(p => {
                    const salePrice = p.discountedPrice > 0 ? p.discountedPrice : p.originalPrice;
                    const hasDiscount = p.discountedPrice > 0 && p.discountedPrice < p.originalPrice;
                    const discountPct = hasDiscount ? Math.round((1 - p.discountedPrice / p.originalPrice) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-orange-50/30 transition-colors group">
                        {/* Sách & Tác giả */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={p.img || "https://placehold.co/40x56?text=Book"}
                                onError={e => { e.target.src = "https://placehold.co/40x56?text=Book"; }}
                                className="h-14 w-10 rounded-lg object-cover border border-gray-200 shadow-sm group-hover:scale-105 transition-transform"
                                alt={p.title}
                              />
                              {hasDiscount && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                                  -{discountPct}%
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate max-w-[180px] font-semibold text-gray-900 text-[13px]">{p.title}</p>
                                {p.status === "discontinued" && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 uppercase">Ngừng KD</span>
                                )}
                              </div>
                              <p className="text-xs italic text-gray-400 mt-0.5">{p.author || "Không rõ tác giả"}</p>
                              <p className="text-[10px] text-gray-300 mt-0.5">{p.publisher || ""}</p>
                            </div>
                          </div>
                        </td>

                        {/* Thể loại */}
                        <td className="px-5 py-3.5">
                          <span className="rounded-lg bg-orange-50 border border-orange-100 px-2.5 py-1 text-xs font-semibold text-primary">
                            {p.category?.name || "Chưa phân loại"}
                          </span>
                        </td>

                        {/* Giá */}
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-gray-900 text-[13px]">
                            {salePrice.toLocaleString("vi-VN")}₫
                          </p>
                          {hasDiscount && (
                            <p className="text-[11px] text-gray-400 line-through mt-0.5">
                              {p.originalPrice.toLocaleString("vi-VN")}₫
                            </p>
                          )}
                        </td>

                        {/* Tồn kho */}
                        <td className="px-5 py-3.5">
                          <StockBadge count={p.countInStock ?? 0} />
                        </td>

                        {/* Đã bán */}
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-primary">{p.sold ?? 0}</span>
                          <span className="text-xs text-gray-400 ml-1">cuốn</span>
                        </td>

                        {/* Đánh giá */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <FaStar size={12} className="text-amber-400 flex-shrink-0" />
                            <span className="font-semibold text-gray-700 text-[13px]">
                              {(p.rating ?? 0).toFixed(1)}
                            </span>
                            <span className="text-[11px] text-gray-400">({p.numReviews ?? 0})</span>
                          </div>
                        </td>

                        {/* Thao tác */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              title={p.status === "discontinued" ? "Khôi phục kinh doanh" : "Ngừng kinh doanh"}
                              onClick={() => handleToggleStatus(p._id, p.status)}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all border ${p.status === "discontinued" ? "text-emerald-500 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-300" : "text-purple-500 hover:bg-purple-50 border-purple-100 hover:border-purple-300"}`}
                            >
                              {p.status === "discontinued" ? <FaStore size={13} /> : <FaStoreSlash size={13} />}
                            </button>
                            <Link to={`/admin/product/${p._id}`}>
                              <button
                                title="Chỉnh sửa"
                                className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-500 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all"
                              >
                                <FaEdit size={13} />
                              </button>
                            </Link>
                            <button
                              title="Xóa vĩnh viễn"
                              onClick={() => handleDelete(p._id)}
                              className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 border border-red-100 hover:border-red-300 transition-all"
                            >
                              <FaTrash size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {pageData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <FaBoxOpen size={32} className="text-gray-200" />
                          <p className="text-sm font-medium">
                            {hasFilter ? `Không tìm thấy sách nào phù hợp` : "Chưa có sách nào"}
                          </p>
                          {hasFilter && (
                            <button onClick={resetFilters} className="text-xs text-primary hover:underline">
                              Xóa bộ lọc
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              rowsPerPage={rowsPerPage}
              onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
              onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              unit="đầu sách"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
