import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('admin@xploreintellects.com');
  const [password, setPassword] = useState<string>('Admin@12345');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password, 'ADMIN');
    setLoading(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-grid-pattern flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
            <span className="font-bold text-lg tracking-tight">TF</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">TaskFlow</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-slate-200/80 text-slate-700">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Xplore Intellects</p>
          </div>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="mt-6 flex p-1 bg-slate-200/70 rounded-xl max-w-xs mx-auto border border-slate-300/40">
          <div className="flex-1 py-1.5 px-3 text-xs font-semibold text-center rounded-lg bg-white text-slate-900 shadow-xs">
            Admin Portal
          </div>
          <Link
            to="/login/employee"
            className="flex-1 py-1.5 px-3 text-xs font-medium text-center rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            Employee
          </Link>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Welcome back, Admin
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Manage organization tasks, monitor team completion rates, and assign work.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)]">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <span className="font-semibold">Notice:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 placeholder-slate-400 transition-colors"
                  placeholder="admin@xploreintellects.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="admin-password" className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 placeholder-slate-400 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 transition-all cursor-pointer shadow-xs"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in as Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="font-medium flex items-center gap-1.5 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Demo Account
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@xploreintellects.com', 'Admin@12345')}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  EV
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                    Eleanor Vance
                  </div>
                  <div className="text-[10px] text-slate-500">Engineering Leadership</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                <Sparkles className="w-3 h-3" />
                <span>Fill</span>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/login/employee"
            className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            Looking for Employee Portal? <span className="text-indigo-600 underline">Switch here</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
