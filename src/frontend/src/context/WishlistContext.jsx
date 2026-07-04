import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { userRequest } from "../requestMethods";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch danh sách ID yêu thích khi user đăng nhập
  const fetchWishlistIds = useCallback(async () => {
    if (!currentUser) {
      setWishlistIds([]);
      setWishlistCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await userRequest.get("/wishlist/ids");
      setWishlistIds(res.data.data || []);
      setWishlistCount(res.data.data?.length || 0);
    } catch (error) {
      console.error("Lỗi fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWishlistIds();
  }, [fetchWishlistIds]);

  // Kiểm tra 1 sản phẩm có trong wishlist không
  const isInWishlist = useCallback(
    (productId) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  // Thêm vào wishlist
  const addToWishlist = async (productId) => {
    try {
      await userRequest.post("/wishlist", { productId });
      setWishlistIds((prev) => [...prev, productId]);
      setWishlistCount((prev) => prev + 1);
      return true;
    } catch (error) {
      console.error("Lỗi thêm yêu thích:", error);
      return false;
    }
  };

  // Xóa khỏi wishlist
  const removeFromWishlist = async (productId) => {
    try {
      await userRequest.delete(`/wishlist/${productId}`);
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      setWishlistCount((prev) => Math.max(prev - 1, 0));
      return true;
    } catch (error) {
      console.error("Lỗi xóa yêu thích:", error);
      return false;
    }
  };

  // Toggle yêu thích
  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount,
        loading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        fetchWishlistIds,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist phải được sử dụng trong WishlistProvider");
  }
  return context;
};
