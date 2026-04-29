import {
  RouterProvider,
  createBrowserRouter,
  Outlet,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import ScrollToTop from "./components/ScrollToTop";

//user
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import ProductDetail from "./pages/ProductDetail";
import MyAccount from "./pages/MyAccount";
import Order from "./pages/Order";
import Success from "./pages/Success";
import Checkout from "./pages/Checkout";
import ProductList from "./pages/ProductList";
import FlashSale from "./pages/FlashSale";
import MyVouchers from "./pages/MyVouchers";
import About from "./pages/About";
import Contact from "./pages/Contact";
import { FAQ, ShippingPolicy, PrivacyPolicy, Terms } from "./pages/PolicyPages";

//admin
import AdminMenu from "./components/admin/Menu";
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
  const user = useSelector((state) => state.user);
  const currentUser = user.currentUser;

  //user
  const ClientLayout = () => {
    return (
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </div>
    );
  };

  //admin
  const AdminLayout = () => {
    if (!currentUser || currentUser.role !== 1) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="flex min-h-screen bg-slate-50">
        <ScrollToTop />
        <div className="w-64 flex-none border-r bg-white shadow-sm h-screen sticky top-0 overflow-y-auto z-50">
          <AdminMenu />
        </div>

        <div className="flex-1 p-4 overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    );
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <ClientLayout />,
      children: [
        { path: "/", element: <Home /> },
        {
          path: "/login",
          element: currentUser ? <Navigate to="/" /> : <Login />,
        },
        {
          path: "/register",
          element: currentUser ? <Navigate to="/" /> : <Register />,
        },
        { path: "/cart", element: <Cart /> },
        { path: "/product/:id", element: <ProductDetail /> },
        { path: "/products", element: <ProductList /> },
        { path: "/products/:category", element: <ProductList /> },
        {
          path: "/myaccount",
          element: currentUser ? <MyAccount /> : <Login />,
        },
        { path: "/myorders", element: currentUser ? <Order /> : <Login /> },
        { path: "/checkout", element: <Checkout /> },
        { path: "/success", element: <Success /> },
        { path: "/flash-sale", element: <FlashSale /> },
        {
          path: "/my-vouchers",
          element: currentUser ? <MyVouchers /> : <Login />,
        },
        //footer
        { path: "/about", element: <About /> },
        { path: "/contact", element: <Contact /> },
        { path: "/faq", element: <FAQ /> },
        { path: "/shipping", element: <ShippingPolicy /> },
        { path: "/privacy", element: <PrivacyPolicy /> },
        { path: "/terms", element: <Terms /> },
      ],
    },

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
