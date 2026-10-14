import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, CheckCircle2, AlertCircle, Mail, Layers } from 'lucide-react';
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
      setErrorMessage('Please select an active employee to assign this task.');
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
        err.response?.data?.message || err.message || 'Error occurred while saving task.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/tasks')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tasks</span>
        </button>
      </div>

      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Create & Assign Task Order
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Provision a new enterprise work order, allocate an active employee, and trigger automated notification dispatch.
        </p>
      </div>

      {/* Feedback Messages */}
      {successResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Task {successResult.taskIdentifier} Created Successfully!</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">{successResult.message}</p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/tasks')}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-md hover:bg-emerald-800 transition-colors"
            >
              View in All Tasks Table
            </button>
            <button
              onClick={() => setSuccessResult(null)}
              className="text-xs text-emerald-800 font-medium hover:underline"
            >
              Create Another Task
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <p className="font-semibold">Unable to create task:</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="task-title" className="text-xs font-semibold text-slate-800">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {title.length}/120 characters
              </span>
            </div>
            <input
              id="task-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Integrate OAuth Token Refresh and Redirection Handlers"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="task-desc" className="text-xs font-semibold text-slate-800">
                Detailed Scope of Work & Deliverables <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">
                {description.length}/2000 characters
              </span>
            </div>
            <textarea
              id="task-desc"
              required
              rows={4}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear technical specifications, edge-case requirements, and verification criteria for the assignee..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Assigned Employee & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-assignee" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Assign To Employee <span className="text-rose-500">*</span>
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
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {activeEmployees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} &bull; {emp.department} ({emp.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Priority Level
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="HIGH">High Priority (Urgent milestone)</option>
                <option value="MEDIUM">Medium Priority (Standard queue)</option>
                <option value="LOW">Low Priority (Backlog item)</option>
              </select>
            </div>
          </div>

          {/* Initial Status & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-status" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Initial Pipeline Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="PENDING">Pending (Waiting on dependencies)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-xs font-semibold text-slate-800 mb-1.5">
                Target Due Date (Optional)
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Email Notification Notice */}
          <div className="p-3.5 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
            <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Automated Notification System:</span>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Upon submission, an official assignment dispatch will be queued and sent via Nodemailer SMTP to the employee's corporate email containing work details and direct portal login link.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/admin/tasks')}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || activeEmployees.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{loading ? 'Creating & Dispatching...' : 'Create & Assign Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
