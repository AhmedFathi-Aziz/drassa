import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearLocalAuthStorage } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

/** Top offset for page content below the fixed navbar (logo + padding). Keep in sync with logo height classes. */
export const NAVBAR_CLEARANCE_PX = 96;

/**
 * Fixed marketing nav (same as homepage) — use on all routes.
 * Content below should clear the fixed bar (see `NAVBAR_CLEARANCE_PX`).
 */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, loading, logout } = useAuth();
  const hasSession = !!session?.user?.id;

  const dashboardPath = profile?.role === 'admin' ? '/admin' : '/dashboard';
  const path = location.pathname;
  const isHome = path === '/';
  const isPortal = path.startsWith('/dashboard') || path.startsWith('/admin');

  async function handleLogout() {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    } finally {
      clearLocalAuthStorage();
      window.location.href = '/';
    }
  }

  const linkIdle = 'text-[#53606b] dark:text-slate-400 font-medium hover:text-[#005288] dark:hover:text-blue-200 transition-colors bg-transparent border-0 p-0 cursor-pointer';
  const linkActive = 'text-[#003a63] dark:text-blue-300 font-semibold border-b-2 border-[#003a63] pb-1';

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white dark:bg-white flex justify-between items-center px-5 py-2 md:px-6 font-headline tracking-tight shadow-sm shadow-black/[0.04]">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="bg-transparent border-0 p-0 cursor-pointer shrink-0 flex items-center"
        aria-label="Home"
      >
        <img
          alt="DRASSA — Drassa Academy for Safety Aquatics"
          className="h-[52px] md:h-[60px] w-auto max-w-[min(220px,40vw)] object-contain object-left"
          src="/drassa-logo.png"
        />
      </button>

      <div className="hidden md:flex items-center gap-6">
        {isHome ? (
          <span className={linkActive}>Home</span>
        ) : (
          <button type="button" className={linkIdle} onClick={() => navigate('/')}>
            Home
          </button>
        )}
        {isPortal ? (
          <span className={linkActive}>Emrill Portal Dashboard</span>
        ) : (
          <button
            type="button"
            className={linkIdle}
            onClick={() => navigate(hasSession ? dashboardPath : '/login')}
          >
            Emrill Portal Dashboard
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {loading ? (
          <span className="text-secondary text-sm">…</span>
        ) : hasSession ? (
          <>
            <button
              type="button"
              onClick={() => navigate(dashboardPath)}
              className="px-3 py-1.5 sm:px-4 text-sm text-primary font-medium transition-opacity duration-200 hover:opacity-80"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 sm:px-4 text-sm bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Log out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 sm:px-4 text-sm bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-lg font-medium hover:opacity-90 transition-all"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
