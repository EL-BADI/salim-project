import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import { ShoppingCart } from "lucide-react";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </BrowserRouter>
    </LanguageProvider>
  );
}

function Header() {
  const { t, dir } = useLanguage();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const isAdmin = useQuery(api.auth.isAdmin);
  const cartCount = useQuery(api.cart.count);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <div className={`flex items-center gap-8 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          <Link to="/" className="text-2xl font-bold text-primary">
            ShopHub
          </Link>
          <nav className={`hidden md:flex gap-6 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
            <Link to="/" className="text-gray-700 hover:text-primary transition-colors">
              {t("home")}
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-primary transition-colors">
              {t("products")}
            </Link>
            <Authenticated>
              <Link to="/orders" className="text-gray-700 hover:text-primary transition-colors">
                {t("orders")}
              </Link>
            </Authenticated>
            {isAdmin && (
              <Link to="/admin" className="text-accent hover:text-accent-hover transition-colors font-semibold">
                {t("admin")}
              </Link>
            )}
          </nav>
        </div>
        <div className={`flex items-center gap-4 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
          <LanguageSwitcher />
          <Authenticated>
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartCount !== undefined && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className={`flex items-center gap-3 ${dir === "rtl" ? "flex-row-reverse" : ""}`}>
              <span className="text-sm text-gray-600 hidden sm:block">
                {loggedInUser?.email}
              </span>
              <SignOutButton />
            </div>
          </Authenticated>
          <Unauthenticated>
            <Link
              to="/"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              {t("signIn")}
            </Link>
          </Unauthenticated>
        </div>
      </div>
    </header>
  );
}
