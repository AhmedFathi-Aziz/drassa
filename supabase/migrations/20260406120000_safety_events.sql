-- Safety events: rescues, incidents, and related emergency logs

create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null
    check (event_type in ('rescue', 'incident', 'near_miss', 'medical', 'other')),
  severity text
    check (severity is null or severity in ('low', 'medium', 'high', 'critical')),
  description text,
  location text,
  occurred_at timestamptz not null default now(),
  actions_taken text,
  reporter_display text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index safety_events_occurred_at_idx on public.safety_events (occurred_at desc);

alter table public.safety_events enable row level security;

create policy "safety_events_select_authenticated"
  on public.safety_events for select
  to authenticated
  using (true);

create policy "safety_events_insert_admin"
  on public.safety_events for insert
  to authenticated
  with check (public.is_admin());

create policy "safety_events_update_admin"
  on public.safety_events for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "safety_events_delete_admin"
  on public.safety_events for delete
  to authenticated
  using (public.is_admin());
