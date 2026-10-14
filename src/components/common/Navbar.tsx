import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Layers,
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

  // Compute breadcrumb title based on path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return 'Admin Overview';
    if (path.includes('/admin/employees')) return 'Employee Directory';
    if (path.includes('/admin/tasks/create')) return 'Task Assignment Engine';
    if (path.includes('/admin/tasks')) return 'Enterprise Task Directory';
    if (path.includes('/employee/dashboard')) return 'Employee Overview';
    if (path.includes('/employee/tasks')) return 'My Assigned Tasks';
    if (path.includes('/profile')) return 'Account Settings';
    return 'Portal';
  };

  const handleLogout = async () => {
    await logout();
    navigate(isAdmin ? '/login/admin' : '/login/employee');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-800">{getBreadcrumbs()}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 hidden sm:inline">TaskFlow</span>
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile Dropdown */}
        <div className="flex items-center gap-4">
          {/* Quick Demo Switcher helper */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
            <span>Role:</span>
            <span className="font-semibold text-slate-800">{user?.role}</span>
            <span className="text-slate-300">|</span>
            <Link
              to={isAdmin ? '/login/employee' : '/login/admin'}
              className="text-indigo-600 hover:underline font-medium"
            >
              Switch Portal
            </Link>
          </div>

          {/* Admin Notification Center Trigger */}
          {isAdmin && (
            <button
              onClick={() => setNotificationDrawerOpen(true)}
              aria-label="View system notifications"
              className="relative p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Audit Email Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 text-slate-700 transition-colors focus:outline-none"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                {user?.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <p className="text-[10px] text-indigo-600 font-medium mt-0.5 uppercase tracking-wider">
                      {user?.department} &bull; {user?.role}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>Account Profile</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

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
