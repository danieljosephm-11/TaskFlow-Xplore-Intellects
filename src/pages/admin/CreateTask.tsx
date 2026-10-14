import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import api from '../../services/api.ts';
import { User, TaskPriority, TaskStatus } from '../../types/client.ts';

export const CreateTask: React.FC = () => {
  const navigate = useNavigate();

  const [activeEmployees, setActiveEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(true);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [dueDate, setDueDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    taskIdentifier: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    api
      .get('/employees/active')
      .then((res) => {
        if (res.data.success && res.data.data.length > 0) {
          setActiveEmployees(res.data.data);
          setAssignedTo(res.data.data[0]._id);
        }
      })
      .catch((err) => {
        console.error('Error fetching active employees', err);
        setErrorMessage('Failed to load employee list for assignment.');
      })
      .finally(() => setLoadingEmployees(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessResult(null);

    if (!title.trim() || title.length > 120) {
      setErrorMessage('Task title is required and cannot exceed 120 characters.');
      return;
    }

    if (!description.trim() || description.length > 2000) {
      setErrorMessage('Task description is required and cannot exceed 2000 characters.');
      return;
    }

    if (!assignedTo) {
      setErrorMessage('Please select a team member to assign this task.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/tasks', {
        title: title.trim(),
        description: description.trim(),
        assignedTo,
        priority,
        status,
        dueDate: dueDate ? dueDate : null,
      });

      if (res.data.success) {
        setSuccessResult({
          taskIdentifier: res.data.data.taskIdentifier,
          message: res.data.message,
        });

        // Reset form
        setTitle('');
        setDescription('');
        setDueDate('');
        setStatus('NOT_STARTED');
        setPriority('MEDIUM');
      } else {
        setErrorMessage(res.data.message || 'Failed to create task.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Server error encountered while creating task.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div>
        <button
          onClick={() => navigate('/admin/tasks')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Tasks</span>
        </button>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Create New Task
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Specify task details, assign an owner from your team, and set a target due date.
        </p>
      </div>

      {/* Feedback Messages */}
      {successResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl space-y-2.5 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Task {successResult.taskIdentifier} created successfully</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">{successResult.message}</p>
          <div className="pt-1 flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/tasks')}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
            >
              View in All Tasks
            </button>
            <button
              onClick={() => setSuccessResult(null)}
              className="text-xs text-emerald-800 font-medium hover:underline"
            >
              Create another task
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-semibold">Unable to create task:</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="task-title" className="text-xs font-medium text-slate-700">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums font-mono">
                {title.length}/120
              </span>
            </div>
            <input
              id="task-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth token refresh flow"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors placeholder-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="task-desc" className="text-xs font-medium text-slate-700">
                Description & Deliverables <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums font-mono">
                {description.length}/2000
              </span>
            </div>
            <textarea
              id="task-desc"
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear specifications, edge-case criteria, and testing notes..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors leading-relaxed placeholder-slate-400"
            />
          </div>

          {/* Assigned Employee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-assignee" className="block text-xs font-medium text-slate-700 mb-1.5">
                Assignee <span className="text-rose-500">*</span>
              </label>
              {loadingEmployees ? (
                <div className="text-xs text-slate-400 py-2">Loading active employees...</div>
              ) : activeEmployees.length === 0 ? (
                <div className="text-xs text-rose-500 py-2">
                  No active employees available in directory.
                </div>
              ) : (
                <select
                  id="task-assignee"
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors text-slate-700"
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} &bull; {emp.department}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="task-priority" className="block text-xs font-medium text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors text-slate-700"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Initial Status & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-status" className="block text-xs font-medium text-slate-700 mb-1.5">
                Initial Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors text-slate-700"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                Due Date (Optional)
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 bg-white transition-colors text-slate-700"
              />
            </div>
          </div>

          {/* Email Notification Notice */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
            <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-slate-800">Automatic Notification:</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                The assigned team member will receive an email notification with direct portal link and task details.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/tasks')}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || activeEmployees.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating Task...' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
