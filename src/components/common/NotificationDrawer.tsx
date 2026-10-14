import React, { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { NotificationItem } from '../../types/client.ts';
import api from '../../services/api.ts';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', {
        params: { status: filter === 'ALL' ? '' : filter, limit: 30 },
      });
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setFeedback(null);
    try {
      const res = await api.post(`/notifications/${id}/retry`);
      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message });
        fetchNotifications();
      } else {
        setFeedback({ type: 'error', message: res.data.message || 'Retry failed' });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Error executing retry dispatch.',
      });
    } finally {
      setRetryingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs">
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Email Notification Log</h3>
                <p className="text-[11px] text-slate-500">SMTP dispatch auditing and retry controls</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="px-6 py-2.5 border-b border-slate-100 bg-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              {['ALL', 'SENT', 'FAILED', 'PENDING'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    filter === status
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh"
              className="p-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Feedback alert */}
          {feedback && (
            <div
              className={`m-4 p-3 rounded text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No notification records found matching criteria.
              </div>
            ) : (
              notifications.map((item) => {
                const isSent = item.deliveryStatus === 'SENT';
                const isFailed = item.deliveryStatus === 'FAILED';

                return (
                  <div
                    key={item._id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition-colors text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-500">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded border ${
                          isSent
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isFailed
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isSent ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isFailed ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {item.deliveryStatus}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900 line-clamp-1">{item.subject}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        To:{' '}
                        <span className="font-mono text-slate-700 font-medium">
                          {item.recipient}
                        </span>
                      </p>
                    </div>

                    {item.lastError && (
                      <p className="text-[11px] text-rose-600 bg-rose-50/70 p-1.5 rounded border border-rose-100 leading-tight">
                        Reason: {item.lastError}
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Attempts: {item.attempts}</span>
                      <button
                        onClick={() => handleRetry(item._id)}
                        disabled={retryingId === item._id}
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${retryingId === item._id ? 'animate-spin' : ''}`}
                        />
                        {retryingId === item._id ? 'Retrying...' : 'Retry Dispatch'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
