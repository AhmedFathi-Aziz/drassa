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
  user_category text not null default 'lifeguard' check (user_category in ('lifeguard', 'instructor')),
  created_at timestamptz default now()
);

-- Allow users to read their own profile; admins can read all
alter table public.profiles enable row level security;

-- Non-recursive admin check for RLS policies
-- Avoids "infinite recursion detected in policy for relation profiles"
create or replace function public.is_admin()
returns boolean
language plpgsql
volatile
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

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

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

-- Admin-only RPC to get file counts grouped by user
create or replace function public.admin_user_file_counts()
returns table (user_id uuid, total bigint)
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
  select f.user_id, count(*)::bigint as total
  from public.files f
  group by f.user_id;
end;
$$;

grant execute on function public.admin_user_file_counts() to authenticated;

-- Admin-only RPC to fetch one user profile by id
create or replace function public.admin_get_user_profile(target_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.profiles;
begin
  set local row_security = off;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Forbidden';
  end if;

  select *
  into result
  from public.profiles
  where id = target_user_id;

  return result;
end;
$$;

grant execute on function public.admin_get_user_profile(uuid) to authenticated;

-- Admin-only RPC to fetch files for one user
create or replace function public.admin_list_files_for_user(target_user_id uuid)
returns setof public.files
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
  from public.files
  where user_id = target_user_id
  order by created_at desc;
end;
$$;

grant execute on function public.admin_list_files_for_user(uuid) to authenticated;

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
  insert into public.profiles (id, username, full_name, email, role, user_category)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(new.raw_user_meta_data->>'user_category', 'lifeguard')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. CREATE ADMIN USER (run after creating the first admin account in Supabase Auth / SQL)
-- Replace 'admin-user-uuid-here' with the actual UUID from auth.users
-- update public.profiles set role = 'admin' where username = 'admin';

-- 6. IN-SERVICE TRAINING (sessions, lesson plans, attendance)
create table public.in_service_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  session_at timestamptz not null default now(),
  location text,
  duration_minutes integer,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  storage_path text not null,
  public_url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table public.in_service_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.in_service_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attended boolean not null default true,
  notes text,
  created_at timestamptz default now(),
  unique (session_id, user_id)
);

create index in_service_sessions_session_at_idx on public.in_service_sessions (session_at desc);
create index in_service_attendance_session_idx on public.in_service_attendance (session_id);

alter table public.in_service_sessions enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.in_service_attendance enable row level security;

create policy "in_service_sessions_select_authenticated"
  on public.in_service_sessions for select
  to authenticated
  using (true);

create policy "in_service_sessions_insert_admin"
  on public.in_service_sessions for insert
  to authenticated
  with check (public.is_admin());

create policy "in_service_sessions_update_admin"
  on public.in_service_sessions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "in_service_sessions_delete_admin"
  on public.in_service_sessions for delete
  to authenticated
  using (public.is_admin());

create policy "lesson_plans_select_authenticated"
  on public.lesson_plans for select
  to authenticated
  using (true);

create policy "lesson_plans_insert_admin"
  on public.lesson_plans for insert
  to authenticated
  with check (public.is_admin());

create policy "lesson_plans_update_admin"
  on public.lesson_plans for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "lesson_plans_delete_admin"
  on public.lesson_plans for delete
  to authenticated
  using (public.is_admin());

create policy "in_service_attendance_all_admin"
  on public.in_service_attendance for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('lesson-plans', 'lesson-plans', true)
on conflict (id) do nothing;

create policy "lesson_plans_storage_select"
  on storage.objects for select
  using (bucket_id = 'lesson-plans');

create policy "lesson_plans_storage_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "lesson_plans_storage_update_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "lesson_plans_storage_delete_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lesson-plans'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
