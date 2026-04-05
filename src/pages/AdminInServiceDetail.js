import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import {
  getAllProfiles,
  getInServiceSession,
  listAttendanceForSession,
  saveSessionAttendance,
} from '../lib/supabase';

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

export default function AdminInServiceDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessionRow, setSessionRow] = useState(null);
  const [staff, setStaff] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const [sess, profiles, attRows] = await Promise.all([
          getInServiceSession(sessionId),
          getAllProfiles(),
          listAttendanceForSession(sessionId),
        ]);
        if (cancelled) return;
        if (!sess) {
          setError('Session not found.');
          setSessionRow(null);
          setStaff([]);
          setAttendanceMap({});
          return;
        }
        setSessionRow(sess);
        const users = (profiles || []).filter((p) => p.role === 'user');
        setStaff(users);
        const next = {};
        for (const u of users) {
          next[u.id] = { attended: false, notes: '' };
        }
        for (const row of attRows || []) {
          if (next[row.user_id] !== undefined) {
            next[row.user_id] = {
              attended: !!row.attended,
              notes: row.notes || '',
            };
          }
        }
        setAttendanceMap(next);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Could not load session or attendance.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const sortedStaff = useMemo(
    () => [...staff].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '')),
    [staff]
  );

  function setUserAttendance(userId, patch) {
    setAttendanceMap((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], ...patch },
    }));
  }

  async function handleSave() {
    if (!sessionRow) return;
    setSaving(true);
    setError('');
    try {
      const rows = sortedStaff.map((u) => ({
        user_id: u.id,
        attended: !!attendanceMap[u.id]?.attended,
        notes: attendanceMap[u.id]?.notes ?? '',
      }));
      await saveSessionAttendance(sessionRow.id, rows);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Could not save attendance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout activeNav="in-service">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/admin/in-service" className="text-sm font-semibold text-[#1a6ab0] hover:underline">
          ← Sessions
        </Link>
        <span className="text-slate-300">|</span>
        <button
          type="button"
          onClick={() => navigate('/admin/in-service/new')}
          className="text-sm font-semibold text-secondary hover:text-[#1a6ab0]"
        >
          + Add session
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {loading ? (
        <div className="py-14 text-center text-sm text-secondary">Loading…</div>
      ) : !sessionRow ? (
        <p className="text-sm text-secondary">This session does not exist or you cannot access it.</p>
      ) : (
        <>
          <header className="mb-8">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {sessionRow.title}
            </h1>
            <p className="mt-2 text-sm text-secondary">
              {formatSessionAt(sessionRow.session_at)}
              {sessionRow.location ? ` · ${sessionRow.location}` : ''}
              {sessionRow.duration_minutes != null ? ` · ${sessionRow.duration_minutes} min` : ''}
            </p>
            {sessionRow.description && (
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm text-on-surface-variant">
                {sessionRow.description}
              </p>
            )}
          </header>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">Attendance</h2>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-xl bg-[#1a6ab0] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save attendance'}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,100px)_minmax(0,1fr)] gap-3 border-b border-outline-variant/50 bg-surface-bright px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-secondary sm:gap-4 sm:text-[11px]">
                  <div>Staff</div>
                  <div>Present</div>
                  <div>Notes</div>
                </div>
                {sortedStaff.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-secondary">
                    No staff users yet. Add users from the admin user list first.
                  </div>
                ) : (
                  sortedStaff.map((u) => (
                    <div
                      key={u.id}
                      className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,100px)_minmax(0,1fr)] items-center gap-3 border-b border-outline-variant/30 px-6 py-3 last:border-b-0 sm:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-on-background">{u.full_name}</div>
                        <div className="truncate text-xs text-secondary">
                          @{u.username} · {u.user_category === 'instructor' ? 'Instructor' : 'Lifeguard'}
                        </div>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!attendanceMap[u.id]?.attended}
                          onChange={(e) => setUserAttendance(u.id, { attended: e.target.checked })}
                          className="h-4 w-4 rounded border-outline-variant text-[#1a6ab0] focus:ring-[#1a6ab0]"
                        />
                        <span className="sr-only">Present</span>
                      </label>
                      <input
                        type="text"
                        value={attendanceMap[u.id]?.notes ?? ''}
                        onChange={(e) => setUserAttendance(u.id, { notes: e.target.value })}
                        placeholder="Optional"
                        className="w-full min-w-0 rounded-lg border border-outline-variant/60 bg-surface-bright px-2 py-1.5 text-sm outline-none ring-primary/20 focus:ring-2"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
