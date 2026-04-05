import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdminUserFileCounts, getAllProfiles } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import { getAdminListCache, setAdminListCache } from '../lib/adminListCache';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ADMIN_LIST_CACHE_TTL_MS = 2 * 60 * 1000;

function categoryLabel(cat) {
  if (cat === 'instructor') return 'Instructor';
  return 'Lifeguard';
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userFileCounts, setUserFileCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [listFilter, setListFilter] = useState('all'); // all | lifeguard | instructor

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cache = getAdminListCache();
      const stale = !cache || Date.now() - cache.ts > ADMIN_LIST_CACHE_TTL_MS;
      if (cache && !stale) {
        setUsers(cache.users || []);
        setUserFileCounts(cache.userFileCounts || {});
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

        setAdminListCache({
          users: profiles || [],
          userFileCounts: counts,
          ts: Date.now(),
        });
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

  const filteredUsers = useMemo(() => {
    if (listFilter === 'lifeguard') {
      return users.filter((u) => (u.user_category || 'lifeguard') === 'lifeguard');
    }
    if (listFilter === 'instructor') {
      return users.filter((u) => u.user_category === 'instructor');
    }
    return users;
  }, [users, listFilter]);

  const lifeguardCount = useMemo(
    () => users.filter((u) => (u.user_category || 'lifeguard') === 'lifeguard').length,
    [users]
  );
  const instructorCount = useMemo(
    () => users.filter((u) => u.user_category === 'instructor').length,
    [users]
  );

  const totalFiles = Object.values(userFileCounts).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout activeNav="list">
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            User management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            Lifeguards and instructors are created here (not via public signup). Filter the list or open a user for
            files.
          </p>
        </div>
        <Link
          to="/admin/add-user"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#1a6ab0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          + Add user
        </Link>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total users', value: users.length },
          { label: 'Lifeguards', value: lifeguardCount },
          { label: 'Instructors', value: instructorCount },
          { label: 'Total files', value: totalFiles },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-outline-variant/40 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-secondary sm:text-[11px]">
              {s.label}
            </div>
            <div className="mt-1 font-headline text-2xl font-bold text-[#1a6ab0] sm:text-3xl">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'lifeguard', label: 'Lifeguards' },
          { id: 'instructor', label: 'Instructors' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setListFilter(f.id)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              listFilter === f.id
                ? 'border-[#1a6ab0] bg-[#1a6ab0] text-white'
                : 'border-outline-variant/60 bg-white text-secondary hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[880px]">
            <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,72px)_minmax(0,88px)] gap-3 border-b border-outline-variant/50 bg-surface-bright px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-secondary sm:gap-4 sm:text-[11px]">
              <div>User</div>
              <div>Email</div>
              <div>Category</div>
              <div>Files</div>
              <div>Action</div>
            </div>

            {loading ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">Loading users…</div>
            ) : filteredUsers.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-secondary">
                {users.length === 0 ? 'No users yet. Use Add user to create accounts.' : 'No users in this filter.'}
              </div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="grid w-full grid-cols-[minmax(0,1.6fr)_minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,72px)_minmax(0,88px)] items-center gap-3 border-b border-outline-variant/30 px-6 py-3.5 text-left transition-colors last:border-b-0 hover:bg-primary-fixed/40 sm:gap-4"
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
                  <div className="text-xs font-medium text-on-surface-variant sm:text-sm">
                    {categoryLabel(u.user_category)}
                  </div>
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
