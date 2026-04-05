import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { deleteLessonPlan, listLessonPlans, uploadLessonPlan } from '../lib/supabase';

function formatBytes(n) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCreated(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function AdminLessonPlans() {
  const [plans, setPlans] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    const rows = await listLessonPlans();
    setPlans(rows);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        await refresh();
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Could not load lesson plans. Run the latest Supabase migration.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    setUploading(true);
    try {
      await uploadLessonPlan(file, { title: title.trim(), description: description.trim() || null });
      setTitle('');
      setDescription('');
      setFile(null);
      setFileInputKey((k) => k + 1);
      await refresh();
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete lesson plan “${row.title}”?`)) return;
    setDeletingId(row.id);
    setError('');
    try {
      await deleteLessonPlan(row);
      setPlans((prev) => prev.filter((p) => p.id !== row.id));
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout activeNav="lesson-plans">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">Lesson plans</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Upload teaching plans (PDF, Word, etc.). Only admins can add or remove files; signed-in staff can open them
          from this list.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <form
        onSubmit={handleUpload}
        className="mb-10 max-w-xl space-y-4 rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">Upload plan</h2>
        <div>
          <label htmlFor="lp-title" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Title
          </label>
          <input
            id="lp-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
            placeholder="Unit 3 — water rescue"
          />
        </div>
        <div>
          <label htmlFor="lp-desc" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            Description (optional)
          </label>
          <textarea
            id="lp-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1.5 w-full resize-y rounded-xl border border-outline-variant/60 bg-surface-bright px-3 py-2.5 text-sm outline-none ring-primary/20 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="lp-file" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
            File
          </label>
          <input
            key={fileInputKey}
            id="lp-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1.5 block w-full text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-[#1a6ab0] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-xl bg-[#1a6ab0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-secondary">Library</h2>
      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,80px)_minmax(0,88px)] gap-3 border-b border-outline-variant/50 bg-surface-bright px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-secondary sm:gap-4 sm:text-[11px]">
              <div>Title</div>
              <div>File / size</div>
              <div>Open</div>
              <div>Delete</div>
            </div>
            {loading ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">Loading…</div>
            ) : plans.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">No lesson plans uploaded yet.</div>
            ) : (
              plans.map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,80px)_minmax(0,88px)] items-center gap-3 border-b border-outline-variant/30 px-6 py-3.5 last:border-b-0 sm:gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-on-background">{p.title}</div>
                    <div className="truncate text-xs text-secondary">{formatCreated(p.created_at)}</div>
                    {p.description && (
                      <div className="mt-1 line-clamp-2 text-xs text-on-surface-variant">{p.description}</div>
                    )}
                  </div>
                  <div className="min-w-0 text-sm text-on-surface-variant">
                    <div className="truncate">{p.file_name}</div>
                    <div className="text-xs text-secondary">{formatBytes(p.size_bytes)}</div>
                  </div>
                  <a
                    href={p.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#1a6ab0] hover:underline"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p)}
                    className="text-left text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingId === p.id ? '…' : 'Delete'}
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
