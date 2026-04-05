-- Fix lesson-plans storage policies: use inline admin check instead of public.is_admin()
-- (some setups saw storage uploads hang or fail oddly when the policy called is_admin()).

drop policy if exists "lesson_plans_storage_insert_admin" on storage.objects;
drop policy if exists "lesson_plans_storage_update_admin" on storage.objects;
drop policy if exists "lesson_plans_storage_delete_admin" on storage.objects;

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
