-- ============================================================
-- DRASSA - EMRILL PORTAL: Supabase Database Setup
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- 1. PROFILES TABLE
-- Extends the built-in auth.users table with extra fields
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Allow users to read their own profile; admins can read all
alter table public.profiles enable row level security;

-- Non-recursive admin check for RLS policies
-- Avoids "infinite recursion detected in policy for relation profiles"
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Bypass RLS for the internal check
  set local row_security = off;
  return exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
end;
$$;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin-only RPC to list all non-admin users without relying on caller RLS state
create or replace function public.admin_list_user_profiles()
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  set local row_security = off;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Forbidden';
  end if;

  return query
  select *
  from public.profiles
  where role = 'user'
  order by created_at desc;
end;
$$;

grant execute on function public.admin_list_user_profiles() to authenticated;

-- 2. FILES TABLE
-- Stores metadata for every uploaded file
create table public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  file_type text not null check (file_type in ('pdf', 'image', 'video')),
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz default now()
);

alter table public.files enable row level security;

create policy "Users can view own files"
  on public.files for select
  using (auth.uid() = user_id);

create policy "Admins can view all files"
  on public.files for select
  using (public.is_admin());

create policy "Users can insert own files"
  on public.files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own files"
  on public.files for delete
  using (auth.uid() = user_id);

-- 3. STORAGE BUCKET
-- Create the bucket for file uploads
insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', true);

-- Storage policies
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (bucket_id = 'user-files' and auth.role() = 'authenticated');

create policy "Anyone can view files"
  on storage.objects for select
  using (bucket_id = 'user-files');

create policy "Users can delete own files"
  on storage.objects for delete
  using (bucket_id = 'user-files' and auth.uid()::text = (storage.foldername(name))[1]);

-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- This function runs automatically when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. CREATE ADMIN USER (run this AFTER creating the admin via the app's signup)
-- Replace 'admin-user-uuid-here' with the actual UUID from auth.users
-- update public.profiles set role = 'admin' where username = 'admin';
