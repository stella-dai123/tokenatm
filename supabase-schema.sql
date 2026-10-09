-- Run once in the SQL Editor of your own Supabase project.
-- Data is private to the signed-in user; the frontend uses only a publishable/anon key.
create table if not exists public.habit_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.habit_state enable row level security;
revoke all on public.habit_state from anon;
grant select, insert, update on public.habit_state to authenticated;
drop policy if exists own_state_select on public.habit_state;
create policy own_state_select on public.habit_state for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists own_state_insert on public.habit_state;
create policy own_state_insert on public.habit_state for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists own_state_update on public.habit_state;
create policy own_state_update on public.habit_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
