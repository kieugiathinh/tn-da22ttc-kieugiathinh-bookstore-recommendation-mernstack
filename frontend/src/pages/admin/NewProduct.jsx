import { FaSave, FaCloudUploadAlt, FaArrowLeft } from "react-icons/fa";
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
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 4. Xử lý Upload & Submit
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedImage) { Swal.fire("Cảnh báo", "Vui lòng chọn ảnh bìa sách.", "warning"); return; }
    if (!cat) { Swal.fire("Cảnh báo", "Vui lòng chọn thể loại sách.", "warning"); return; }

    setUploadStatus("Đang tải ảnh lên Cloudinary...");
    const data = new FormData();
    data.append("file", selectedImage);
    data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    try {
      const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
      const { url } = uploadRes.data;

      setUploadStatus("Đang lưu vào cơ sở dữ liệu...");
      const newProduct = {
        ...inputs, img: url, category: cat,
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
      Swal.fire("Lỗi!", error.response?.data?.message || "Tạo sản phẩm thất bại.", "error");
    }
  };

  const isProcessing = uploadStatus.includes("Đang");

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
                <InputField label="Tên Sách" required name="title" placeholder="Ví dụ: Đắc Nhân Tâm" onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Tác giả" required name="author" placeholder="Nguyễn Nhật Ánh..." onChange={handleChange} />
                  <InputField label="Nhà xuất bản" required name="publisher" placeholder="NXB Trẻ..." onChange={handleChange} />
                </div>
                <InputField label="Mô tả nội dung" as="textarea" name="desc" rows={6} required
                  placeholder="Tóm tắt nội dung sách..." onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Giá Bìa (VND)" required type="number" name="originalPrice" placeholder="100000" onChange={handleChange} />
                  <InputField label="Giá Bán (Sau giảm)" type="number" name="discountedPrice" placeholder="80000" onChange={handleChange} />
                </div>
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

                <InputField label="Số lượng nhập kho" required type="number" name="countInStock" placeholder="Ví dụ: 50" onChange={handleChange} min="0" />

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
                          <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="h-full w-full object-contain" />
                        </div>
                        <label htmlFor="file" className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black">
                          Đổi ảnh
                        </label>
                      </div>
                    )}
                    <input type="file" id="file" onChange={imageChange} className="hidden" accept="image/*" />
                  </div>
                  {uploadStatus && <p className="mt-2 text-center text-xs font-medium text-brand-600">{uploadStatus}</p>}
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
