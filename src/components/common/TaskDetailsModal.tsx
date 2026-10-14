import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User as UserIcon, History } from 'lucide-react';
import { Task, TaskActivity, User } from '../../types/client.ts';
import { StatusBadge, PriorityBadge } from './Badge.tsx';
import api from '../../services/api.ts';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  canEdit?: boolean;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  canEdit = false,
}) => {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    if (isOpen && task) {
      setActiveTab('details');
      setLoadingActivities(true);
      api
        .get(`/tasks/${task._id}/activity`)
        .then((res) => {
          if (res.data.success) {
            setActivities(res.data.data);
          }
        })
        .catch((err) => console.error('Failed to load activities', err))
        .finally(() => setLoadingActivities(false));
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const assignedUser =
    typeof task.assignedTo === 'object' && task.assignedTo !== null
      ? (task.assignedTo as User)
      : null;

  const creatorUser =
    typeof task.createdBy === 'object' && task.createdBy !== null
      ? (task.createdBy as User)
      : null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not Specified';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {task.taskIdentifier}
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} size="sm" />
              <PriorityBadge priority={task.priority} size="sm" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-100 text-xs font-medium text-slate-500 shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview & Specifications
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit History ({activities.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'details' ? (
            <>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{task.title}</h2>
                <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {task.description}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg border border-slate-100 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Assigned Employee</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {assignedUser ? assignedUser.name : 'Unknown User'}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {assignedUser?.email} &bull; {assignedUser?.department || 'Department N/A'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-100 bg-white space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Deadlines & Milestones</span>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[11px]">Target Due Date:</p>
                    <p className="font-semibold text-slate-900">{formatDate(task.dueDate)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                <div>
                  Created:{' '}
                  <span className="text-slate-700 font-medium">{formatDate(task.createdAt)}</span> by{' '}
                  <span className="text-slate-700 font-medium">
                    {creatorUser ? creatorUser.name : 'System Admin'}
                  </span>
                </div>
                <div>
                  Last Updated:{' '}
                  <span className="text-slate-700 font-medium">{formatDate(task.updatedAt)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {loadingActivities ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading audit history...</div>
              ) : activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity history recorded for this task.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {activities.map((act) => {
                    const actorName =
                      typeof act.actor === 'object' && act.actor !== null
                        ? (act.actor as any).name
                        : 'System';

                    return (
                      <div key={act._id} className="relative group text-xs">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{act.action}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {formatDateTime(act.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Triggered by <span className="font-medium text-slate-800">{actorName}</span>
                        </p>
                        {act.previousStatus && act.newStatus && (
                          <div className="mt-1 text-[11px] text-slate-500 font-mono">
                            {act.previousStatus} &rarr; {act.newStatus}
                          </div>
                        )}
                        {act.notes && (
                          <p className="mt-1 text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 text-[11px]">
                            {act.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {canEdit && onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs transition-colors"
            >
              Edit Task Specifications
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
