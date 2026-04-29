import { FaSave, FaCloudUploadAlt, FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { userRequest } from "../../requestMethods";
import axios from "axios";
import Swal from "sweetalert2";
import { CLOUDINARY_CONFIG } from "../../utils/constants";

const Product = () => {
  const location = useLocation();
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

        setLoading(false);
      } catch (error) {
        console.error("Lỗi:", error);
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

  // --- 3. Update Logic (ĐÃ SỬA) ---
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

      // --- THAY ĐỔI Ở ĐÂY ---
      // Không hiện Swal thành công nữa
      // Chuyển hướng ngay lập tức về trang danh sách sản phẩm
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      // Vẫn giữ thông báo lỗi để biết nếu có trục trặc
      Swal.fire("Lỗi", "Cập nhật thất bại. Vui lòng thử lại.", "error");
      setUploadStatus("Lỗi");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-purple-600 font-medium">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="flex-1 p-8 bg-gray-50 h-full overflow-y-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          ✏️ Chỉnh sửa sách
        </h1>
        <Link
          to="/admin/products"
          className="flex items-center text-gray-600 hover:text-purple-600 transition"
        >
          <FaArrowLeft className="mr-2" /> Quay lại danh sách
        </Link>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <form
          onSubmit={handleUpdate}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* CỘT TRÁI */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Tên Sách
              </label>
              <input
                type="text"
                name="title"
                defaultValue={product.title}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Tác giả
                </label>
                <input
                  type="text"
                  name="author"
                  defaultValue={product.author}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Nhà xuất bản
                </label>
                <input
                  type="text"
                  name="publisher"
                  defaultValue={product.publisher}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Mô tả nội dung
              </label>
              <textarea
                name="desc"
                rows="6"
                defaultValue={product.desc}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Giá Bìa (VND)
                </label>
                <input
                  type="number"
                  name="originalPrice"
                  defaultValue={product.originalPrice}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Giá Khuyến Mãi
                </label>
                <input
                  type="number"
                  name="discountedPrice"
                  defaultValue={product.discountedPrice}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="space-y-6">
            {/* Ảnh */}
            <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 flex flex-col items-center text-center">
              <div className="relative w-full h-64 mb-4 bg-white rounded-lg overflow-hidden shadow-sm">
                <img
                  src={
                    newSelectedImage
                      ? URL.createObjectURL(newSelectedImage)
                      : product.img
                  }
                  alt="Book Cover"
                  className="w-full h-full object-contain"
                />
              </div>
              <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition flex items-center">
                <FaCloudUploadAlt className="mr-2" /> Chọn ảnh mới
                <input
                  type="file"
                  className="hidden"
                  onChange={handleImageChange}
                  accept="image/*"
                />
              </label>
              {uploadStatus && (
                <p className="text-xs text-blue-500 mt-2">{uploadStatus}</p>
              )}
            </div>

            {/* Thể loại */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Thể loại sách
              </label>
              <select
                value={selectedCat}
                onChange={handleCatChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
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

            {/* Tồn kho */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Số lượng tồn kho
              </label>
              <input
                type="number"
                name="countInStock"
                defaultValue={product.countInStock}
                onChange={handleChange}
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Đã bán */}
            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Đã bán
              </label>
              <input
                type="number"
                name="sold"
                defaultValue={product.sold || 0}
                onChange={handleChange}
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                title="Có thể chỉnh sửa số lượng đã bán để tăng độ uy tín"
              />
            </div>

            {/* Nút Lưu */}
            <button
              type="submit"
              disabled={uploadStatus.includes("Đang")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center justify-center"
            >
              <FaSave className="mr-2 text-xl" />{" "}
              {uploadStatus.includes("Đang") ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Product;
