import { FaSave, FaCloudUploadAlt, FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../../requestMethods";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";

// ── Shared input style ─────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200/30";

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
    <div className="space-y-6">
      <PageHeader
        title="Thêm Sách Mới"
        subtitle="Điền thông tin chi tiết để thêm sách vào hệ thống"
        action={
          <Link
            to="/admin/products"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <FaArrowLeft size={14} /> Quay lại
          </Link>
        }
      />

      <form onSubmit={handleUpload}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                Thông tin chi tiết
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Tên Sách <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Ví dụ: Đắc Nhân Tâm"
                    onChange={handleChange}
                    required
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Tác giả <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="author"
                      placeholder="Nguyễn Nhật Ánh..."
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Nhà xuất bản <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="publisher"
                      placeholder="NXB Trẻ..."
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Mô tả nội dung
                  </label>
                  <textarea
                    name="desc"
                    rows="6"
                    placeholder="Tóm tắt nội dung sách..."
                    onChange={handleChange}
                    required
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Giá Bìa (VND) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      placeholder="100000"
                      onChange={handleChange}
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Giá Bán (Sau giảm)
                    </label>
                    <input
                      type="number"
                      name="discountedPrice"
                      placeholder="80000"
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: PHÂN LOẠI & ẢNH */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">
                Phân loại & Hình ảnh
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Thể loại sách <span className="text-red-500">*</span>
                  </label>
                  <select
                    onChange={handleCatChange}
                    className={inputCls}
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

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Số lượng nhập kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="countInStock"
                    placeholder="Ví dụ: 50"
                    onChange={handleChange}
                    required
                    min="0"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Ảnh Bìa Sách <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-colors hover:bg-gray-50">
                    {!selectedImage ? (
                      <label htmlFor="file" className="flex w-full cursor-pointer flex-col items-center py-4">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-transform group-hover:scale-110">
                          <FaCloudUploadAlt size={24} />
                        </div>
                        <span className="text-sm font-semibold text-brand-600">Tải ảnh lên</span>
                      </label>
                    ) : (
                      <div className="relative w-full">
                        <div className="relative mx-auto h-64 w-full max-w-[200px] overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100">
                          <img
                            src={URL.createObjectURL(selectedImage)}
                            alt="Preview"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <label
                          htmlFor="file"
                          className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black"
                        >
                          Đổi ảnh
                        </label>
                      </div>
                    )}
                    <input type="file" id="file" onChange={imageChange} className="hidden" accept="image/*" />
                  </div>
                  {uploadStatus && (
                    <p className="mt-2 text-center text-xs font-medium text-brand-600">
                      {uploadStatus}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={uploadStatus.includes("Đang")}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all ${
                      uploadStatus.includes("Đang")
                        ? "cursor-not-allowed bg-brand-400 opacity-70"
                        : "bg-brand-600 hover:bg-brand-700 active:scale-[0.98]"
                    }`}
                  >
                    <FaSave size={16} />
                    {uploadStatus.includes("Đang") ? "ĐANG XỬ LÝ..." : "LƯU SÁCH MỚI"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewProduct;
