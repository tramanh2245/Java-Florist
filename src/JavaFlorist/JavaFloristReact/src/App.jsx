import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";

// 1. CONTEXTS
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// 2. COMPONENTS
import { ProtectedRoute } from "./components/ProtectedRoute";
import FloatingButtons from "./components/FloatingButtons";
import ProductModal from "./components/ProductModal";
import Layout from "./components/Layout";

// 3. PAGES - AUTH & MAIN
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import Dashboard from "./pages/Dashboard";
import AllProductsPage from "./pages/AllProductsPage";

// 4. PAGES - ADMIN & MANAGEMENT
import UserManagement  from "./pages/UserManagement";
import BouquetManagement from "./pages/BouquetManagement";
import AddBouquetPage from "./pages/AddBouquetPage";
import EditBouquetPage from "./pages/EditBouquetPage";
import PartnerRegistrationPage from "./pages/PartnerRegistrationPage";
import PartnerApprovalPage from "./pages/PartnerApprovalPage";
import UserDetailPage from "./pages/UserDetailPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import CheckoutPage from './pages/CheckoutPage';
import PaypalSuccess from './pages/PaypalSuccess';
import PartnerOrdersPage from './pages/PartnerOrdersPage';
import AdminOrderManagement from './pages/AdminOrderManagement';
import AdminOrderDetailsPage from "./pages/AdminOrderDetailsPage";
import PartnerAnalyticsPage from "./pages/PartnerAnalyticsPage";


function App() {
  // ─── 1. STATE ───
  const [closing, setClosing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const openSearch = () => {
    setClosing(false);
    setShowSearch(true);
  };


  return (
    <AuthProvider>
      <CartProvider>
        {/* ─── 3. ROUTES ─── */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<Layout setSelectedProduct={setSelectedProduct} />}>
            <Route path="/all-products" element={<AllProductsPage />} />
            <Route path="/partner-registration" element={<PartnerRegistrationPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected Routes (User) */}
          <Route path="/profile" element={<ProtectedRoute Component={ProfilePage} />} />
          <Route path="/my-orders" element={<ProtectedRoute Component={MyOrdersPage} />} />
          <Route path="/change-password" element={<ProtectedRoute Component={ChangePasswordPage} />} />
          <Route
            path="/partner/orders"
            element={<ProtectedRoute Component={PartnerOrdersPage} requiredRole="Partner" />}
          />

          {/* Admin Routes */}
          <Route path="/admin/user-management" element={<ProtectedRoute Component={UserManagement} requiredRole="Admin" />} />

          <Route path="/admin/orders" element={<ProtectedRoute Component={AdminOrderManagement} requiredRole="Admin" />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
          <Route
            path="/bouquetManagement"
            element={<ProtectedRoute Component={BouquetManagement} requiredRole="Admin" />}
          />

          <Route
            path="/admin/add-bouquet"
            element={<ProtectedRoute Component={AddBouquetPage} requiredRole="Admin" />}
          />

          <Route
            path="/admin/edit-bouquet/:id"
            element={<ProtectedRoute Component={EditBouquetPage} requiredRole="Admin" />}
          />

          <Route
            path="/admin/partner-approvals"
            element={<ProtectedRoute Component={PartnerApprovalPage} requiredRole="Admin" />}
          />

          <Route
            path="/admin/users/:id"
            element={<ProtectedRoute Component={UserDetailPage} requiredRole="Admin" />}
          />

          <Route path="/checkout" element={<ProtectedRoute Component={CheckoutPage} />} />
          <Route path="/paypal-success" element={<ProtectedRoute Component={PaypalSuccess} />} />
          <Route path="/partner/analytics" element={<PartnerAnalyticsPage />} />

        </Routes>


        {/* ─── 4. GLOBAL FLOATING ELEMENTS ─── */}
        <FloatingButtons />

        <ProductModal
          selected={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;