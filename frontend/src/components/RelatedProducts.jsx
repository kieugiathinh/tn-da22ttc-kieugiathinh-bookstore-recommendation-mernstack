import { useEffect, useState } from "react";
import { FaThumbsUp } from "react-icons/fa";
import { userRequest } from "../requestMethods";
import ProductCard from "./ProductCard";

const RelatedProducts = ({ categoryId, currentProductId }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Chỉ gọi API khi đã có ID danh mục và ID sản phẩm hiện tại
    if (!categoryId || !currentProductId) return;

    const fetchRelated = async () => {
      try {
        const res = await userRequest.get(
          `/products/related?categoryId=${categoryId}&productId=${currentProductId}`
        );
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRelated();
  }, [categoryId, currentProductId]);

  if (products.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex items-center justify-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 uppercase">
          <FaThumbsUp className="text-purple-500" /> Có thể bạn sẽ thích
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((item) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
