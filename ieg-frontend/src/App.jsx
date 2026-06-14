import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import api, { API_BASE } from "./config/api";
import axios from "axios";

import DashboardLayout from "./components/layout/DashboardLayout";
import PrivateRoute from "./components/guards/PrivateRoute";
import GuestRoute from "./components/guards/GuestRoute";
import Spinner from "./components/ui/Spinner";

import LandingPage from "./features/public/LandingPage";
import ServicesPage from "./features/public/ServicesPage";
import PricingPage from "./features/public/PricingPage";
import AboutPage from "./features/public/AboutPage";
import ContactPage from "./features/public/ContactPage";

import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";

import AdminDashboard from "./features/admin/AdminDashboard";
import AdminUsers from "./features/admin/AdminUsers";
import AdminVerifications from "./features/admin/AdminVerifications";
import AdminDocumentReviews from "./features/admin/AdminDocumentReviews";
import AdminReports from "./features/admin/AdminReports";
import AdminSettings from "./features/admin/AdminSettings";
import AdminChatModeration from "./features/admin/AdminChatModeration";
import ChatPage from "./components/chat/ChatPage";

import ExporterDashboard from "./features/exporter/ExporterDashboard";
import ExporterProducts from "./features/exporter/ExporterProducts";
import AddProduct from "./features/exporter/AddProduct";
import ExporterOrders from "./features/exporter/ExporterOrders";
import BuyerRequests from "./features/exporter/BuyerRequests";
import ExporterShippingRequests from "./features/exporter/ExporterShippingRequests";
import ExporterDocuments from "./features/exporter/ExporterDocuments";
import ExporterWallet from "./features/exporter/ExporterWallet";

import BuyerDashboard from "./features/buyer/BuyerDashboard";
import Marketplace from "./features/buyer/Marketplace";
import BuyerOrders from "./features/buyer/BuyerOrders";
import BuyerSettings from "./features/buyer/BuyerSettings";
import ProductDetailsPage from "./features/buyer/ProductDetailsPage";
import BuyerShipmentDetail from "./features/buyer/BuyerShipmentDetail";

import ShipperDashboard from "./features/shipper/ShipperDashboard";
import ShipperShippingRequests from "./features/shipper/ShipperShippingRequests";
import ShipmentTracking from "./features/shipper/ShipmentTracking";
import ShipperReports from "./features/shipper/ShipperReports";
import ShipperSettings from "./features/shipper/ShipperSettings";

export default function App() {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const restoreSession = async () => {
      setLoading(true);
      try {
        const { data: refreshData } = await axios.post(
          `${API_BASE}/auth/refresh-token`,
          {},
          { withCredentials: true, timeout: 5000 },
        );
        const accessToken = refreshData.data?.accessToken;
        if (!accessToken) { setLoading(false); return; }

        const { data: meData } = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const user = meData.data?.user;
        if (user) setAuth(user, accessToken);
        else setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    restoreSession();
  }, [setAuth, setLoading]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      <Route path="/auth/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/auth/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/auth/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/auth/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

      <Route path="/admin" element={<PrivateRoute roles={["admin"]}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="verifications" element={<AdminVerifications />} />
        <Route path="document-reviews" element={<AdminDocumentReviews />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="chat" element={<AdminChatModeration />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/exporter" element={<PrivateRoute roles={["exporter"]}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<ExporterDashboard />} />
        <Route path="products" element={<ExporterProducts />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="orders" element={<ExporterOrders />} />
        <Route path="purchase-requests" element={<BuyerRequests />} />
        <Route path="buyer-requests" element={<BuyerRequests />} />
        <Route path="shipping-requests" element={<ExporterShippingRequests />} />
        <Route path="documents" element={<ExporterDocuments />} />
        <Route path="wallet" element={<ExporterWallet />} />
        <Route path="shipments" element={<ShipmentTracking />} />
        <Route path="messages" element={<ChatPage />} />
      </Route>

      <Route path="/buyer" element={<PrivateRoute roles={["buyer"]}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<BuyerDashboard />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="marketplace/:id" element={<ProductDetailsPage />} />
        <Route path="orders" element={<BuyerOrders />} />
        <Route path="orders/:orderId/shipment" element={<BuyerShipmentDetail />} />
        <Route path="messages" element={<ChatPage />} />
        <Route path="settings" element={<BuyerSettings />} />
      </Route>

      <Route path="/shipper" element={<PrivateRoute roles={["shipper"]}><DashboardLayout /></PrivateRoute>}>
        <Route index element={<ShipperDashboard />} />
        <Route path="requests" element={<ShipperShippingRequests />} />
        <Route path="create" element={<ShipperShippingRequests />} />
        <Route path="tracking" element={<ShipmentTracking />} />
        <Route path="reports" element={<ShipperReports />} />
        <Route path="settings" element={<ShipperSettings />} />
      </Route>

      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1b3e" }}>
          <div className="text-center animate-fade-in">
            <p className="font-display font-bold text-6xl text-white mb-3">404</p>
            <p className="text-slate-400 mb-6">Page not found</p>
            <a href="/" className="btn-gold">← Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}
