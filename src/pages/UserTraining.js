import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar from '../components/Navbar';
import { listInServiceSessions, listLessonPlans } from '../lib/supabase';

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

export default function UserTraining() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError('');
      setLoading(true);
      try {
        const [s, p] = await Promise.all([listInServiceSessions(), listLessonPlans()]);
        if (cancelled) return;
        setSessions(s || []);
        setPlans(p || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Could not load training data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 144 }}>
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
            In-service training, {firstName}
          </h2>
          <p style={{ fontSize: 13, color: '#868e96' }}>Sessions and lesson plans shared by your admin team</p>
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

      <div style={{ padding: 32, flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
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
        ) : (
          <>
            <section style={{ marginBottom: 36 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#343a40', marginBottom: 16 }}>
                Training sessions
              </h3>
              <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, overflow: 'hidden' }}>
                {sessions.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>
                    No sessions published yet.
                  </div>
                ) : (
                  sessions.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f3f5',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#343a40', fontSize: 14 }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: '#868e96' }}>
                        {formatSessionAt(s.session_at)}
                        {s.location ? ` · ${s.location}` : ''}
                        {s.duration_minutes != null ? ` · ${s.duration_minutes} min` : ''}
                      </div>
                      {s.description && (
                        <div style={{ fontSize: 13, color: '#495057', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                          {s.description}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#343a40', marginBottom: 16 }}>Lesson plans</h3>
              <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, overflow: 'hidden' }}>
                {plans.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>
                    No lesson plans yet.
                  </div>
                ) : (
                  plans.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f3f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#343a40', fontSize: 14 }}>{p.title}</div>
                        {p.description && (
                          <div style={{ fontSize: 12, color: '#868e96', marginTop: 4 }}>{p.description}</div>
                        )}
                        <div style={{ fontSize: 12, color: '#adb5bd', marginTop: 4 }}>{p.file_name}</div>
                      </div>
                      <a
                        href={p.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '8px 16px',
                          borderRadius: 10,
                          background: '#1a6ab0',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Open file
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
