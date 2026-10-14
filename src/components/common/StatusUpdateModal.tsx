import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { Task, TaskStatus } from '../../types/client.ts';
import api from '../../services/api.ts';

interface StatusUpdateModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: Task, message: string) => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  task,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !task) return null;

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(task.status);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.patch(`/tasks/${task._id}/status`, {
        status: selectedStatus,
        notes: notes.trim(),
      });

      if (res.data.success) {
        onSuccess(res.data.data, res.data.message);
        onClose();
      } else {
        setError(res.data.message || 'Failed to update status.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions: { value: TaskStatus; label: string; description: string; color: string }[] = [
    { value: 'NOT_STARTED', label: 'Not Started', description: 'Queued in backlog, work has not started yet.', color: 'bg-slate-400' },
    { value: 'PENDING', label: 'Pending', description: 'Waiting on external inputs, reviews, or blocker resolution.', color: 'bg-amber-500' },
    { value: 'IN_PROGRESS', label: 'In Progress', description: 'Actively working on the task deliverables.', color: 'bg-indigo-600' },
    { value: 'COMPLETED', label: 'Completed', description: 'All requirements verified and ready for review.', color: 'bg-emerald-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
              {task.taskIdentifier}
            </span>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">Update Status</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-1">Task</p>
              <p className="text-sm font-semibold text-slate-900 line-clamp-2">{task.title}</p>
            </div>

            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                New Status
              </label>
              <div className="grid grid-cols-1 gap-2">
                {statusOptions.map((opt) => {
                  const isSelected = selectedStatus === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50/80 text-slate-900 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50/60 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="taskStatus"
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => setSelectedStatus(opt.value)}
                        className="mt-0.5 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                            <span className="text-xs font-semibold">{opt.label}</span>
                          </div>
                          {task.status === opt.value && (
                            <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                          {opt.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="update-notes" className="block text-xs font-medium text-slate-700 mb-1">
                Progress Notes (Optional)
              </label>
              <textarea
                id="update-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add brief details about progress made or blockers encountered..."
                rows={3}
                maxLength={500}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                {notes.length}/500
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Admin receives notification of this change.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg shadow-xs transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Save & Update'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
