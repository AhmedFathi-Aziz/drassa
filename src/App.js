import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetail from './pages/AdminUserDetail';
import ResetPassword from './pages/ResetPassword';
import AuthLoadingScreen from './components/AuthLoadingScreen';

function ProtectedRoute({ children, adminOnly = false }) {
  const { session, profile, loading, profileLoading } = useAuth();
  const hasValidSession = !!session?.user?.id;

  if (loading) return <AuthLoadingScreen />;

  if (!hasValidSession) return <Navigate to="/login" replace />;

  if (profileLoading) return <AuthLoadingScreen />;

  if (adminOnly && profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && profile?.role === 'admin') return <Navigate to="/admin" replace />;

  return children;
}

function GuestRoute({ children }) {
  const { session, profile, loading, profileLoading } = useAuth();
  const hasValidSession = !!session?.user?.id;
  if (loading || profileLoading) return <AuthLoadingScreen />;
  if (hasValidSession) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/user/:userId" element={<ProtectedRoute adminOnly><AdminUserDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
