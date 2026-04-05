-- Run in Supabase SQL Editor if you already deployed the base schema.
-- Adds lifeguard/instructor classification and admin profile updates.

-- 1) User category (non-admin portal users)
alter table public.profiles
  add column if not exists user_category text not null default 'lifeguard'
  check (user_category in ('lifeguard', 'instructor'));

comment on column public.profiles.user_category is 'Portal role: lifeguard (منقذ) or instructor (مدرب). Admins use profiles.role = admin.';

-- 2) Allow admins to update any profile (e.g. change category)
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- 3) Keep trigger in sync with metadata from Auth
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
