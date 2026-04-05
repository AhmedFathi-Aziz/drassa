import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE is the recommended browser flow; implicit + refresh was prone to stuck session recovery.
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

function getAuthStorageKeyPrefix() {
  try {
    const host = new URL(supabaseUrl).hostname; // <ref>.supabase.co
    const ref = host.split('.')[0];
    return `sb-${ref}`;
  } catch {
    return 'sb-';
  }
}

export function clearLocalAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    const prefix = getAuthStorageKeyPrefix();
    // Known keys used by supabase-js; remove any matching prefix just in case.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

// ---- Auth helpers ----
// Public self-signup is disabled. Admins create users via:
// - Production (Vercel): POST /api/create-user (serverless, uses SUPABASE_SERVICE_ROLE_KEY on server only)
// - Optional: Supabase Edge Function `create-user` (e.g. local dev without Vercel API)

export const USER_CATEGORIES = {
  lifeguard: 'lifeguard',
  instructor: 'instructor',
};

function explainEdgeFunctionFailure(message) {
  const base = message || 'Edge Function request failed';
  if (/failed to send|fetch|network|edge function/i.test(base)) {
    return `${base}

(على Vercel) تأكد إن ملف api/create-user.js موجود في المشروع وأضفت في Vercel → Environment Variables:
SUPABASE_SERVICE_ROLE_KEY و SUPABASE_URL (أو REACT_APP_SUPABASE_URL)

(بدون Vercel) انشر Edge Function: supabase functions deploy create-user`;
  }
  return base;
}

async function invokeEdgeFunctionCreateUser(body) {
  const { data, error } = await supabase.functions.invoke('create-user', { body });
  if (error) {
    throw new Error(explainEdgeFunctionFailure(error.message));
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

/**
 * Admin-only: creates auth user + profile (via DB trigger on auth.users).
 * @param {{ email: string, password: string, username: string, full_name: string, user_category?: 'lifeguard'|'instructor' }} payload
 */
export async function adminCreateUser(payload) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in as admin.');
  }

  const body = {
    email: payload.email,
    password: payload.password,
    username: payload.username,
    full_name: payload.full_name,
    user_category: payload.user_category ?? USER_CATEGORIES.lifeguard,
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const controller = new AbortController();
  const timeoutMs = 45000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${origin}/api/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      if (!res.ok) {
        throw new Error(text?.slice(0, 200) || `Server error (${res.status})`);
      }
    }

    if (res.ok) {
      if (json.error) throw new Error(json.error);
      return json;
    }

    if (res.status === 404 && isLocalhost) {
      return invokeEdgeFunctionCreateUser(body);
    }

    throw new Error(json.error || `Request failed (${res.status})`);
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s. Check Vercel logs, SUPABASE_SERVICE_ROLE_KEY, and redeploy with api/create-user.js.`
      );
    }
    if (isLocalhost && e && (/failed to fetch|networkerror|load failed/i.test(String(e.message)) || e.name === 'TypeError')) {
      return invokeEdgeFunctionCreateUser(body);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Admin-only: update lifeguard / instructor classification (RLS: admin policy). */
export async function adminUpdateUserCategory(userId, userCategory) {
  const cat = userCategory === USER_CATEGORIES.instructor ? USER_CATEGORIES.instructor : USER_CATEGORIES.lifeguard;
  const { error } = await supabase.from('profiles').update({ user_category: cat }).eq('id', userId);
  if (error) throw error;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sends password reset email. Add /reset-password to Supabase Redirect URLs. */
export async function requestPasswordReset(email) {
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) throw error;
}

export async function signOut(options = { scope: 'local' }) {
  // "local" clears the session for this device only and avoids extra edge cases in dev.
  const { error } = await supabase.auth.signOut(options);
  // Even if Supabase returns an error, ensure local tokens are cleared.
  clearLocalAuthStorage();
  if (error) throw error;
}

export async function signOutSafe(options = { scope: 'local' }) {
  // Some browsers/tabs can cause auth signOut() to hang (navigator lock). Never block UI on it.
  try {
    await Promise.race([
      signOut(options),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    // ignore
  } finally {
    clearLocalAuthStorage();
  }
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ---- Profile helpers ----

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getProfileByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllProfiles() {
  // Use an admin RPC (security definer) to avoid fragile RLS recursion/policy issues.
  const { data, error } = await supabase.rpc('admin_list_user_profiles');
  if (!error) return data;

  // Fallback for older DB setups that don't have the RPC yet.
  const fallback = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'user')
    .order('created_at', { ascending: false });

  if (fallback.error) throw fallback.error;
  return fallback.data;
}

// ---- File helpers ----

export async function getUserFiles(userId) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getFilesForUser(userId) {
  const { data, error } = await supabase.rpc('admin_list_files_for_user', { target_user_id: userId });
  if (!error) return data || [];
  return getUserFiles(userId);
}

export async function getAdminUserFileCounts() {
  const { data, error } = await supabase.rpc('admin_user_file_counts');
  if (!error) return data || [];

  // Fallback for older DB setups without RPC.
  const { data: files, error: fallbackError } = await supabase
    .from('files')
    .select('user_id');
  if (fallbackError) throw fallbackError;

  const counts = {};
  for (const f of files || []) counts[f.user_id] = (counts[f.user_id] || 0) + 1;
  return Object.entries(counts).map(([user_id, total]) => ({ user_id, total }));
}

export async function getAdminUserProfile(userId) {
  const { data, error } = await supabase.rpc('admin_get_user_profile', { target_user_id: userId });
  if (!error) return data || null;
  return getProfile(userId);
}

async function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms)
    ),
  ]);
}

export async function uploadFile(file, userId) {
  const storagePath = `${userId}/${Date.now()}_${file.name}`;

  // Determine file_type category
  let fileType = 'pdf';
  if (file.type.startsWith('image/')) fileType = 'image';
  else if (file.type.startsWith('video/')) fileType = 'video';

  // Upload to Supabase Storage
  const { error: uploadError } = await withTimeout(
    supabase.storage
      .from('user-files')
      .upload(storagePath, file, { cacheControl: '3600', upsert: false }),
    30000,
    'Storage upload'
  );

  if (uploadError) {
    const msg = uploadError?.message || String(uploadError);
    throw new Error(`Storage upload failed: ${msg}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('user-files')
    .getPublicUrl(storagePath);

  // Insert metadata into the files table
  const { data, error: dbError } = await withTimeout(
    supabase
      .from('files')
      .insert({
        user_id: userId,
        name: file.name,
        file_type: fileType,
        mime_type: file.type,
        size_bytes: file.size,
        storage_path: storagePath,
        public_url: urlData.publicUrl,
      })
      .select()
      .single(),
    30000,
    'DB insert'
  );

  if (dbError) {
    const msg = dbError?.message || String(dbError);
    throw new Error(`DB insert failed: ${msg}`);
  }
  return data;
}

