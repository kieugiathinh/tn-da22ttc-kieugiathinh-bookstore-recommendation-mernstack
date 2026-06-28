import { FaSave, FaCloudUploadAlt, FaArrowLeft, FaMagic } from "react-icons/fa";
import axios from "axios";
import { userRequest } from "../../requestMethods";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";
import Card from "../../components/common/Card";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";

const NewProduct = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [inputs, setInputs] = useState({});
  const [cat, setCat] = useState("");
  const [categories, setCategories] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [autoFilledImg, setAutoFilledImg] = useState("");
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
      setAutoFilledImg("");
    }
  };

  // 3. Xử lý nhập liệu text
  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✨ Auto Fill: Tra cứu thông tin sách từ Google Books
  const handleAutoFill = async () => {
    const title = inputs.title;
    if (!title || !title.trim()) {
      Swal.fire("Chưa nhập tên sách", "Vui lòng nhập tên sách trước khi sử dụng Auto Fill.", "warning");
      return;
    }

    setIsFetchingData(true);
    try {
      const res = await userRequest.get("/products/autofill", {
        params: { title: title.trim() },
      });

      const bookData = res.data;

      // Tạo giá ngẫu nhiên hợp lý (vì Google Books không cung cấp giá VNĐ)
      const randomPrice = Math.floor(Math.random() * (250000 - 50000 + 1) / 1000) * 1000 + 50000;

      // Xử lý publishedYear từ publishedDate
      let publishedYearStr = "";
      if (bookData.publishedDate) {
        publishedYearStr = bookData.publishedDate.substring(0, 4);
      }

      setInputs((prev) => ({
        ...prev,
        title: bookData.title || prev.title,
        author: bookData.authors || prev.author || "",
        publisher: bookData.publisher || prev.publisher || "",
        desc: bookData.description || prev.desc || "",
        originalPrice: prev.originalPrice || randomPrice,
        pageCount: bookData.pageCount || prev.pageCount || "",
        publishedYear: publishedYearStr || prev.publishedYear || ""
      }));

      // Nếu có ảnh bìa từ Google Books
      if (bookData.thumbnail) {
        setAutoFilledImg(bookData.thumbnail);
        setSelectedImage(null);
      }

      Swal.fire({
        icon: "success",
        title: "Đã tự động điền!",
        text: `Tìm thấy: "${bookData.title}". Hãy kiểm tra lại thông tin và chỉnh sửa nếu cần.`,
        timer: 3000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("AutoFill Error:", error);
      const message = error.response?.data?.message || "Không tìm thấy thông tin sách. Vui lòng thử tên khác.";
      Swal.fire("Không tìm thấy", message, "info");
    } finally {
      setIsFetchingData(false);
    }
  };

  // 4. Xử lý Upload & Submit
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedImage && !autoFilledImg) { Swal.fire("Cảnh báo", "Vui lòng chọn ảnh bìa sách.", "warning"); return; }
    if (!cat) { Swal.fire("Cảnh báo", "Vui lòng chọn thể loại sách.", "warning"); return; }

    setUploadStatus("Đang tải ảnh lên Cloudinary...");

    try {
      let url = autoFilledImg;

      // Nếu admin đã chọn file ảnh thủ công → upload lên Cloudinary
      if (selectedImage) {
        const data = new FormData();
        data.append("file", selectedImage);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
        const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
        url = uploadRes.data.url;
      }

      setUploadStatus("Đang lưu vào cơ sở dữ liệu...");
      const newProduct = {
        ...inputs, 
        img: url, 
        category: cat,
        countInStock: Number(inputs.countInStock) || 0,
        originalPrice: Number(inputs.originalPrice),
        discountedPrice: Number(inputs.discountedPrice) || 0,
        pageCount: inputs.pageCount ? Number(inputs.pageCount) : null,
        publishedYear: inputs.publishedYear ? Number(inputs.publishedYear) : null,
        language: inputs.language || "vi",
        ageGroup: inputs.ageGroup || "all",
        tags: inputs.tags ? inputs.tags.split(",").map(t => t.trim()).filter(Boolean) : []
      };
      await userRequest.post("/products", newProduct);
      Swal.fire("Thành công!", "Sách mới đã được thêm vào kho.", "success");
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      setUploadStatus("Thất bại");
      Swal.fire("Lỗi!", error.response?.data?.message || "Tạo sản phẩm thất bại.", "error");
    }
  };

  const isProcessing = uploadStatus.includes("Đang");

  // Xác định ảnh preview hiển thị
  const previewImgSrc = selectedImage
    ? URL.createObjectURL(selectedImage)
    : autoFilledImg || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thêm Sách Mới"
        subtitle="Điền thông tin chi tiết để thêm sách vào hệ thống"
        action={
          <Link to="/admin/products">
            <Button variant="secondary" icon={<FaArrowLeft size={14} />}>Quay lại</Button>
          </Link>
        }
      />

      <form onSubmit={handleUpload}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Thông tin chi tiết</h2>
              <div className="space-y-5">
                {/* Tên sách + Nút Auto Fill */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Tên Sách <span className="ml-0.5 text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <InputField
                      name="title"
                      placeholder="Ví dụ: Đắc Nhân Tâm"
                      value={inputs.title || ""}
                      onChange={handleChange}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={handleAutoFill}
                      isLoading={isFetchingData}
                      disabled={isFetchingData}
                      icon={!isFetchingData ? <FaMagic size={14} /> : undefined}
                      style={{
                        whiteSpace: "nowrap",
                        background: isFetchingData ? undefined : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: isFetchingData ? undefined : "#fff",
                        border: "none",
                      }}
                    >
                      {isFetchingData ? "Đang tìm..." : "✨ Auto Fill"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Tác giả" required name="author" placeholder="Nguyễn Nhật Ánh..." value={inputs.author || ""} onChange={handleChange} />
                  <InputField label="Nhà xuất bản" required name="publisher" placeholder="NXB Trẻ..." value={inputs.publisher || ""} onChange={handleChange} />
                </div>
                <InputField label="Mô tả nội dung" as="textarea" name="desc" rows={6} required
                  placeholder="Tóm tắt nội dung sách..." value={inputs.desc || ""} onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Giá Bìa (VND)" required type="number" name="originalPrice" placeholder="100000" value={inputs.originalPrice || ""} onChange={handleChange} />
                  <InputField label="Giá Bán (Sau giảm)" type="number" name="discountedPrice" placeholder="80000" value={inputs.discountedPrice || ""} onChange={handleChange} />
                </div>
              </div>
            </Card>

            {/* CARD THÔNG TIN BỔ SUNG (AI RECOMMENDATION) */}
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Thuộc tính Mở rộng (Hỗ trợ AI Recommendation)</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Ngôn ngữ" required as="select" name="language" value={inputs.language || "vi"} onChange={handleChange}>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">Tiếng Anh</option>
                    <option value="ja">Tiếng Nhật</option>
                    <option value="zh">Tiếng Trung</option>
                    <option value="fr">Tiếng Pháp</option>
                    <option value="other">Khác</option>
                  </InputField>
                  <InputField label="Độ tuổi phù hợp" required as="select" name="ageGroup" value={inputs.ageGroup || "all"} onChange={handleChange}>
                    <option value="all">Mọi lứa tuổi</option>
                    <option value="children">Trẻ em</option>
                    <option value="teen">Thanh thiếu niên</option>
                    <option value="adult">Người lớn (18+)</option>
                  </InputField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Năm xuất bản" type="number" name="publishedYear" placeholder="2024" value={inputs.publishedYear || ""} onChange={handleChange} />
                  <InputField label="Số trang" type="number" name="pageCount" placeholder="300" value={inputs.pageCount || ""} onChange={handleChange} min="1" />
                </div>

                <InputField 
                  label="Từ khóa / Tags (Phân cách bằng dấu phẩy)" 
                  name="tags" 
                  placeholder="Ví dụ: Tiểu thuyết, Tâm lý, Bestseller 2024" 
                  value={inputs.tags || ""} 
                  onChange={handleChange} 
                />
              </div>
            </Card>
          </div>

          {/* CỘT PHẢI: PHÂN LOẠI & ẢNH */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Phân loại & Hình ảnh</h2>
              <div className="space-y-5">
                <InputField label="Thể loại sách" required as="select" defaultValue="" onChange={(e) => setCat(e.target.value)}>
                  <option value="" disabled>-- Chọn thể loại --</option>
                  {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                </InputField>

                <InputField label="Số lượng nhập kho" required type="number" name="countInStock" placeholder="Ví dụ: 50" value={inputs.countInStock || ""} onChange={handleChange} min="0" />

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Ảnh Bìa Sách <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-colors hover:bg-gray-50">
                    {!previewImgSrc ? (
                      <label htmlFor="file" className="flex w-full cursor-pointer flex-col items-center py-4">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary transition-transform group-hover:scale-110">
                          <FaCloudUploadAlt size={24} />
                        </div>
                        <span className="text-sm font-semibold text-primary">Tải ảnh lên</span>
                      </label>
                    ) : (
                      <div className="relative w-full">
                        <div className="relative mx-auto h-64 w-full max-w-[200px] overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100">
                          <img src={previewImgSrc} alt="Preview" className="h-full w-full object-contain" />
                        </div>
                        {autoFilledImg && !selectedImage && (
                          <p className="mt-2 text-center text-xs text-indigo-600 font-medium">📷 Ảnh từ Google Books</p>
                        )}
                        <label htmlFor="file" className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black">
                          Đổi ảnh
                        </label>
                      </div>
                    )}
                    <input type="file" id="file" onChange={imageChange} className="hidden" accept="image/*" />
                  </div>
                  {uploadStatus && <p className="mt-2 text-center text-xs font-medium text-primary">{uploadStatus}</p>}
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full py-3.5" icon={<FaSave size={16} />}
                    isLoading={isProcessing} disabled={isProcessing}>
                    LƯU SÁCH MỚI
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewProduct;
