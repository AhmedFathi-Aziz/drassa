-- Fix: "SET is not allowed in a non-volatile function"
-- is_admin() uses SET LOCAL row_security — must be VOLATILE, not STABLE.
-- Run once in Supabase SQL Editor on existing projects.

create or replace function public.is_admin()
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  set local row_security = off;
  return exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
end;
$$;
