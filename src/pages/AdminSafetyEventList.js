import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { deleteSafetyEvent, listSafetyEvents, SAFETY_EVENT_TYPES } from '../lib/supabase';

const TYPE_LABELS = {
  [SAFETY_EVENT_TYPES.rescue]: 'Rescue',
  [SAFETY_EVENT_TYPES.incident]: 'Incident',
  [SAFETY_EVENT_TYPES.near_miss]: 'Near miss',
  [SAFETY_EVENT_TYPES.medical]: 'Medical',
  [SAFETY_EVENT_TYPES.other]: 'Other',
};

const SEVERITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function formatWhen(iso) {
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

export default function AdminSafetyEventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const rows = await listSafetyEvents();
        if (!cancelled) setEvents(rows);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Could not load safety events. Run the latest Supabase migration.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete safety event “${title}”? This cannot be undone.`)) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteSafetyEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout activeNav="safety">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Safety events
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            Archive of rescues, incidents, and other safety-related events. Only admins can add or remove entries;
            all staff can view the list from the dashboard.
          </p>
        </div>
        <Link
          to="/admin/safety/new"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1a6ab0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + Add safety event
        </Link>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,88px)_minmax(0,88px)_minmax(0,1fr)_minmax(0,120px)_minmax(0,88px)] gap-3 border-b border-outline-variant/50 bg-surface-bright px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-secondary sm:gap-4 sm:text-[11px]">
              <div>Title / when</div>
              <div>Type</div>
              <div>Severity</div>
              <div>Location</div>
              <div>Reported by</div>
              <div>Delete</div>
            </div>

            {loading ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">Loading…</div>
            ) : events.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">
                No events yet. Use <strong>Add safety event</strong> to log the first one.
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,88px)_minmax(0,88px)_minmax(0,1fr)_minmax(0,120px)_minmax(0,88px)] items-start gap-3 border-b border-outline-variant/30 px-6 py-4 last:border-b-0 sm:gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-on-background">{ev.title}</div>
                    <div className="mt-0.5 text-xs text-secondary">{formatWhen(ev.occurred_at)}</div>
                    {ev.description && (
                      <p className="mt-2 line-clamp-3 text-xs text-on-surface-variant">{ev.description}</p>
                    )}
                    {ev.actions_taken && (
                      <p className="mt-1 text-xs text-secondary">
                        <span className="font-semibold">Actions: </span>
                        {ev.actions_taken}
                      </p>
                    )}
                  </div>
                  <div className="text-xs font-medium text-on-surface-variant">
                    {TYPE_LABELS[ev.event_type] || ev.event_type}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {ev.severity ? SEVERITY_LABELS[ev.severity] || ev.severity : '—'}
                  </div>
                  <div className="min-w-0 text-sm text-on-surface-variant">{ev.location || '—'}</div>
                  <div className="min-w-0 text-xs text-secondary">{ev.reporter_display || '—'}</div>
                  <button
                    type="button"
                    disabled={deletingId === ev.id}
                    onClick={() => handleDelete(ev.id, ev.title)}
                    className="text-left text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingId === ev.id ? '…' : 'Delete'}
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
