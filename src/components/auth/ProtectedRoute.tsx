import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types/client.ts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Validating credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // If attempting to access /admin/*, direct to /login/admin, else /login/employee
    const isTargetingAdmin = location.pathname.startsWith('/admin');
    return (
      <Navigate
        to={isTargetingAdmin ? '/login/admin' : '/login/employee'}
        state={{ from: location }}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
