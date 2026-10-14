import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const EmployeeLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('john.doe@xploreintellects.com');
  const [password, setPassword] = useState<string>('Employee@12345');
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
    const result = await login(email.trim(), password, 'EMPLOYEE');
    setLoading(false);

    if (result.success) {
      const from = (location.state as any)?.from?.pathname || '/employee/dashboard';
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

  const demoEmployees = [
    {
      name: 'John Doe',
      email: 'john.doe@xploreintellects.com',
      initials: 'JD',
      department: 'Frontend',
      color: 'bg-blue-600',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@xploreintellects.com',
      initials: 'JS',
      department: 'Backend',
      color: 'bg-emerald-600',
    },
    {
      name: 'Robert Chen',
      email: 'robert.chen@xploreintellects.com',
      initials: 'RC',
      department: 'QA & DevOps',
      color: 'bg-purple-600',
    },
  ];

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
          <Link
            to="/login/admin"
            className="flex-1 py-1.5 px-3 text-xs font-medium text-center rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            Admin
          </Link>
          <div className="flex-1 py-1.5 px-3 text-xs font-semibold text-center rounded-lg bg-white text-slate-900 shadow-xs">
            Employee Portal
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Welcome to your Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            View your assigned tasks, update progress notes, and collaborate in real-time.
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
              <label htmlFor="emp-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="emp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 placeholder-slate-400 transition-colors"
                  placeholder="name@xploreintellects.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="emp-password" className="block text-xs font-medium text-slate-700">
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
                  id="emp-password"
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
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Employees */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
              <span className="font-medium flex items-center gap-1.5 text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                Demo Team Accounts
              </span>
              <span className="text-[11px] text-slate-400">1-click select</span>
            </div>

            <div className="space-y-1.5">
              {demoEmployees.map((emp) => {
                const isSelected = email === emp.email;
                return (
                  <button
                    key={emp.email}
                    type="button"
                    onClick={() => handleQuickLogin(emp.email, 'Employee@12345')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full ${emp.color} text-white flex items-center justify-center text-[10px] font-bold`}
                      >
                        {emp.initials}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{emp.name}</div>
                        <div className="text-[10px] text-slate-500">{emp.department}</div>
                      </div>
                    </div>
                    <div
                      className={`text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{isSelected ? 'Active' : 'Select'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            to="/login/admin"
            className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            Executive or Admin? <span className="text-indigo-600 underline">Sign in to Admin Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
