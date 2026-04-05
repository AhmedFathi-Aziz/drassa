/**
 * Vercel Serverless Function — creates Auth users with service role (never exposed to the browser).
 * Set in Vercel Project → Settings → Environment Variables:
 *   SUPABASE_URL (or reuse REACT_APP_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY  (Dashboard → Settings → API → service_role — server only!)
 *   SUPABASE_ANON_KEY (optional; same as REACT_APP_SUPABASE_ANON_KEY if you prefer one name)
 */
const { createClient } = require('@supabase/supabase-js');

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({
        error:
          'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them in Vercel → Environment Variables (not REACT_APP_* for the service role).',
      });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: prof, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profErr || prof?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = await readJsonBody(req);
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(body.password ?? '');
    const username = String(body.username ?? '').trim();
    const full_name = String(body.full_name ?? '').trim();
    const user_category = body.user_category === 'instructor' ? 'instructor' : 'lifeguard';

    if (!email || !password || password.length < 6 || !username || !full_name) {
      return res.status(400).json({
        error: 'Invalid input: email, username, full name, and password (min 6 characters) are required.',
      });
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name,
        role: 'user',
        user_category,
      },
    });

    if (createErr) {
      return res.status(400).json({ error: createErr.message });
    }

    return res.status(200).json({
      user: { id: created.user?.id, email: created.user?.email },
    });
  } catch (e) {
    console.error('create-user error:', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
};
