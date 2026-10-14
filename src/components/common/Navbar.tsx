import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Plus,
  ChevronRight,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NotificationDrawer } from './NotificationDrawer.tsx';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState<boolean>(false);

  // Compute natural human breadcrumb title
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Overview';
    if (path.includes('/admin/employees')) return 'Team Members';
    if (path.includes('/admin/tasks/create')) return 'Create Task';
    if (path.includes('/admin/tasks')) return 'All Tasks';
    if (path.includes('/employee/dashboard')) return 'Overview';
    if (path.includes('/employee/tasks')) return 'My Tasks';
    if (path.includes('/profile')) return 'Settings';
    return 'Dashboard';
  };

  const handleLogout = async () => {
    await logout();
    navigate(isAdmin ? '/login/admin' : '/login/employee');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-8 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">TaskFlow</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
            <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
              {getBreadcrumbs()}
            </span>
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Admin Primary Action: Create Task shortcut */}
          {isAdmin && (
            <Link
              to="/admin/tasks/create"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-medium shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </Link>
          )}

          {/* Admin Email Notification Bell */}
          {isAdmin && (
            <button
              onClick={() => setNotificationDrawerOpen(true)}
              aria-label="View system notifications"
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors"
              title="Audit Email Deliveries"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            </button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 pl-1.5 rounded-lg hover:bg-slate-100/70 border border-transparent hover:border-slate-200 text-slate-700 transition-all focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-semibold text-slate-800 block leading-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                  {isAdmin ? 'Admin' : user?.department || 'Employee'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {isAdmin ? <Shield className="w-3 h-3 text-indigo-600" /> : <Briefcase className="w-3 h-3 text-emerald-600" />}
                        {user?.role}
                      </span>
                      <span className="text-[10px] text-slate-400">&bull;</span>
                      <span className="text-[10px] text-slate-500 truncate">{user?.department}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      to={isAdmin ? '/login/employee' : '/login/admin'}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <span className="w-3.5 h-3.5 text-slate-400 font-mono text-[11px] text-center">⇄</span>
                      <span>{isAdmin ? 'Switch to Employee Portal' : 'Switch to Admin Console'}</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1" />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Admin Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
      />
    </>
  );
};
