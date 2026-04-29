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

const PREVIEW_LIMIT = 3;

const FlashSales = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- STATE QUẢN LÝ XEM THÊM ---
  const [expandedSales, setExpandedSales] = useState({});

  // --- STATE MODAL TẠO / SỬA (Sửa tên biến ở đây cho chuẩn) ---
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
    setShowSaleModal(true); // Dùng biến showSaleModal
  };

  const handleOpenEdit = (sale) => {
    setEditingSaleId(sale._id);
    setSaleForm({
      name: sale.name,
      startTime: formatDateForInput(sale.startTime),
      endTime: formatDateForInput(sale.endTime),
      isActive: sale.isActive,
    });
    setShowSaleModal(true); // Dùng biến showSaleModal
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
      setShowSaleModal(false); // Đóng modal
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

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto relative">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          ⚡ Quản lý Flash Sale
        </h1>
        <button
          className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
          onClick={handleOpenCreate}
        >
          <FaPlus className="mr-2" /> Tạo Chiến Dịch Mới
        </button>
      </div>

      <div className="grid gap-8">
        {flashSales.map((sale) => {
          const isExpanded = expandedSales[sale._id];
          const productsToShow = isExpanded
            ? sale.products
            : sale.products.slice(0, PREVIEW_LIMIT);
          const hiddenCount = sale.products.length - PREVIEW_LIMIT;

          return (
            <div
              key={sale._id}
              className={`bg-white rounded-xl shadow-md border-l-4 overflow-hidden ${
                sale.isActive ? "border-l-green-500" : "border-l-gray-400"
              }`}
            >
              {/* Header Card */}
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-gray-800">
                      {sale.name}
                    </h3>
                    <button
                      onClick={() => handleToggleActive(sale)}
                      className="focus:outline-none text-2xl transition-colors"
                      title={
                        sale.isActive ? "Tắt chiến dịch" : "Bật chiến dịch"
                      }
                    >
                      {sale.isActive ? (
                        <FaToggleOn className="text-green-500 cursor-pointer" />
                      ) : (
                        <FaToggleOff className="text-gray-400 cursor-pointer" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                    <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      <FaCalendarAlt className="mr-2" />{" "}
                      {formatDateDisplay(sale.startTime)}
                    </span>
                    <span>➔</span>
                    <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      <FaClock className="mr-2" />{" "}
                      {formatDateDisplay(sale.endTime)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleOpenEdit(sale)}
                    className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 font-medium text-sm"
                  >
                    <FaEdit className="mr-1" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteSale(sale._id)}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Body: Danh sách sản phẩm */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-gray-700">
                    Sản phẩm khuyến mãi ({sale.products.length})
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedSaleId(sale._id);
                      setShowProductModal(true);
                    }}
                    className="flex items-center text-purple-600 hover:text-purple-800 font-semibold text-sm"
                  >
                    <FaPlus className="mr-1" /> Thêm sách vào đây
                  </button>
                </div>

                {sale.products.length === 0 ? (
                  <p className="text-gray-400 italic text-sm text-center py-4 border-2 border-dashed rounded-lg">
                    Chưa có sách nào trong đợt sale này.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-600">
                              Sách
                            </th>
                            <th className="px-4 py-2 text-left text-gray-600">
                              Giá Gốc
                            </th>
                            <th className="px-4 py-2 text-left text-red-600 font-bold">
                              Giá Sale
                            </th>
                            <th className="px-4 py-2 text-left text-gray-600">
                              Giới hạn
                            </th>
                            <th className="px-4 py-2 text-left text-gray-600">
                              Tiến độ
                            </th>
                            <th className="px-4 py-2 text-center text-gray-600">
                              Xóa
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {productsToShow.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 flex items-center">
                                <img
                                  src={item.product?.img}
                                  className="w-10 h-14 object-cover rounded shadow-sm mr-3"
                                  alt=""
                                />
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {item.product?.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.product?._id}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-500 decoration-slate-400 line-through">
                                {item.product?.originalPrice?.toLocaleString()}{" "}
                                đ
                              </td>
                              <td className="px-4 py-3 font-bold text-red-600 text-base">
                                {item.discountPrice?.toLocaleString()} đ
                              </td>
                              <td className="px-4 py-3">
                                {item.quantityLimit}
                              </td>
                              <td className="px-4 py-3 w-32">
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        (item.soldCount / item.quantityLimit) *
                                          100,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500 text-right">
                                  {item.soldCount} đã bán
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() =>
                                    handleRemoveProduct(
                                      sale._id,
                                      item.product?._id
                                    )
                                  }
                                  className="text-red-400 hover:text-red-600 transition"
                                >
                                  <FaTimes />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* NÚT SHOW MORE / SHOW LESS */}
                    {sale.products.length > PREVIEW_LIMIT && (
                      <div className="text-center mt-3 border-t border-dashed pt-2">
                        <button
                          onClick={() => toggleExpand(sale._id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center w-full transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <FaChevronUp className="mr-1" /> Thu gọn
                            </>
                          ) : (
                            <>
                              <FaChevronDown className="mr-1" /> Xem thêm{" "}
                              {hiddenCount} sách nữa
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
      </div>

      {/* --- MODAL TẠO / SỬA CHIẾN DỊCH --- */}
      {/* ĐÃ SỬA TÊN BIẾN showCreateModal -> showSaleModal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSaleId ? "Cập Nhật Chiến Dịch" : "Tạo Chiến Dịch Mới"}
              </h2>
              <button
                onClick={() => setShowSaleModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSale} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên chiến dịch
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="VD: Sale Tết 2025"
                  value={saleForm.name}
                  onChange={(e) =>
                    setSaleForm({ ...saleForm, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Bắt đầu
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    value={saleForm.startTime}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Kết thúc
                  </label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                    value={saleForm.endTime}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, endTime: e.target.value })
                    }
                  />
                </div>
              </div>
              {editingSaleId && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    checked={saleForm.isActive}
                    onChange={(e) =>
                      setSaleForm({ ...saleForm, isActive: e.target.checked })
                    }
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm font-medium text-gray-900"
                  >
                    Đang hoạt động
                  </label>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-bold shadow-lg transition transform hover:-translate-y-0.5"
              >
                {editingSaleId ? "LƯU THAY ĐỔI" : "TẠO CHIẾN DỊCH"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Sản Phẩm (Giữ nguyên) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-xl font-bold text-gray-800">
                Thêm Sách Vào Sale
              </h2>
              <button onClick={() => setShowProductModal(false)}>
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Chọn sách
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  value={productForm.productId}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      productId: e.target.value,
                    })
                  }
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Giá Sale (VND)
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="50000"
                    value={productForm.discountPrice}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        discountPrice: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Số lượng bán
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                    value={productForm.quantityLimit}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        quantityLimit: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg"
              >
                XÁC NHẬN THÊM
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashSales;
