import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg,#0d2d52 0%,#1a6ab0 60%,#2d8ae0 100%)',
        minHeight: 400, display: 'flex', alignItems: 'center', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: .06,
          backgroundImage: 'repeating-linear-gradient(45deg,white 0,white 1px,transparent 0,transparent 50%)',
          backgroundSize: '24px 24px',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '64px 80px', maxWidth: 640 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,.7)', marginBottom: 16, fontWeight: 500, textTransform: 'uppercase' }}>
            Development & Research Academy for Sports Science
          </div>
          <h1 style={{ fontSize: 54, fontWeight: 700, color: '#fff', lineHeight: 1.05, letterSpacing: -1, marginBottom: 16 }}>
            DRASSA – EMRILL
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.8)', lineHeight: 1.7, marginBottom: 32, fontWeight: 300, maxWidth: 480 }}>
            A scientific reference for the development of sports and athletes according to the latest international standards.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/signup')} style={{
              padding: '13px 28px', background: '#fff', color: '#0d4a8a', border: 'none',
              borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Get Started</button>
            <button onClick={() => navigate('/login')} style={{
              padding: '13px 28px', background: 'transparent', color: '#fff',
              border: '1.5px solid rgba(255,255,255,.5)', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>Sign In</button>
          </div>
        </div>
      </div>

      {/* Services */}
      <div style={{ padding: '56px 80px', flex: 1 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#343a40', marginBottom: 4 }}>Our Services</h2>
        <p style={{ fontSize: 14, color: '#868e96', marginBottom: 32 }}>Everything you need in one secure portal</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
          {[
            { icon: '📁', title: 'Secure File Upload', desc: 'Upload PDFs, images, and videos with drag-and-drop simplicity.' },
            { icon: '👥', title: 'User Management', desc: 'Admin panel to manage all registered users and their data.' },
            { icon: '🖥️', title: 'Personal Dashboard', desc: 'Each user gets their own private space to manage uploads.' },
            { icon: '🔒', title: 'Secure & Private', desc: 'Files are private. Only you and authorized admins can access your data.' },
          ].map(card => (
            <div key={card.title} style={{
              background: '#fff', border: '1px solid #e9ecef', borderRadius: 14, padding: '28px 24px',
              transition: 'border-color .2s, box-shadow .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a6ab0'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(26,106,176,.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 14 }}>{card.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#343a40', marginBottom: 8 }}>{card.title}</div>
              <div style={{ fontSize: 13, color: '#868e96', lineHeight: 1.6 }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: '#1e2a36', color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '24px', fontSize: 12 }}>
        © 2025 DRASSA – Emrill Portal. All rights reserved. | Drassa Academy for Safety Aquatics
      </footer>
    </div>
  );
}
