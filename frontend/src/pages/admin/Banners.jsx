import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import IconButton from "../../components/common/IconButton";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";

const Banners = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [banners, setBanners] = useState([]);

  const [uploadStatus, setUploadStatus] = useState("");
  const [loadingList, setLoadingList] = useState(true);

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
      setSelectedImage(e.target.files[0]);
      setUploadStatus("Đã chọn ảnh");
    }
  };

  // 3. Xử lý Upload và Lưu
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      toast.warning("Vui lòng chọn ảnh banner trước!");
      return;
    }

    const promise = new Promise(async (resolve, reject) => {
      try {
        setUploadStatus("Đang tải lên...");
        const data = new FormData();
        data.append("file", selectedImage);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

        const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
        const { url } = uploadRes.data;

        await userRequest.post("/banners", { img: url, title, subtitle });

        setTitle("");
        setSubtitle("");
        setSelectedImage(null);
        setUploadStatus("");
        fetchBanners();
        resolve();
      } catch (error) {
        console.error(error);
        setUploadStatus("Lỗi");
        reject(error);
      }
    });

    toast.promise(promise, {
      loading: "Đang tải ảnh và lưu banner...",
      success: "Tạo banner mới thành công!",
      error: "Có lỗi xảy ra, vui lòng thử lại.",
    });
  };

  // 4. Xử lý Xóa Banner
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
      } catch {
        toast.error("Lỗi khi xóa banner");
      }
    }
  };

  // 5. Ẩn hiện Banner
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý Banner Quảng cáo"
        subtitle="Thiết lập các banner hiển thị trên trang chủ"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start max-w-6xl">
        {/* CỘT TRÁI: Danh sách Banner */}
        <Card className="flex flex-col">
          <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900">Danh sách Banner</h2>
            <span className="flex h-6 items-center justify-center rounded-full bg-brand-100 px-2.5 text-xs font-bold text-brand-700">
              {banners.length} banner
            </span>
          </div>

          <div className="p-6">
            {loadingList ? (
              <LoadingSpinner className="py-10" />
            ) : banners.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Chưa có banner nào. Hãy tạo banner mới bên phải.
              </div>
            ) : (
              <div className="flex max-h-[500px] flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {banners.map((banner) => (
                  <div
                    key={banner._id}
                    className={`group relative flex items-center justify-between rounded-xl border p-4 transition-all duration-200
                      ${!banner.isActive
                        ? "border-gray-200 bg-gray-50 opacity-70"
                        : "border-brand-100 bg-white hover:border-brand-300 hover:shadow-md"
                      }
                    `}
                  >
                    {/* Ảnh Banner */}
                    <div className="relative shrink-0">
                      <img src={banner.img || "https://placehold.co/150x75?text=Banner"}
                        alt={banner.title} className="h-20 w-36 rounded-lg object-cover shadow-sm bg-gray-100" />
                      {!banner.isActive && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900/40">
                          <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">ĐÃ ẨN</span>
                        </div>
                      )}
                    </div>

                    {/* Thông tin */}
                    <div className="mx-4 min-w-0 flex-1">
                      <h3 className={`truncate text-sm font-bold ${!banner.isActive ? "text-gray-500" : "text-gray-900"}`}>
                        {banner.title || "Không tiêu đề"}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{banner.subtitle || "Không mô tả phụ"}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <IconButton
                        variant="default"
                        onClick={() => handleToggleActive(banner)}
                        title={banner.isActive ? "Nhấn để Ẩn" : "Nhấn để Hiện"}
                        icon={banner.isActive ? <FaToggleOn className="text-green-500 text-lg" /> : <FaToggleOff className="text-gray-400 text-lg" />}
                      />
                      <IconButton variant="delete" icon={<FaTrash size={13} />}
                        onClick={() => handleDelete(banner._id)} title="Xóa Banner" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* CỘT PHẢI: Form Tạo Banner mới */}
        <Card className="lg:sticky lg:top-6">
          <div className="border-b border-gray-100 px-6 py-5 bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900">Tạo Banner mới</h2>
          </div>

          <form onSubmit={handleUpload} className="p-6 space-y-5">
            {/* Input Ảnh */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-600">1. Ảnh Banner (Bắt buộc)</label>
              <div className="group relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/30 p-4 transition-colors hover:bg-brand-50">
                {!selectedImage ? (
                  <label htmlFor="file" className="flex h-full w-full cursor-pointer flex-col items-center justify-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 transition-transform group-hover:scale-110">
                      <FaPlus size={20} />
                    </div>
                    <span className="text-sm font-semibold text-brand-700">Tải ảnh lên</span>
                    <span className="mt-1 text-xs text-gray-500">Khuyên dùng tỷ lệ 16:9 hoặc 2:1</span>
                  </label>
                ) : (
                  <div className="relative h-full w-full">
                    <img src={URL.createObjectURL(selectedImage)} className="h-full w-full rounded-lg object-contain" alt="Preview" />
                    <label htmlFor="file" className="absolute bottom-2 right-2 cursor-pointer rounded bg-black/70 px-2 py-1 text-xs text-white hover:bg-black">
                      Đổi ảnh
                    </label>
                  </div>
                )}
                <input type="file" id="file" onChange={imageChange} className="hidden" accept="image/*" />
              </div>
              {uploadStatus && (
                <p className="mt-2 text-center text-xs font-medium text-brand-600">{uploadStatus}</p>
              )}
            </div>

            {/* Inputs Text */}
            <div className="space-y-4">
              <InputField label="2. Tiêu đề chính" placeholder="VD: Siêu Sale Mùa Hè"
                value={title} onChange={(e) => setTitle(e.target.value)} />
              <InputField label="3. Mô tả phụ" placeholder="VD: Giảm giá lên đến 50%"
                value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>

            {/* Nút Upload */}
            <div className="pt-2">
              <Button type="submit" className="w-full py-3"
                disabled={!selectedImage}
                isLoading={uploadStatus.includes("Đang")}>
                TẢI LÊN & LƯU
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Banners;
