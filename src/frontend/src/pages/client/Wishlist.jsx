import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHeartBroken, FaTrash, FaShoppingCart } from "react-icons/fa";
import { FiChevronRight, FiHome } from "react-icons/fi";
import { userRequest } from "../../requestMethods";
import { useWishlist } from "../../context/WishlistContext";
import ProductCard from "../../components/client/ProductCard";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { addProduct } from "../../redux/cartRedux";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { removeFromWishlist, wishlistCount } = useWishlist();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const res = await userRequest.get("/wishlist");
        setWishlistItems(res.data.data);
      } catch (error) {
        console.error("Lỗi lấy danh sách yêu thích:", error);
        toast.error("Không thể tải danh sách yêu thích");
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleRemove = async (productId, title) => {
    const success = await removeFromWishlist(productId);
    if (success) {
      setWishlistItems((prev) => prev.filter((item) => item.productId._id !== productId));
      toast.success(`Đã xóa ${title} khỏi danh sách yêu thích`);
    }
  };

  const handleAddToCart = (product) => {
    if (product.countInStock <= 0) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }
    dispatch(addProduct({ ...product, quantity: 1 }));
    toast.success("Đã thêm vào giỏ hàng");
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
              <FiHome /> Trang chủ
            </Link>
            <FiChevronRight className="text-slate-400" />
            <span className="text-slate-800 font-medium">Sách yêu thích</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Sách yêu thích
            <span className="bg-rose-100 text-rose-600 text-sm py-1 px-3 rounded-full font-semibold">
              {wishlistCount} sản phẩm
            </span>
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-4 rounded-2xl h-80 animate-pulse flex flex-col">
                <div className="w-full h-48 bg-slate-200 rounded-xl mb-4"></div>
                <div className="w-3/4 h-4 bg-slate-200 rounded-full mb-2"></div>
                <div className="w-1/2 h-4 bg-slate-200 rounded-full mb-auto"></div>
                <div className="w-full h-8 bg-slate-200 rounded-xl mt-4"></div>
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 min-h-[400px]">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <FaHeartBroken className="text-4xl text-rose-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Chưa có sản phẩm yêu thích</h2>
            <p className="text-slate-500 mb-8 max-w-md">
              Bạn chưa thêm cuốn sách nào vào danh sách yêu thích. Hãy khám phá kho sách của BookBee nhé!
            </p>
            <Link
              to="/products"
              className="px-8 py-3 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {wishlistItems.map((item) => {
              const product = item.productId;
              if (!product) return null; // Safe check for deleted products
              return (
                <div key={item._id} className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="p-3 pb-0 flex-1">
                    <ProductCard product={product} />
                  </div>

                  <div className="px-3 pb-3 pt-2 flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.countInStock <= 0}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${product.countInStock > 0
                          ? "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                    >
                      <FaShoppingCart />
                      Thêm
                    </button>
                    <button
                      onClick={() => handleRemove(product._id, product.title)}
                      className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-colors shrink-0 cursor-pointer"
                      title="Xóa khỏi yêu thích"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
