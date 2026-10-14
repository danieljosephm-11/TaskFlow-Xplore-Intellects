import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';
import api from '../../services/api.ts';
import { Task, PaginationMeta, User, TaskPriority, TaskStatus } from '../../types/client.ts';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { TaskDetailsModal } from '../../components/common/TaskDetailsModal.tsx';

export const AllTasks: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<User[]>([]);
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
  const [employeeId, setEmployeeId] = useState<string>(searchParams.get('employeeId') || 'ALL');

  // Modals
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: string;
  }>({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'MEDIUM',
    status: 'NOT_STARTED',
    dueDate: '',
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Fetch active employees for dropdown
  useEffect(() => {
    api
      .get('/employees/active')
      .then((res) => {
        if (res.data.success) {
          setActiveEmployees(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to load active employees', err));
  }, []);

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
          employeeId: employeeId === 'ALL' ? '' : employeeId,
        },
      });

      if (res.data.success) {
        setTasks(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTasks(1, pagination.limit);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, priority, employeeId]);

  const handlePageChange = (newPage: number) => {
    fetchTasks(newPage, pagination.limit);
  };

  const handleLimitChange = (newLimit: number) => {
    fetchTasks(1, newLimit);
  };

  const openEditModal = (task: Task) => {
    const assignedId =
      typeof task.assignedTo === 'object' && task.assignedTo !== null
        ? (task.assignedTo as User)._id
        : (task.assignedTo as string);

    setEditTask(task);
    setEditFormData({
      title: task.title,
      description: task.description,
      assignedTo: assignedId,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;

    setEditError(null);
    setEditLoading(true);

    try {
      const res = await api.put(`/tasks/${editTask._id}`, {
        ...editFormData,
        dueDate: editFormData.dueDate || null,
      });

      if (res.data.success) {
        setToastMessage(res.data.message);
        setEditTask(null);
        fetchTasks(pagination.page, pagination.limit);
      } else {
        setEditError(res.data.message || 'Failed to update task.');
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.message || 'Error updating task.');
    } finally {
      setEditLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteTask) return;

    try {
      const res = await api.delete(`/tasks/${deleteTask._id}`);
      if (res.data.success) {
        setToastMessage(`Task ${deleteTask.taskIdentifier} deleted.`);
        fetchTasks(pagination.page, pagination.limit);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeleteTask(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Enterprise Task Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Query, filter, delegate, and track all organizational deliverables across workstreams.
          </p>
        </div>
        <Link
          to="/admin/tasks/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Task</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, ID, or employee..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Assigned Employee Filter */}
          <div>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Assignees</option>
              {activeEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-3 px-4">Identifier</th>
                <th className="py-3 px-4">Title & Description</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading task directory...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No tasks match the active filters.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const assignedUser =
                    typeof t.assignedTo === 'object' && t.assignedTo !== null
                      ? (t.assignedTo as User)
                      : null;

                  return (
                    <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                        {t.taskIdentifier}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{t.description}</p>
                      </td>
                      <td className="py-3 px-4">
                        {assignedUser ? (
                          <div>
                            <p className="font-medium text-slate-800">{assignedUser.name}</p>
                            <p className="text-[10px] text-slate-400">{assignedUser.department}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={t.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(t.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailsTask(t)}
                            title="Inspect Task & Audit History"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            title="Edit or Reassign Task"
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTask(t)}
                            title="Delete Task"
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        onEdit={(task) => openEditModal(task)}
        canEdit={true}
      />

      {/* EDIT & REASSIGN TASK MODAL */}
      {editTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs text-indigo-600 font-semibold">
                  {editTask.taskIdentifier}
                </span>
                <h3 className="text-base font-semibold text-slate-900">Edit Task Specifications</h3>
              </div>
              <button
                onClick={() => setEditTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={2000}
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, description: e.target.value })
                  }
                  className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assignee (Active Employee)
                  </label>
                  <select
                    required
                    value={editFormData.assignedTo}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, assignedTo: e.target.value })
                    }
                    className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {activeEmployees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value as TaskStatus,
                      })
                    }
                    className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, dueDate: e.target.value })
                    }
                    className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditTask(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Update Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTask}
        title="Delete Task Confirmation"
        message={`Are you sure you want to permanently delete task "${deleteTask?.taskIdentifier}: ${deleteTask?.title}"? This action removes the task and its audit history from the system.`}
        confirmLabel="Delete Task"
        variant="danger"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTask(null)}
      />
    </div>
  );
};
