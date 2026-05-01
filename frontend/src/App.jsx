import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// ── Layouts ───────────────────────────────────────────────────────────────────
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";

// ── Client Pages ──────────────────────────────────────────────────────────────
import Home from "./pages/client/Home";
import Login from "./pages/client/Login";
import Register from "./pages/client/Register";
import Cart from "./pages/client/Cart";
import ProductDetail from "./pages/client/ProductDetail";
import MyAccount from "./pages/client/MyAccount";
import Order from "./pages/client/Order";
import Success from "./pages/client/Success";
import Checkout from "./pages/client/Checkout";
import ProductList from "./pages/client/ProductList";
import FlashSale from "./pages/client/FlashSale";
import MyVouchers from "./pages/client/MyVouchers";
import About from "./pages/client/About";
import Contact from "./pages/client/Contact";
import { FAQ, ShippingPolicy, PrivacyPolicy, Terms } from "./pages/client/PolicyPages";

// ── Admin Pages ───────────────────────────────────────────────────────────────
import AdminHome from "./pages/admin/Home";
import AdminUsers from "./pages/admin/Users";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminBanners from "./pages/admin/Banners";
import AdminFlashSales from "./pages/admin/FlashSales";
import AdminProductEdit from "./pages/admin/Product";
import AdminNewProduct from "./pages/admin/NewProduct";
import AdminCategories from "./pages/admin/Categories";
import AdminReviews from "./pages/admin/Reviews";
import AdminCoupon from "./pages/admin/CouponList";

function App() {
  const currentUser = useSelector((state) => state.user.currentUser);

  const router = createBrowserRouter([
    // ── CLIENT ROUTES (bọc bởi ClientLayout) ─────────────────────────────────
    {
      path: "/",
      element: <ClientLayout />,
      children: [
        { path: "/", element: <Home /> },
        { path: "/login", element: currentUser ? <Navigate to="/" /> : <Login /> },
        { path: "/register", element: currentUser ? <Navigate to="/" /> : <Register /> },
        { path: "/cart", element: <Cart /> },
        { path: "/product/:id", element: <ProductDetail /> },
        { path: "/products", element: <ProductList /> },
        { path: "/products/:category", element: <ProductList /> },
        { path: "/myaccount", element: currentUser ? <MyAccount /> : <Login /> },
        { path: "/myorders", element: currentUser ? <Order /> : <Login /> },
        { path: "/checkout", element: <Checkout /> },
        { path: "/success", element: <Success /> },
        { path: "/flash-sale", element: <FlashSale /> },
        { path: "/my-vouchers", element: currentUser ? <MyVouchers /> : <Login /> },
        { path: "/about", element: <About /> },
        { path: "/contact", element: <Contact /> },
        { path: "/faq", element: <FAQ /> },
        { path: "/shipping", element: <ShippingPolicy /> },
        { path: "/privacy", element: <PrivacyPolicy /> },
        { path: "/terms", element: <Terms /> },
      ],
    },

    // ── ADMIN ROUTES (bọc bởi AdminLayout — tự kiểm tra quyền role=1) ────────
    {
      path: "/admin",
      element: <AdminLayout />,
      children: [
        { path: "", element: <AdminHome /> },
        { path: "users", element: <AdminUsers /> },
        { path: "products", element: <AdminProducts /> },
        { path: "product/:id", element: <AdminProductEdit /> },
        { path: "newproduct", element: <AdminNewProduct /> },
        { path: "orders", element: <AdminOrders /> },
        { path: "categories", element: <AdminCategories /> },
        { path: "banners", element: <AdminBanners /> },
        { path: "flash-sales", element: <AdminFlashSales /> },
        { path: "reviews", element: <AdminReviews /> },
        { path: "coupons", element: <AdminCoupon /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
