import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../../requestMethods";
import Swal from "sweetalert2";
import { CLOUDINARY_CONFIG } from "../../utils/constants";

const Banners = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [banners, setBanners] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("Sẵn sàng tải ảnh");
  const [loadingList, setLoadingList] = useState(true);

  // 1. Hàm Tải danh sách Banner
  const fetchBanners = async () => {
    try {
      setLoadingList(true);
      const res = await userRequest.get("/banners");
      setBanners(res.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách banner:", error);
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
      setUploadStatus("Ảnh đã chọn. Sẵn sàng tải lên.");
    }
  };

  // 3. Xử lý Upload và Lưu
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      Swal.fire("Lỗi", "Vui lòng chọn ảnh banner.", "warning");
      return;
    }

    setUploadStatus("Đang tải ảnh lên Cloudinary...");
    const data = new FormData();
    data.append("file", selectedImage);
    data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    try {
      // BƯỚC 1: UPLOAD ẢNH
      const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadStatus(`Đang tải lên: ${percentCompleted}%`);
        },
      });

      const { url } = uploadRes.data;

      // BƯỚC 2: LƯU VÀO DATABASE
      setUploadStatus("Đang lưu thông tin vào DB...");
      await userRequest.post("/banners", {
        img: url,
        title,
        subtitle,
      });

      // THÔNG BÁO THÀNH CÔNG VÀ RESET
      setUploadStatus("Thành công 🥳");
      Swal.fire("Thành công!", "Banner đã được tạo mới.", "success");

      setTitle("");
      setSubtitle("");
      setSelectedImage(null);
      fetchBanners(); // Tải lại danh sách banner
    } catch (error) {
      console.error(error);
      setUploadStatus("Tải lên thất bại 😔");
      Swal.fire(
        "Lỗi!",
        "Lưu banner thất bại. Vui lòng kiểm tra console.",
        "error"
      );
    }
  };

  // 4. Xử lý Xóa Banner
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Xóa Banner?",
      text: "Bạn có chắc chắn muốn xóa banner này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await userRequest.delete(`/banners/${id}`);
        Swal.fire("Đã xóa!", "Banner đã được xóa thành công.", "success");
        fetchBanners(); // Tải lại danh sách banner thay vì reload trang
      } catch (error) {
        Swal.fire("Lỗi!", "Xóa banner thất bại.", "error");
      }
    }
  };

  //Ẩn hiện Banner
  const handleToggleActive = async (banner) => {
    try {
      // Gọi API cập nhật trạng thái ngược lại
      await userRequest.put(`/banners/${banner._id}`, {
        isActive: !banner.isActive,
      });

      // Reload lại danh sách để thấy thay đổi (hoặc update state local để mượt hơn)
      fetchBanners();

      // Thông báo nhỏ (Optional)
      const status = !banner.isActive ? "Đã hiện" : "Đã ẩn";
      Swal.fire({
        title: "Thành công",
        text: `Banner ${status}`,
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Lỗi", "Không thể cập nhật trạng thái", "error");
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🖼️ Quản lý Banner Quảng cáo
      </h1>

      {/* Thay đổi chính ở đây: grid-cols-1 lg:grid-cols-2 */}
      {/* Đã thêm max-w-6xl và mx-auto để giới hạn chiều rộng tổng thể và căn giữa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* CỘT TRÁI: Danh sách Banner đang hoạt động */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-3 text-purple-600">
            Danh sách Banner ({banners.length})
          </h2>

          {loadingList ? (
            <div className="text-center py-10 text-gray-500">Đang tải...</div>
          ) : banners.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Chưa có banner nào.
            </div>
          ) : (
            <div className="flex flex-col space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {banners.map((banner) => (
                <div
                  className={`flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition duration-200 bg-white
                    ${
                      !banner.isActive ? "opacity-60 bg-gray-50" : ""
                    } // Làm mờ nếu đang ẩn
                  `}
                  key={banner._id}
                >
                  <img
                    src={banner.img || "https://via.placeholder.com/150x75"}
                    alt={banner.title}
                    className="w-32 h-16 object-cover rounded-md shadow-sm ring-1 ring-gray-200 flex-shrink-0"
                  />

                  <div className="flex-1 mx-4 truncate">
                    <h3 className="text-sm font-bold text-gray-800 truncate">
                      {banner.title || "Không tiêu đề"}
                    </h3>
                    {/* Hiển thị trạng thái bằng chữ cho rõ */}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        banner.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {banner.isActive ? "Đang hiện" : "Đang ẩn"}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    {/* NÚT TOGGLE ẨN/HIỆN */}
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className="text-2xl focus:outline-none transition-transform active:scale-90"
                      title={banner.isActive ? "Nhấn để Ẩn" : "Nhấn để Hiện"}
                    >
                      {banner.isActive ? (
                        <FaToggleOn className="text-green-500" />
                      ) : (
                        <FaToggleOff className="text-gray-400" />
                      )}
                    </button>

                    {/* NÚT XÓA */}
                    <button
                      className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full transition"
                      onClick={() => handleDelete(banner._id)}
                      title="Xóa vĩnh viễn"
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
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-3 text-purple-600">
            Tạo Banner mới
          </h2>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* Input Ảnh */}
            <div>
              <span className="font-semibold text-gray-700 block mb-2">
                1. Chọn Ảnh Banner:
              </span>
              <div className="flex items-center space-x-4">
                {/* Thay đổi chiều cao và chiều rộng của khung chọn ảnh để cân đối hơn */}
                <div className="border-2 h-40 w-full border-purple-300 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden">
                  {!selectedImage ? (
                    <label
                      htmlFor="file"
                      className="cursor-pointer text-purple-500 hover:text-purple-700 flex flex-col items-center"
                    >
                      <FaPlus className="text-xl" />
                      <span className="text-xs mt-1">
                        Chọn ảnh (Tỷ lệ 2:1 hoặc 16:9 được khuyến nghị)
                      </span>{" "}
                      {/* Cập nhật gợi ý tỷ lệ */}
                    </label>
                  ) : (
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <input
                  type="file"
                  id="file"
                  onChange={imageChange}
                  style={{ display: "none" }}
                  accept="image/*"
                />
              </div>
              <span
                className={`mt-2 block text-sm font-medium ${
                  uploadStatus.includes("Thành công")
                    ? "text-green-600"
                    : uploadStatus.includes("thất bại")
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                Trạng thái: {uploadStatus}
              </span>
            </div>

            {/* Input Title */}
            <div>
              <span className="font-semibold text-gray-700 block mb-2">
                2. Tiêu đề chính:
              </span>
              <input
                type="text"
                placeholder="Ví dụ: Giảm giá Sách Mới"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Input Subtitle */}
            <div>
              <span className="font-semibold text-gray-700 block mb-2">
                3. Mô tả phụ:
              </span>
              <input
                type="text"
                placeholder="Chỉ áp dụng cho 100 khách hàng đầu tiên"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>

            {/* Nút Upload */}
            <button
              type="submit"
              className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-bold transition duration-300 ${
                !selectedImage || uploadStatus.includes("Đang tải")
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 shadow-lg"
              }`}
              disabled={!selectedImage || uploadStatus.includes("Đang tải")}
            >
              TẢI LÊN VÀ LƯU BANNER
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Banners;
