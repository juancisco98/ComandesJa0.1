
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext'; // Import DataProvider
import Layout from './components/Layout';
import LoginView from './components/LoginView';
import KitchenView from './components/KitchenView';
import MenuEditor from './components/MenuEditor';
import ShiftClose from './components/ShiftClose';
import StoreFront from './components/StoreFront';
import CustomerHome from './components/CustomerHome';
import CustomersView from './components/CustomersView';
import MarketingView from './components/MarketingView';
import SettingsView from './components/SettingsView';
import AnalyticsView from './components/AnalyticsView';
import { UserRole } from './types';

// Componente para proteger rutas y redirigir según rol
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/store" replace />;
    }
    return <Navigate to="/admin/kitchen" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'TENANT' ? "/admin/kitchen" : "/store"} replace /> : <LoginView />} />
      
      {/* Customer Routes (Marketplace & Stores) */}
      <Route path="/store" element={
        <ProtectedRoute allowedRoles={['CUSTOMER', 'TENANT']}>
           <CustomerHome />
        </ProtectedRoute>
      } />
      <Route path="/store/:slug" element={
        <ProtectedRoute allowedRoles={['CUSTOMER', 'TENANT']}>
           <StoreFront />
        </ProtectedRoute>
      } />

      {/* Admin Routes - Solo TENANT */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['TENANT']}>
          <Layout>
            <Routes>
              <Route path="kitchen" element={<KitchenView />} />
              <Route path="menu" element={<MenuEditor />} />
              <Route path="shift" element={<ShiftClose />} />
              <Route path="customers" element={<CustomersView />} />
              <Route path="marketing" element={<MarketingView />} />
              <Route path="settings" element={<SettingsView />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="*" element={<Navigate to="kitchen" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to={user ? (user.role === 'TENANT' ? "/admin/kitchen" : "/store") : "/login"} replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
            <AppRoutes />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;
