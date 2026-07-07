import LoadingSpinner from "../../components/admin/LoadingSpinner";
import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaImage, FaUpload, FaCrown, FaStar, FaArrowUp, FaEdit, FaTimes } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";

const Banners = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState("main"); // "main", "sub", "top"
  
  const [banners, setBanners] = useState([]);
  const [activeTab, setActiveTab] = useState("main");
  const [uploadStatus, setUploadStatus] = useState("");
  const [loadingList, setLoadingList] = useState(true);

  // Edit State
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  // 1. Hàm Tải danh sách Banner
  const fetchBanners = async () => {
    try {
      setLoadingList(true);
      const res = await userRequest.get("/banners");
      setBanners(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách banner:", error);
      toast.error("Không thể tải danh sách banner");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  // 2. Xử lý chọn ảnh
  const imageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setUploadStatus("Đã chọn ảnh mới");
    }
  };

  // 3. Xử lý Edit Banner
  const handleEdit = (banner) => {
    setIsEdit(true);
    setEditId(banner._id);
    setTitle(banner.title || "");
    setSubtitle(banner.subtitle || "");
    setType(banner.type || "main");
    setSelectedFile(null);
    setPreviewImage(banner.img); // Hiển thị ảnh cũ
    setUploadStatus("");
    
    // Auto switch tab if needed
    if (banner.type) setActiveTab(banner.type);
    else setActiveTab("main");
  };

  const cancelEdit = () => {
    setIsEdit(false);
    setEditId(null);
    setTitle("");
    setSubtitle("");
    setType("main");
    setSelectedFile(null);
    setPreviewImage(null);
    setUploadStatus("");
  };

  // 4. Xử lý Upload và Lưu (Tạo Mới / Cập Nhật)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!isEdit && !selectedFile) {
      toast.warning("Vui lòng chọn ảnh banner để tạo mới!");
      return;
    }

    const promise = new Promise(async (resolve, reject) => {
      try {
        setUploadStatus("Đang xử lý...");
        let finalImageUrl = previewImage; // Mặc định dùng ảnh hiện tại nếu đang edit

        // Nếu có chọn ảnh mới, thực hiện upload lên Cloudinary
        if (selectedFile) {
          setUploadStatus("Đang tải ảnh lên Cloudinary...");
          const data = new FormData();
          data.append("file", selectedFile);
          data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

          const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
          finalImageUrl = uploadRes.data.url;
        }

        const payload = { img: finalImageUrl, title, subtitle, type };

        if (isEdit) {
          setUploadStatus("Đang cập nhật banner...");
          await userRequest.put(`/banners/${editId}`, payload);
        } else {
          setUploadStatus("Đang lưu banner mới...");
          await userRequest.post("/banners", payload);
        }

        cancelEdit(); // Reset form
        fetchBanners();
        resolve();
      } catch (error) {
        console.error(error);
        setUploadStatus("Lỗi");
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: isEdit ? "Đang cập nhật banner..." : "Đang tạo banner mới...",
      success: isEdit ? "Cập nhật thành công!" : "Tạo banner mới thành công!",
      error: "Có lỗi xảy ra, vui lòng thử lại.",
    });
  };

  // 5. Xử lý Xóa Banner
  const handleDelete = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Xóa Banner?", text: "Hành động này không thể hoàn tác!",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay", cancelButtonText: "Hủy",
    });
    if (isConfirmed) {
      try {
        await userRequest.delete(`/banners/${id}`);
        toast.success("Đã xóa banner thành công");
        fetchBanners();
        if (editId === id) cancelEdit(); // Nếu đang sửa banner vừa bị xóa
      } catch {
        toast.error("Lỗi khi xóa banner");
      }
    }
  };

  // 6. Ẩn hiện Banner
  const handleToggleActive = async (banner) => {
    try {
      await userRequest.put(`/banners/${banner._id}`, { isActive: !banner.isActive });
      fetchBanners();
      toast.success(!banner.isActive ? "Đã hiện banner" : "Đã ẩn banner");
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const getFilteredBanners = () => {
    return banners.filter((b) => {
      if (activeTab === "main") return b.type === "main" || !b.type;
      return b.type === activeTab;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Banner Quảng cáo"
        subtitle="Thiết lập các banner hiển thị trên trang chủ"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start max-w-[1400px]">
        {/* CỘT TRÁI: Danh sách Banner (Chiếm 7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {/* TABS */}
          <div className="flex bg-gray-50/50 border-b border-gray-100 p-2 gap-2">
            <button onClick={() => setActiveTab("main")}
              className={`flex-1 py-3 px-2 text-xs font-bold text-center rounded-xl transition-all flex flex-col items-center gap-1 ${
                activeTab === "main" ? "bg-white text-primary shadow-sm border border-orange-100" : "text-gray-500 hover:bg-gray-100 border border-transparent"
              }`}>
              <FaCrown size={14} className={activeTab === "main" ? "text-orange-400" : "text-gray-400"} />
              <span>Banner Chính ({banners.filter((b) => b.type === "main" || !b.type).length})</span>
            </button>
            <button onClick={() => setActiveTab("sub")}
              className={`flex-1 py-3 px-2 text-xs font-bold text-center rounded-xl transition-all flex flex-col items-center gap-1 ${
                activeTab === "sub" ? "bg-white text-primary shadow-sm border border-orange-100" : "text-gray-500 hover:bg-gray-100 border border-transparent"
              }`}>
              <FaStar size={14} className={activeTab === "sub" ? "text-orange-400" : "text-gray-400"} />
              <span>Banner Phụ ({banners.filter((b) => b.type === "sub").length})</span>
            </button>
            <button onClick={() => setActiveTab("top")}
              className={`flex-1 py-3 px-2 text-xs font-bold text-center rounded-xl transition-all flex flex-col items-center gap-1 ${
                activeTab === "top" ? "bg-white text-primary shadow-sm border border-orange-100" : "text-gray-500 hover:bg-gray-100 border border-transparent"
              }`}>
              <FaArrowUp size={14} className={activeTab === "top" ? "text-orange-400" : "text-gray-400"} />
              <span>Banner Top ({banners.filter((b) => b.type === "top").length})</span>
            </button>
          </div>

          {/* DANH SÁCH */}
          <div className="p-5 flex-1 min-h-[400px]">
            {loadingList ? (
              <LoadingSpinner className="py-10" />
            ) : getFilteredBanners().length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
                <FaImage size={40} className="text-gray-300 mb-3" />
                <span className="font-bold text-sm">Chưa có banner nào ở mục này.</span>
              </div>
            ) : (
              <div className="flex max-h-[600px] flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {getFilteredBanners().map((banner) => (
                  <div key={banner._id}
                    className={`group relative flex items-center justify-between rounded-2xl border p-4 transition-all duration-200
                      ${!banner.isActive ? "border-gray-200 bg-gray-50/80 opacity-80" : "border-orange-100 bg-white hover:border-primary hover:shadow-[0_4px_12px_rgba(249,115,22,0.1)]"}
                      ${editId === banner._id ? "ring-2 ring-primary bg-orange-50/30" : ""}
                    `}
                  >
                    {/* Ảnh Banner */}
                    <div className="relative shrink-0 border border-gray-100 rounded-xl overflow-hidden bg-gray-100">
                      <img src={banner.img || "https://placehold.co/150x75?text=Banner"} alt={banner.title} className="h-24 w-40 object-cover" />
                      {!banner.isActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-[1px]">
                          <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-black text-gray-800 shadow-sm uppercase tracking-widest">ĐÃ ẨN</span>
                        </div>
                      )}
                    </div>

                    {/* Thông tin */}
                    <div className="mx-5 min-w-0 flex-1">
                      <h3 className={`truncate text-sm font-black tracking-wide ${!banner.isActive ? "text-gray-500" : "text-gray-800"}`}>
                        {banner.title || "Không tiêu đề"}
                      </h3>
                      <p className="mt-1 truncate text-xs font-medium text-gray-500">{banner.subtitle || "Không mô tả phụ"}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0 border-l border-gray-100 pl-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(banner)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-blue-500 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors" title="Sửa Banner">
                          <FaEdit size={13} />
                        </button>
                        <button onClick={() => handleDelete(banner._id)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors" title="Xóa Banner">
                          <FaTrash size={12} />
                        </button>
                      </div>
                      <button onClick={() => handleToggleActive(banner)}
                        className={`flex items-center justify-center w-full py-1.5 rounded-lg transition-colors border text-xs font-bold gap-1.5 ${banner.isActive ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                        title={banner.isActive ? "Nhấn để Ẩn" : "Nhấn để Hiện"}
                      >
                        {banner.isActive ? <><FaToggleOn size={14} /> BẬT</> : <><FaToggleOff size={14} /> ẨN</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: Form Tạo / Sửa Banner (Chiếm 5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm lg:sticky lg:top-6 overflow-hidden flex flex-col">
          <div className={`border-b border-gray-100 px-6 py-5 flex items-center justify-between gap-3 ${isEdit ? "bg-gradient-to-r from-blue-50 to-white" : "bg-gradient-to-r from-orange-50 to-white"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${isEdit ? "bg-blue-500" : "bg-primary"}`}>
                {isEdit ? <FaEdit size={12} /> : <FaPlus size={12} />}
              </div>
              <h2 className="text-base font-bold text-gray-800 tracking-wide">
                {isEdit ? "Cập Nhật Banner" : "Tạo Banner Mới"}
              </h2>
            </div>
            {isEdit && (
              <button onClick={cancelEdit} className="text-xs font-bold text-gray-500 hover:text-red-500 flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 hover:border-red-200 transition-colors">
                <FaTimes /> HỦY
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
            {/* Input Ảnh */}
            <div>
              <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wider">
                1. Ảnh Banner {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className={`group relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 transition-colors ${isEdit ? "border-blue-200 bg-blue-50/30 hover:bg-blue-50" : "border-orange-200 bg-orange-50/50 hover:bg-orange-50 hover:border-primary"}`}>
                {!previewImage ? (
                  <label htmlFor="file" className="flex h-full w-full cursor-pointer flex-col items-center justify-center">
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border transition-transform group-hover:scale-110 ${isEdit ? "text-blue-500 border-blue-100" : "text-primary border-orange-100"}`}>
                      <FaUpload size={16} />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Tải ảnh lên</span>
                    <span className="mt-1 text-[11px] font-semibold text-gray-400 text-center">Tỷ lệ 16:9 (Main/Sub) hoặc 21:1 (Top)</span>
                  </label>
                ) : (
                  <div className="relative h-full w-full">
                    <img src={previewImage} className="h-full w-full rounded-xl object-contain bg-white" alt="Preview" />
                    <label htmlFor="file" className="absolute bottom-2 right-2 cursor-pointer rounded-lg bg-gray-900/80 px-3 py-1.5 text-[11px] font-bold tracking-wider text-white hover:bg-black transition-colors backdrop-blur-sm shadow-lg">
                      ĐỔI ẢNH {isEdit && "MỚI"}
                    </label>
                  </div>
                )}
                <input type="file" id="file" onChange={imageChange} className="hidden" accept="image/*" />
              </div>
              {uploadStatus && (
                <p className={`mt-2 text-center text-[11px] font-bold uppercase tracking-wider ${uploadStatus.includes("Lỗi") ? "text-red-500" : isEdit ? "text-blue-500" : "text-primary"}`}>
                  {uploadStatus}
                </p>
              )}
            </div>

            {/* Inputs Text */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wider">2. Tiêu đề chính</label>
                <input type="text" placeholder="VD: Siêu Sale Mùa Hè" value={title} onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm font-semibold border rounded-xl focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-all placeholder:font-normal ${isEdit ? "border-blue-100 focus:border-blue-500 focus:ring-blue-500/10" : "border-gray-200 focus:border-primary focus:ring-primary/10"}`} />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wider">3. Mô tả phụ</label>
                <input type="text" placeholder="VD: Giảm giá lên đến 50%" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm font-semibold border rounded-xl focus:outline-none focus:ring-2 bg-gray-50 focus:bg-white transition-all placeholder:font-normal ${isEdit ? "border-blue-100 focus:border-blue-500 focus:ring-blue-500/10" : "border-gray-200 focus:border-primary focus:ring-primary/10"}`} />
              </div>
            </div>

            {/* Select Type */}
            <div>
              <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wider">4. Vị trí hiển thị</label>
              <div className="grid grid-cols-3 gap-2">
                <label className={`flex flex-col cursor-pointer items-center justify-center gap-1.5 rounded-xl border p-3 transition-colors ${type === "main" ? (isEdit ? "border-blue-500 bg-blue-50 text-blue-600" : "border-primary bg-orange-50 text-primary shadow-sm") : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}>
                  <input type="radio" name="bannerType" value="main" className="hidden" checked={type === "main"} onChange={(e) => setType(e.target.value)} />
                  <FaCrown size={14} className={type === "main" ? (isEdit ? "text-blue-500" : "text-primary") : "text-gray-400"} />
                  <span className="text-[11px] font-bold text-center">Slider Chính</span>
                </label>
                <label className={`flex flex-col cursor-pointer items-center justify-center gap-1.5 rounded-xl border p-3 transition-colors ${type === "sub" ? (isEdit ? "border-blue-500 bg-blue-50 text-blue-600" : "border-primary bg-orange-50 text-primary shadow-sm") : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}>
                  <input type="radio" name="bannerType" value="sub" className="hidden" checked={type === "sub"} onChange={(e) => setType(e.target.value)} />
                  <FaStar size={14} className={type === "sub" ? (isEdit ? "text-blue-500" : "text-primary") : "text-gray-400"} />
                  <span className="text-[11px] font-bold text-center">Banner Phụ</span>
                </label>
                <label className={`flex flex-col cursor-pointer items-center justify-center gap-1.5 rounded-xl border p-3 transition-colors ${type === "top" ? (isEdit ? "border-blue-500 bg-blue-50 text-blue-600" : "border-primary bg-orange-50 text-primary shadow-sm") : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}>
                  <input type="radio" name="bannerType" value="top" className="hidden" checked={type === "top"} onChange={(e) => setType(e.target.value)} />
                  <FaArrowUp size={14} className={type === "top" ? (isEdit ? "text-blue-500" : "text-primary") : "text-gray-400"} />
                  <span className="text-[11px] font-bold text-center">Topbar</span>
                </label>
              </div>
            </div>

            {/* Nút Upload / Save */}
            <div className="pt-2">
              <button type="submit" disabled={uploadStatus.includes("Đang")}
                className={`w-full py-3.5 rounded-xl text-sm font-black tracking-widest text-white shadow-md disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${isEdit ? "bg-blue-500 hover:bg-blue-600 shadow-blue-500/30" : "bg-primary hover:bg-primary/90 shadow-[0_4px_12px_rgba(249,115,22,0.3)]"}`}>
                {uploadStatus.includes("Đang") ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    {isEdit ? "ĐANG CẬP NHẬT..." : "ĐANG TẢI LÊN..."}
                  </>
                ) : (
                  <>
                    {isEdit ? <><FaEdit size={14} /> LƯU THAY ĐỔI</> : <><FaUpload size={14} /> TẢI LÊN & LƯU</>}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Banners;
