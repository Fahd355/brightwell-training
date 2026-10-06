-- BrightWell Training — Supabase setup.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to run more than once.

-- 1. Trainee profiles (one row per login, created automatically)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Progress (one row per trainee per section)
create table if not exists public.progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  section_id text not null,
  video_pct int not null default 0,
  video_done boolean not null default false,
  task_done boolean not null default false,
  task_response text,
  quiz_score int,
  quiz_passed boolean not null default false,
  quiz_attempts int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, section_id)
);

-- 3. Security: trainees see only their own rows; trainers (is_admin) see everyone
alter table public.profiles enable row level security;
alter table public.progress enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (id = auth.uid() or public.is_admin());

drop policy if exists "progress read" on public.progress;
create policy "progress read" on public.progress for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "progress insert" on public.progress;
create policy "progress insert" on public.progress for insert with check (user_id = auth.uid());
drop policy if exists "progress update" on public.progress;
create policy "progress update" on public.progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 4. Auto-create a profile when you add a user (username = part of the email before @)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, split_part(new.email, '@', 1), new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, username)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- 5. Public video bucket
insert into storage.buckets (id, name, public)
values ('training-videos', 'training-videos', true)
on conflict (id) do update set public = true;

-- ── After creating your own login, make yourself a trainer (change the username): ──
-- update public.profiles set is_admin = true where username = 'mohamed';

-- ── Optional: give a trainee a display name: ──
-- update public.profiles set full_name = 'Sara Ahmed' where username = 'sara';
