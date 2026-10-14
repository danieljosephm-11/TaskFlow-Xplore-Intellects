import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  PlusCircle,
  User as UserIcon,
  LogOut,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(isAdmin ? '/login/admin' : '/login/employee');
  };

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/employees', label: 'Employees', icon: Users },
    { to: '/admin/tasks', label: 'All Tasks', icon: CheckSquare },
    { to: '/admin/tasks/create', label: 'Create Task', icon: PlusCircle },
    { to: '/profile', label: 'My Profile', icon: UserIcon },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/profile', label: 'My Profile', icon: UserIcon },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">TaskFlow</span>
            <span className="block text-[10px] text-indigo-400 font-medium tracking-wider uppercase">
              Xplore Intellects
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill Banner */}
      <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Workspace Portal</span>
          <span
            className={`font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
              isAdmin
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/80'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
            }`}
          >
            {isAdmin ? 'Admin Console' : 'Employee Portal'}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => {
                if (window.innerWidth < 768) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile footer info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-md border border-slate-800 hover:border-rose-900/50 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/70 backdrop-blur-xs flex">
          <div className="relative w-64 max-w-xs h-full bg-slate-900 shadow-xl">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onClose} />
        </div>
      )}
    </>
  );
};
