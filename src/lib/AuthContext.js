import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, getProfile } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);
  const bootTimeoutRef = useRef(null);

  useEffect(() => {
    // React 18 StrictMode runs effects twice in dev; Supabase auth uses a navigator lock.
    // Guard to avoid concurrent auth calls/subscriptions that can spam "lock ... stole it" errors.
    if (didInit.current) return;
    didInit.current = true;

    // Absolute guard: never keep app in auth loading forever.
    bootTimeoutRef.current = setTimeout(() => {
      setProfileError(prev => prev || 'Auth bootstrap timed out');
      setLoading(false);
    }, 12000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) fetchProfile(session.user.id);
        else setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setProfileError(err?.message || 'Failed to get session');
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          setLoading(true);
          await fetchProfile(session.user.id);
        }
        else { setProfile(null); setProfileError(''); setLoading(false); }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (bootTimeoutRef.current) clearTimeout(bootTimeoutRef.current);
    };
  }, []);

  async function fetchProfile(userId) {
    try {
      setProfileError('');
      const p = await Promise.race([
        getProfile(userId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile request timed out')), 8000)),
      ]);
      setProfile(p);
    } catch (err) {
      setProfile(null);
      setProfileError(err?.message || 'Failed to load profile');
      console.error('Failed to fetch profile:', err);
    } finally {
      if (bootTimeoutRef.current) {
        clearTimeout(bootTimeoutRef.current);
        bootTimeoutRef.current = null;
      }
      setLoading(false);
    }
  }

  const value = { session, profile, profileError, loading, isAdmin: profile?.role === 'admin' };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
