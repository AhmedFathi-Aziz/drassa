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
    flowType: 'implicit',
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

export async function signUp({ username, fullName, email, password }) {
  const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName, role: 'user' },
      emailRedirectTo,
    },
  });
  if (error) throw error;
  return data;
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

export async function uploadFile(file, userId) {
  const storagePath = `${userId}/${Date.now()}_${file.name}`;

  // Determine file_type category
  let fileType = 'pdf';
  if (file.type.startsWith('image/')) fileType = 'image';
  else if (file.type.startsWith('video/')) fileType = 'video';

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('user-files')
    .upload(storagePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    const msg = uploadError?.message || String(uploadError);
    throw new Error(`Storage upload failed: ${msg}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('user-files')
    .getPublicUrl(storagePath);

  // Insert metadata into the files table
  const { data, error: dbError } = await supabase.from('files').insert({
    user_id: userId,
    name: file.name,
    file_type: fileType,
    mime_type: file.type,
    size_bytes: file.size,
    storage_path: storagePath,
    public_url: urlData.publicUrl,
  }).select().single();

  if (dbError) {
    const msg = dbError?.message || String(dbError);
    throw new Error(`DB insert failed: ${msg}`);
  }
  return data;
}

export async function deleteFile(fileId, storagePath) {
  await supabase.storage.from('user-files').remove([storagePath]);
  const { error } = await supabase.from('files').delete().eq('id', fileId);
  if (error) throw error;
}
