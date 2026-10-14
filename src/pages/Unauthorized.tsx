import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const Unauthorized: React.FC = () => {
  const { user, isAdmin, isEmployee } = useAuth();
  const navigate = useNavigate();

  const targetDashboard = isAdmin ? '/admin/dashboard' : '/employee/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center space-y-5 animate-in fade-in">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="font-mono text-xs font-semibold text-rose-600 tracking-wider uppercase">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Access Restricted</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your current account credentials ({user?.email || 'Guest'}, Role:{' '}
            <strong className="text-slate-800">{user?.role || 'None'}</strong>) do not possess the required authorization level to access this endpoint or route.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-left text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Role-Based Policy Enforcement:</p>
          <p>&bull; Employees cannot access Executive Admin panels or Admin APIs.</p>
          <p>&bull; Administrators are routed to the central management console.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Go Back
          </button>
          <Link
            to={targetDashboard}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            Return to My Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
