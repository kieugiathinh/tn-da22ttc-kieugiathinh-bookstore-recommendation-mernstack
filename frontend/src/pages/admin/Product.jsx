import { FaSave, FaCloudUploadAlt, FaArrowLeft, FaSync } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import axios from "axios";
import Swal from "sweetalert2";
import { CLOUDINARY_CONFIG } from "../../utils/constants";
import PageHeader from "../../components/admin/PageHeader";

// ── Shared input style ─────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-200/30";

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

        const currentCatId =
          productRes.data.category?._id || productRes.data.category;
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

  const handleCatChange = (e) => {
    setSelectedCat(e.target.value);
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
        ...inputs,
        img: imgUrl,
        category: selectedCat,
        countInStock: Number(inputs.countInStock),
        originalPrice: Number(inputs.originalPrice),
        discountedPrice: Number(inputs.discountedPrice),
        sold: Number(inputs.sold),
      };

      await userRequest.put("/products/" + id, updatedProduct);

      // Chuyển hướng ngay lập tức về trang danh sách sản phẩm
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      Swal.fire("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.", "error");
      setUploadStatus("Lỗi");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <FaSync className="mr-2 animate-spin text-brand-500" /> Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chỉnh Sửa Sách"
        subtitle={`Chỉnh sửa thông tin cho mã sách: ${id.slice(-8)}`}
        action={
          <Link
            to="/admin/products"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <FaArrowLeft size={14} /> Quay lại
          </Link>
        }
      />

      <form onSubmit={handleUpdate}>
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
                    defaultValue={product.title}
                    onChange={handleChange}
                    required
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Tác giả
                    </label>
                    <input
                      type="text"
                      name="author"
                      defaultValue={product.author}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Nhà xuất bản
                    </label>
                    <input
                      type="text"
                      name="publisher"
                      defaultValue={product.publisher}
                      onChange={handleChange}
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
                    defaultValue={product.desc}
                    onChange={handleChange}
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
                      defaultValue={product.originalPrice}
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
                      defaultValue={product.discountedPrice}
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
                    value={selectedCat}
                    onChange={handleCatChange}
                    className={inputCls}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Tồn kho
                    </label>
                    <input
                      type="number"
                      name="countInStock"
                      defaultValue={product.countInStock}
                      onChange={handleChange}
                      min="0"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600" title="Chỉnh sửa để tăng độ uy tín">
                      Đã bán
                    </label>
                    <input
                      type="number"
                      name="sold"
                      defaultValue={product.sold || 0}
                      onChange={handleChange}
                      min="0"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                    Ảnh Bìa Sách <span className="text-red-500">*</span>
                  </label>
                  <div className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-colors hover:bg-gray-50">
                    <div className="relative w-full">
                      <div className="relative mx-auto h-64 w-full max-w-[200px] overflow-hidden rounded-lg bg-white shadow-sm border border-gray-100">
                        <img
                          src={
                            newSelectedImage
                              ? URL.createObjectURL(newSelectedImage)
                              : product.img || "https://placehold.co/200x300?text=No+Img"
                          }
                          alt="Book Cover"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <label
                        htmlFor="file"
                        className="absolute bottom-2 right-1/2 translate-x-1/2 flex cursor-pointer items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-black"
                      >
                        Đổi ảnh
                      </label>
                    </div>
                    <input type="file" id="file" onChange={handleImageChange} className="hidden" accept="image/*" />
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
                    {uploadStatus.includes("Đang") ? "ĐANG XỬ LÝ..." : "LƯU THAY ĐỔI"}
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

export default Product;
