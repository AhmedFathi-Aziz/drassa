/** In-memory cache for admin user list; invalidate after creating/updating users. */
let adminListCache = null;

export function getAdminListCache() {
  return adminListCache;
}

export function setAdminListCache(data) {
  adminListCache = data;
}

export function invalidateAdminListCache() {
  adminListCache = null;
}
