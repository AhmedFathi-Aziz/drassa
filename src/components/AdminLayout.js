import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar, { NAVBAR_CLEARANCE_PX } from './Navbar';

/** Must match fixed navbar clearance (see Navbar). */
export const ADMIN_NAV_OFFSET = NAVBAR_CLEARANCE_PX;

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

const AddIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrainingIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 7v6M9 10h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ChartIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden>
    <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/**
 * Admin shell: sidebar stays fixed while only the main column scrolls.
 * @param {'list' | 'add' | 'detail' | 'in-service' | 'lesson-plans' | 'reports'} activeNav
 */
export default function AdminLayout({ children, activeNav = 'list' }) {
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
              className={`${navBtn} ${activeNav === 'list' ? navActive : navIdle}`}
            >
              <UsersIcon />
              User list
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/add-user')}
              className={`${navBtn} ${activeNav === 'add' ? navActive : navIdle}`}
            >
              <AddIcon />
              Add user
            </button>
            {activeNav === 'detail' && (
              <div className={`${navBtn} ${navActive} cursor-default`}>
                <PersonIcon />
                User detail
              </div>
            )}

            <p className="mb-1 mt-5 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              In-service
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/in-service')}
              className={`${navBtn} ${activeNav === 'in-service' ? navActive : navIdle}`}
            >
              <TrainingIcon />
              Training sessions
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/lesson-plans')}
              className={`${navBtn} ${activeNav === 'lesson-plans' ? navActive : navIdle}`}
            >
              <DocumentIcon />
              Lesson plans
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/reports')}
              className={`${navBtn} ${activeNav === 'reports' ? navActive : navIdle}`}
            >
              <ChartIcon />
              Reports
            </button>
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
