import { FaSave, FaCloudUploadAlt, FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import axios from "axios";
import Swal from "sweetalert2";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";
import Card from "../../components/common/Card";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Product = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState({});
  const [inputs, setInputs] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [loading, setLoading] = useState(true);

  const [newSelectedImage, setNewSelectedImage] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // 1. Tải dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          userRequest.get("/products/find/" + id),
          userRequest.get("/categories"),
        ]);

        setProduct(productRes.data);
        setCategories(categoriesRes.data);
        const currentCatId = productRes.data.category?._id || productRes.data.category;
        setSelectedCat(currentCatId);

        setInputs({
          title: productRes.data.title,
          author: productRes.data.author,
          publisher: productRes.data.publisher,
          desc: productRes.data.desc,
          originalPrice: productRes.data.originalPrice,
          discountedPrice: productRes.data.discountedPrice,
          countInStock: productRes.data.countInStock,
          sold: productRes.data.sold || 0,
        });
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 2. Handlers
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewSelectedImage(e.target.files[0]);
      setUploadStatus("Đã chọn ảnh mới");
    }
  };

  const handleChange = (e) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- 3. Update Logic ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUploadStatus("Đang xử lý...");
    let imgUrl = product.img;

    try {
      if (newSelectedImage) {
        setUploadStatus("Đang tải ảnh...");
        const data = new FormData();
        data.append("file", newSelectedImage);
        data.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
        const uploadRes = await axios.post(CLOUDINARY_CONFIG.uploadUrl, data);
        imgUrl = uploadRes.data.url;
      }

      const updatedProduct = {
        ...inputs, img: imgUrl, category: selectedCat,
        countInStock: Number(inputs.countInStock),
        originalPrice: Number(inputs.originalPrice),
        discountedPrice: Number(inputs.discountedPrice),
        sold: Number(inputs.sold),
      };

      await userRequest.put("/products/" + id, updatedProduct);
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      Swal.fire("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.", "error");
      setUploadStatus("Lỗi");
    }
  };

  if (loading) return <LoadingSpinner />;

  const isProcessing = uploadStatus.includes("Đang");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chỉnh Sửa Sách"
        subtitle={`Chỉnh sửa thông tin cho mã sách: ${id.slice(-8)}`}
        action={
          <Link to="/admin/products">
            <Button variant="secondary" icon={<FaArrowLeft size={14} />}>Quay lại</Button>
          </Link>
        }
      />

      <form onSubmit={handleUpdate}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Thông tin chi tiết</h2>
              <div className="space-y-5">
                <InputField label="Tên Sách" required name="title" defaultValue={product.title} onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Tác giả" name="author" defaultValue={product.author} onChange={handleChange} />
                  <InputField label="Nhà xuất bản" name="publisher" defaultValue={product.publisher} onChange={handleChange} />
                </div>
                <InputField label="Mô tả nội dung" as="textarea" name="desc" rows={6} defaultValue={product.desc} onChange={handleChange} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Giá Bìa (VND)" required type="number" name="originalPrice" defaultValue={product.originalPrice} onChange={handleChange} />
                  <InputField label="Giá Bán (Sau giảm)" type="number" name="discountedPrice" defaultValue={product.discountedPrice} onChange={handleChange} />
                </div>
              </div>
            </Card>
          </div>

          {/* CỘT PHẢI: PHÂN LOẠI & ẢNH */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5 border-b border-gray-100 pb-3">Phân loại & Hình ảnh</h2>
              <div className="space-y-5">
                <InputField label="Thể loại sách" required as="select" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)}>
                  <option value="" disabled>-- Chọn thể loại --</option>
                  {categories.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                </InputField>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Tồn kho" type="number" name="countInStock" defaultValue={product.countInStock} onChange={handleChange} min="0" />
                  <InputField label="Đã bán" type="number" name="sold" defaultValue={product.sold || 0} onChange={handleChange} min="0" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Ảnh Bìa Sách <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-colors hover:bg-gray-50">
                    <div className="relative w-full">
                      <div className="relative mx-auto h-64 w-full max-w-[200px] overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100">
                        <img
                          src={newSelectedImage ? URL.createObjectURL(newSelectedImage) : product.img || "https://placehold.co/200x300?text=No+Img"}
                          alt="Book Cover" className="h-full w-full object-contain"
                        />
                      </div>
                      <label htmlFor="file" className="absolute bottom-2 right-1/2 translate-x-1/2 flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black">
                        Đổi ảnh
                      </label>
                    </div>
                    <input type="file" id="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                  {uploadStatus && <p className="mt-2 text-center text-xs font-medium text-brand-600">{uploadStatus}</p>}
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full py-3.5" icon={<FaSave size={16} />}
                    isLoading={isProcessing} disabled={isProcessing}>
                    LƯU THAY ĐỔI
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

export default Product;
