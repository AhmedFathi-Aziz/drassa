import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  'video/*': ['.mp4', '.mov', '.avi', '.webm'],
};

export default function DropZone({ onUploaded }) {
  const { session } = useAuth();
  const [uploads, setUploads] = useState([]); // { name, progress, status }

  const updateUpload = (name, patch) => {
    setUploads(prev => prev.map(u => u.name === name ? { ...u, ...patch } : u));
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!session) return;

    const newUploads = acceptedFiles.map(f => ({ name: f.name, progress: 0, status: 'uploading' }));
    setUploads(prev => [...newUploads, ...prev]);

    for (const file of acceptedFiles) {
      try {
        // Simulate progress ticks while uploading
        let tick = 0;
        const interval = setInterval(() => {
          tick = Math.min(tick + Math.floor(Math.random() * 15) + 5, 85);
          updateUpload(file.name, { progress: tick });
        }, 200);

        const uploaded = await uploadFile(file, session.user.id);

        clearInterval(interval);
        updateUpload(file.name, { progress: 100, status: 'done' });

        if (onUploaded) onUploaded(uploaded);

        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.name !== file.name));
        }, 1500);

      } catch (err) {
        updateUpload(file.name, { status: 'error', error: err.message });
      }
    }
  }, [session, onUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxSize: 100 * 1024 * 1024,
  });

  return (
    <div>
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? '#1a6ab0' : '#dee2e6'}`,
        borderRadius: 12,
        padding: '48px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        background: isDragActive ? '#e8f2fb' : '#f8f9fa',
        transition: 'all .2s',
      }}>
        <input {...getInputProps()} />
        <div style={{
          width: 52, height: 52, margin: '0 auto 16px', background: '#e8f2fb',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="#1a6ab0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontSize: 14, color: '#495057', fontWeight: 500, marginBottom: 6 }}>
          {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
        </p>
        <p style={{ fontSize: 12, color: '#adb5bd', marginBottom: 16 }}>
          PDF, Images (JPG, PNG, WEBP), Videos (MP4, MOV) — up to 100MB each
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 280, margin: '0 auto 16px' }}>
          <div style={{ flex: 1, height: 1, background: '#e9ecef' }} />
          <span style={{ fontSize: 12, color: '#adb5bd' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e9ecef' }} />
        </div>
        <button style={{
          padding: '10px 24px', background: '#1a6ab0', color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Browse Files</button>
      </div>

      {uploads.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {uploads.map(u => (
            <div key={u.name} style={{
              background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8,
              padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#495057', minWidth: 120, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name}
                </span>
                <div style={{ flex: 1, height: 5, background: '#e9ecef', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, transition: 'width .3s',
                    background: u.status === 'error' ? '#e24b4a' : '#1a6ab0',
                    width: u.status === 'error' ? '100%' : `${u.progress}%`,
                  }} />
                </div>
                <span
                  title={u.status === 'error' ? (u.error || 'Upload failed') : undefined}
                  style={{ fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'right', color: u.status === 'error' ? '#e24b4a' : '#1a6ab0' }}
                >
                  {u.status === 'error' ? 'Error' : u.status === 'done' ? '✓' : `${u.progress}%`}
                </span>
              </div>
              {u.status === 'error' && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#e24b4a', lineHeight: 1.35 }}>
                  {u.error || 'Upload failed'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
