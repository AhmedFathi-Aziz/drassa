import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProfiles, getUserFiles, signOut } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const sidebarStyle = {
  width: 220, background: '#1e2a36', minHeight: '100vh', flexShrink: 0,
  display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  useAuth();
  const [users, setUsers] = useState([]);
  const [userFileCounts, setUserFileCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const profiles = await getAllProfiles();
        setUsers(profiles || []);
        // Load file counts for each user
        const counts = {};
        await Promise.all((profiles || []).map(async (u) => {
          try {
            const files = await getUserFiles(u.id);
            counts[u.id] = files?.length || 0;
          } catch { counts[u.id] = 0; }
        }));
        setUserFileCounts(counts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleLogout() {
    try {
      await signOut({ scope: 'local' });
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      navigate('/');
    }
  }

  const totalFiles = Object.values(userFileCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={sidebarStyle}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>DRASSA</div>
          <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
        </div>
        <nav style={{ flex: 1, paddingTop: 8 }}>
          <div style={{ padding: '10px 20px', fontSize: 13, color: '#fff', background: '#1a6ab0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            All Users
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
      <div style={{ flex: 1, padding: 32, background: '#f8f9fa', overflowY: 'auto' }}>
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40' }}>User Management</h2>
          <p style={{ fontSize: 13, color: '#868e96', marginTop: 4 }}>View all registered users and their uploaded files</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16, margin: '24px 0' }}>
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Total Files', value: totalFiles },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, color: '#868e96', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1a6ab0' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef', fontSize: 11, fontWeight: 600, color: '#868e96', textTransform: 'uppercase', letterSpacing: .5 }}>
            <div>User</div><div>Email</div><div>Files</div><div>Action</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>Loading users...</div>
          ) : users.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#adb5bd', fontSize: 13 }}>No users registered yet.</div>
          ) : users.map(u => (
            <div key={u.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '14px 20px', borderBottom: '1px solid #f1f3f5', alignItems: 'center', cursor: 'pointer', transition: 'background .15s' }}
              onClick={() => navigate(`/admin/user/${u.id}`)}
              onMouseEnter={e => e.currentTarget.style.background = '#e8f2fb'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: '#1a6ab0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                  {getInitials(u.full_name)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#343a40' }}>{u.full_name}</div>
                  <div style={{ fontSize: 11, color: '#adb5bd' }}>@{u.username}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#495057' }}>{u.email}</div>
              <div style={{ fontSize: 13, color: '#495057' }}>{userFileCounts[u.id] ?? '…'}</div>
              <div style={{ fontSize: 12, color: '#1a6ab0', fontWeight: 600 }}>View →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
