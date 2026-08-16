-- CardFlow Vite cloud sync. Original CardFlow tables are not used or changed.

create table if not exists public.vite_user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.vite_user_state enable row level security;

drop policy if exists "vite_user_state_select_own" on public.vite_user_state;
drop policy if exists "vite_user_state_insert_own" on public.vite_user_state;
drop policy if exists "vite_user_state_update_own" on public.vite_user_state;
drop policy if exists "vite_user_state_delete_own" on public.vite_user_state;

create policy "vite_user_state_select_own"
  on public.vite_user_state for select
  using (auth.uid() = user_id);

create policy "vite_user_state_insert_own"
  on public.vite_user_state for insert
  with check (auth.uid() = user_id);

create policy "vite_user_state_update_own"
  on public.vite_user_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "vite_user_state_delete_own"
  on public.vite_user_state for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.vite_user_state to authenticated;

alter table public.vite_user_state replica identity full;

do $$
begin
  execute 'alter publication supabase_realtime add table public.vite_user_state';
exception
  when duplicate_object then null;
end $$;
