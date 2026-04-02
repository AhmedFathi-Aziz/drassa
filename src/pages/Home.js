import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <Navbar />

      <section style={{
        position: 'relative',
        minHeight: 420,
        backgroundImage: 'linear-gradient(rgba(12,17,24,.55),rgba(12,17,24,.55)), url("https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1600&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '42px 28px',
      }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,.86)', padding: '26px 28px', border: '1px solid rgba(255,255,255,.3)' }}>
              <h1 style={{ fontSize: 54, color: '#fff', margin: 0, fontWeight: 700, letterSpacing: .2 }}>
                <span style={{ color: '#fff', mixBlendMode: 'normal' }}>DRASSA - EMRILL</span>
              </h1>
            </div>
            <div style={{ background: 'rgba(255,255,255,.86)', padding: '18px 20px', border: '1px solid rgba(255,255,255,.3)' }}>
              <p style={{ margin: 0, fontSize: 31, lineHeight: 1.4, color: '#111' }}>
                Development and Research Academy for Sports Science Activities (DRASSA)
              </p>
            </div>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/signup')} style={{ padding: '11px 22px', borderRadius: 20, border: 'none', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Sign Up</button>
            <button onClick={() => navigate('/login')} style={{ padding: '11px 22px', borderRadius: 20, border: '1px solid #fff', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Login</button>
          </div>
        </div>
      </section>

      <section style={{ background: '#05070b', color: '#fff', padding: '46px 28px 56px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <h2 style={{ margin: 0, fontSize: 38, letterSpacing: 1.5 }}>VISION</h2>
          <p style={{ marginTop: 20, fontSize: 37, lineHeight: 1.5, maxWidth: 960, color: 'rgba(255,255,255,.94)' }}>
            To be a scientific reference for the development of sports and athletes according to the latest international standards.
          </p>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 360 }}>
        <div style={{ background: '#1a8fe0', display: 'flex', alignItems: 'center', padding: '40px 46px' }}>
          <p style={{ color: '#fff', fontSize: 40, lineHeight: 1.6, fontWeight: 600, maxWidth: 540 }}>
            This is the space to introduce visitors to the business or brand. Briefly explain who's behind it, what it does and what makes it unique.
          </p>
        </div>
        <div style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      </section>

      <section style={{ padding: '30px 28px 38px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 20 }}>
          {['I.W.S.F.', 'MEDIC FIRST AID', 'AMERICAN LIFEGUARD', 'EMERGENCY FIRST RESPONSE', 'AMBULANCE'].map((name) => (
            <div key={name} style={{ border: '1px solid #e3e7ec', borderRadius: 10, padding: '16px 10px', textAlign: 'center', fontWeight: 700, color: '#1d4f89', fontSize: 15 }}>
              {name}
            </div>
          ))}
        </div>
      </section>

      <footer style={{ background: '#1e2a36', color: 'rgba(255,255,255,.5)', textAlign: 'center', padding: '24px', fontSize: 12 }}>
        © 2025 DRASSA – Emrill Portal. All rights reserved. | Drassa Academy for Safety Aquatics
      </footer>
    </div>
  );
}
