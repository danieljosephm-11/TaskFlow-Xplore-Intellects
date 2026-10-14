import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  Activity,
  Calendar,
} from 'lucide-react';
import api from '../../services/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.tsx';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal.tsx';
import { Task } from '../../types/client.ts';

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
            <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-lg"></div>
          <div className="h-72 bg-slate-200 rounded-lg"></div>
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

  const statCards = [
    {
      label: 'Total Workforce',
      value: overview.totalEmployees,
      subtext: 'Active enterprise employees',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-100',
      link: '/admin/employees',
    },
    {
      label: 'All Active Tasks',
      value: overview.totalTasks,
      subtext: `${overview.completed} tasks fulfilled`,
      icon: CheckSquare,
      color: 'text-slate-800',
      bgColor: 'bg-slate-50 border-slate-200',
      link: '/admin/tasks',
    },
    {
      label: 'In Progress / Pending',
      value: overview.inProgress + overview.pending,
      subtext: `${overview.inProgress} in progress · ${overview.pending} pending`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/60 border-amber-200',
      link: '/admin/tasks?status=IN_PROGRESS',
    },
    {
      label: 'Completed Tasks',
      value: overview.completed,
      subtext: `${overview.totalTasks > 0 ? Math.round((overview.completed / overview.totalTasks) * 100) : 0}% team throughput`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      link: '/admin/tasks?status=COMPLETED',
    },
    {
      label: 'High Priority Alert',
      value: overview.highPriority,
      subtext: 'Requires immediate monitoring',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border-rose-200',
      link: '/admin/tasks?priority=HIGH',
    },
    {
      label: 'Not Started',
      value: overview.notStarted,
      subtext: 'Queued for development',
      icon: Activity,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50 border-slate-200',
      link: '/admin/tasks?status=NOT_STARTED',
    },
    {
      label: 'Overdue Deadlines',
      value: overview.overdue,
      subtext: 'Past agreed target delivery',
      icon: Calendar,
      color: 'text-rose-700',
      bgColor: 'bg-rose-100/50 border-rose-300',
      link: '/admin/tasks',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Operations & Workflow Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status updates, team velocity metrics, and automated notification dispatches.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/admin/tasks/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create & Assign Task</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`p-4 rounded-xl border ${card.bgColor} hover:shadow-xs transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 truncate">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
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

      {/* Analytics Charts & Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status & Priority Visual Distribution */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Task Status & Priority Distribution</h2>
              <p className="text-xs text-slate-500">Live breakdown of work order lifecycle states</p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-400">
              Total: {overview.totalTasks}
            </span>
          </div>

          {/* Status Progress Bar & Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Lifecycle Progress</span>
              <span className="text-slate-500 font-mono tabular-nums">
                {overview.totalTasks > 0
                  ? `${Math.round((overview.completed / overview.totalTasks) * 100)}% Fulfilled`
                  : '0% Fulfilled'}
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
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

            {/* Status Grid Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              {data?.distribution.byStatus.map((s) => (
                <div key={s.key} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-600 truncate">{s.status}</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 tabular-nums">{s.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-semibold text-slate-700">Urgency & Priority Weight</span>
            <div className="grid grid-cols-3 gap-3 text-xs">
              {data?.distribution.byPriority.map((p) => (
                <div key={p.key} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700">{p.priority}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                  </div>
                  <p className="text-lg font-bold text-slate-900 tabular-nums">{p.count}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {overview.totalTasks > 0
                      ? `${Math.round((p.count / overview.totalTasks) * 100)}% of load`
                      : '0%'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Completion Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Workforce Velocity</h2>
                <p className="text-xs text-slate-500">Per-employee task completion</p>
              </div>
              <Link to="/admin/employees" className="text-xs text-indigo-600 hover:underline font-semibold">
                Manage
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {data?.employeeSummary && data.employeeSummary.length > 0 ? (
                data.employeeSummary.map((emp) => (
                  <div key={emp.id} className="text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{emp.name}</span>
                      <span className="font-mono text-slate-600 tabular-nums">
                        {emp.completed}/{emp.totalAssigned} done ({emp.completionRate}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${emp.completionRate}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {emp.department} &bull; {emp.inProgress} active
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No employee metrics available.
                </div>
              )}
            </div>
          </div>

          <Link
            to="/admin/employees"
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors mt-4"
          >
            <span>View Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Row: Recent Tasks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recently Updated Tasks</h2>
              <p className="text-xs text-slate-500">Latest pipeline assignments and adjustments</p>
            </div>
            <Link to="/admin/tasks" className="text-xs text-indigo-600 hover:underline font-semibold">
              View All Tasks
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentTasks && data.recentTasks.length > 0 ? (
              data.recentTasks.map((t) => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTask(t)}
                  className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-semibold text-indigo-600">
                        {t.taskIdentifier}
                      </span>
                      <PriorityBadge priority={t.priority} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Assigned to:{' '}
                      <span className="text-slate-700 font-medium">
                        {typeof t.assignedTo === 'object' && t.assignedTo !== null
                          ? (t.assignedTo as any).name
                          : 'Assigned'}
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No tasks registered yet.</div>
            )}
          </div>
        </div>

        {/* Audit Activity Trail */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">System Activity Audit Log</h2>
              <p className="text-xs text-slate-500">Real-time status transitions and assignments</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.slice(0, 6).map((act, index) => (
                <div key={index} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
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
                        {act.task?.title || 'System Task'}
                      </span>
                    </p>
                    {act.previousStatus && act.newStatus && (
                      <p className="text-[10px] text-indigo-600 font-mono">
                        {act.previousStatus} &rarr; {act.newStatus}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity records logged.
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
