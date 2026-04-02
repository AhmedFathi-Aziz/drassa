import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { getUserFiles } from '../lib/supabase';
import Navbar from '../components/Navbar';
import DropZone from '../components/DropZone';
import FileCard from '../components/FileCard';

/** Avoid empty "Loading…" when revisiting the dashboard; refresh in background. */
const filesByUserId = new Map();
const FILES_CACHE_TTL_MS = 2 * 60 * 1000;

function StatCard({ label, value, color = '#1a6ab0' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 11, color: '#868e96', textTransform: 'uppercase', letterSpacing: .5, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

export default function UserDashboard() {
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setFiles([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const cached = filesByUserId.get(userId);
    const cacheOk = cached && Date.now() - cached.ts < FILES_CACHE_TTL_MS;
    if (cacheOk) {
      setFiles(cached.files);
      setLoading(false);
    } else {
      setLoading(true);
    }

    (async () => {
      try {
        const data = await getUserFiles(userId);
        if (cancelled) return;
        const list = data || [];
        setFiles(list);
        filesByUserId.set(userId, { files: list, ts: Date.now() });
      } catch (err) {
        console.error('Failed to load files:', err);
        if (!cancelled && !cacheOk) setFiles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleUploaded = (newFile) => {
    setFiles((prev) => {
      const next = [newFile, ...prev];
      if (userId) filesByUserId.set(userId, { files: next, ts: Date.now() });
      return next;
    });
  };

  const handleDeleted = (fileId) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileId);
      if (userId) filesByUserId.set(userId, { files: next, ts: Date.now() });
      return next;
    });
  };

  const filtered = filter === 'all' ? files : files.filter(f => f.file_type === filter);
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 144 }}>
      <Navbar />
      <div style={{ background: '#fff', borderBottom: '1px solid #e9ecef', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#343a40', marginBottom: 2 }}>Good day, {firstName} 👋</h2>
          <p style={{ fontSize: 13, color: '#868e96' }}>Manage and upload your files securely</p>
        </div>
        <div style={{ fontSize: 12, color: '#adb5bd' }}>@{profile?.username}</div>
      </div>

      <div style={{ padding: 32, flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Files" value={files.length} />
          <StatCard label="PDFs" value={files.filter(f => f.file_type === 'pdf').length} color="#a32d2d" />
          <StatCard label="Images" value={files.filter(f => f.file_type === 'image').length} color="#185FA5" />
          <StatCard label="Videos" value={files.filter(f => f.file_type === 'video').length} color="#3B6D11" />
        </div>

        {/* Upload Zone */}
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, padding: 28, marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#343a40', marginBottom: 16 }}>Upload Files</h3>
          <DropZone onUploaded={handleUploaded} />
        </div>

        {/* Files */}
        <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#343a40' }}>My Files</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'pdf', 'image', 'video'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  background: filter === f ? '#1a6ab0' : 'transparent',
                  color: filter === f ? '#fff' : '#868e96',
                  border: `1px solid ${filter === f ? '#1a6ab0' : '#dee2e6'}`,
                  transition: 'all .15s', textTransform: 'capitalize',
                }}>{f === 'all' ? 'All' : f + 's'}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#adb5bd', fontSize: 13 }}>Loading files...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#adb5bd', fontSize: 13 }}>
              {filter === 'all' ? 'No files yet. Upload your first file above.' : `No ${filter}s uploaded yet.`}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
              {filtered.map(file => (
                <FileCard key={file.id} file={file} onDeleted={handleDeleted} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
