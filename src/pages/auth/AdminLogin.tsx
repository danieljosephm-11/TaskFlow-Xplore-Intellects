import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, ArrowRight, Lock, Mail, Layers } from 'lucide-react';
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
      setErrorMessage('Please provide both administrative email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password, 'ADMIN');
    setLoading(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.message);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@xploreintellects.com');
    setPassword('Admin@12345');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">TaskFlow</h1>
            <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Xplore Intellects</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            Executive Admin Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with authorized administrative credentials to manage organization tasks and teams.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl rounded-xl border border-slate-700/80 sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-md bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
              <span className="font-semibold shrink-0">Login Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500"
                  placeholder="admin@xploreintellects.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Autofill helper */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Demo Credentials
              </span>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                Auto-Fill Demo Admin
              </button>
            </div>
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700/60 font-mono text-[11px] text-slate-300 space-y-1">
              <div>Email: <span className="text-indigo-300">admin@xploreintellects.com</span></div>
              <div>Password: <span className="text-indigo-300">Admin@12345</span></div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/login/employee"
              className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors"
            >
              Are you an Employee? <span className="text-indigo-400 underline">Switch to Employee Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
