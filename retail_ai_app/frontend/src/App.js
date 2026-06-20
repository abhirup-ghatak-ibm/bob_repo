import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import DashboardPage  from './pages/DashboardPage';
import InventoryPage  from './pages/InventoryPage';
import InsightsPage   from './pages/InsightsPage';
import AllRecsPage    from './pages/AllRecsPage';
import SettingsPage   from './pages/SettingsPage';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { Spinner } from './components/UI';
import './index.css';

function AppRoutes() {
  const { owner, loading } = useAuth();

  if (loading) return <div className="auth-page"><Spinner /></div>;

  if (!owner) {
    return (
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/insights"  element={<InsightsPage />} />
        <Route path="/all-recs"  element={<AllRecsPage />} />
        <Route path="/settings"  element={<SettingsPage />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
