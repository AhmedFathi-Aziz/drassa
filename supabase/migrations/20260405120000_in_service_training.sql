-- In-service training: sessions, lesson plans (storage), attendance (admin-only RLS)

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
  with check (bucket_id = 'lesson-plans' and public.is_admin());

create policy "lesson_plans_storage_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lesson-plans' and public.is_admin())
  with check (bucket_id = 'lesson-plans' and public.is_admin());

create policy "lesson_plans_storage_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lesson-plans' and public.is_admin());
