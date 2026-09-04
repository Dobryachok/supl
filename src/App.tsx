import { Route, Routes } from 'react-router-dom';
import { BuyerLayout } from './components/layout/BuyerLayout';
import { SellerLayout } from './components/layout/SellerLayout';
import { AcceptancePage } from './pages/buyer/AcceptancePage';
import { CartPage } from './pages/buyer/CartPage';
import { CatalogPage } from './pages/buyer/CatalogPage';
import { CategoryPage } from './pages/buyer/CategoryPage';
import { ChatsPage } from './pages/buyer/ChatsPage';
import { CheckoutPage } from './pages/buyer/CheckoutPage';
import { DeliveriesPage } from './pages/buyer/DeliveriesPage';
import { FavoritesPage } from './pages/buyer/FavoritesPage';
import { HomePage } from './pages/buyer/HomePage';
import { NotFoundPage } from './pages/buyer/NotFoundPage';
import { OrderPage } from './pages/buyer/OrderPage';
import { OrdersPage } from './pages/buyer/OrdersPage';
import { ProductPage } from './pages/buyer/ProductPage';
import { ProfilePage } from './pages/buyer/ProfilePage';
import { SearchPage } from './pages/buyer/SearchPage';
import { SupplierPage } from './pages/buyer/SupplierPage';
import { SuppliersPage } from './pages/buyer/SuppliersPage';
import { SellerChatsPage } from './pages/seller/SellerChatsPage';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { SellerDeliveriesPage } from './pages/seller/SellerDeliveriesPage';
import { SellerImportPage } from './pages/seller/SellerImportPage';
import { SellerOrderPage } from './pages/seller/SellerOrderPage';
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage';
import { SellerProductFormPage } from './pages/seller/SellerProductFormPage';
import { SellerProductsPage } from './pages/seller/SellerProductsPage';
import { SellerProfilePage } from './pages/seller/SellerProfilePage';

export function App() {
  return (
    <Routes>
      <Route element={<BuyerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/:id" element={<SupplierPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderPage />} />
        <Route path="/orders/:id/acceptance" element={<AcceptancePage />} />
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<SellerDashboard />} />
        <Route path="orders" element={<SellerOrdersPage />} />
        <Route path="orders/:id" element={<SellerOrderPage />} />
        <Route path="deliveries" element={<SellerDeliveriesPage />} />
        <Route path="products" element={<SellerProductsPage />} />
        <Route path="products/new" element={<SellerProductFormPage />} />
        <Route path="products/import" element={<SellerImportPage />} />
        <Route path="products/:id/edit" element={<SellerProductFormPage />} />
        <Route path="chats" element={<SellerChatsPage />} />
        <Route path="profile" element={<SellerProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
