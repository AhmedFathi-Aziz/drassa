import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { signOutSafe, supabase, getProfile, getProfileByEmail } from '../lib/supabase';

const AuthContext = createContext(null);

const PROFILE_FETCH_TIMEOUT_MS = 14_000;
const GET_SESSION_TIMEOUT_MS = 15_000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms)
    ),
  ]);
}

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
    user_category: meta.user_category === 'instructor' ? 'instructor' : 'lifeguard',
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef(null);
  const profileFetchPromisesRef = useRef(new Map());

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfileImpl = useCallback(async (user) => {
    const userId = user?.id;
    const email = user?.email;
    if (!userId) {
      setProfile(null);
      setProfileError('');
      setProfileLoading(false);
      return;
    }

    const alreadyHaveUser = profileRef.current?.id === userId;
    if (!alreadyHaveUser) {
      setProfileLoading(true);
    }

    try {
      setProfileError('');
      let p;
      try {
        p = await withTimeout(getProfile(userId), PROFILE_FETCH_TIMEOUT_MS, 'Profile fetch');
      } catch (firstErr) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        try {
          p = await withTimeout(getProfile(userId), PROFILE_FETCH_TIMEOUT_MS, 'Profile fetch (retry)');
        } catch (secondErr) {
          if (!email) throw secondErr;
          p = await withTimeout(
            getProfileByEmail(email),
            PROFILE_FETCH_TIMEOUT_MS,
            'Profile fetch by email'
          );
        }
      }
      setProfile(p);
      setProfileError('');
    } catch (err) {
      setProfile((prev) => prev || buildFallbackProfile(user));
      setProfileError(err?.message || 'Failed to load profile');
      console.error('Failed to fetch profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(
    async (user) => {
      const uid = user?.id;
      if (!uid) {
        await fetchProfileImpl(user);
        return;
      }
      const existing = profileFetchPromisesRef.current.get(uid);
      if (existing) {
        await existing;
        return;
      }
      const p = fetchProfileImpl(user).finally(() => {
        profileFetchPromisesRef.current.delete(uid);
      });
      profileFetchPromisesRef.current.set(uid, p);
      await p;
    },
    [fetchProfileImpl]
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          GET_SESSION_TIMEOUT_MS,
          'getSession'
        );
        // Always unblock the router — even if this effect was superseded (Strict Mode), a later boot runs too.
        setLoading(false);

        if (cancelled) return;

        const sessionRow = data?.session;
        const validSession = sessionRow?.user?.id && !error ? sessionRow : null;
        setSession(validSession);

        if (validSession?.user) {
          await fetchProfile(validSession.user);
        } else {
          setProfile(null);
          setProfileError('');
          setProfileLoading(false);
        }
      } catch (err) {
        console.error('Auth boot failed:', err);
        setLoading(false);
        if (!cancelled) {
          setSession(null);
          setProfile(null);
          setProfileError(err?.message || 'Session could not be restored');
          setProfileLoading(false);
        }
      }
    }

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setLoading(false);

      // First paint + refresh: handled exclusively by boot() so Strict Mode / listener order cannot skip profile load.
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (cancelled) return;

      const valid = newSession?.user?.id ? newSession : null;
      setSession(valid);

      if (valid?.user) {
        await fetchProfile(valid.user);
      } else {
        setProfile(null);
        setProfileError('');
        setProfileLoading(false);
        profileFetchPromisesRef.current.clear();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  async function logout() {
    setSession(null);
    setProfile(null);
    setProfileError('');
    setProfileLoading(false);
    setLoading(false);
    profileFetchPromisesRef.current.clear();
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
