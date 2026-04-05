import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
  getAllProfiles,
  listAllInServiceAttendance,
  listInServiceSessions,
  listLessonPlans,
} from '../lib/supabase';

function csvEscape(value) {
  if (value == null) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename, headerRow, dataRows) {
  const lines = [headerRow.map(csvEscape).join(','), ...dataRows.map((row) => row.map(csvEscape).join(','))];
  const bom = '\ufeff';
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminTrainingReports() {
  const [sessions, setSessions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const [s, lp, att, prof] = await Promise.all([
          listInServiceSessions(),
          listLessonPlans(),
          listAllInServiceAttendance(),
          getAllProfiles(),
        ]);
        if (cancelled) return;
        setSessions(s || []);
        setPlans(lp || []);
        setAttendance(att || []);
        setProfiles(prof || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Could not load report data. Run the latest Supabase migration.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profileById = useMemo(() => {
    const m = {};
    for (const p of profiles) m[p.id] = p;
    return m;
  }, [profiles]);

  const sessionById = useMemo(() => {
    const m = {};
    for (const s of sessions) m[s.id] = s;
    return m;
  }, [sessions]);

  const attendancePresent = useMemo(() => attendance.filter((a) => a.attended).length, [attendance]);
  const attendanceAbsent = useMemo(() => attendance.filter((a) => !a.attended).length, [attendance]);

  const sessionsByMonth = useMemo(() => {
    const counts = {};
    for (const s of sessions) {
      const d = new Date(s.session_at);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12);
  }, [sessions]);

  function exportSessions() {
    downloadCsv(
      'in-service-sessions.csv',
      ['id', 'title', 'session_at', 'location', 'duration_minutes', 'created_at'],
      sessions.map((s) => [
        s.id,
        s.title,
        s.session_at,
        s.location || '',
        s.duration_minutes ?? '',
        s.created_at,
      ])
    );
  }

  function exportLessonPlans() {
    downloadCsv(
      'lesson-plans.csv',
      ['id', 'title', 'file_name', 'size_bytes', 'mime_type', 'public_url', 'created_at'],
      plans.map((p) => [p.id, p.title, p.file_name, p.size_bytes, p.mime_type, p.public_url, p.created_at])
    );
  }

  function exportAttendance() {
    downloadCsv(
      'in-service-attendance.csv',
      ['session_id', 'session_title', 'user_id', 'full_name', 'email', 'attended', 'notes', 'created_at'],
      attendance.map((a) => {
        const sess = sessionById[a.session_id];
        const prof = profileById[a.user_id];
        return [
          a.session_id,
          sess?.title || '',
          a.user_id,
          prof?.full_name || '',
          prof?.email || '',
          a.attended ? 'yes' : 'no',
          a.notes || '',
          a.created_at,
        ];
      })
    );
  }

  return (
    <AdminLayout activeNav="reports">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Training reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Summary of in-service activity and CSV exports for sessions, lesson plans, and attendance (admin only).
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {loading ? (
        <div className="py-14 text-center text-sm text-secondary">Loading…</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Training sessions', value: sessions.length },
              { label: 'Lesson plans', value: plans.length },
              { label: 'Attendance (present)', value: attendancePresent },
              { label: 'Attendance (absent)', value: attendanceAbsent },
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

          {sessionsByMonth.length > 0 && (
            <div className="mb-8 rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">Sessions by month</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {sessionsByMonth.map(([month, count]) => (
                  <li key={month} className="flex justify-between border-b border-outline-variant/30 py-2 last:border-0">
                    <span className="text-on-surface-variant">{month}</span>
                    <span className="font-semibold tabular-nums text-on-background">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary">Export CSV</h2>
            <p className="mt-2 text-sm text-secondary">Downloads open as UTF-8 spreadsheets (Excel-friendly).</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={exportSessions}
                className="rounded-xl border border-outline-variant/60 bg-surface-bright px-4 py-2.5 text-sm font-semibold text-on-background hover:border-[#1a6ab0]/40"
              >
                Sessions
              </button>
              <button
                type="button"
                onClick={exportLessonPlans}
                className="rounded-xl border border-outline-variant/60 bg-surface-bright px-4 py-2.5 text-sm font-semibold text-on-background hover:border-[#1a6ab0]/40"
              >
                Lesson plans
              </button>
              <button
                type="button"
                onClick={exportAttendance}
                className="rounded-xl border border-outline-variant/60 bg-surface-bright px-4 py-2.5 text-sm font-semibold text-on-background hover:border-[#1a6ab0]/40"
              >
                Attendance
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
