import React from 'react';
import { deleteFile } from '../lib/supabase';

const TYPE_CONFIG = {
  pdf:   { emoji: '📄', bg: '#fff3f3', badge: '#ffe4e4', badgeText: '#a32d2d', label: 'PDF' },
  image: { emoji: '🖼️', bg: '#f3f7ff', badge: '#e4eeff', badgeText: '#185FA5', label: 'Image' },
  video: { emoji: '🎬', bg: '#f3fff6', badge: '#e4fff2', badgeText: '#3B6D11', label: 'Video' },
};

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

export default function FileCard({ file, onDeleted, readonly = false }) {
  const cfg = TYPE_CONFIG[file.file_type] || TYPE_CONFIG.pdf;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await deleteFile(file.id, file.storage_path);
      if (onDeleted) onDeleted(file.id);
    } catch (err) {
      alert('Failed to delete file: ' + err.message);
    }
  }

  return (
    <div style={{
      border: '1px solid #e9ecef', borderRadius: 10, overflow: 'hidden',
      transition: 'border-color .2s, box-shadow .2s', background: '#fff',
      cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a6ab0'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,106,176,.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.boxShadow = 'none'; }}
      onClick={() => window.open(file.public_url, '_blank')}
    >
      <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg, fontSize: 34, position: 'relative' }}>
        {cfg.emoji}
        {!readonly && (
          <button onClick={handleDelete} style={{
            position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,.9)',
            border: '1px solid #e9ecef', borderRadius: 6, width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 11, color: '#e24b4a', opacity: 0,
            transition: 'opacity .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0}
            title="Delete file"
          >✕</button>
        )}
      </div>
      <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f3f5' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#343a40', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }} title={file.name}>
          {file.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .4, background: cfg.badge, color: cfg.badgeText }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 11, color: '#868e96' }}>{formatSize(file.size_bytes)}</span>
        </div>
      </div>
    </div>
  );
}
