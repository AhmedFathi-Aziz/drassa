import React, { createContext, useContext, useState, useCallback } from 'react';

const CacheContext = createContext(null);

/**
 * Cache provider for session-scoped data like admin user lists.
 * Caches are cleared on logout to prevent stale data in multi-tab scenarios.
 */
export function CacheProvider({ children }) {
  const [adminListCache, setAdminListCache] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes

  const getAdminListCache = useCallback(() => {
    if (!adminListCache || !cacheTimestamp) return null;
    const age = Date.now() - cacheTimestamp;
    if (age > CACHE_DURATION_MS) {
      setAdminListCache(null);
      setCacheTimestamp(null);
      return null;
    }
    return adminListCache;
  }, [adminListCache, cacheTimestamp]);

  const setAdminListCacheData = useCallback((data) => {
    setAdminListCache(data);
    setCacheTimestamp(Date.now());
  }, []);

  const invalidateAdminListCache = useCallback(() => {
    setAdminListCache(null);
    setCacheTimestamp(null);
  }, []);

  const clearAllCaches = useCallback(() => {
    setAdminListCache(null);
    setCacheTimestamp(null);
  }, []);

  const value = {
    getAdminListCache,
    setAdminListCache: setAdminListCacheData,
    invalidateAdminListCache,
    clearAllCaches,
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

export function useCache() {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within CacheProvider');
  }
  return context;
}
