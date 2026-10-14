import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  PlusCircle,
  User as UserIcon,
  LogOut,
  X,
  ArrowLeftRight,
  Briefcase,
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
    { to: '/admin/tasks', label: 'All Tasks', icon: CheckSquare },
    { to: '/admin/tasks/create', label: 'Create Task', icon: PlusCircle },
    { to: '/admin/employees', label: 'Team Directory', icon: Users },
    { to: '/profile', label: 'Account Settings', icon: UserIcon },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employee/tasks', label: 'My Tasks', icon: CheckSquare },
    { to: '/profile', label: 'Account Settings', icon: UserIcon },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d121c] text-slate-300 border-r border-slate-800/80 select-none">
      {/* Brand & Workspace Header */}
      <div className="px-5 py-4 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shadow-indigo-500/20">
              TF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-white tracking-tight">TaskFlow</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                  v1.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Xplore Intellects
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Pill */}
        <div className="mt-3.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-300 text-[11px] font-medium truncate">
              {isAdmin ? 'Engineering Org' : user?.department || 'Operations'}
            </span>
          </div>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide uppercase ${
              isAdmin
                ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50'
                : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
            }`}
          >
            {isAdmin ? 'Admin' : 'Member'}
          </span>
        </div>
      </div>

      {/* Nav Section */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Navigation
          </div>
          <nav className="space-y-1">
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
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white font-semibold shadow-2xs border border-slate-700/70'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Portal Switch */}
        <div className="pt-2">
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Workspaces
          </div>
          <Link
            to={isAdmin ? '/login/employee' : '/login/admin'}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent hover:border-slate-800 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <ArrowLeftRight className="w-4 h-4 text-slate-500" />
              <span>{isAdmin ? 'Switch to Employee Portal' : 'Switch to Admin Console'}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-indigo-600/90 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0d121c]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of account"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-xs flex">
          <div className="relative w-64 max-w-xs h-full shadow-2xl">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={onClose} />
        </div>
      )}
    </>
  );
};
