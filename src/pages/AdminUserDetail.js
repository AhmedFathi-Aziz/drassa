import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminUserProfile, getFilesForUser } from '../lib/supabase';
import FileCard from '../components/FileCard';
import AdminLayout from '../components/AdminLayout';

const detailCache = new Map(); // userId -> { profile, files, ts }

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out`)), ms)
        ),
      ]);

    async function load() {
      if (cancelled) return;
      const cached = detailCache.get(userId);
      if (cached) {
        setUserProfile(cached.profile || null);
        setFiles(cached.files || []);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError('');
      let latestProfile = cached?.profile || null;
      let latestFiles = cached?.files || [];
      try {
        const prof = await withTimeout(getAdminUserProfile(userId), 12000, 'Profile request');
        latestProfile = prof;
        if (!cancelled) setUserProfile(prof);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Failed to load user profile');
      }

      try {
        const userFiles = await withTimeout(getFilesForUser(userId), 12000, 'Files request');
        latestFiles = userFiles || [];
        if (!cancelled) setFiles(latestFiles);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError((prev) => prev || err?.message || 'Failed to load user files');
      } finally {
        if (!cancelled) {
          detailCache.set(userId, {
            profile: latestProfile,
            files: latestFiles,
            ts: Date.now(),
          });
        }
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filtered = filter === 'all' ? files : files.filter((f) => f.file_type === filter);

  return (
    <AdminLayout activeNav="detail">
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="mb-8 flex flex-col gap-6 border-b border-outline-variant/40 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-white px-4 py-2.5 text-sm font-medium text-on-surface shadow-sm transition-colors hover:border-primary/30 hover:bg-surface-bright"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to users
          </button>
          {userProfile && (
            <>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1a6ab0] text-lg font-bold text-white">
                {getInitials(userProfile.full_name)}
              </div>
              <div>
                <h1 className="font-headline text-xl font-bold text-primary sm:text-2xl">
                  {userProfile.full_name}
                </h1>
                <p className="mt-1 text-sm text-secondary">
                  {userProfile.email} · @{userProfile.username}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total files', value: files.length, color: '#1a6ab0' },
          { label: 'PDFs', value: files.filter((f) => f.file_type === 'pdf').length, color: '#a32d2d' },
          { label: 'Images', value: files.filter((f) => f.file_type === 'image').length, color: '#185FA5' },
          { label: 'Videos', value: files.filter((f) => f.file_type === 'video').length, color: '#3B6D11' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-outline-variant/40 bg-white px-5 py-4 shadow-sm"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              {s.label}
            </div>
            <div className="mt-1 font-headline text-2xl font-bold tabular-nums" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-headline text-lg font-semibold text-primary">Uploaded files</h2>
          <div className="flex flex-wrap gap-2">
            {['all', 'pdf', 'image', 'video'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filter === f
                    ? 'border-[#1a6ab0] bg-[#1a6ab0] text-white'
                    : 'border-outline-variant/60 bg-white text-secondary hover:border-primary/40'
                }`}
              >
                {f === 'all' ? 'All' : `${f}s`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-secondary">Loading files…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-secondary">No files found.</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {filtered.map((file) => (
              <FileCard key={file.id} file={file} readonly />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
