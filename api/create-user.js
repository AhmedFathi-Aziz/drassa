/**
 * Vercel Serverless Function — creates Auth users with service role (never exposed to the browser).
 * Set in Vercel: SUPABASE_SERVICE_ROLE_KEY (+ URL via REACT_APP_SUPABASE_URL or SUPABASE_URL).
 */
const { createClient } = require('@supabase/supabase-js');

/**
 * Vercel may pre-parse JSON into req.body; raw streams may never emit `end` if mishandled — avoid hanging forever.
 */
function readJsonBody(req) {
  const b = req.body;
  if (b != null && typeof b === 'object' && !Buffer.isBuffer(b)) {
    return Promise.resolve(b);
  }
  if (typeof b === 'string') {
    try {
      return Promise.resolve(b ? JSON.parse(b) : {});
    } catch {
      return Promise.resolve({});
    }
  }
  if (Buffer.isBuffer(b)) {
    try {
      const s = b.toString('utf8');
      return Promise.resolve(s ? JSON.parse(s) : {});
    } catch {
      return Promise.resolve({});
    }
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    const t = setTimeout(() => {
      reject(new Error('Request body read timed out'));
    }, 15000);
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      clearTimeout(t);
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
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
          'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them in Vercel → Environment Variables.',
      });
    }

    const body = await readJsonBody(req);

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