/**
 * Delete a file from DB and storage.
 * Deletes DB record first to prevent orphaned storage files if DB delete fails.
 * Storage cleanup is best-effort and won't fail the operation.
 */
export async function deleteFile(fileId, storagePath) {
  // Delete from DB first (critical: prevents orphaned files if this fails)
  const { error: dbError } = await supabase.from('files').delete().eq('id', fileId);
  if (dbError) throw new Error(`Failed to delete file record: ${dbError.message}`);

  // Then cleanup storage (best-effort; don't fail the operation if this fails)
  try {
    await supabase.storage.from('user-files').remove([storagePath]);
  } catch (storageErr) {
    console.warn(`Storage cleanup warning for ${storagePath}: ${storageErr?.message || String(storageErr)}`);
    // Don't re-throw; file record is already deleted from DB
  }
}

// ---- In-service training (sessions, lesson plans, attendance) ----

export async function listInServiceSessions() {
  const { data, error } = await supabase
    .from('in_service_sessions')
    .select('*')
    .order('session_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getInServiceSession(id) {
  const { data, error } = await supabase.from('in_service_sessions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * @param {{ title: string, description?: string|null, session_at: string, location?: string|null, duration_minutes?: number|null }} payload
 */
export async function createInServiceSession(payload) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  let durationMinutes = null;
  if (payload.duration_minutes != null && payload.duration_minutes !== '') {
    const n = Number(payload.duration_minutes);
    if (Number.isFinite(n)) durationMinutes = n;
  }

  const { data, error } = await supabase
    .from('in_service_sessions')
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      session_at: payload.session_at,
      location: payload.location?.trim() || null,
      duration_minutes: durationMinutes,
      created_by: uid,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInServiceSession(id) {
  const { error } = await supabase.from('in_service_sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function listLessonPlans() {
  const { data, error } = await supabase
    .from('lesson_plans')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * @param {File} file
 * @param {{ title: string, description?: string|null }} meta
 */
export async function uploadLessonPlan(file, meta) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user?.id) {
    throw new Error(userErr?.message || 'You must be signed in.');
  }
  const uid = userData.user.id;

  const safeName = (file.name || 'file').replace(/[^\w.-]+/g, '_');
  const storagePath = `${uid}/${Date.now()}_${safeName}`;

  const uploadPayload = supabase.storage
    .from('lesson-plans')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

  let uploadError;
  try {
    const { error } = await withTimeout(uploadPayload, 45000, 'Lesson plan storage upload');
    uploadError = error;
  } catch (timeoutErr) {
    throw new Error(
      `${timeoutErr?.message || 'Upload timed out'}. Check Supabase → Storage: bucket "lesson-plans" exists and insert policies from the migration are applied.`
    );
  }

  if (uploadError) {
    const msg = uploadError.message || String(uploadError);
    const hint =
      /bucket|not found|row-level security|policy|permission/i.test(msg)
        ? ' In Dashboard → Storage, create bucket "lesson-plans" (public) and run storage policies from supabase/migrations/20260405120000_in_service_training.sql.'
        : '';
    throw new Error(`Storage upload failed: ${msg}.${hint}`);
  }

  const { data: urlData } = supabase.storage.from('lesson-plans').getPublicUrl(storagePath);

  const insertPayload = supabase
    .from('lesson_plans')
    .insert({
      title: meta.title.trim(),
      description: meta.description?.trim() || null,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
      uploaded_by: uid,
    })
    .select()
    .single();

  let data;
  let error;
  try {
    const result = await withTimeout(insertPayload, 30000, 'Lesson plan database save');
    data = result.data;
    error = result.error;
  } catch (timeoutErr) {
    await supabase.storage.from('lesson-plans').remove([storagePath]).catch(() => {});
    throw new Error(timeoutErr?.message || 'Saving lesson plan metadata timed out.');
  }

  if (error) {
    await supabase.storage.from('lesson-plans').remove([storagePath]).catch(() => {});
    throw new Error(error.message || String(error));
  }
  return data;
}

export async function deleteLessonPlan(row) {
  if (row?.storage_path) {
    await supabase.storage.from('lesson-plans').remove([row.storage_path]);
  }
  const { error } = await supabase.from('lesson_plans').delete().eq('id', row.id);
  if (error) throw error;
}

export async function listAttendanceForSession(sessionId) {
  const { data, error } = await supabase
    .from('in_service_attendance')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return data || [];
}

/**
 * @param {string} sessionId
 * @param {{ user_id: string, attended: boolean, notes?: string|null }[]} rows
 */
export async function saveSessionAttendance(sessionId, rows) {
  const payload = rows.map((r) => ({
    session_id: sessionId,
    user_id: r.user_id,
    attended: !!r.attended,
    notes: r.notes?.trim() || null,
  }));
  const { error } = await supabase.from('in_service_attendance').upsert(payload, {
    onConflict: 'session_id,user_id',
  });
  if (error) throw error;
}

/** Admin-only RLS: full attendance export for reports. */
export async function listAllInServiceAttendance() {
  const { data, error } = await supabase.from('in_service_attendance').select('*');
  if (error) throw error;
  return data || [];
}

// ---- Safety events (rescues & incidents) ----

export const SAFETY_EVENT_TYPES = {
  rescue: 'rescue',
  incident: 'incident',
  near_miss: 'near_miss',
  medical: 'medical',
  other: 'other',
};

export const SAFETY_SEVERITY = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

export async function listSafetyEvents() {
  const { data, error } = await supabase
    .from('safety_events')
    .select('*')
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * @param {{
 *   title: string,
 *   event_type: keyof typeof SAFETY_EVENT_TYPES,
 *   severity?: keyof typeof SAFETY_SEVERITY | null,
 *   description?: string|null,
 *   location?: string|null,
 *   occurred_at: string,
 *   actions_taken?: string|null,
 *   reporter_display?: string|null,
 * }} payload
 */
export async function createSafetyEvent(payload) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user?.id) {
    throw new Error(userErr?.message || 'You must be signed in.');
  }
  const uid = userData.user.id;

  const { data, error } = await supabase
    .from('safety_events')
    .insert({
      title: payload.title.trim(),
      event_type: payload.event_type,
      severity: payload.severity || null,
      description: payload.description?.trim() || null,
      location: payload.location?.trim() || null,
      occurred_at: payload.occurred_at,
      actions_taken: payload.actions_taken?.trim() || null,
      reporter_display: payload.reporter_display?.trim() || null,
      created_by: uid,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSafetyEvent(id) {
  const { error } = await supabase.from('safety_events').delete().eq('id', id);
  if (error) throw error;
}

// ---- Audit logging ----

/**
 * Get audit logs (all for admins, own for regular users).
 * @param {object} opts - { limit?: number, offset?: number, action?: string, tableName?: string }
 */
export async function getAuditLogs(opts = {}) {
  const { limit = 50, offset = 0, action, tableName } = opts;
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq('action', action);
  }
  if (tableName) {
    query = query.eq('table_name', tableName);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Get audit logs for a specific record (all changes to that record).
 */
export async function getRecordAuditLog(tableName, recordId) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Get audit logs for a specific user (actions performed by a user).
 */
export async function getUserAuditLog(userId, opts = {}) {
  const { limit = 50, offset = 0 } = opts;
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

/**
 * Count total audit logs (for pagination).
 */
export async function countAuditLogs(action, tableName) {
  let query = supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true });
  
  if (action) {
    query = query.eq('action', action);
  }
  if (tableName) {
    query = query.eq('table_name', tableName);
  }
  
  const { count, error } = await query;
  if (error) throw new Error(`Failed to count audit logs: ${error.message}`);
  return count || 0;
}

