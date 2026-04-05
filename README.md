# DRASSA – Emrill Portal

A full-stack web portal for DRASSA – Emrill with user authentication, file uploads (PDFs, images, videos), personal dashboards, and an admin panel.

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | React 18 | Component-based UI |
| Routing | React Router v6 | Multi-page navigation |
| File Uploads | react-dropzone | Drag & drop support |
| Backend / Auth | Supabase | Auth + Database + Storage in one |
| Hosting | Vercel | Free, instant deploys from GitHub |

---

## Project Structure

```
drassa-portal/
├── api/
│   └── create-user.js      # Vercel serverless: admin creates users (service role on server)
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js         # Shared navigation bar
│   │   ├── DropZone.js       # Drag & drop file uploader
│   │   └── FileCard.js       # File display card
│   ├── lib/
│   │   ├── supabase.js       # Supabase client + all API functions
│   │   └── AuthContext.js    # React auth context (session management)
│   ├── pages/
│   │   ├── Home.js           # Landing page
│   │   ├── Login.js          # Login page (no public signup)
│   │   ├── UserDashboard.js  # User file manager
│   │   ├── AdminDashboard.js # Admin: user list (lifeguards / instructors)
│   │   ├── AdminAddUser.js   # Admin: create user accounts
│   │   └── AdminUserDetail.js# Admin: single user files
│   ├── App.js                # Routes + auth guards
│   ├── index.js              # Entry point
│   └── index.css             # Global styles
├── supabase_setup.sql        # ← Run this in Supabase SQL Editor (fresh DB)
├── supabase/migrations/      # ← Extra SQL for existing projects (user categories, etc.)
├── supabase/functions/       # ← Edge Function: admin-only user creation
├── .env.example              # ← Copy to .env and fill in your keys
└── package.json
```

---

## Setup Guide (Step by Step)

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**
3. Choose a name (e.g. `drassa-portal`), set a strong database password, pick a region close to you
4. Wait ~2 minutes for the project to be ready

### Step 2 — Run the Database Setup

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open the file `supabase_setup.sql` from this project
4. Copy the entire contents and paste it into the SQL Editor
5. Click **Run** (green button)

This creates:
- `profiles` table (user data)
- `files` table (file metadata)
- `user-files` storage bucket
- Row Level Security policies (users only see their own files)
- A trigger that auto-creates a profile when someone signs up

### Step 3 — Get Your Supabase Keys

1. In Supabase, go to **Project Settings → API**
2. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 4 — Configure Environment Variables

1. In the project folder, copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your keys:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 5 — Install and Run Locally

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6 — Create the first admin (no public signup)

Public self-registration is **disabled**. Create the first account in **Supabase Dashboard → Authentication → Users → Add user** (email + password). In **User metadata** set at least:

`{"username":"admin","full_name":"Administrator","role":"user"}`

The `handle_new_user` trigger creates the `profiles` row. Then promote to admin in **SQL Editor**:

```sql
UPDATE public.profiles SET role = 'admin' WHERE username = 'admin';
```

Log in at `/login`. Further staff accounts are created from **Admin → Add user**. On **Vercel**, add `SUPABASE_SERVICE_ROLE_KEY` (see Deploy section). Optionally you can use a Supabase Edge Function instead (`supabase/functions/create-user`).

---

## Deploy to Vercel (Free)

### Option A — Deploy via GitHub (Recommended)

1. Push this project to a GitHub repository
2. Go to [https://vercel.com](https://vercel.com) and sign up with GitHub
3. Click **New Project → Import** your GitHub repo
4. In the **Environment Variables** section, add:
   - `REACT_APP_SUPABASE_URL` → your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` → your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → **service_role** key from Supabase → Settings → API (used only by `api/create-user.js` on the server — never exposed to the browser). Required for **Admin → Add user** on the deployed site.
5. Click **Deploy** — done! Vercel gives you a live URL instantly.

After each env change, **Redeploy** so serverless functions pick up new variables.

### Option B — Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
# Follow the prompts, add env vars when asked
```

---

## Features

### For Users
- Accounts are created by an **admin** (lifeguard or instructor category); users log in with the email/username and password they were given
- Log in securely (Supabase Auth with JWT tokens)
- Drag & drop or browse to upload files
- Supported: PDF, JPG, PNG, WEBP, GIF, MP4, MOV, AVI, WEBM (up to 100MB each)
- View all uploaded files in a gallery grid
- Filter files by type (PDF / Image / Video)
- Delete their own files
- Click any file to open/preview it

### For Admins
- **Add user**: create accounts (email, username, password, category: lifeguard or instructor)
- **User list**: filter by **Lifeguards (منقذين)** / **Instructors (مدربين)** / all; file counts per user
- Open a user to view files and change their category
- Read-only view of user files on the admin detail page (cannot delete user files from there)

---

## How Auth Works

1. User signs up → Supabase creates an entry in `auth.users`
2. A database trigger automatically creates a matching `profiles` row
3. On login, Supabase returns a JWT session token stored in localStorage
4. `AuthContext.js` listens for session changes and provides `session` + `profile` to all components
5. React Router guards (`ProtectedRoute`, `GuestRoute`) redirect users based on their role

---

## How File Upload Works

1. User selects/drops files in `DropZone.js`
2. File is uploaded directly to **Supabase Storage** bucket `user-files`
3. File is stored at path: `{user_id}/{timestamp}_{filename}`
4. After upload, a record is inserted into the `files` table with metadata (name, type, size, public URL)
5. The file grid re-renders with the new file instantly

---

## Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only read/write their own `profiles` and `files` rows
- Admins have a special policy to read all profiles and files
- Storage is set to public read (so files can be previewed by URL) but only authenticated users can upload
- Files are organized per user by folder (`{user_id}/...`)

---

## Common Issues

| Problem | Solution |
|---|---|
| "Missing Supabase environment variables" | Make sure `.env` file exists and has both keys |
| Public signup removed | Only admins create users via **Admin → Add user** |
| “Add user” on Vercel fails | Add `SUPABASE_SERVICE_ROLE_KEY` in Vercel env and redeploy; ensure `api/create-user.js` is in the repo |
| “Add user” on localhost only | Either run `vercel dev` (serves `/api`) or deploy Supabase Edge Function `create-user` |
| Edge Function / fetch errors | Apply SQL migration for `user_category`; optional: `supabase functions deploy create-user` |
| Profile missing `user_category` column | Run `supabase/migrations/20260205120000_user_category_admin_policies.sql` in SQL Editor |
| Files upload but don't appear | Check the `files` table RLS policy in Supabase |
| Admin panel not showing | Run the SQL `UPDATE profiles SET role = 'admin'` command |
| Vercel deploy fails | Make sure env vars are set in Vercel dashboard |

---

## Support

For Supabase questions: [https://supabase.com/docs](https://supabase.com/docs)  
For Vercel questions: [https://vercel.com/docs](https://vercel.com/docs)
