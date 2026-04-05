import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/General/HomePage';
import CategoryPage from './pages/General/CategoryPage';
import SearchPage from './pages/General/SearchPage';
import ProductDetailPage from './pages/General/ProductDetailPage';
import ProfilePage from './pages/User/ProfilePage';
import CartPage from './pages/User/CartPage';
import WishlistPage from './pages/User/WishlistPage';
import OrderSuccessPage from './pages/User/OrderSuccessPage';
import MyProductsPage from './pages/Provider/MyProductsPage';
import AddProductPage from './pages/Provider/AddProductPage';
import EditProductPage from './pages/Provider/EditProductPage';
import ManageOrdersPage from './pages/Provider/ManageOrdersPage';
import ProviderDashboardPage from './pages/Provider/ProviderDashboardPage';
import AddCategoryPage from './pages/Admin/AddCategoryPage';
import UserManagementPage from './pages/Admin/UserManagementPage';
import AddressManagementPage from './pages/Admin/AddressManagementPage';
import ProductManagementPage from './pages/Admin/ProductManagementPage';
import OrderManagementPage from './pages/Admin/OrderManagementPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/loadingspinner/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css'

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
    <Router>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/categories/:categoryName" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin/user-management" element={
              <ProtectedRoute roles={['admin']}>
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/address-management" element={
              <ProtectedRoute roles={['admin']}>
                <AddressManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/product-management" element={
              <ProtectedRoute roles={['admin']}>
                <ProductManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/order-management" element={
              <ProtectedRoute roles={['admin']}>
                <OrderManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/add-category" element={
              <ProtectedRoute roles={['admin']}>
                <AddCategoryPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/add-product" element={
              <ProtectedRoute roles={['provider']}>
                <AddProductPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/edit-product/:productId" element={
              <ProtectedRoute roles={['provider', 'admin']}>
                <EditProductPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/my-products" element={
              <ProtectedRoute roles={['provider']}>
                <MyProductsPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/manage-orders" element={
              <ProtectedRoute roles={['provider']}>
                <ManageOrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/provider/dashboard" element={
              <ProtectedRoute roles={['provider']}>
                <ProviderDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute> {/* Protected for all logged-in users */}
                <CartPage />
              </ProtectedRoute>
            } />
            <Route path="/order/success" element={
              <ProtectedRoute> {/* Protected for all logged-in users */}
                <OrderSuccessPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
      </ToastProvider>
      </Router>
    </Suspense>
  );
}

export default App
