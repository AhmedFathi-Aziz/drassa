import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUserFileCounts, getAllProfiles } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Show list immediately when returning to this page; refresh in background. */
let adminListCache = null; // { users, userFileCounts, ts }
const ADMIN_LIST_CACHE_TTL_MS = 2 * 60 * 1000;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userFileCounts, setUserFileCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const stale =
        !adminListCache || Date.now() - adminListCache.ts > ADMIN_LIST_CACHE_TTL_MS;
      if (adminListCache && !stale) {
        setUsers(adminListCache.users || []);
        setUserFileCounts(adminListCache.userFileCounts || {});
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const profiles = await getAllProfiles();
        if (cancelled) return;
        setUsers(profiles || []);

        const counts = {};
        const countRows = await getAdminUserFileCounts();
        if (cancelled) return;
        for (const row of countRows || []) counts[row.user_id] = Number(row.total || 0);
        setUserFileCounts(counts);

        adminListCache = {
          users: profiles || [],
          userFileCounts: counts,
          ts: Date.now(),
        };
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalFiles = Object.values(userFileCounts).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout activeNav="users">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          User management
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          View all registered users and their uploaded files. Select a row to open details.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Total users', value: users.length },
          { label: 'Total files', value: totalFiles },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-outline-variant/40 bg-white px-6 py-5 shadow-sm"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              {s.label}
            </div>
            <div className="mt-2 font-headline text-3xl font-bold text-[#1a6ab0]">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,88px)_minmax(0,88px)] gap-4 border-b border-outline-variant/50 bg-surface-bright px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-secondary">
              <div>User</div>
              <div>Email</div>
              <div>Files</div>
              <div>Action</div>
            </div>

            {loading ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">
                No users registered yet.
              </div>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="grid w-full grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,88px)_minmax(0,88px)] items-center gap-4 border-b border-outline-variant/30 px-6 py-3.5 text-left transition-colors last:border-b-0 hover:bg-primary-fixed/40"
                  onClick={() => navigate(`/admin/user/${u.id}`)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a6ab0] text-[11px] font-bold text-white">
                      {getInitials(u.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-on-background">{u.full_name}</div>
                      <div className="truncate text-xs text-secondary">@{u.username}</div>
                    </div>
                  </div>
                  <div className="truncate text-sm text-on-surface-variant">{u.email}</div>
                  <div className="text-sm tabular-nums text-on-surface-variant">
                    {userFileCounts[u.id] ?? '—'}
                  </div>
                  <div className="text-sm font-semibold text-[#1a6ab0]">View →</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
