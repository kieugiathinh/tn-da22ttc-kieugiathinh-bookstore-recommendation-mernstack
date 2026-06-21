import {
  FaPlus, FaTrash, FaCalendarAlt, FaClock, FaTimes,
  FaEdit, FaToggleOn, FaToggleOff, FaChevronDown, FaChevronUp,
  FaSearch, FaCheck
} from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import PageHeader from "../../components/admin/PageHeader";
import Button from "../../components/common/Button";
import InputField from "../../components/common/InputField";
import Modal from "../../components/common/Modal";
import IconButton from "../../components/common/IconButton";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/common/Badge";

const PREVIEW_LIMIT = 3;

const FlashSales = () => {
  const [flashSales, setFlashSales] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTER & SEARCH CHIẾN DỊCH ---
  const [searchSale, setSearchSale] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // --- STATE QUẢN LÝ XEM THÊM ---
  const [expandedSales, setExpandedSales] = useState({});

  // --- STATE MODAL TẠO / SỬA CHIẾN DỊCH ---
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [saleForm, setSaleForm] = useState({ name: "", startTime: "", endTime: "", isActive: true });

  // --- STATE MODAL THÊM SẢN PHẨM (BULK) ---
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  
  // Bulk selection & settings
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]); // Array of IDs
  const [bulkDiscount, setBulkDiscount] = useState("");
  const [bulkLimit, setBulkLimit] = useState("");
  const [customSettings, setCustomSettings] = useState({}); // { productId: { discountPrice, quantityLimit } }

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

  useEffect(() => { fetchData(); }, []);

  const toggleExpand = (saleId) => {
    setExpandedSales((prev) => ({ ...prev, [saleId]: !prev[saleId] }));
  };

  // Format Date Helper
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const formatDateDisplay = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  // --- HANDLERS MỞ MODAL ---
  const handleOpenCreate = () => {
    setEditingSaleId(null);
    setSaleForm({ name: "", startTime: "", endTime: "", isActive: true });
    setShowSaleModal(true);
  };

  const handleOpenEdit = (sale) => {
    setEditingSaleId(sale._id);
    setSaleForm({ name: sale.name, startTime: formatDateForInput(sale.startTime), endTime: formatDateForInput(sale.endTime), isActive: sale.isActive });
    setShowSaleModal(true);
  };

  const handleOpenAddProducts = (saleId) => {
    setSelectedSaleId(saleId);
    setSelectedProducts([]);
    setCustomSettings({});
    setBulkDiscount("");
    setBulkLimit("");
    setSearchProduct("");
    setShowProductModal(true);
  };

  // --- XỬ LÝ API ---
  const handleSaveSale = async (e) => {
    e.preventDefault();
    try {
      if (editingSaleId) {
        await userRequest.put(`/flash-sales/${editingSaleId}`, saleForm);
        Swal.fire({ title: "Thành công", text: "Cập nhật chiến dịch thành công", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        await userRequest.post("/flash-sales", saleForm);
        Swal.fire({ title: "Thành công", text: "Đã tạo đợt Flash Sale mới", icon: "success", timer: 1500, showConfirmButton: false });
      }
      setShowSaleModal(false);
      fetchData();
    } catch (error) {
      Swal.fire("Lỗi", error.response?.data?.message || "Thất bại", "error");
    }
  };

  const handleToggleActive = async (sale) => {
    try {
      await userRequest.put(`/flash-sales/${sale._id}`, { isActive: !sale.isActive });
      fetchData();
    } catch (error) { console.error(error); }
  };

  const handleDeleteSale = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa?", text: "Chiến dịch này sẽ bị xóa vĩnh viễn!", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/flash-sales/${id}`);
        Swal.fire({ title: "Đã xóa", icon: "success", timer: 1200, showConfirmButton: false });
        fetchData();
      } catch { Swal.fire("Lỗi", "Không thể xóa", "error"); }
    }
  };

  // --- LỌC CHIẾN DỊCH ---
  const filteredSales = useMemo(() => {
    return flashSales.filter(sale => {
      const matchSearch = !searchSale || sale.name.toLowerCase().includes(searchSale.toLowerCase());
      const matchStatus = filterStatus === "all" ? true : filterStatus === "active" ? sale.isActive : !sale.isActive;
      return matchSearch && matchStatus;
    });
  }, [flashSales, searchSale, filterStatus]);

  // --- BULK ADD LOGIC ---
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => p.title.toLowerCase().includes(searchProduct.toLowerCase()));
  }, [allProducts, searchProduct]);

  const toggleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleBulkApply = () => {
    if (!bulkDiscount && !bulkLimit) return;
    const newSettings = { ...customSettings };
    selectedProducts.forEach(id => {
      if (!newSettings[id]) newSettings[id] = {};
      const product = allProducts.find(p => p._id === id);
      if (bulkDiscount && product) {
        // Nếu nhập % (có chữ %) -> tính theo %
        if (bulkDiscount.includes('%')) {
          const pct = parseFloat(bulkDiscount);
          newSettings[id].discountPrice = product.originalPrice * (1 - pct/100);
        } else {
          newSettings[id].discountPrice = parseFloat(bulkDiscount);
        }
      }
      if (bulkLimit) newSettings[id].quantityLimit = parseInt(bulkLimit);
    });
    setCustomSettings(newSettings);
    Swal.fire({ title: "Đã áp dụng", text: "Đã cập nhật giá cho các sách đang chọn", icon: "success", timer: 1000, showConfirmButton: false });
  };

  const handleUpdateCustomSetting = (id, field, value) => {
    setCustomSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSubmitBulkAdd = async () => {
    if (selectedProducts.length === 0) return Swal.fire("Lỗi", "Vui lòng chọn ít nhất 1 sách", "error");
    
    const payload = selectedProducts.map(id => {
      const product = allProducts.find(p => p._id === id);
      const settings = customSettings[id] || {};
      return {
        productId: id,
        discountPrice: settings.discountPrice || product.originalPrice,
        quantityLimit: settings.quantityLimit || 10
      };
    });

    try {
      await userRequest.post(`/flash-sales/${selectedSaleId}/add-multiple-products`, { products: payload });
      Swal.fire({ title: "Thành công", text: `Đã thêm ${payload.length} sách vào Flash Sale`, icon: "success", timer: 1500, showConfirmButton: false });
      setShowProductModal(false);
      fetchData();
    } catch (error) {
      Swal.fire("Lỗi", error.response?.data?.message || "Thất bại", "error");
    }
  };

  const handleRemoveProduct = async (saleId, productId) => {
    const result = await Swal.fire({
      title: "Xóa sách này?", text: "Sách sẽ bị loại khỏi đợt Flash Sale này.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Xóa", cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/flash-sales/${saleId}/remove-product/${productId}`);
        fetchData();
        Swal.fire({ title: "Đã xóa", icon: "success", timer: 1200, showConfirmButton: false });
      } catch { Swal.fire("Lỗi", "Không thể xóa sản phẩm", "error"); }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Flash Sale"
        subtitle="Quản lý các đợt giảm giá chớp nhoáng"
        action={<button onClick={handleOpenCreate} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all"><FaPlus size={14} /> Tạo Chiến Dịch Mới</button>}
      />

      {/* ── TOOLBAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full items-center">
          <div className="relative w-full sm:max-w-xs">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Tìm tên chiến dịch..."
              value={searchSale}
              onChange={e => setSearchSale(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all"
            />
          </div>
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={`pl-4 pr-8 py-2.5 text-sm font-semibold rounded-xl border bg-gray-50 focus:outline-none focus:border-primary cursor-pointer transition-all appearance-none ${filterStatus !== "all" ? "border-primary text-primary bg-orange-50" : "border-gray-200 text-gray-700"}`}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đã tắt</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredSales.map((sale) => {
          const isExpanded = expandedSales[sale._id];
          const productsToShow = isExpanded ? sale.products : sale.products.slice(0, PREVIEW_LIMIT);
          const hiddenCount = sale.products.length - PREVIEW_LIMIT;

          return (
            <div
              key={sale._id}
              className={`overflow-hidden rounded-2xl border shadow-sm transition-all ${
                sale.isActive ? "border-orange-200 bg-white" : "border-gray-200 bg-gray-50/50 opacity-80"
              }`}
            >
              {/* Header Card */}
              <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b px-6 py-4 ${
                sale.isActive ? "bg-orange-50/30 border-orange-100" : "bg-gray-50 border-gray-100"
              }`}>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{sale.name}</h3>
                    <button onClick={() => handleToggleActive(sale)} className="text-xl transition-colors hover:opacity-80 focus:outline-none"
                      title={sale.isActive ? "Tắt chiến dịch" : "Bật chiến dịch"}>
                      {sale.isActive ? <FaToggleOn className="text-primary" /> : <FaToggleOff className="text-gray-400" />}
                    </button>
                    {!sale.isActive && <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-md uppercase tracking-wide">Đã tắt</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <span className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 shadow-sm border border-gray-100">
                      <FaCalendarAlt className="text-orange-400" /> {formatDateDisplay(sale.startTime)}
                    </span>
                    <span>➔</span>
                    <span className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 shadow-sm border border-gray-100">
                      <FaClock className="text-orange-400" /> {formatDateDisplay(sale.endTime)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-2">
                  <button onClick={() => handleOpenEdit(sale)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-500 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors">
                    <FaEdit size={12} /> Sửa
                  </button>
                  <button onClick={() => handleDeleteSale(sale._id)} className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors">
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>

              {/* Body: Danh sách sản phẩm */}
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-bold text-gray-800">
                    Sản phẩm khuyến mãi <span className="text-gray-400 text-sm font-semibold ml-1">({sale.products.length})</span>
                  </h4>
                  <button onClick={() => handleOpenAddProducts(sale._id)}
                    className="flex items-center gap-1.5 text-sm font-bold text-primary bg-orange-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-orange-100">
                    <FaPlus size={12} /> Thêm sách
                  </button>
                </div>

                {sale.products.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 flex flex-col items-center gap-2 text-sm text-gray-400 bg-gray-50/50">
                    <FaTimes size={24} className="text-gray-300" />
                    <p className="font-medium">Chưa có sách nào trong đợt sale này.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            <th className="px-5 py-3.5">Sách</th>
                            <th className="px-5 py-3.5">Giá Gốc</th>
                            <th className="px-5 py-3.5 text-red-500">Giá Sale</th>
                            <th className="px-5 py-3.5">Giới hạn</th>
                            <th className="px-5 py-3.5">Tiến độ</th>
                            <th className="px-5 py-3.5 text-center">Bỏ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                          {productsToShow.map((item, idx) => (
                            <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                              <td className="px-5 py-3.5 flex items-center gap-3">
                                <img src={item.product?.img || "https://placehold.co/40x56"}
                                  className="h-12 w-9 rounded-md border border-gray-200 object-cover shadow-sm bg-gray-50" alt="" />
                                <div>
                                  <div className="font-bold text-gray-800 text-[13px] line-clamp-1 max-w-[200px]" title={item.product?.title}>
                                    {item.product?.title}
                                  </div>
                                  <div className="text-[10px] font-semibold text-gray-400 mt-0.5 tracking-wider">ID: {item.product?._id.slice(-6).toUpperCase()}</div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-gray-400 font-semibold line-through text-xs">{item.product?.originalPrice?.toLocaleString()} đ</td>
                              <td className="px-5 py-3.5 font-black text-red-500 text-sm">{item.discountPrice?.toLocaleString()} đ</td>
                              <td className="px-5 py-3.5 font-bold text-gray-700">{item.quantityLimit}</td>
                              <td className="px-5 py-3.5 w-40">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 mb-1.5">
                                  <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                                    style={{ width: `${Math.min((item.soldCount / item.quantityLimit) * 100, 100)}%` }}></div>
                                </div>
                                <div className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đã bán {item.soldCount}</div>
                              </td>
                              <td className="px-5 py-3.5 text-center">
                                <button className="flex items-center justify-center w-7 h-7 mx-auto rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                  onClick={() => handleRemoveProduct(sale._id, item.product?._id)}>
                                  <FaTimes size={12} />
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
                        <button onClick={() => toggleExpand(sale._id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-primary shadow-sm transition-colors hover:bg-orange-50 border border-orange-100">
                          {isExpanded ? <><FaChevronUp size={10} /> Thu gọn</> : <><FaChevronDown size={10} /> Xem thêm {hiddenCount} sách nữa</>}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filteredSales.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-gray-400 bg-white">
            <FaClock size={40} className="text-gray-200 mb-3" />
            <span className="font-bold">Không tìm thấy chiến dịch nào</span>
          </div>
        )}
      </div>

      {/* --- MODAL TẠO / SỬA CHIẾN DỊCH --- */}
      <Modal isOpen={showSaleModal} onClose={() => setShowSaleModal(false)}
        title={editingSaleId ? "Cập Nhật Chiến Dịch" : "Tạo Chiến Dịch Mới"}>
        <form onSubmit={handleSaveSale} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tên chiến dịch <span className="text-red-500">*</span></label>
            <input type="text" required placeholder="VD: Sale Tết 2025" value={saleForm.name} onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Bắt đầu <span className="text-red-500">*</span></label>
              <input type="datetime-local" required value={saleForm.startTime} onChange={(e) => setSaleForm({ ...saleForm, startTime: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Kết thúc <span className="text-red-500">*</span></label>
              <input type="datetime-local" required value={saleForm.endTime} onChange={(e) => setSaleForm({ ...saleForm, endTime: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
            </div>
          </div>
          {editingSaleId && (
            <div className="flex items-center mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <input type="checkbox" id="isActiveSale" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                checked={saleForm.isActive} onChange={(e) => setSaleForm({ ...saleForm, isActive: e.target.checked })} />
              <label htmlFor="isActiveSale" className="ml-2 text-sm font-bold text-gray-800 cursor-pointer">Chiến dịch đang hoạt động</label>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" onClick={() => setShowSaleModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Hủy</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all">{editingSaleId ? "LƯU THAY ĐỔI" : "TẠO CHIẾN DỊCH"}</button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL THÊM SẢN PHẨM (BULK) --- */}
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Thêm Sách Vào Sale" size="2xl">
        <div className="flex flex-col h-[80vh] bg-white">
          {/* Header Modal - Bulk Settings */}
          <div className="p-5 border-b border-gray-100 bg-gray-50 shrink-0">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Áp dụng hàng loạt cho các sách đang chọn</h4>
            <div className="flex flex-wrap items-center gap-3">
              <input type="text" placeholder="Giá Sale (VD: 50000 hoặc 20%)" value={bulkDiscount} onChange={e => setBulkDiscount(e.target.value)}
                className="w-56 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
              <input type="number" placeholder="Giới hạn SL (VD: 50)" value={bulkLimit} onChange={e => setBulkLimit(e.target.value)}
                className="w-40 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary" />
              <button onClick={handleBulkApply} className="px-4 py-2 bg-orange-100 text-primary font-bold text-sm rounded-lg hover:bg-orange-200 transition-colors">
                Áp Dụng
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-gray-100 shrink-0 relative">
            <FaSearch className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
            <input type="text" placeholder="Tìm kiếm sách theo tên..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-gray-50 focus:bg-white transition-all" />
          </div>

          {/* Danh sách sách (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredProducts.map(product => {
              const isSelected = selectedProducts.includes(product._id);
              const customSettingsForProduct = customSettings[product._id] || {};
              const currentSalePrice = customSettingsForProduct.discountPrice !== undefined ? customSettingsForProduct.discountPrice : product.originalPrice;
              const currentLimit = customSettingsForProduct.quantityLimit !== undefined ? customSettingsForProduct.quantityLimit : 10;
              
              return (
                <div key={product._id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isSelected ? 'border-primary bg-orange-50/20' : 'border-gray-100 hover:border-gray-300'}`}>
                  {/* Checkbox */}
                  <div className="shrink-0 flex items-center justify-center">
                    <button type="button" onClick={() => toggleSelectProduct(product._id)}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-transparent'}`}>
                      <FaCheck size={10} />
                    </button>
                  </div>
                  
                  {/* Info */}
                  <div className="flex items-center gap-3 w-1/3 shrink-0">
                    <img src={product.img || "https://placehold.co/40x56"} alt="" className="w-10 h-14 object-cover rounded shadow-sm border border-gray-200" />
                    <div>
                      <p className="font-bold text-gray-800 text-[13px] line-clamp-2">{product.title}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Giá gốc: <span className="line-through">{product.originalPrice?.toLocaleString()}đ</span></p>
                    </div>
                  </div>

                  {/* Individual Settings (Only show if selected) */}
                  <div className={`flex-1 flex items-center justify-end gap-3 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="flex flex-col items-end">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giá Sale</label>
                      <div className="flex items-center">
                        <input type="number" value={currentSalePrice} onChange={e => handleUpdateCustomSetting(product._id, 'discountPrice', Number(e.target.value))}
                          className="w-24 px-2 py-1.5 text-sm font-bold text-red-500 border border-gray-200 rounded-md focus:outline-none focus:border-red-400 text-right" />
                        <span className="ml-1 text-xs font-semibold text-gray-500">đ</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Giới hạn</label>
                      <input type="number" value={currentLimit} onChange={e => handleUpdateCustomSetting(product._id, 'quantityLimit', Number(e.target.value))}
                        className="w-20 px-2 py-1.5 text-sm font-bold text-gray-700 border border-gray-200 rounded-md focus:outline-none focus:border-primary text-right" />
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">Không tìm thấy sách nào.</div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-600">Đã chọn: <span className="text-primary text-lg">{selectedProducts.length}</span> sách</span>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Hủy</button>
              <button onClick={handleSubmitBulkAdd} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2">
                <FaCheck size={14} /> XÁC NHẬN THÊM
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FlashSales;
