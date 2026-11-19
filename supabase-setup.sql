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

-- 5. New progress columns (uploads, quiz answers)
alter table public.progress add column if not exists task_file text;
alter table public.progress add column if not exists quiz_answers jsonb;

-- 6. Trainer feedback → shows to the trainee as a notification
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_id text not null,
  body text not null,
  author_id uuid references auth.users(id),
  author_name text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
drop policy if exists "feedback read" on public.feedback;
create policy "feedback read" on public.feedback for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "feedback insert" on public.feedback;
create policy "feedback insert" on public.feedback for insert with check (public.is_admin());
drop policy if exists "feedback delete" on public.feedback;
create policy "feedback delete" on public.feedback for delete using (public.is_admin());
create or replace function public.mark_feedback_read(ids uuid[]) returns void
language sql security definer set search_path = public as $$
  update public.feedback set read_at = now() where id = any(ids) and user_id = auth.uid() and read_at is null;
$$;

-- 7. Q&A — trainees see their own questions plus every answered one
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  body text not null,
  answer text,
  answered_by text,
  answered_at timestamptz,
  answer_seen boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.questions enable row level security;
drop policy if exists "questions read" on public.questions;
create policy "questions read" on public.questions for select using (user_id = auth.uid() or answer is not null or public.is_admin());
drop policy if exists "questions insert" on public.questions;
create policy "questions insert" on public.questions for insert with check (user_id = auth.uid());
drop policy if exists "questions answer" on public.questions;
create policy "questions answer" on public.questions for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "questions delete" on public.questions;
create policy "questions delete" on public.questions for delete using (public.is_admin());
create or replace function public.mark_answers_seen() returns void
language sql security definer set search_path = public as $$
  update public.questions set answer_seen = true where user_id = auth.uid() and answer is not null and not answer_seen;
$$;

-- 8. Live sessions (Google Meet links)
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  starts_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.meetings enable row level security;
drop policy if exists "meetings read" on public.meetings;
create policy "meetings read" on public.meetings for select using (auth.uid() is not null);
drop policy if exists "meetings write" on public.meetings;
create policy "meetings write" on public.meetings for all using (public.is_admin()) with check (public.is_admin());

-- 9. Private bucket for uploaded assignment files (trainee folder = their user id)
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;
drop policy if exists "submissions upload" on storage.objects;
create policy "submissions upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "submissions update" on storage.objects;
create policy "submissions update" on storage.objects for update to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "submissions read" on storage.objects;
create policy "submissions read" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 10. Public video bucket
insert into storage.buckets (id, name, public)
values ('training-videos', 'training-videos', true)
on conflict (id) do update set public = true;

-- ── After creating your own login, make yourself a trainer (change the username): ──
-- update public.profiles set is_admin = true where username = 'mohamed';

-- ── Optional: give a trainee a display name: ──
-- update public.profiles set full_name = 'Sara Ahmed' where username = 'sara';
