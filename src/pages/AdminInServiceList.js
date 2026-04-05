import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { deleteInServiceSession, listInServiceSessions } from '../lib/supabase';

function formatSessionAt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export default function AdminInServiceList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const rows = await listInServiceSessions();
        if (!cancelled) setSessions(rows);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Could not load sessions. Run the latest Supabase migration.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete training session “${title}”? Attendance for this session will be removed.`)) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteInServiceSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout activeNav="in-service">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            In-service training
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            Register and review on-the-job training sessions. Only admins can add or remove sessions; staff can see the
            list when signed in.
          </p>
        </div>
        <Link
          to="/admin/in-service/new"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1a6ab0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + Add session
        </Link>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,88px)_minmax(0,100px)] gap-3 border-b border-outline-variant/50 bg-surface-bright px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-secondary sm:gap-4 sm:text-[11px]">
              <div>Title</div>
              <div>When</div>
              <div>Detail</div>
              <div>Delete</div>
            </div>

            {loading ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">
                No sessions yet. Use <strong>Add session</strong> to log the first one.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,88px)_minmax(0,100px)] items-center gap-3 border-b border-outline-variant/30 px-6 py-3.5 last:border-b-0 sm:gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-on-background">{s.title}</div>
                    {s.location && (
                      <div className="truncate text-xs text-secondary">{s.location}</div>
                    )}
                  </div>
                  <div className="text-sm text-on-surface-variant">{formatSessionAt(s.session_at)}</div>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/in-service/${s.id}`)}
                    className="text-left text-sm font-semibold text-[#1a6ab0] hover:underline"
                  >
                    Attendance →
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id, s.title)}
                    className="text-left text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingId === s.id ? '…' : 'Delete'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
