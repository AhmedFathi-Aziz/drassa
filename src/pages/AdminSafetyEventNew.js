import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useAuth } from '../lib/AuthContext';
import {
  createSafetyEvent,
  SAFETY_EVENT_TYPES,
  SAFETY_SEVERITY,
} from '../lib/supabase';

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

const TYPE_OPTIONS = [
  { value: SAFETY_EVENT_TYPES.rescue, label: 'Rescue' },
  { value: SAFETY_EVENT_TYPES.incident, label: 'Incident' },
  { value: SAFETY_EVENT_TYPES.near_miss, label: 'Near miss' },
  { value: SAFETY_EVENT_TYPES.medical, label: 'Medical' },
  { value: SAFETY_EVENT_TYPES.other, label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: SAFETY_SEVERITY.low, label: 'Low' },
  { value: SAFETY_SEVERITY.medium, label: 'Medium' },
  { value: SAFETY_SEVERITY.high, label: 'High' },
  { value: SAFETY_SEVERITY.critical, label: 'Critical' },
];

export default function AdminSafetyEventNew() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState(SAFETY_EVENT_TYPES.incident);
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [actionsTaken, setActionsTaken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const parsed = new Date(occurredAt);
    if (Number.isNaN(parsed.getTime())) {
      setError('Invalid date and time.');
      return;
    }
    setLoading(true);
    try {
      await createSafetyEvent({
        title: title.trim(),
        event_type: eventType,
        severity: severity || null,
        description: description.trim() || null,
        location: location.trim() || null,
        occurred_at: parsed.toISOString(),
        actions_taken: actionsTaken.trim() || null,
        reporter_display: profile?.full_name?.trim() || profile?.username || null,
      });
      navigate('/admin/safety');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Could not save event.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout activeNav="safety">
      <div className="mb-6">
        <Link to="/admin/safety" className="text-sm font-semibold text-[#1a6ab0] hover:underline">
          ← Back to safety events
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Add safety event
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Log a rescue, incident, or other safety-related event as soon as possible after it occurs.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-5 rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <label htmlFor="se-title" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Title
          </label>
          <input
            id="se-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
            placeholder="Short summary, e.g. Guest assist — shallow end"
            autoComplete="off"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="se-type" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
              Event type
            </label>
            <select
              id="se-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1a6ab0]"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="se-sev" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
              Severity
            </label>
            <select
              id="se-sev"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1a6ab0]"
            >
              {SEVERITY_OPTIONS.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="se-when" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            When it occurred
          </label>
          <input
            id="se-when"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="se-loc" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Location (optional)
          </label>
          <input
            id="se-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
            placeholder="Pool zone, facility area"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="se-desc" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            What happened
          </label>
          <textarea
            id="se-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1.5 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
            placeholder="Facts: who was involved, what was observed, condition of person(s), etc."
          />
        </div>
        <div>
          <label htmlFor="se-actions" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Actions taken (optional)
          </label>
          <textarea
            id="se-actions"
            value={actionsTaken}
            onChange={(e) => setActionsTaken(e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
            placeholder="First aid, EMS called, pool cleared, supervisor notified…"
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#1a6ab0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save event'}
          </button>
          <Link
            to="/admin/safety"
            className="inline-flex items-center rounded-xl border border-outline-variant/60 bg-white px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-bright"
          >
            Cancel
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
