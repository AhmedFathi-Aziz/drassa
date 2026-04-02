import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../lib/supabase';
import Navbar from '../components/Navbar';
import MarketingFooter from '../components/MarketingFooter';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.fullName || !form.username || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await signUp(form);
      // If email confirmations are enabled, Supabase won't create a session yet.
      if (!data?.session) {
        setMessage('Account created. Please check your email to confirm your account, then sign in.');
        setTimeout(() => navigate('/login'), 800);
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Signup failed. Try a different email or username.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1px solid #dee2e6',
    borderRadius: 10, fontSize: 14, outline: 'none',
  };
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#495057',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: .3,
  };

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
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40', marginBottom: 4 }}>Create Account</h2>
            <p style={{ fontSize: 13, color: '#868e96' }}>Join the DRASSA – Emrill Portal</p>
          </div>

          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e24b4a', marginBottom: 16 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: '#f0fff4', border: '1px solid #b7ebc6', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#2f9e44', marginBottom: 16 }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Full Name', field: 'fullName', type: 'text', placeholder: 'Your full name' },
              { label: 'Username', field: 'username', type: 'text', placeholder: 'Choose a username' },
              { label: 'Email', field: 'email', type: 'email', placeholder: 'your@email.com' },
              { label: 'Password', field: 'password', type: 'password', placeholder: 'At least 6 characters' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type} value={form[field]} onChange={update(field)}
                  placeholder={placeholder} required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#1a6ab0'}
                  onBlur={e => e.target.style.borderColor = '#dee2e6'}
                />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 13, background: loading ? '#adb5bd' : '#1a6ab0', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8,
            }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#868e96' }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#1a6ab0', cursor: 'pointer', fontWeight: 500 }}>Sign In</span>
          </p>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
