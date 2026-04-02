import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MarketingFooter from '../components/MarketingFooter';
import { useAuth } from '../lib/AuthContext';

const IMG_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBN0ybgDDGK2fe12djowC22fULy-PXUimX9vJ93ZbWNlRj8mYu-ieE5eJp3jndbweCokyItLNoi4o6_6jomepq4cBch4mH90cWl0a1L3d3wEuFjfSWjFdgrJQzU6UekxY0oOpsdTbzmu178Mv7P9e0FF5lYDWb1zuegnqv-V7IoDygOjrVRiHS-YQJUCSA7NrjsXLjwi_-vn9YJ5WH9ha5ex9sNwiqcImQa5WgViyXrE_Trz9T-l6i1h1BFJoT8xLtrUdxWRPjtpvxj';

const IMG_MISSION =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBRw-3Gqrhde3gD6cYLx_tKBRWQMjOSmq4iqSynFFP6_irWk9Wy0Rpfq9kURWzAWp9PckW-QWbTvRh1qcMxNizZ49_g7vSJCl4DQes4G4pD4EqzXX0dw-prfiF4TdSz1M6SIQDvv5XEqRQefrIPEWSodR3iygdOIpQc7XTaGDfnn7mQXB7NdE43rpwpaFsyqHJXgqDPZDFb5Dbbf0tEuM5RuzaHYOQAX6Js-B0aMDUJfl_RaCVd9Os1YALdC40rh8QL3r6lc2iecJPq';

const IMG_CTA =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuABMYeFdlcdFyrWeuoGO2qzaYJVQ6MBkNam_vcsvd6zcq7j-1c2YaksDs8cA-Ut_65tDLExH2c7Fr3ohOVs-EevOz1xoafcLl1MIUbU5DsLumwg-PHQx_d7BG9tlk0bE7hTKK2pK8-gmRvt-Z_u2sol4UPyPewgjPtBW9eQd_0pcaSsNMOzFxCb7q-cLNSLx0nhAuDlPKK2GUN0fb88F2rrSUFQiQ9MwKntYdsgKHAEHMI6U8HQRrLGzBW5cSWarhQhWPm5AE_EEQ3W';

export default function Home() {
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const hasSession = !!session?.user?.id;
  const dashboardPath = profile?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="bg-white font-body text-on-surface min-h-screen">
      <Navbar />

      <main className="pt-36">
        {/* Hero Section */}
        <section className="relative h-[870px] w-full overflow-hidden">
          <img
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            src={IMG_HERO}
          />
          <div className="absolute inset-0 hero-gradient flex items-center">
            <div className="editorial-spacing max-w-4xl">
              <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-primary leading-tight tracking-tight mb-6">
                DRASSA - EMRILL
              </h1>
              <p className="text-xl text-on-primary/90 max-w-xl mb-10 leading-relaxed font-light">
                Development and Research Academy for Sports Science Activities (DRASSA) is an academy specializing in the research and development of sports science activities,
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="px-10 py-4 bg-on-primary text-primary rounded-xl font-bold text-lg hover:bg-primary-fixed transition-colors"
                >
                  Request Access
                </button>
                <button
                  type="button"
                  onClick={() => navigate(hasSession ? dashboardPath : '/login')}
                  className="px-10 py-4 glass-panel border border-on-primary/20 text-on-primary rounded-xl font-bold text-lg hover:bg-on-primary/20 transition-colors"
                >
                  View Dashboard Demo
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-12 right-12 glass-panel p-6 rounded-full flex items-center gap-4 shadow-2xl max-w-[calc(100%-2rem)]">
            <div className="w-4 h-4 bg-tertiary rounded-full animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-label uppercase tracking-widest text-secondary font-semibold">Active Monitoring</p>
              <p className="text-primary font-bold">248 Guard Stations Live</p>
            </div>
          </div>
        </section>

        {/* Institutional Guardianship */}
        <section className="py-24 editorial-spacing bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            <div className="md:col-span-7">
              <span className="text-tertiary font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
                Institutional Guardianship
              </span>
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-8">
                Elevating Dubai’s Coastline Standards through Digital Integrity.
              </h2>
              <p className="text-lg text-secondary leading-loose mb-8">
                Our mission is to bridge the gap between physical surveillance and digital intelligence. In a city where
                luxury meets innovation, Drassa ensures that every private beach and hotel pool operates at the peak of
                international safety standards.
              </p>
              <div className="grid grid-cols-2 gap-8 border-l-2 border-outline-variant pl-8">
                <div>
                  <p className="text-3xl font-headline font-extrabold text-primary">99.9%</p>
                  <p className="text-sm font-medium text-secondary">Operational Readiness</p>
                </div>
                <div>
                  <p className="text-3xl font-headline font-extrabold text-primary">15s</p>
                  <p className="text-sm font-medium text-secondary">Incident Response Entry</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-5 relative">
              <div className="aspect-[4/5] rounded-full overflow-hidden shadow-2xl">
                <img alt="" className="w-full h-full object-cover" src={IMG_MISSION} />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-tertiary-fixed p-8 rounded-xl shadow-xl max-w-xs">
                <p className="text-on-tertiary-fixed italic font-medium leading-relaxed">
                  &ldquo;Data is the silent lifeguard that watches over our entire operation.&rdquo;
                </p>
                <p className="mt-4 text-xs font-bold text-on-tertiary-fixed-variant uppercase">
                  Director of Safety, Jumeirah Group
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Logos — fixed identical cells so every logo renders at the same size */}
        <section className="py-6 bg-white">
          <div className="editorial-spacing">
            <style>{`
              @keyframes logoFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
            `}</style>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 items-stretch">
              {[
                { src: '/logo-iwsf.webp', alt: 'I.W.S.F.' },
                { src: '/logo-medic-first-aid.png', alt: 'MEDIC First Aid' },
                { src: '/logo-american-lifeguard.png', alt: 'American Lifeguard Association' },
                { src: '/logo-emergency-first-response.webp', alt: 'Emergency First Response' },
                { src: '/logo-ambulance.png', alt: 'Ambulance' },
                { src: '/logo-eiac.png', alt: 'Emirates International Accreditation Center' },
              ].map((logo, idx) => (
                <div
                  key={logo.alt}
                  className="group flex w-full min-h-0 h-52 sm:h-60 md:h-72 items-center justify-center bg-transparent p-0"
                  style={{
                    animation: 'logoFloat 4.5s ease-in-out infinite',
                    animationDelay: `${idx * 0.15}s`,
                  }}
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="max-h-full w-full max-w-full object-contain opacity-100 transition-transform duration-200 group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 editorial-spacing">
          <div className="relative rounded-full overflow-hidden h-[500px] flex items-center justify-center text-center px-6">
            <img alt="" className="absolute inset-0 w-full h-full object-cover" src={IMG_CTA} />
            <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" />
            <div className="relative z-10 max-w-3xl px-2">
              <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-primary mb-8">
                Ready to secure your shoreline?
              </h2>
              <p className="text-xl text-on-primary/80 mb-12 font-light">
                Join Dubai&apos;s leading hotels in establishing the next generation of aquatic safety. Start your digital
                transformation today.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="px-12 py-5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-xl text-lg hover:shadow-lg transition-all"
                >
                  Onboard Your Hotel
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="px-12 py-5 border-2 border-on-primary text-on-primary font-bold rounded-xl text-lg hover:bg-on-primary hover:text-primary transition-all"
                >
                  Speak to an Advisor
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
