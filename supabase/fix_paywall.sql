-- ============================================================
-- TickShift Academy — SECURITY FIX: enforce the membership paywall
-- Run this ONCE in your Supabase dashboard → SQL Editor.
--
-- Problem: courses, lessons, and assignments were readable by ANY
-- logged-in user, even without a membership. The "Membership
-- Required" screen was cosmetic — a free account could pull every
-- course and lesson straight from the database API.
--
-- Fix: reads of courses/lessons/assignments now require an active
-- membership (free or pro tier) or an admin role. Admin tools are
-- unaffected. Public Hub posts are unaffected.
-- ============================================================

-- Helper: does the caller have an active membership or admin role?
-- SECURITY DEFINER so it can check the memberships/profiles tables
-- without being blocked by their own RLS.
create or replace function public.has_active_access()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from memberships
      where user_id = auth.uid() and status = 'active'
    )
    or exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    );
$$;

-- Courses: members only
drop policy if exists "Authenticated read courses" on courses;
create policy "Members read courses" on courses
  for select to authenticated using (has_active_access());

-- Lessons: members only
drop policy if exists "Authenticated read lessons" on lessons;
create policy "Members read lessons" on lessons
  for select to authenticated using (has_active_access());

-- Assignments: members only
drop policy if exists "Authenticated read assignments" on assignments;
create policy "Members read assignments" on assignments
  for select to authenticated using (has_active_access());

select 'Paywall fix applied successfully.' as status;
