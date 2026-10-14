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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center space-y-5 animate-in fade-in">
        <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>

        <div>
          <span className="font-mono text-xs font-semibold text-indigo-600 tracking-wider uppercase">
            HTTP 404 Not Found
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Page Not Located</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            The resource, route, or document requested does not exist in the TaskFlow system.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to={homeRoute}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Application</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
