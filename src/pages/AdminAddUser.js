import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { adminCreateUser, USER_CATEGORIES } from '../lib/supabase';
import { invalidateAdminListCache } from '../lib/adminListCache';

const LABELS = {
  [USER_CATEGORIES.lifeguard]: 'Lifeguard (منقذ)',
  [USER_CATEGORIES.instructor]: 'Instructor (مدرب)',
};

export default function AdminAddUser() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState(USER_CATEGORIES.lifeguard);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await adminCreateUser({
        email: email.trim(),
        password,
        username: username.trim(),
        full_name: fullName.trim(),
        user_category: category,
      });
      invalidateAdminListCache();
      setSuccess('User created. Share the email, username, and password with them so they can sign in.');
      setTimeout(() => navigate('/admin'), 1800);
    } catch (err) {
      setError(err?.message || 'Could not create user. Deploy the create-user Edge Function if you see a function error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout activeNav="add">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          Add user
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary">
          Create an account for a lifeguard or instructor. Give them their username and password so they can log in from
          the login page — public registration is disabled.
        </p>
      </header>

      <div className="max-w-lg rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-sm sm:p-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-error">{error}</div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Full name
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/60 px-3 py-2.5 text-sm outline-none focus:border-[#1a6ab0]"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Username
            </label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/60 px-3 py-2.5 text-sm outline-none focus:border-[#1a6ab0]"
              placeholder="Unique username"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Email
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/60 px-3 py-2.5 text-sm outline-none focus:border-[#1a6ab0]"
              placeholder="user@example.com"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Initial password
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/60 px-3 py-2.5 text-sm outline-none focus:border-[#1a6ab0]"
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-secondary">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/60 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1a6ab0]"
            >
              <option value={USER_CATEGORIES.lifeguard}>{LABELS[USER_CATEGORIES.lifeguard]}</option>
              <option value={USER_CATEGORIES.instructor}>{LABELS[USER_CATEGORIES.instructor]}</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#1a6ab0] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create user'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="rounded-xl border border-outline-variant/60 bg-white px-5 py-2.5 text-sm font-medium text-secondary hover:bg-surface-bright"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
