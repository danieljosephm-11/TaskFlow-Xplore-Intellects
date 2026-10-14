import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import api from '../../services/api.ts';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.tsx';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal.tsx';
import { StatusUpdateModal } from '../../components/common/StatusUpdateModal.tsx';
import { Task } from '../../types/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface EmployeeDashboardData {
  overview: {
    totalAssigned: number;
    notStarted: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
  };
  distribution: {
    byStatus: { status: string; key: string; count: number; color: string }[];
    byPriority: { priority: string; key: string; count: number; color: string }[];
  };
  dueSoonTasks: Task[];
  recentTasks: Task[];
  recentActivity: any[];
}

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<EmployeeDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [statusUpdateTask, setStatusUpdateTask] = useState<Task | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/employee');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load employee metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStatusUpdated = (_updatedTask: Task, message: string) => {
    setFeedbackNotice(message);
    fetchDashboardData();
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalAssigned: 0,
    notStarted: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0,
  };

  const statCards = [
    {
      label: 'Assigned to You',
      value: overview.totalAssigned,
      subtext: 'Total allocated work orders',
      icon: CheckSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-100',
      link: '/employee/tasks',
    },
    {
      label: 'In Progress / Active',
      value: overview.inProgress + overview.pending,
      subtext: `${overview.inProgress} ongoing · ${overview.pending} pending review`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/60 border-amber-200',
      link: '/employee/tasks?status=IN_PROGRESS',
    },
    {
      label: 'Tasks Completed',
      value: overview.completed,
      subtext: `${overview.completionRate}% completion rate`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      link: '/employee/tasks?status=COMPLETED',
    },
    {
      label: 'Overdue Milestones',
      value: overview.overdue,
      subtext: overview.overdue > 0 ? 'Urgent attention required' : 'All deadlines on track',
      icon: AlertTriangle,
      color: overview.overdue > 0 ? 'text-rose-600' : 'text-slate-400',
      bgColor: overview.overdue > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200',
      link: '/employee/tasks',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.department} &bull; Personal task queue and milestone tracking.
          </p>
        </div>
        <Link
          to="/employee/tasks"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <span>Open My Tasks Table</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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

      {/* Urgent Attention / Due Soon Alerts */}
      {data?.dueSoonTasks && data.dueSoonTasks.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Tasks Approaching Target Due Date (Next 72 Hours)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.dueSoonTasks.map((t) => (
              <div
                key={t._id}
                className="p-3 bg-white rounded-lg border border-amber-200/80 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[10px] font-semibold text-amber-800">
                      {t.taskIdentifier}
                    </span>
                    <PriorityBadge priority={t.priority} size="sm" />
                  </div>
                  <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                  <p className="text-[10px] text-amber-700 font-mono mt-0.5">
                    Target: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Immediate'}
                  </p>
                </div>
                <button
                  onClick={() => setStatusUpdateTask(t)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shrink-0"
                >
                  Update
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress & Priority Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Progress & Status */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Task Completion Performance</h2>
              <p className="text-xs text-slate-500">Your personal work order completion rate</p>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-600 tabular-nums">
              {overview.completionRate}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                style={{ width: `${overview.completionRate}%` }}
                className="h-full bg-emerald-500 transition-all duration-300"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{overview.completed} tasks fulfilled</span>
              <span>{overview.totalAssigned - overview.completed} pending completion</span>
            </div>
          </div>

          {/* Status Breakdown Grid */}
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

        {/* Priority Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Priority Weight</h2>
            <p className="text-xs text-slate-500">Breakdown of assigned urgency</p>
          </div>

          <div className="space-y-3">
            {data?.distribution.byPriority.map((p) => (
              <div key={p.key} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-slate-700">{p.priority} Priority</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {overview.totalAssigned > 0
                      ? `${Math.round((p.count / overview.totalAssigned) * 100)}% of your workload`
                      : '0%'}
                  </p>
                </div>
                <span className="text-base font-bold text-slate-900 tabular-nums">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assigned Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Task Assignments</h2>
            <p className="text-xs text-slate-500">Click any row to inspect specifications or adjust status</p>
          </div>
          <Link to="/employee/tasks" className="text-xs text-indigo-600 hover:underline font-semibold">
            View All My Tasks
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.recentTasks && data.recentTasks.length > 0 ? (
            data.recentTasks.map((t) => (
              <div
                key={t._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
              >
                <div
                  onClick={() => setDetailsTask(t)}
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-semibold text-indigo-600">
                      {t.taskIdentifier}
                    </span>
                    <PriorityBadge priority={t.priority} size="sm" />
                    <StatusBadge status={t.status} size="sm" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900 truncate">{t.title}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Deadline'} &bull; Updated: {new Date(t.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setStatusUpdateTask(t)}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                  >
                    Change Status
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No tasks currently assigned to your account.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskDetailsModal
        task={detailsTask}
        isOpen={!!detailsTask}
        onClose={() => setDetailsTask(null)}
        canEdit={false}
      />

      <StatusUpdateModal
        task={statusUpdateTask}
        isOpen={!!statusUpdateTask}
        onClose={() => setStatusUpdateTask(null)}
        onSuccess={handleStatusUpdated}
      />
    </div>
  );
};
