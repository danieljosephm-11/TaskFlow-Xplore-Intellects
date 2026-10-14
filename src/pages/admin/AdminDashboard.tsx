import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Activity,
  Calendar,
} from 'lucide-react';
import api from '../../services/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.tsx';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal.tsx';
import { Task } from '../../types/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface AdminDashboardData {
  overview: {
    totalEmployees: number;
    totalTasks: number;
    notStarted: number;
    pending: number;
    inProgress: number;
    completed: number;
    highPriority: number;
    overdue: number;
  };
  distribution: {
    byStatus: { status: string; key: string; count: number; color: string }[];
    byPriority: { priority: string; key: string; count: number; color: string }[];
  };
  employeeSummary: {
    id: string;
    name: string;
    department: string;
    totalAssigned: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  }[];
  recentActivity: any[];
  recentTasks: Task[];
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white border border-slate-200 rounded-xl"></div>
          <div className="h-72 bg-white border border-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalEmployees: 0,
    totalTasks: 0,
    notStarted: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    highPriority: 0,
    overdue: 0,
  };

  const completionPct =
    overview.totalTasks > 0
      ? Math.round((overview.completed / overview.totalTasks) * 100)
      : 0;

  const statCards = [
    {
      label: 'All Tasks',
      value: overview.totalTasks,
      subtext: `${overview.completed} completed so far`,
      icon: CheckSquare,
      iconBg: 'bg-slate-100 text-slate-700',
      link: '/admin/tasks',
    },
    {
      label: 'Active & In Progress',
      value: overview.inProgress + overview.pending,
      subtext: `${overview.inProgress} in progress · ${overview.pending} pending`,
      icon: Clock,
      iconBg: 'bg-blue-50 text-blue-600',
      link: '/admin/tasks?status=IN_PROGRESS',
    },
    {
      label: 'Completed Tasks',
      value: overview.completed,
      subtext: `${completionPct}% overall completion rate`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      link: '/admin/tasks?status=COMPLETED',
    },
    {
      label: 'High Priority',
      value: overview.highPriority,
      subtext: overview.overdue > 0 ? `${overview.overdue} tasks past due date` : 'Requires prompt review',
      icon: AlertCircle,
      iconBg: 'bg-rose-50 text-rose-600',
      link: '/admin/tasks?priority=HIGH',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Overview
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}. Here is the current progress across your team.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/admin/tasks/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Link>
        </div>
      </div>

      {/* High-Impact Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="group p-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 group-hover:text-slate-800 transition-colors">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 truncate">{card.subtext}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Middle Row: Status Progress & Team Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Task Lifecycle Progress</h2>
              <p className="text-xs text-slate-500">Breakdown of tasks by active status and priority</p>
            </div>
            <div className="text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
              Total: <span className="font-bold text-slate-900">{overview.totalTasks}</span>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-xs font-medium text-slate-600">Completion Velocity</span>
              <span className="text-slate-900 font-semibold tabular-nums">
                {completionPct}% Complete
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden">
              {overview.totalTasks > 0 && (
                <>
                  <div
                    style={{ width: `${(overview.completed / overview.totalTasks) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Completed: ${overview.completed}`}
                  />
                  <div
                    style={{ width: `${(overview.inProgress / overview.totalTasks) * 100}%` }}
                    className="bg-indigo-500 transition-all duration-300"
                    title={`In Progress: ${overview.inProgress}`}
                  />
                  <div
                    style={{ width: `${(overview.pending / overview.totalTasks) * 100}%` }}
                    className="bg-amber-400 transition-all duration-300"
                    title={`Pending: ${overview.pending}`}
                  />
                  <div
                    style={{ width: `${(overview.notStarted / overview.totalTasks) * 100}%` }}
                    className="bg-slate-300 transition-all duration-300"
                    title={`Not Started: ${overview.notStarted}`}
                  />
                </>
              )}
            </div>

            {/* Status Breakdown Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
              {data?.distribution.byStatus.map((s) => (
                <div key={s.key} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-600 text-xs font-medium truncate">{s.status}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{s.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Levels */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs font-medium text-slate-700 mb-2.5">Priority Distribution</div>
            <div className="grid grid-cols-3 gap-3">
              {data?.distribution.byPriority.map((p) => (
                <div key={p.key} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{p.priority}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  </div>
                  <p className="text-base font-bold text-slate-900 tabular-nums">{p.count}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {overview.totalTasks > 0
                      ? `${Math.round((p.count / overview.totalTasks) * 100)}% of total`
                      : '0%'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Progress */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Team Progress</h2>
                <p className="text-xs text-slate-500">Individual workload & completion</p>
              </div>
              <Link to="/admin/employees" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Directory
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {data?.employeeSummary && data.employeeSummary.length > 0 ? (
                data.employeeSummary.map((emp) => (
                  <div key={emp.id} className="text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{emp.name}</span>
                      </div>
                      <span className="text-slate-500 text-[11px] tabular-nums font-mono">
                        {emp.completed}/{emp.totalAssigned} done
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${emp.completionRate}%` }}
                        className="h-full bg-slate-900 rounded-full transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{emp.department}</span>
                      <span className="font-medium text-slate-600">{emp.completionRate}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No employee metrics found.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/admin/employees"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors mt-4"
          >
            <span>Manage Team Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Row: Recent Tasks & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Tasks</h2>
              <p className="text-xs text-slate-500">Recently assigned or updated tasks</p>
            </div>
            <Link to="/admin/tasks" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View All
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentTasks && data.recentTasks.length > 0 ? (
              data.recentTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTask(t)}
                  className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 px-2 rounded-lg transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-semibold text-slate-500 group-hover:text-indigo-600">
                        {t.taskIdentifier}
                      </span>
                      <PriorityBadge priority={t.priority} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Assigned to{' '}
                      <span className="text-slate-700 font-medium">
                        {typeof t.assignedTo === 'object' && t.assignedTo !== null
                          ? (t.assignedTo as any).name
                          : 'Team'}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No tasks created yet.</div>
            )}
          </div>
        </div>

        {/* Activity Trail */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-xs text-slate-500">Live event audit and status updates</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 6).map((act, index) => (
                <div key={index} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">
                        {act.actor?.name || 'Administrator'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                      {act.action}:{' '}
                      <span className="font-medium text-slate-900">
                        {act.task?.title || 'Task'}
                      </span>
                    </p>
                    {act.previousStatus && act.newStatus && (
                      <p className="text-[10px] text-indigo-600 font-mono mt-0.5">
                        {act.previousStatus} &rarr; {act.newStatus}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity logged.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        canEdit={true}
      />
    </div>
  );
};
