-- Audit logging: track all user actions and modifications

-- Add updated_at and updated_by to safety_events (if not already present)
-- Skip if columns already exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'safety_events' and column_name = 'updated_at') then
    alter table public.safety_events add column updated_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'safety_events' and column_name = 'updated_by') then
    alter table public.safety_events add column updated_by uuid references public.profiles(id) on delete set null;
  end if;
end $$;

-- Add updated_at and updated_by to in_service_attendance (if not already present)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'in_service_attendance' and column_name = 'updated_at') then
    alter table public.in_service_attendance add column updated_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'in_service_attendance' and column_name = 'updated_by') then
    alter table public.in_service_attendance add column updated_by uuid references public.profiles(id) on delete set null;
  end if;
end $$;

-- Create audit_logs table to track all user actions (if not already present)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete', 'login', 'logout', 'file_upload', 'file_delete')),
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  changes jsonb, -- diff of what changed
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Create indexes if they don't exist
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_record_idx on public.audit_logs (table_name, record_id);

-- Enable RLS on audit_logs (if not already enabled)
alter table public.audit_logs enable row level security;

-- Drop old policies if they exist
drop policy if exists "audit_logs_select_own" on public.audit_logs;
drop policy if exists "audit_logs_insert_system" on public.audit_logs;

-- All authenticated users can read their own audit logs; admins can read all
create policy "audit_logs_select_own"
  on public.audit_logs for select
  to authenticated
  using (
    user_id = auth.uid() or public.is_admin()
  );

create policy "audit_logs_insert_system"
  on public.audit_logs for insert
  to authenticated
  with check (true);

-- Drop old function and triggers if they exist
drop trigger if exists safety_events_audit_trigger on public.safety_events;
drop trigger if exists in_service_attendance_audit_trigger on public.in_service_attendance;
drop trigger if exists in_service_sessions_audit_trigger on public.in_service_sessions;
drop trigger if exists lesson_plans_audit_trigger on public.lesson_plans;
drop trigger if exists files_audit_trigger on public.files;
drop function if exists public.log_audit_event();

-- Create a function to log changes automatically
create function public.log_audit_event()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  v_user_id uuid;
  v_old_values jsonb;
  v_new_values jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return new;
  end if;

  v_old_values := to_jsonb(old.*);
  v_new_values := to_jsonb(new.*);

  if tg_op = 'DELETE' then
    insert into public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    values (v_user_id, 'delete', tg_table_name, old.id, v_old_values, null);
    return old;
  elsif tg_op = 'INSERT' then
    insert into public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    values (v_user_id, 'create', tg_table_name, new.id, null, v_new_values);
    return new;
  elsif tg_op = 'UPDATE' then
    if v_old_values != v_new_values then
      insert into public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
      values (v_user_id, 'update', tg_table_name, new.id, v_old_values, v_new_values);
    end if;
    return new;
  end if;
end;
$$;

-- Attach triggers to tables
create trigger safety_events_audit_trigger
  after insert or update or delete on public.safety_events
  for each row execute function log_audit_event();

create trigger in_service_attendance_audit_trigger
  after insert or update or delete on public.in_service_attendance
  for each row execute function log_audit_event();

create trigger in_service_sessions_audit_trigger
  after insert or update or delete on public.in_service_sessions
  for each row execute function log_audit_event();

create trigger lesson_plans_audit_trigger
  after insert or update or delete on public.lesson_plans
  for each row execute function log_audit_event();

create trigger files_audit_trigger
  after insert or update or delete on public.files
  for each row execute function log_audit_event();
