import React, { useEffect, useState, useMemo } from 'react';
import { getAuditLogs, countAuditLogs } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

const ACTIONS = [
  { value: '', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'file_delete', label: 'File Delete' },
];

const TABLES = [
  { value: '', label: 'All tables' },
  { value: 'safety_events', label: 'Safety Events' },
  { value: 'in_service_attendance', label: 'Training Attendance' },
  { value: 'in_service_sessions', label: 'Training Sessions' },
  { value: 'lesson_plans', label: 'Lesson Plans' },
  { value: 'files', label: 'User Files' },
];

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncateJson(obj, maxLength = 100) {
  if (!obj) return '—';
  const str = JSON.stringify(obj);
  if (str.length > maxLength) return str.slice(0, maxLength) + '...';
  return str;
}

function formatAction(action) {
  const map = {
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    login: 'Login',
    logout: 'Logout',
    file_upload: 'Upload',
    file_delete: 'Delete',
  };
  return map[action] || action;
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ action: '', tableName: '' });
  const [pagination, setPagination] = useState({ limit: 50, offset: 0, total: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const count = await countAuditLogs(filter.action || undefined, filter.tableName || undefined);
        if (cancelled) return;
        setPagination((p) => ({ ...p, total: count }));

        const data = await getAuditLogs({
          limit: pagination.limit,
          offset: pagination.offset,
          action: filter.action || undefined,
          tableName: filter.tableName || undefined,
        });
        if (cancelled) return;
        setLogs(data);
      } catch (err) {
        console.error('Audit logs error:', err);
        if (!cancelled) setError(err?.message || 'Failed to load audit logs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filter.action, filter.tableName, pagination.limit, pagination.offset]);

  const pages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  function handleFilterChange(key, value) {
    setFilter((f) => ({ ...f, [key]: value }));
    setPagination((p) => ({ ...p, offset: 0 })); // Reset to page 1
  }

  function handleNextPage() {
    if (currentPage < pages) {
      setPagination((p) => ({ ...p, offset: p.offset + p.limit }));
    }
  }

  function handlePrevPage() {
    if (currentPage > 1) {
      setPagination((p) => ({ ...p, offset: Math.max(0, p.offset - p.limit) }));
    }
  }

  return (
    <AdminLayout activeNav="audit">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Audit logs
        </h1>
        <p className="max-w-2xl text-sm text-secondary">
          Track all user actions including safety event changes, training attendance, user creation, and file uploads.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-outline-variant/40 bg-white p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Action
            </label>
            <select
              value={filter.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full rounded-lg border border-outline-variant/60 px-3 py-2 text-sm outline-none focus:border-[#1a6ab0]"
            >
              {ACTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Table
            </label>
            <select
              value={filter.tableName}
              onChange={(e) => handleFilterChange('tableName', e.target.value)}
              className="w-full rounded-lg border border-outline-variant/60 px-3 py-2 text-sm outline-none focus:border-[#1a6ab0]"
            >
              {TABLES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-outline-variant/40 bg-white p-8 text-center text-secondary">
          Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/40 bg-white p-8 text-center text-secondary">
          No audit logs found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-outline-variant/40 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant/40 bg-surface/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-secondary">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-secondary">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-secondary">Table</th>
                  <th className="px-4 py-3 text-left font-semibold text-secondary">Changes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-surface/30'}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-secondary">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-900">
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-secondary">
                      {log.table_name}
                    </td>
                    <td className="px-4 py-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium text-blue-600 hover:underline">
                          view
                        </summary>
                        <div className="mt-2 rounded bg-surface/50 p-2 text-[10px] font-mono text-secondary max-h-40 overflow-auto">
                          {log.action === 'update' && (
                            <>
                              <div className="mb-2">
                                <div className="font-bold text-red-600">Old:</div>
                                <pre className="whitespace-pre-wrap break-words">
                                  {truncateJson(log.old_values, 200)}
                                </pre>
                              </div>
                              <div>
                                <div className="font-bold text-green-600">New:</div>
                                <pre className="whitespace-pre-wrap break-words">
                                  {truncateJson(log.new_values, 200)}
                                </pre>
                              </div>
                            </>
                          )}
                          {log.action === 'create' && (
                            <pre className="whitespace-pre-wrap break-words">
                              {truncateJson(log.new_values, 200)}
                            </pre>
                          )}
                          {log.action === 'delete' && (
                            <pre className="whitespace-pre-wrap break-words text-red-600">
                              {truncateJson(log.old_values, 200)}
                            </pre>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-outline-variant/40 bg-white p-4">
            <div className="text-sm text-secondary">
              Page {currentPage} of {pages} ({pagination.total} total logs)
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="rounded-lg border border-outline-variant/60 px-4 py-2 text-sm font-medium text-primary hover:bg-surface/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= pages}
                className="rounded-lg border border-outline-variant/60 px-4 py-2 text-sm font-medium text-primary hover:bg-surface/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
