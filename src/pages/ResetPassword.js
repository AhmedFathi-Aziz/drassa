import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import { useAuth } from '../lib/AuthContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const hasSession = !!session?.user?.id;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err?.message || 'Could not update password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 144 }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#ffffff' }}>
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 440 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40', marginBottom: 8, textAlign: 'center' }}>Set a new password</h2>
          <p style={{ fontSize: 13, color: '#868e96', marginBottom: 24, textAlign: 'center' }}>
            Choose a password for your DRASSA – Emrill account.
          </p>

          {authLoading ? (
            <p style={{ textAlign: 'center', color: '#868e96', fontSize: 14 }}>Checking your reset link…</p>
          ) : !hasSession ? (
            <div style={{ background: '#fff8e6', border: '1px solid #fcc', borderRadius: 8, padding: '14px 16px', fontSize: 13, color: '#856404' }}>
              This reset link is invalid or has expired. Request a new one from the{' '}
              <button type="button" onClick={() => navigate('/login')} style={{ color: '#1a6ab0', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                login page
              </button>
              .
            </div>
          ) : done ? (
            <p style={{ textAlign: 'center', color: '#2f9e44', fontSize: 14 }}>Password updated. Redirecting to sign in…</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e24b4a', marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: 13,
                  background: submitting ? '#adb5bd' : '#1a6ab0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
