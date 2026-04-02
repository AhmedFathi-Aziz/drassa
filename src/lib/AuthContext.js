import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { signOutSafe, supabase, getProfile, getProfileByEmail } from '../lib/supabase';

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
  /** True while resolving the profiles row for the current session (gates role-based routes). */
  const [profileLoading, setProfileLoading] = useState(false);
  // "loading" should only block routing until we know session exists or not.
  // Profile loading can be slow/stall (network, cold start) and must not freeze the app.
  const [loading, setLoading] = useState(true);
  const didInit = useRef(false);
  const hasProfileRef = useRef(false);

  useEffect(() => {
    hasProfileRef.current = !!profile;
  }, [profile]);

  useEffect(() => {
    // React 18 StrictMode runs effects twice in dev; Supabase auth uses a navigator lock.
    // Guard to avoid concurrent auth calls/subscriptions that can spam "lock ... stole it" errors.
    if (didInit.current) return;
    didInit.current = true;

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        const validSession = session?.user?.id ? session : null;
        setSession(validSession);
        // Session is known now; unblock routing immediately.
        setLoading(false);
        if (validSession?.user?.id) fetchProfile(validSession.user);
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setProfileError(err?.message || 'Failed to get session');
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const validSession = session?.user?.id ? session : null;
        setSession(validSession);
        // Unblock routing immediately on auth event; profile refresh happens in background.
        setLoading(false);
        if (validSession?.user?.id) {
          // Token refresh can happen when tab focus changes; avoid unnecessary profile reloads.
          if (_event === 'TOKEN_REFRESHED' && hasProfileRef.current) {
            return;
          }
          await fetchProfile(validSession.user);
        }
        else {
          setProfile(null);
          setProfileError('');
          setProfileLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(user) {
    const userId = user?.id;
    const email = user?.email;
    if (!userId) {
      setProfile(null);
      setProfileError('');
      setProfileLoading(false);
      setLoading(false);
      return;
    }

    setProfileLoading(true);
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
      setProfileLoading(false);
    }
  }

  async function logout() {
    // Optimistically clear UI state immediately, then sign out in background.
    setSession(null);
    setProfile(null);
    setProfileError('');
    setProfileLoading(false);
    setLoading(false);
    signOutSafe({ scope: 'local' }).catch(() => {});
  }

  const value = {
    session,
    profile,
    profileError,
    loading,
    profileLoading,
    isAdmin: profile?.role === 'admin',
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
