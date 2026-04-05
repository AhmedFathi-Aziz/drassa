import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { createInServiceSession } from '../lib/supabase';

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function AdminInServiceNew() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sessionAt, setSessionAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [location, setLocation] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    const parsed = new Date(sessionAt);
    if (Number.isNaN(parsed.getTime())) {
      setError('Invalid date and time.');
      return;
    }
    setLoading(true);
    try {
      await createInServiceSession({
        title: title.trim(),
        description: description.trim() || null,
        session_at: parsed.toISOString(),
        location: location.trim() || null,
        duration_minutes: durationMinutes === '' ? null : Number(durationMinutes),
      });
      navigate('/admin/in-service');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Could not save session.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout activeNav="in-service">
      <div className="mb-6">
        <Link to="/admin/in-service" className="text-sm font-semibold text-[#1a6ab0] hover:underline">
          ← Back to sessions
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">Add training session</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Log a new in-service session. You can record attendance on the next screen.
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
          <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm text-on-background outline-none ring-primary/20 focus:ring-2"
            placeholder="e.g. CPR refresher"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="sessionAt" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Date &amp; time
          </label>
          <input
            id="sessionAt"
            type="datetime-local"
            value={sessionAt}
            onChange={(e) => setSessionAt(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm text-on-background outline-none ring-primary/20 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="location" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Location (optional)
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm text-on-background outline-none ring-primary/20 focus:ring-2"
            placeholder="Pool deck / classroom"
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="duration"
            className="block text-xs font-semibold uppercase tracking-wider text-secondary"
          >
            Duration (minutes, optional)
          </label>
          <input
            id="duration"
            type="number"
            min={0}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm text-on-background outline-none ring-primary/20 focus:ring-2"
            placeholder="60"
          />
        </div>
        <div>
          <label htmlFor="desc" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Notes (optional)
          </label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1.5 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm text-on-background outline-none ring-primary/20 focus:ring-2"
            placeholder="Topics covered, instructor name, etc."
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#1a6ab0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save session'}
          </button>
          <Link
            to="/admin/in-service"
            className="inline-flex items-center rounded-xl border border-outline-variant/60 bg-white px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-bright"
          >
            Cancel
          </Link>
        </div>
      </form>
    </AdminLayout>
  );
}
