import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { signOutSafe, supabase, getProfile, getProfileByEmail } from '../lib/supabase';

const AuthContext = createContext(null);

const PROFILE_FETCH_TIMEOUT_MS = 14_000;
const GET_SESSION_TIMEOUT_MS = 12_000;

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
  /** Same-uid profile fetch in flight — avoids duplicate parallel loads freezing UI state. */
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
    let active = true;

    withTimeout(supabase.auth.getSession(), GET_SESSION_TIMEOUT_MS, 'getSession')
      .then(({ data: { session: s } }) => {
        setLoading(false);
        if (!active) return;
        const validSession = s?.user?.id ? s : null;
        setSession(validSession);
        // Do not touch profileLoading here — it races with onAuthStateChange + fetchProfile and can
        // flip back to true after fetch completes, leaving routes stuck on the loading screen.
      })
      .catch((err) => {
        console.error('Failed to get session:', err);
        setLoading(false);
        if (!active) return;
        setProfileError(err?.message || 'Failed to get session');
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const validSession = session?.user?.id ? session : null;
      setLoading(false);
      if (!active) return;

      setSession(validSession);

      if (validSession?.user?.id) {
        await fetchProfile(validSession.user);
      } else {
        setProfile(null);
        setProfileError('');
        setProfileLoading(false);
        profileFetchPromisesRef.current.clear();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // If we have a session but never got a profile row and nothing is loading, recover (e.g. missed INITIAL_SESSION).
  useEffect(() => {
    if (!session?.user?.id || profile != null || profileLoading) return;
    fetchProfile(session.user);
  }, [session, profile, profileLoading, fetchProfile]);

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
