import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';

// Pages
import { AdminLogin } from './pages/auth/AdminLogin.tsx';
import { EmployeeLogin } from './pages/auth/EmployeeLogin.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { EmployeeManagement } from './pages/admin/EmployeeManagement.tsx';
import { AllTasks } from './pages/admin/AllTasks.tsx';
import { CreateTask } from './pages/admin/CreateTask.tsx';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard.tsx';
import { MyTasks } from './pages/employee/MyTasks.tsx';
import { Profile } from './pages/Profile.tsx';
import { Unauthorized } from './pages/Unauthorized.tsx';
import { NotFound } from './pages/NotFound.tsx';

// Smart Root Redirector
const RootRedirector: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login/employee" replace />;
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/employee/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<RootRedirector />} />

          {/* Public Auth Routes */}
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/login/employee" element={<EmployeeLogin />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="tasks" element={<AllTasks />} />
            <Route path="tasks/create" element={<CreateTask />} />
          </Route>

          {/* Employee Protected Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="tasks" element={<MyTasks />} />
          </Route>

          {/* Shared Authenticated Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Profile />} />
          </Route>

          {/* Error and Fallback Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
