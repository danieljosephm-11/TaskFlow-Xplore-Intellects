import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const NotFound: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const homeRoute = !isAuthenticated
    ? '/login/employee'
    : isAdmin
    ? '/admin/dashboard'
    : '/employee/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/90 p-8 text-center space-y-5 animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>

        <div>
          <span className="font-mono text-xs font-semibold text-slate-500 tracking-wider uppercase">
            404 Error
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Page Not Found</h1>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to={homeRoute}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
