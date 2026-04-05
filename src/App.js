import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import UserTraining from './pages/UserTraining';
import AdminDashboard from './pages/AdminDashboard';
import AdminAddUser from './pages/AdminAddUser';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminInServiceList from './pages/AdminInServiceList';
import AdminInServiceNew from './pages/AdminInServiceNew';
import AdminInServiceDetail from './pages/AdminInServiceDetail';
import AdminLessonPlans from './pages/AdminLessonPlans';
import AdminTrainingReports from './pages/AdminTrainingReports';
import ResetPassword from './pages/ResetPassword';
import AuthLoadingScreen from './components/AuthLoadingScreen';

function ProtectedRoute({ children, adminOnly = false }) {
  const { session, profile, loading, profileLoading } = useAuth();
  const hasValidSession = !!session?.user?.id;

  if (loading) return <AuthLoadingScreen />;

  if (!hasValidSession) return <Navigate to="/login" replace />;

  // Block only until we have a profile row (or fallback). Background refetch keeps profileLoading false.
  if (profileLoading && !profile) return <AuthLoadingScreen />;

  if (adminOnly && profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && profile?.role === 'admin') return <Navigate to="/admin" replace />;

  return children;
}

function GuestRoute({ children }) {
  const { session, profile, loading, profileLoading } = useAuth();
  const hasValidSession = !!session?.user?.id;
  if (loading) return <AuthLoadingScreen />;
  if (hasValidSession && profileLoading && !profile) return <AuthLoadingScreen />;
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
          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/training" element={<ProtectedRoute><UserTraining /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/add-user" element={<ProtectedRoute adminOnly><AdminAddUser /></ProtectedRoute>} />
          <Route path="/admin/user/:userId" element={<ProtectedRoute adminOnly><AdminUserDetail /></ProtectedRoute>} />
          <Route path="/admin/in-service" element={<ProtectedRoute adminOnly><AdminInServiceList /></ProtectedRoute>} />
          <Route path="/admin/in-service/new" element={<ProtectedRoute adminOnly><AdminInServiceNew /></ProtectedRoute>} />
          <Route path="/admin/in-service/:sessionId" element={<ProtectedRoute adminOnly><AdminInServiceDetail /></ProtectedRoute>} />
          <Route path="/admin/lesson-plans" element={<ProtectedRoute adminOnly><AdminLessonPlans /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminTrainingReports /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
