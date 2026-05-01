import {
  FaPlus,
  FaTrash,
  FaCalendarAlt,
  FaClock,
  FaTimes,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";

const PREVIEW_LIMIT = 3;

// ── Shared input style ─────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200/30";

const FlashSales = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ XEM THÊM ---
  const [expandedSales, setExpandedSales] = useState({});

  // --- STATE MODAL TẠO / SỬA ---
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [saleForm, setSaleForm] = useState({
    name: "",
    startTime: "",
    endTime: "",
    isActive: true,
  });

  // State Modal Thêm Sản Phẩm
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [productForm, setProductForm] = useState({
    productId: "",
    discountPrice: "",
    quantityLimit: 10,
  });

  // 1. Fetch Data
  const fetchData = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        userRequest.get("/flash-sales/all"),
        userRequest.get("/products"),
      ]);
      setFlashSales(salesRes.data);
      setAllProducts(productsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpand = (saleId) => {
    setExpandedSales((prev) => ({
      ...prev,
      [saleId]: !prev[saleId],
    }));
  };

  // Format Date Helper
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const formatDateDisplay = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- HANDLERS MỞ MODAL ---
  const handleOpenCreate = () => {
    setEditingSaleId(null);
    setSaleForm({ name: "", startTime: "", endTime: "", isActive: true });
    setShowSaleModal(true);
  };

  const handleOpenEdit = (sale) => {
    setEditingSaleId(sale._id);
    setSaleForm({
      name: sale.name,
      startTime: formatDateForInput(sale.startTime),
      endTime: formatDateForInput(sale.endTime),
      isActive: sale.isActive,
    });
    setShowSaleModal(true);
  };

  // --- XỬ LÝ API ---
  const handleSaveSale = async (e) => {
    e.preventDefault();
    try {
      if (editingSaleId) {
        await userRequest.put(`/flash-sales/${editingSaleId}`, saleForm);
        Swal.fire("Thành công", "Cập nhật chiến dịch thành công", "success");
      } else {
        await userRequest.post("/flash-sales", saleForm);
        Swal.fire("Thành công", "Đã tạo đợt Flash Sale mới", "success");
      }
      setShowSaleModal(false);
      fetchData();
    } catch (error) {
      Swal.fire("Lỗi", error.response?.data?.message || "Thất bại", "error");
    }
  };

  const handleToggleActive = async (sale) => {
    try {
      await userRequest.put(`/flash-sales/${sale._id}`, {
        isActive: !sale.isActive,
      });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSale = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?",
      text: "Chiến dịch này sẽ bị xóa vĩnh viễn!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy"
    });
    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/flash-sales/${id}`);
        Swal.fire("Đã xóa", "", "success");
        fetchData();
      } catch (error) {
        Swal.fire("Lỗi", "Không thể xóa", "error");
      }
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedSaleId) return;
    try {
      await userRequest.post(
        `/flash-sales/${selectedSaleId}/add-product`,
        productForm
      );
      Swal.fire("Thành công", "Đã thêm sách vào Flash Sale", "success");
      setShowProductModal(false);
      setProductForm({ productId: "", discountPrice: "", quantityLimit: 10 });
      fetchData();
    } catch (error) {
      Swal.fire("Lỗi", error.response?.data?.message || "Thất bại", "error");
    }
  };

  const handleRemoveProduct = async (saleId, productId) => {
    const result = await Swal.fire({
      title: "Xóa sách này?",
      text: "Sách sẽ bị loại khỏi đợt Flash Sale này.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    });
    if (result.isConfirmed) {
      try {
        await userRequest.delete(
          `/flash-sales/${saleId}/remove-product/${productId}`
        );
        fetchData();
        Swal.fire("Đã xóa", "", "success");
      } catch (error) {
        Swal.fire("Lỗi", "Không thể xóa sản phẩm", "error");
      }
    }
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Flash Sale"
        subtitle="Quản lý các đợt giảm giá chớp nhoáng"
        action={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            <FaPlus size={14} /> Tạo Chiến Dịch Mới
          </button>
        }
      />

      <div className="space-y-6">
        {flashSales.map((sale) => {
          const isExpanded = expandedSales[sale._id];
          const productsToShow = isExpanded
            ? sale.products
            : sale.products.slice(0, PREVIEW_LIMIT);
          const hiddenCount = sale.products.length - PREVIEW_LIMIT;

          return (
            <div
              key={sale._id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                sale.isActive ? "border-green-200" : "border-gray-200 opacity-80"
              }`}
            >
              {/* Header Card */}
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b px-6 py-4 ${
                sale.isActive ? "bg-green-50/50 border-green-100" : "bg-gray-50 border-gray-100"
              }`}>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {sale.name}
                    </h3>
                    <button
                      onClick={() => handleToggleActive(sale)}
                      className="text-xl transition-colors hover:opacity-80 focus:outline-none"
                      title={sale.isActive ? "Tắt chiến dịch" : "Bật chiến dịch"}
                    >
                      {sale.isActive ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-gray-400" />
                      )}
                    </button>
                    {!sale.isActive && (
                      <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                        ĐÃ TẮT
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 shadow-sm border border-gray-100">
                      <FaCalendarAlt className="text-brand-500" />
                      {formatDateDisplay(sale.startTime)}
                    </span>
                    <span>➔</span>
                    <span className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 shadow-sm border border-gray-100">
                      <FaClock className="text-brand-500" />
                      {formatDateDisplay(sale.endTime)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(sale)}
                    className="flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    <FaEdit size={12} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteSale(sale._id)}
                    className="flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>

              {/* Body: Danh sách sản phẩm */}
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">
                    Sản phẩm khuyến mãi <span className="text-gray-500 text-sm font-normal">({sale.products.length})</span>
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedSaleId(sale._id);
                      setShowProductModal(true);
                    }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                  >
                    <FaPlus size={12} /> Thêm sách vào đợt này
                  </button>
                </div>

                {sale.products.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                    Chưa có sách nào trong đợt sale này.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            <th className="px-5 py-3.5">Sách</th>
                            <th className="px-5 py-3.5">Giá Gốc</th>
                            <th className="px-5 py-3.5 text-red-500">Giá Sale</th>
                            <th className="px-5 py-3.5">Giới hạn</th>
                            <th className="px-5 py-3.5">Tiến độ</th>
                            <th className="px-5 py-3.5 text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {productsToShow.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-5 py-3 flex items-center gap-3">
                                <img
                                  src={item.product?.img || "https://placehold.co/40x56"}
                                  className="h-14 w-10 rounded border border-gray-200 object-cover shadow-sm bg-gray-100"
                                  alt=""
                                />
                                <div>
                                  <div className="font-semibold text-gray-800 line-clamp-1 max-w-[200px]" title={item.product?.title}>
                                    {item.product?.title}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    ID: {item.product?._id.slice(-6)}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-gray-400 line-through">
                                {item.product?.originalPrice?.toLocaleString()} đ
                              </td>
                              <td className="px-5 py-3 font-bold text-red-600 text-base">
                                {item.discountPrice?.toLocaleString()} đ
                              </td>
                              <td className="px-5 py-3 font-medium text-gray-700">
                                {item.quantityLimit}
                              </td>
                              <td className="px-5 py-3 w-40">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 mb-1.5">
                                  <div
                                    className="h-full rounded-full bg-red-500"
                                    style={{
                                      width: `${Math.min((item.soldCount / item.quantityLimit) * 100, 100)}%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="text-right text-[11px] font-medium text-gray-500">
                                  Đã bán {item.soldCount}
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <button
                                  onClick={() => handleRemoveProduct(sale._id, item.product?._id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors"
                                >
                                  <FaTimes size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* NÚT SHOW MORE / SHOW LESS */}
                    {sale.products.length > PREVIEW_LIMIT && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => toggleExpand(sale._id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 border border-gray-200"
                        >
                          {isExpanded ? (
                            <>
                              <FaChevronUp size={10} /> Thu gọn
                            </>
                          ) : (
                            <>
                              <FaChevronDown size={10} /> Xem thêm {hiddenCount} sách nữa
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {flashSales.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400">
            Chưa có chiến dịch Flash Sale nào
          </div>
        )}
      </div>

      {/* --- MODAL TẠO / SỬA CHIẾN DỊCH --- */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                {editingSaleId ? "Cập Nhật Chiến Dịch" : "Tạo Chiến Dịch Mới"}
              </h2>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSale} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Tên chiến dịch
                </label>
                <input
                  required
                  type="text"
                  className={inputCls}
                  placeholder="VD: Sale Tết 2025"
                  value={saleForm.name}
                  onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Bắt đầu
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className={inputCls}
                    value={saleForm.startTime}
                    onChange={(e) => setSaleForm({ ...saleForm, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Kết thúc
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className={inputCls}
                    value={saleForm.endTime}
                    onChange={(e) => setSaleForm({ ...saleForm, endTime: e.target.value })}
                  />
                </div>
              </div>
              {editingSaleId && (
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={saleForm.isActive}
                    onChange={(e) => setSaleForm({ ...saleForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-semibold text-gray-700">
                    Đang hoạt động
                  </label>
                </div>
              )}
              
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
                >
                  {editingSaleId ? "LƯU THAY ĐỔI" : "TẠO CHIẾN DỊCH"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Sản Phẩm */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">
                Thêm Sách Vào Sale
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Chọn sách
                </label>
                <select
                  required
                  className={inputCls}
                  value={productForm.productId}
                  onChange={(e) => setProductForm({ ...productForm, productId: e.target.value })}
                >
                  <option value="">-- Tìm sách --</option>
                  {allProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} - Giá gốc: {p.originalPrice?.toLocaleString()} đ
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Giá Sale (VND)
                  </label>
                  <input
                    required
                    type="number"
                    className={inputCls}
                    placeholder="50000"
                    value={productForm.discountPrice}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Số lượng bán
                  </label>
                  <input
                    required
                    type="number"
                    className={inputCls}
                    value={productForm.quantityLimit}
                    onChange={(e) => setProductForm({ ...productForm, quantityLimit: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
                >
                  XÁC NHẬN THÊM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashSales;
