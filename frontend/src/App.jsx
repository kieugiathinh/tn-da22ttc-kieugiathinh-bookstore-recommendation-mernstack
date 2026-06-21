import { RouterProvider, createBrowserRouter } from "react-router-dom";

// ── Layouts ───────────────────────────────────────────────────────────────────
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";

// ── Route Guards ──────────────────────────────────────────────────────────────
import ProtectedRoute from "./components/common/ProtectedRoute";
import GuestRoute from "./components/common/GuestRoute";

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
import AllCoupons from "./pages/client/AllCoupons";
import ForgotPassword from "./pages/client/ForgotPassword";
import ResetPassword from "./pages/client/ResetPassword";
import { FAQ, ShippingPolicy, PrivacyPolicy, Terms } from "./pages/client/PolicyPages";
import Recommendations from "./pages/client/Recommendations";

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
import AdminChatAnalytics from "./pages/admin/ChatAnalytics";
import AdminRecommendations from "./pages/admin/AIRecommendations";
import AdminEmailCampaign from "./pages/admin/EmailCampaign";
import AdminUserStats from "./pages/admin/UserStats";
import AdminOrderStats from "./pages/admin/OrderStats";
import AdminProductStats from "./pages/admin/ProductStats";
import AdminFlashSaleStats from "./pages/admin/FlashSaleStats";

// ── Router Configuration ─────────────────────────────────────────────────────
const router = createBrowserRouter([
  // ── CLIENT ROUTES (bọc bởi ClientLayout) ─────────────────────────────────
  {
    path: "/",
    element: <ClientLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/cart", element: <Cart /> },
      { path: "/product/:id", element: <ProductDetail /> },
      { path: "/products", element: <ProductList /> },
      { path: "/products/:category", element: <ProductList /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/success", element: <Success /> },
      { path: "/flash-sale", element: <FlashSale /> },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <Contact /> },
      { path: "/faq", element: <FAQ /> },
      { path: "/shipping", element: <ShippingPolicy /> },
      { path: "/privacy", element: <PrivacyPolicy /> },
      { path: "/terms", element: <Terms /> },
      { path: "/recommendations", element: <Recommendations /> },
      { path: "/coupons", element: <AllCoupons /> },

      // ── Guest-only routes (đã đăng nhập → redirect về /) ──────────────
      { path: "/login", element: <GuestRoute><Login /></GuestRoute> },
      { path: "/register", element: <GuestRoute><Register /></GuestRoute> },
      { path: "/forgot-password", element: <GuestRoute><ForgotPassword /></GuestRoute> },
      { path: "/reset-password/:token", element: <GuestRoute><ResetPassword /></GuestRoute> },

      // ── Protected routes (chưa đăng nhập → redirect về /login) ────────
      { path: "/myaccount", element: <ProtectedRoute><MyAccount /></ProtectedRoute> },
      { path: "/myorders", element: <ProtectedRoute><Order /></ProtectedRoute> },
      { path: "/my-vouchers", element: <ProtectedRoute><MyVouchers /></ProtectedRoute> },
    ],
  },

  // ── ADMIN ROUTES (AdminLayout tự kiểm tra quyền role=1) ────────────────
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
      { path: "chat-analytics", element: <AdminChatAnalytics /> },
      { path: "ai-recommendations", element: <AdminRecommendations /> },
      { path: "email-marketing", element: <AdminEmailCampaign /> },
      { path: "user-stats", element: <AdminUserStats /> },
      { path: "order-stats", element: <AdminOrderStats /> },
      { path: "product-stats", element: <AdminProductStats /> },
      { path: "flashsale-stats", element: <AdminFlashSaleStats /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
