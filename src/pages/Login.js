import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../lib/supabase';
import Navbar from '../components/Navbar';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar showAuth={false} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8f9fa' }}>
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 20, padding: '44px 40px', width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, background: '#1a6ab0', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>DR</div>
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
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 6, textTransform: 'uppercase', letterSpacing: .3 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password"
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#1a6ab0'}
                onBlur={e => e.target.style.borderColor = '#dee2e6'}
              />
            </div>
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
    </div>
  );
}
