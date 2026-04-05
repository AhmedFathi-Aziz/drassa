import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { CacheProvider } from './lib/CacheContext';

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
import AdminSafetyEventList from './pages/AdminSafetyEventList';
import AdminSafetyEventNew from './pages/AdminSafetyEventNew';
import AdminAuditLogs from './pages/AdminAuditLogs';
import UserSafetyEvents from './pages/UserSafetyEvents';
import ResetPassword from './pages/ResetPassword';
import AuthLoadingScreen from './components/AuthLoadingScreen';

const AUTH_STUCK_MS = 22_000;

function ProtectedRoute({ children, adminOnly = false }) {
  const { session, profile, loading, profileLoading } = useAuth();
  const hasValidSession = !!session?.user?.id;
  const [stuckBypass, setStuckBypass] = useState(false);

  useEffect(() => {
    const blocked =
      loading || (hasValidSession && profileLoading && profile == null);
    if (!blocked) {
      setStuckBypass(false);
      return undefined;
    }
    const t = setTimeout(() => setStuckBypass(true), AUTH_STUCK_MS);
    return () => clearTimeout(t);
  }, [loading, hasValidSession, profileLoading, profile]);

  if (loading && !stuckBypass) return <AuthLoadingScreen />;

  if (!hasValidSession) return <Navigate to="/login" replace />;

  if (profileLoading && !profile && !stuckBypass) return <AuthLoadingScreen />;

  if (adminOnly && profile && profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && profile?.role === 'admin') return <Navigate to="/admin" replace />;

  return children;
}

function GuestRoute({ children }) {
  const { session, profile, loading, profileLoading } = useAuth();
  const hasValidSession = !!session?.user?.id;
  const [stuckBypass, setStuckBypass] = useState(false);

  useEffect(() => {
    const blocked =
      loading || (hasValidSession && profileLoading && profile == null);
    if (!blocked) {
      setStuckBypass(false);
      return undefined;
    }
    const t = setTimeout(() => setStuckBypass(true), AUTH_STUCK_MS);
    return () => clearTimeout(t);
  }, [loading, hasValidSession, profileLoading, profile]);

  if (loading && !stuckBypass) return <AuthLoadingScreen />;
  if (hasValidSession && profileLoading && !profile && !stuckBypass) return <AuthLoadingScreen />;
  if (hasValidSession) {
    if (profile?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CacheProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/training" element={<ProtectedRoute><UserTraining /></ProtectedRoute>} />
            <Route path="/dashboard/safety" element={<ProtectedRoute><UserSafetyEvents /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/add-user" element={<ProtectedRoute adminOnly><AdminAddUser /></ProtectedRoute>} />
            <Route path="/admin/user/:userId" element={<ProtectedRoute adminOnly><AdminUserDetail /></ProtectedRoute>} />
            <Route path="/admin/in-service" element={<ProtectedRoute adminOnly><AdminInServiceList /></ProtectedRoute>} />
            <Route path="/admin/in-service/new" element={<ProtectedRoute adminOnly><AdminInServiceNew /></ProtectedRoute>} />
            <Route path="/admin/in-service/:sessionId" element={<ProtectedRoute adminOnly><AdminInServiceDetail /></ProtectedRoute>} />
            <Route path="/admin/lesson-plans" element={<ProtectedRoute adminOnly><AdminLessonPlans /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute adminOnly><AdminTrainingReports /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute adminOnly><AdminAuditLogs /></ProtectedRoute>} />
            <Route path="/admin/safety" element={<ProtectedRoute adminOnly><AdminSafetyEventList /></ProtectedRoute>} />
            <Route path="/admin/safety/new" element={<ProtectedRoute adminOnly><AdminSafetyEventNew /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CacheProvider>
    </AuthProvider>
  );
}
