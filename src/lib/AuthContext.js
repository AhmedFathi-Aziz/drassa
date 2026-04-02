import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, getProfile, getProfileByEmail } from '../lib/supabase';

const AuthContext = createContext(null);

function buildFallbackProfile(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const email = user.email || '';
  const guessedName = (email.split('@')[0] || 'User').replace(/[._-]+/g, ' ');
  return {
    id: user.id,
    email,
    username: meta.username || (email.split('@')[0] || 'user'),
    full_name: meta.full_name || guessedName,
    role: meta.role || 'user',
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);
  const bootTimeoutRef = useRef(null);
  const hasProfileRef = useRef(false);

  useEffect(() => {
    hasProfileRef.current = !!profile;
  }, [profile]);

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
        if (session?.user?.id) fetchProfile(session.user);
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
        if (session?.user?.id) {
          // Token refresh can happen when tab focus changes; avoid unnecessary profile reloads.
          if (_event === 'TOKEN_REFRESHED' && hasProfileRef.current) {
            setLoading(false);
            return;
          }
          setLoading(true);
          await fetchProfile(session.user);
        }
        else { setProfile(null); setProfileError(''); setLoading(false); }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (bootTimeoutRef.current) clearTimeout(bootTimeoutRef.current);
    };
  }, []);

  async function fetchProfile(user) {
    const userId = user?.id;
    const email = user?.email;
    if (!userId) {
      setProfile(null);
      setProfileError('');
      setLoading(false);
      return;
    }

    try {
      setProfileError('');
      let p;
      try {
        p = await getProfile(userId);
      } catch (firstErr) {
        // Supabase projects can be slow on first request (cold start); retry once.
        await new Promise(resolve => setTimeout(resolve, 1200));
        try {
          p = await getProfile(userId);
        } catch (secondErr) {
          if (!email) throw secondErr;
          // Fallback: some environments may have profile row keyed differently; try by email.
          p = await getProfileByEmail(email);
        }
      }
      setProfile(p);
      setProfileError('');
    } catch (err) {
      // Preserve existing profile on transient failures (e.g. tab background throttling).
      // Only clear when we never had a profile yet.
      setProfile(prev => prev || buildFallbackProfile(user));
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
