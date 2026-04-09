-- ============================================================
-- TickShift Academy — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- TABLES

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamp with time zone default now()
);

create table courses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  color text default 'blue',
  position integer default 0,
  created_at timestamp with time zone default now()
);

create table lessons (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses on delete cascade not null,
  title text not null,
  youtube_id text not null,
  duration text default '0:00',
  position integer default 0,
  created_at timestamp with time zone default now()
);

create table assignments (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses on delete cascade,
  title text not null,
  description text,
  due_date text,
  created_at timestamp with time zone default now()
);

create table lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  lesson_id uuid references lessons on delete cascade not null,
  completed_at timestamp with time zone default now(),
  unique(user_id, lesson_id)
);

create table submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  assignment_id uuid references assignments on delete cascade not null,
  content text not null,
  submitted_at timestamp with time zone default now(),
  unique(user_id, assignment_id)
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table assignments enable row level security;
alter table lesson_progress enable row level security;
alter table submissions enable row level security;

-- Helper function: is current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Profiles
create policy "Users view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Admins view all profiles" on profiles
  for select using (is_admin());
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);

-- Courses (all authenticated users can read; only admins write)
create policy "Authenticated read courses" on courses
  for select to authenticated using (true);
create policy "Admins manage courses" on courses
  for all using (is_admin());

-- Lessons
create policy "Authenticated read lessons" on lessons
  for select to authenticated using (true);
create policy "Admins manage lessons" on lessons
  for all using (is_admin());

-- Assignments
create policy "Authenticated read assignments" on assignments
  for select to authenticated using (true);
create policy "Admins manage assignments" on assignments
  for all using (is_admin());

-- Lesson progress (users own their records; admins read all)
create policy "Users manage own progress" on lesson_progress
  for all using (user_id = auth.uid());
create policy "Admins read all progress" on lesson_progress
  for select using (is_admin());

-- Submissions (users own their records; admins read all)
create policy "Users manage own submissions" on submissions
  for all using (user_id = auth.uid());
create policy "Admins read all submissions" on submissions
  for select using (is_admin());

-- ============================================================
-- TO MAKE YOURSELF AN ADMIN:
-- After signing up, run this in the SQL editor:
--   update profiles set role = 'admin' where email = 'your@email.com';
-- ============================================================
