import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Eye,
  CheckCircle2,
  X,
  Clock,
  Calendar,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Task, PaginationMeta, TaskStatus, TaskPriority } from '../../types/client.ts';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal.tsx';
import { StatusUpdateModal } from '../../components/common/StatusUpdateModal.tsx';

export const MyTasks: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL');
  const [priority, setPriority] = useState<string>(searchParams.get('priority') || 'ALL');

  // Modals
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [statusModalTask, setStatusModalTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTasks = async (page = pagination.page, limit = pagination.limit) => {
    try {
      setLoading(true);
      const res = await api.get('/tasks', {
        params: {
          page,
          limit,
          search: search.trim(),
          status: status === 'ALL' ? '' : status,
          priority: priority === 'ALL' ? '' : priority,
        },
      });

      if (res.data.success) {
        setTasks(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load employee tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks(1, pagination.limit);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, priority]);

  const handlePageChange = (newPage: number) => {
    fetchTasks(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    fetchTasks(1, newLimit);
  };

  const handleStatusUpdated = (_updatedTask: Task, message: string) => {
    setToastMessage(message);
    fetchTasks(pagination.page, pagination.limit);
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setPriority('ALL');
  };

  const hasActiveFilters = search || status !== 'ALL' || priority !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold p-1 text-sm">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              My Tasks
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {pagination.total} assigned
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tasks assigned directly to your account. Update status and progress notes as you work.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks by title or task ID..."
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors placeholder-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors text-slate-700"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Filtered results active</span>
            <button
              onClick={resetFilters}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 font-medium text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned On</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading your tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No assigned tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const isOverdue =
                    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED';

                  return (
                    <tr key={t._id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-[11px] text-slate-600 bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 px-2 py-0.5 rounded transition-colors">
                          {t.taskIdentifier}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.description}</p>
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={t.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span className={isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetailsTask(t)}
                            title="Inspect details and history"
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStatusModalTask(t)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
                          >
                            Update Status
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination */}
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={detailsTask}
        isOpen={!!detailsTask}
        onClose={() => setDetailsTask(null)}
        canEdit={false}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        task={statusModalTask}
        isOpen={!!statusModalTask}
        onClose={() => setStatusModalTask(null)}
        onSuccess={handleStatusUpdated}
      />
    </div>
  );
};
