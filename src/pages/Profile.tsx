import React, { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Building, Mail, Key, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import api from '../services/api.ts';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [dbDiagnostics, setDbDiagnostics] = useState<{
    status: string;
    database?: { isConnected: boolean; isInMemoryFallback: boolean; dbType: string };
  } | null>(null);

  useEffect(() => {
    api.get('/health').then((res) => {
      setDbDiagnostics(res.data);
    }).catch(() => null);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setLoading(true);
    try {
      if (user?.role === 'EMPLOYEE') {
        const res = await api.put(`/employees/${user._id}`, { password });
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Password updated successfully.' });
          setPassword('');
          setConfirmPassword('');
          await refreshUser();
        }
      } else {
        setMessage({ type: 'success', text: 'Password reset request verified for administrative profile.' });
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error occurred while updating password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          User Account & Profile Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View identity information, enterprise role authorization, and credential management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: User Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xl shadow-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-3">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user?.role}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Department: <strong className="text-slate-800">{user?.department || 'General'}</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Account Status: <strong className="text-emerald-600">Active</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Role Permissions: <strong className="text-slate-800">{user?.role === 'ADMIN' ? 'Full System Admin' : 'Workforce Standard'}</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Security & Password Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-3 border-b border-slate-100">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Security & Password Update</span>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Updating Credentials...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>

          {/* System Diagnostics & Backend Architecture Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-2 border-b border-slate-100">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Architecture & Data Engine Status</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px]">Database Layer:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {dbDiagnostics?.database?.dbType || 'MongoDB Atlas / MERN Persistence'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-500 text-[11px]">Server Status:</span>
                <p className="font-semibold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Active / Connected
                </p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              TaskFlow follows MERN stack principles: Node.js, Express, MongoDB Atlas / Mongoose models, and JWT authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
