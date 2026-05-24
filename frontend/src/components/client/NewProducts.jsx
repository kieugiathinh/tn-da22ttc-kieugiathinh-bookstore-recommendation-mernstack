import { useEffect, useState } from "react";
import { FaBookOpen, FaMagic } from "react-icons/fa";
import { userRequest } from "../../requestMethods";
import ProductCard from "./ProductCard";

const NewProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchNew = async () => {
      try {
        const res = await userRequest.get("/products/new");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNew();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="mb-12">
      {/* Tiêu đề đẹp mắt */}
      <div className="flex items-center gap-3 mb-6 mt-8 justify-center honeycomb-bg py-4 rounded-lg">
        <div className="h-[2px] w-12 bg-honey-gold rounded-full hidden sm:block"></div>
        <h2 className="text-2xl font-extrabold uppercase flex items-center gap-2 tracking-wide text-primary border-l-4 border-honey-gold pl-3">
          <FaBookOpen className="text-xl" />
          Sách Mới Tuyển Chọn
          <FaMagic className="text-honey-gold animate-pulse text-lg" />
        </h2>
        <div className="h-[2px] w-12 bg-honey-gold rounded-full hidden sm:block"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((item) => (
          <ProductCard key={item._id} product={item} />
        ))}
      </div>
    </div>
  );
};

export default NewProducts;

