import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar, { NAVBAR_CLEARANCE_PX } from '../components/Navbar';
import { listSafetyEvents, SAFETY_EVENT_TYPES } from '../lib/supabase';

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

export default function UserSafetyEvents() {
  const { profile } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

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
        if (!cancelled) setError(err?.message || 'Could not load safety events.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: NAVBAR_CLEARANCE_PX }}>
      <Navbar />
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e9ecef',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#343a40', marginBottom: 2 }}>
            Safety events, {firstName}
          </h2>
          <p style={{ fontSize: 13, color: '#868e96' }}>Read-only archive of rescues and incidents</p>
        </div>
        <Link
          to="/dashboard"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1a6ab0',
            textDecoration: 'none',
          }}
        >
          ← Back to files
        </Link>
      </div>

      <div style={{ padding: 32, flex: 1, maxWidth: 900, width: '100%', margin: '0 auto' }}>
        {error && (
          <div
            style={{
              marginBottom: 24,
              padding: '12px 16px',
              borderRadius: 12,
              background: '#fff5f5',
              border: '1px solid #feb2b2',
              color: '#c53030',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#adb5bd', fontSize: 13 }}>Loading…</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#adb5bd', fontSize: 13 }}>No events recorded.</div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, overflow: 'hidden' }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  padding: '18px 20px',
                  borderBottom: '1px solid #f1f3f5',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, color: '#343a40', fontSize: 15 }}>{ev.title}</span>
                  <span style={{ fontSize: 12, color: '#868e96' }}>
                    {TYPE_LABELS[ev.event_type] || ev.event_type}
                    {ev.severity ? ` · ${SEVERITY_LABELS[ev.severity] || ev.severity}` : ''}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#adb5bd', marginTop: 4 }}>{formatWhen(ev.occurred_at)}</div>
                {ev.location && (
                  <div style={{ fontSize: 13, color: '#495057', marginTop: 6 }}>📍 {ev.location}</div>
                )}
                {ev.description && (
                  <div style={{ fontSize: 13, color: '#495057', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {ev.description}
                  </div>
                )}
                {ev.actions_taken && (
                  <div style={{ fontSize: 12, color: '#868e96', marginTop: 8 }}>
                    <strong>Actions:</strong> {ev.actions_taken}
                  </div>
                )}
                {ev.reporter_display && (
                  <div style={{ fontSize: 11, color: '#adb5bd', marginTop: 6 }}>Logged by {ev.reporter_display}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
