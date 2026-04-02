import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, requestPasswordReset } from '../lib/supabase';
import Navbar from '../components/Navbar';
import MarketingFooter from '../components/MarketingFooter';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError('');
    setStatus('');
    setLoading(true);
    try {
      setStatus('Signing in…');
      await Promise.race([
        signIn({ email, password }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign in timed out. Close other tabs of this app and try again.')), 8000)),
      ]);
      // Navigate immediately so user sees progress; ProtectedRoute will handle role redirects.
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setError('');
    setResetSent(false);
    if (!email.trim()) {
      setError('Enter your email above to receive a reset link.');
      return;
    }
    setResetLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setResetSent(true);
      setStatus('');
    } catch (err) {
      setError(err?.message || 'Could not send reset email.');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 144 }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#ffffff' }}>
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <img
              src="/drassa-logo.png"
              alt="DRASSA — Drassa Academy for Safety Aquatics"
              style={{
                height: 128,
                width: 'auto',
                maxWidth: 'min(100%, 220px)',
                margin: '0 auto 14px',
                display: 'block',
                objectFit: 'contain',
                objectPosition: 'center',
              }}
            />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40', marginBottom: 4 }}>Welcome Back</h2>
            <p style={{ fontSize: 13, color: '#868e96' }}>Sign in to your DRASSA – Emrill account</p>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e24b4a', marginBottom: 16 }}>
              {error}
            </div>
          )}
          {status && !error && (
            <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#495057', marginBottom: 16 }}>
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .3 }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="your@email.com"
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#1a6ab0'}
                onBlur={e => e.target.style.borderColor = '#dee2e6'}
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .3 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password"
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#1a6ab0'}
                onBlur={e => e.target.style.borderColor = '#dee2e6'}
              />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => { setForgotOpen((o) => !o); setError(''); setResetSent(false); }}
                style={{ background: 'none', border: 'none', color: '#1a6ab0', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
            {forgotOpen && (
              <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#495057', marginBottom: 10 }}>
                  We will email you a link to set a new password (use the email field above).
                </p>
                {resetSent && (
                  <p style={{ fontSize: 13, color: '#2f9e44', marginBottom: 8 }}>Check your inbox for the reset link.</p>
                )}
                <button
                  type="button"
                  onClick={handleForgotSubmit}
                  disabled={resetLoading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: resetLoading ? '#adb5bd' : '#343a40',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: resetLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {resetLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            )}
            <button type="submit" onClick={handleSubmit} disabled={loading} style={{
              width: '100%', padding: 13, background: loading ? '#adb5bd' : '#1a6ab0', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
            }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#868e96' }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/signup')} style={{ color: '#1a6ab0', cursor: 'pointer', fontWeight: 500 }}>Sign Up</span>
          </p>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
