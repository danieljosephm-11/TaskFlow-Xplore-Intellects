import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const Unauthorized: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const targetDashboard = isAdmin ? '/admin/dashboard' : '/employee/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/90 p-8 text-center space-y-5 animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <span className="font-mono text-xs font-semibold text-rose-600 tracking-wider uppercase">
            Access Restricted
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Permission Required</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your account ({user?.email || 'Guest'}, <strong className="text-slate-800">{user?.role || 'Guest'}</strong>) doesn't have access to this page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Go Back
          </button>
          <Link
            to={targetDashboard}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
