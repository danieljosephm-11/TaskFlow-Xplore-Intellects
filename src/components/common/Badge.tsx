import React from 'react';
import { TaskPriority, TaskStatus } from '../../types/client.ts';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-800 ${sizeClasses}`}
        >
          Completed
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-indigo-200 bg-indigo-50 text-indigo-800 ${sizeClasses}`}
        >
          In Progress
        </span>
      );
    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-amber-200 bg-amber-50 text-amber-800 ${sizeClasses}`}
        >
          Pending
        </span>
      );
    case 'NOT_STARTED':
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-slate-200 bg-slate-50 text-slate-700 ${sizeClasses}`}
        >
          Not Started
        </span>
      );
  }
};

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (priority) {
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center font-semibold rounded border border-rose-200 bg-rose-50 text-rose-800 ${sizeClasses}`}
        >
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-amber-200 bg-amber-50 text-amber-800 ${sizeClasses}`}
        >
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className={`inline-flex items-center font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-800 ${sizeClasses}`}
        >
          Low
        </span>
      );
  }
};

export const AccountStatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  return isActive ? (
    <span className="inline-flex items-center font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-800 px-2 py-0.5 text-xs">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center font-medium rounded border border-slate-300 bg-slate-100 text-slate-600 px-2 py-0.5 text-xs">
      Deactivated
    </span>
  );
};
