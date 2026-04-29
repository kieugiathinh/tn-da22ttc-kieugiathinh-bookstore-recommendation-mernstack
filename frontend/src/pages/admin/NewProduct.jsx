import { FaPlus, FaSave, FaCloudUploadAlt } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../../requestMethods";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { CLOUDINARY_CONFIG } from "../../utils/constants";

const NewProduct = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [inputs, setInputs] = useState({});
  const [cat, setCat] = useState("");
  const [categories, setCategories] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const navigate = useNavigate();

  // 1. Load danh sách thể loại từ Backend khi vào trang
  useEffect(() => {
    const getCategories = async () => {
      try {
        const res = await userRequest.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error(err);
        Swal.fire("Lỗi", "Không thể tải danh sách thể loại", "error");
      }
    };
    getCategories();
  }, []);

  // 2. Xử lý chọn ảnh
  const imageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // 3. Xử lý nhập liệu text
  const handleChange = (e) => {
    setInputs((prev) => {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  // 4. Xử lý chọn Thể loại
  const handleCatChange = (e) => {
    setCat(e.target.value);
  };

  // 5. Xử lý Upload & Submit
  const handleUpload = async (e) => {
    e.preventDefault();

    // Validate cơ bản
    if (!selectedImage) {
      Swal.fire("Cảnh báo", "Vui lòng chọn ảnh bìa sách.", "warning");
      return;
    }
    if (!cat) {
      Swal.fire("Cảnh báo", "Vui lòng chọn thể loại sách.", "warning");
      return;
    }

    setUploadStatus("Đang tải ảnh lên Cloudinary...");
    const data = new FormData();
    data.append("file", selectedImage);
    data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    try {
      // BƯỚC 1: UPLOAD ẢNH
      const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
      const { url } = uploadRes.data;

      // BƯỚC 2: TẠO SẢN PHẨM VÀO DB
      setUploadStatus("Đang lưu vào cơ sở dữ liệu...");

      const newProduct = {
        ...inputs,
        img: url,
        category: cat,
        countInStock: Number(inputs.countInStock) || 0,
        originalPrice: Number(inputs.originalPrice),
        discountedPrice: Number(inputs.discountedPrice) || 0,
      };

      await userRequest.post("/products", newProduct);

      Swal.fire("Thành công!", "Sách mới đã được thêm vào kho.", "success");
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      setUploadStatus("Thất bại");
      Swal.fire(
        "Lỗi!",
        error.response?.data?.message || "Tạo sản phẩm thất bại.",
        "error"
      );
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800">➕ Thêm Sách Mới</h1>
      </div>

      {/* FORM */}
      <div className="bg-white p-8 shadow-xl rounded-xl border border-gray-100">
        <form
          onSubmit={handleUpload}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6"
        >
          {/* --- CỘT TRÁI: THÔNG TIN CƠ BẢN --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-purple-600 border-b pb-2">
              Thông tin chi tiết
            </h2>

            {/* Tên sách */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Tên Sách <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="Ví dụ: Đắc Nhân Tâm"
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Tác giả & Nhà xuất bản (MỚI) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Tác giả <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  placeholder="Nguyễn Nhật Ánh..."
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Nhà xuất bản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="publisher"
                  placeholder="NXB Trẻ..."
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Mô tả */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Mô tả nội dung
              </label>
              <textarea
                name="desc"
                rows="5"
                placeholder="Tóm tắt nội dung sách..."
                onChange={handleChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
            </div>

            {/* Giá cả */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Giá Bìa (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  placeholder="100000"
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Giá Bán (Sau giảm)
                </label>
                <input
                  type="number"
                  name="discountedPrice"
                  placeholder="80000"
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI: PHÂN LOẠI & ẢNH --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-purple-600 border-b pb-2">
              Phân loại & Hình ảnh
            </h2>

            {/* Chọn Thể loại (Dropdown từ API) */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Thể loại sách <span className="text-red-500">*</span>
              </label>
              <select
                onChange={handleCatChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  -- Chọn thể loại --
                </option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Số lượng tồn kho (MỚI) */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Số lượng nhập kho <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="countInStock"
                placeholder="Ví dụ: 50"
                onChange={handleChange}
                required
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Upload Ảnh */}
            <div>
              <label className="font-semibold text-gray-700 block mb-2">
                Ảnh Bìa Sách <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-lg p-6 hover:bg-purple-50 transition cursor-pointer relative">
                {!selectedImage ? (
                  <label
                    htmlFor="file"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FaCloudUploadAlt className="text-4xl text-purple-500 mb-2" />
                    <span className="text-sm text-gray-500">
                      Nhấn để tải ảnh lên
                    </span>
                  </label>
                ) : (
                  <div className="relative w-full h-64">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-md"
                    />
                    <label
                      htmlFor="file"
                      className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow cursor-pointer hover:text-purple-600"
                    >
                      <FaCloudUploadAlt />
                    </label>
                  </div>
                )}
                <input
                  type="file"
                  id="file"
                  onChange={imageChange}
                  style={{ display: "none" }}
                  accept="image/*"
                />
              </div>
              {uploadStatus && (
                <p className="text-center text-sm mt-2 text-blue-600 animate-pulse font-medium">
                  {uploadStatus}
                </p>
              )}
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transition duration-300 disabled:opacity-50"
              disabled={uploadStatus.includes("Đang")}
            >
              <FaSave className="mr-2 text-xl" />
              {uploadStatus.includes("Đang") ? "ĐANG XỬ LÝ..." : "LƯU SÁCH MỚI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProduct;
