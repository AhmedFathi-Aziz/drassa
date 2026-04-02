import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAdminUserProfile, getFilesForUser } from '../lib/supabase';
import FileCard from '../components/FileCard';
import { useAuth } from '../lib/AuthContext';
import Navbar from '../components/Navbar';

const NAV_OFFSET = 144;

const detailCache = new Map(); // userId -> { profile, files, ts }

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const withTimeout = (promise, ms, label) => Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
    ]);

    async function load() {
      if (cancelled) return;
      const cached = detailCache.get(userId);
      // Show cached data immediately when revisiting the page.
      if (cached) {
        setUserProfile(cached.profile || null);
        setFiles(cached.files || []);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError('');
      let latestProfile = cached?.profile || null;
      let latestFiles = cached?.files || [];
      try {
        const prof = await withTimeout(getAdminUserProfile(userId), 12000, 'Profile request');
        latestProfile = prof;
        if (!cancelled) setUserProfile(prof);
      }
      catch (err) {
        console.error(err);
        if (!cancelled) setError(err?.message || 'Failed to load user profile');
      }

      try {
        const userFiles = await withTimeout(getFilesForUser(userId), 12000, 'Files request');
        latestFiles = userFiles || [];
        if (!cancelled) setFiles(latestFiles);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError(prev => prev || (err?.message || 'Failed to load user files'));
      } finally {
        if (!cancelled) {
          detailCache.set(userId, {
            profile: latestProfile,
            files: latestFiles,
            ts: Date.now(),
          });
        }
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      window.location.href = '/';
    }
  }

  const filtered = filter === 'all' ? files : files.filter(f => f.file_type === filter);

  const sidebarStyle = {
    width: 220,
    background: '#1e2a36',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: NAV_OFFSET,
    alignSelf: 'flex-start',
    height: `calc(100vh - ${NAV_OFFSET}px)`,
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', marginTop: NAV_OFFSET, minHeight: `calc(100vh - ${NAV_OFFSET}px)` }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>DRASSA</div>
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          <div
            style={{ padding: '10px 20px', fontSize: 13, color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'all .15s' }}
            onClick={() => navigate('/admin')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            All Users
          </div>
          <div style={{ padding: '10px 20px', fontSize: 13, color: '#fff', background: '#1a6ab0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            User Detail
          </div>
        </nav>
        <div style={{ padding: 12 }}>
          <div style={{ padding: '10px 12px', fontSize: 13, color: 'rgba(255,255,255,.6)', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, cursor: 'pointer' }}
            onClick={handleLogout}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.08)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.6)'; }}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Log Out
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 32, background: '#ffffff', overflowY: 'auto' }}>
        {error && (
          <div style={{ marginBottom: 14, background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e24b4a' }}>
            {error}
          </div>
        )}
        {/* Back + User Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/admin')} style={{
            padding: '8px 16px', background: '#fff', border: '1px solid #dee2e6',
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#495057',
          }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to Users
          </button>
          {userProfile && (
            <>
              <div style={{ width: 52, height: 52, background: '#1a6ab0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>
                {getInitials(userProfile.full_name)}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#343a40' }}>{userProfile.full_name}</h3>
                <p style={{ fontSize: 13, color: '#868e96' }}>{userProfile.email} · @{userProfile.username}</p>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Files', value: files.length, color: '#1a6ab0' },
            { label: 'PDFs', value: files.filter(f => f.file_type === 'pdf').length, color: '#a32d2d' },
            { label: 'Images', value: files.filter(f => f.file_type === 'image').length, color: '#185FA5' },
            { label: 'Videos', value: files.filter(f => f.file_type === 'video').length, color: '#3B6D11' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: '#868e96', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Files */}
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#343a40' }}>Uploaded Files</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'pdf', 'image', 'video'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: filter === f ? '#1a6ab0' : 'transparent',
                  color: filter === f ? '#fff' : '#868e96',
                  border: `1px solid ${filter === f ? '#1a6ab0' : '#dee2e6'}`,
                  textTransform: 'capitalize', transition: 'all .15s',
                }}>{f === 'all' ? 'All' : f + 's'}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#adb5bd', fontSize: 13 }}>Loading files...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#adb5bd', fontSize: 13 }}>No files found.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
              {filtered.map(file => (
                <FileCard key={file.id} file={file} readonly />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
