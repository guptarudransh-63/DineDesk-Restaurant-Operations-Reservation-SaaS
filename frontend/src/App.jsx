import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';

// Pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import Reservation from './pages/Reservation';
import OrderTracking from './pages/OrderTracking';
import StaffFloor from './pages/StaffFloor';
import StaffPOS from './pages/StaffPOS';
import KitchenKDS from './pages/KitchenKDS';
import BillingPOS from './pages/BillingPOS';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import AdminReservations from './pages/AdminReservations';
import AdminStaff from './pages/AdminStaff';
import AdminSettings from './pages/AdminSettings';
import CustomerDashboard from './pages/CustomerDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-stone-950 text-stone-100">
        <Navbar />

        <main className="flex-1">
          <Routes>
            {/* Customer Website Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/reservations" element={<Reservation />} />
            <Route path="/orders/track" element={<OrderTracking />} />
            <Route path="/orders/track/:id" element={<OrderTracking />} />
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Staff & Kitchen Operations */}
            <Route path="/staff/floor" element={<StaffFloor />} />
            <Route path="/staff/pos" element={<StaffPOS />} />
            <Route path="/kitchen/kds" element={<KitchenKDS />} />
            <Route path="/billing" element={<BillingPOS />} />

            {/* Admin Operations & Analytics */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/menu" element={<AdminMenu />} />
            <Route path="/admin/reservations" element={<AdminReservations />} />
            <Route path="/admin/staff" element={<AdminStaff />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <CartDrawer />
      </div>
    </BrowserRouter>
  );
}
