import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar from './Navbar';

/** Must match fixed navbar clearance (see Navbar logo height). */
export const ADMIN_NAV_OFFSET = 144;

const UsersIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PersonIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Admin shell: sidebar stays fixed while only the main column scrolls.
 * @param {'users' | 'detail'} activeNav
 */
export default function AdminLayout({ children, activeNav = 'users' }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      window.location.href = '/';
    }
  }

  const navBtn =
    'flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150';
  const navIdle = 'text-slate-300 hover:bg-white/[0.06] hover:text-white';
  const navActive = 'bg-[#1a6ab0] text-white shadow-md shadow-black/20';

  return (
    <div className="min-h-screen bg-[#eef2f6] font-body text-on-surface">
      <Navbar />
      <div
        className="flex overflow-hidden"
        style={{
          marginTop: ADMIN_NAV_OFFSET,
          height: `calc(100vh - ${ADMIN_NAV_OFFSET}px)`,
        }}
      >
        <aside className="flex w-[240px] shrink-0 flex-col border-r border-slate-800/80 bg-[#0d131c] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
          <div className="border-b border-white/10 px-5 py-5">
            <p className="font-headline text-base font-bold tracking-tight text-white">DRASSA</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Admin
            </p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className={`${navBtn} ${activeNav === 'users' ? navActive : navIdle}`}
            >
              <UsersIcon />
              All Users
            </button>
            {activeNav === 'detail' && (
              <div className={`${navBtn} ${navActive} cursor-default`}>
                <PersonIcon />
                User detail
              </div>
            )}
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[#eef2f6]">
          <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
