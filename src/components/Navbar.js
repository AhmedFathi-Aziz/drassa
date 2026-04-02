import React from 'react';
import { useNavigate } from 'react-router-dom';
import { clearLocalAuthStorage, signOut } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const styles = {
  nav: {
    background: '#fff',
    borderBottom: '1px solid #e9ecef',
    padding: '0 32px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,.04)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
  logoCircle: {
    width: 42, height: 42, background: '#1a6ab0', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
  },
  brandText: { display: 'flex', flexDirection: 'column', lineHeight: 1.2 },
  brandMain: { fontSize: 14, fontWeight: 700, color: '#0d4a8a', letterSpacing: 1 },
  brandSub: { fontSize: 9, color: '#868e96', fontWeight: 400, textTransform: 'uppercase', letterSpacing: 0.5 },
  links: { display: 'flex', gap: 8, alignItems: 'center' },
  btnGhost: {
    padding: '8px 18px', background: 'transparent', color: '#495057',
    border: '1px solid #dee2e6', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all .2s',
  },
  btnPrimary: {
    padding: '8px 18px', background: '#1a6ab0', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all .2s',
  },
  userBadge: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, background: '#1a6ab0', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 12, fontWeight: 600,
  },
  username: { fontSize: 13, color: '#495057', fontWeight: 500 },
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Navbar({ showAuth = true }) {
  const navigate = useNavigate();
  const { session, profile, profileError, loading } = useAuth();

  async function handleLogout() {
    try {
      await signOut({ scope: 'local' });
    } catch (err) {
      // Even if sign-out fails, send user to a safe route.
      console.error('Sign out failed:', err);
    } finally {
      // Ensure UI fully resets even if auth events are flaky.
      clearLocalAuthStorage();
      window.location.href = '/';
    }
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.brand} onClick={() => navigate('/')}>
        <div style={styles.logoCircle}>DR</div>
        <div style={styles.brandText}>
          <span style={styles.brandMain}>DRASSA</span>
          <span style={styles.brandSub}>Emrill Portal</span>
        </div>
      </div>

      <div style={styles.links}>
        {session ? (
          <>
            {loading ? (
              <div style={styles.userBadge} aria-label="Loading profile" title={profileError || undefined}>
                <div style={{ ...styles.avatar, background: '#adb5bd' }}>…</div>
                <span style={styles.username}>Loading…</span>
              </div>
            ) : profile ? (
              <>
                <div style={styles.userBadge}>
                  <div style={styles.avatar}>{getInitials(profile.full_name)}</div>
                  <span style={styles.username}>{profile.full_name}</span>
                </div>
                {profile.role === 'admin' && (
                  <button style={styles.btnGhost} onClick={() => navigate('/admin')}>Admin Panel</button>
                )}
              </>
            ) : (
              <div style={styles.userBadge} title={profileError || "Your profile record could not be loaded. This usually means the Supabase SQL setup was not run or failed."}>
                <div style={styles.avatar}>?</div>
                <span style={styles.username}>Signed in</span>
              </div>
            )}
            <button style={styles.btnGhost} onClick={handleLogout}>Log Out</button>
          </>
        ) : showAuth ? (
          <>
            <button style={styles.btnGhost} onClick={() => navigate('/login')}>Log In</button>
            <button style={styles.btnPrimary} onClick={() => navigate('/signup')}>Sign Up</button>
          </>
        ) : null}
      </div>
    </nav>
  );
}
