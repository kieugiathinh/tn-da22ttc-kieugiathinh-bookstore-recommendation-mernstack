import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2"; // Vẫn dùng cho Confirm Xóa
import { toast } from "sonner"; // Dùng Sonner cho thông báo
import { CLOUDINARY_CONFIG } from "../../utils/constants";

const Banners = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [banners, setBanners] = useState([]);

  const [uploadStatus, setUploadStatus] = useState(""); // Bỏ text mặc định cho gọn
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

  useEffect(() => {
    fetchBanners();
  }, []);

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

    // Dùng toast.promise để hiển thị trạng thái loading đẹp mắt
    const promise = new Promise(async (resolve, reject) => {
      try {
        setUploadStatus("Đang tải lên...");

        // BƯỚC 1: UPLOAD ẢNH
        const data = new FormData();
        data.append("file", selectedImage);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

        const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
        const { url } = uploadRes.data;

        // BƯỚC 2: LƯU VÀO DATABASE
        await userRequest.post("/banners", {
          img: url,
          title,
          subtitle,
        });

        // Reset form
        setTitle("");
        setSubtitle("");
        setSelectedImage(null);
        setUploadStatus("");
        fetchBanners();

        resolve(); // Báo thành công cho Toast
      } catch (error) {
        console.error(error);
        setUploadStatus("Lỗi");
        reject(error); // Báo lỗi cho Toast
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
    // Vẫn dùng Swal để hỏi xác nhận (An toàn hơn)
    const result = await Swal.fire({
      title: "Xóa Banner?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/banners/${id}`);

        // Dùng Sonner để báo thành công
        toast.success("Đã xóa banner thành công");
        fetchBanners();
      } catch (error) {
        toast.error("Lỗi khi xóa banner");
      }
    }
  };

  // 5. Ẩn hiện Banner
  const handleToggleActive = async (banner) => {
    try {
      await userRequest.put(`/banners/${banner._id}`, {
        isActive: !banner.isActive,
      });

      fetchBanners();

      // Thông báo nhẹ nhàng
      const message = !banner.isActive ? "Đã hiện banner" : "Đã ẩn banner";
      toast.success(message);
    } catch (error) {
      console.error(error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🖼️ Quản lý Banner Quảng cáo
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* CỘT TRÁI: Danh sách Banner */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
          <h2 className="text-xl font-bold mb-6 border-b pb-3 text-gray-700 flex justify-between items-center">
            <span>Danh sách Banner</span>
            <span className="text-sm font-normal bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
              {banners.length}
            </span>
          </h2>

          {loadingList ? (
            <div className="text-center py-10 text-gray-400 italic">
              Đang tải dữ liệu...
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic">
              Chưa có banner nào. Hãy thêm mới bên phải.
            </div>
          ) : (
            <div className="flex flex-col space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {banners.map((banner) => (
                <div
                  className={`relative group flex items-center justify-between p-3 border rounded-xl transition-all duration-200 bg-white
                    ${
                      !banner.isActive
                        ? "border-gray-200 bg-gray-50 opacity-70"
                        : "border-purple-100 hover:border-purple-300 hover:shadow-md"
                    }
                  `}
                  key={banner._id}
                >
                  {/* Ảnh Banner */}
                  <div className="relative">
                    <img
                      src={banner.img || "https://via.placeholder.com/150x75"}
                      alt={banner.title}
                      className="w-36 h-20 object-cover rounded-lg shadow-sm bg-gray-200"
                    />
                    {!banner.isActive && (
                      <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
                        <span className="text-[10px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded">
                          ĐÃ ẨN
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thông tin */}
                  <div className="flex-1 mx-4 min-w-0">
                    <h3
                      className={`text-sm font-bold truncate ${
                        !banner.isActive ? "text-gray-500" : "text-gray-800"
                      }`}
                    >
                      {banner.title || "Không tiêu đề"}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {banner.subtitle || "Không mô tả phụ"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className="text-xl focus:outline-none transition-transform active:scale-90 hover:opacity-80"
                      title={banner.isActive ? "Nhấn để Ẩn" : "Nhấn để Hiện"}
                    >
                      {banner.isActive ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-gray-400" />
                      )}
                    </button>

                    <button
                      className="text-red-400 hover:text-red-600 transition-transform active:scale-90 p-1"
                      onClick={() => handleDelete(banner._id)}
                      title="Xóa Banner"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: Form Tạo Banner mới */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit sticky top-6">
          <h2 className="text-xl font-bold mb-6 border-b pb-3 text-gray-700">
            Tạo Banner mới
          </h2>

          <form onSubmit={handleUpload} className="space-y-5">
            {/* Input Ảnh */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                1. Ảnh Banner (Bắt buộc)
              </label>

              <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 flex flex-col items-center justify-center bg-purple-50/30 hover:bg-purple-50 transition cursor-pointer relative group h-48">
                {!selectedImage ? (
                  <label
                    htmlFor="file"
                    className="cursor-pointer flex flex-col items-center w-full h-full justify-center"
                  >
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FaPlus className="text-xl" />
                    </div>
                    <span className="text-sm font-medium text-purple-700">
                      Tải ảnh lên
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Khuyên dùng tỷ lệ 16:9 hoặc 2:1
                    </span>
                  </label>
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      className="w-full h-full object-contain rounded-lg"
                      alt="Preview"
                    />
                    <label
                      htmlFor="file"
                      className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-black"
                    >
                      Đổi ảnh
                    </label>
                  </div>
                )}
                <input
                  type="file"
                  id="file"
                  onChange={imageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>

              {uploadStatus && (
                <p className="text-xs text-purple-600 mt-2 text-center font-medium">
                  {uploadStatus}
                </p>
              )}
            </div>

            {/* Inputs Text */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  2. Tiêu đề chính
                </label>
                <input
                  type="text"
                  placeholder="VD: Siêu Sale Mùa Hè"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  3. Mô tả phụ
                </label>
                <input
                  type="text"
                  placeholder="VD: Giảm giá lên đến 50%"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>
            </div>

            {/* Nút Upload */}
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg text-white font-bold transition-all shadow-md transform active:scale-95
                ${
                  !selectedImage || uploadStatus.includes("Đang")
                    ? "bg-gray-300 cursor-not-allowed shadow-none"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:-translate-y-0.5"
                }`}
              disabled={!selectedImage || uploadStatus.includes("Đang")}
            >
              {uploadStatus.includes("Đang")
                ? "ĐANG XỬ LÝ..."
                : "TẢI LÊN & LƯU"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Banners;
