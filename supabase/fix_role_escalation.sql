-- ============================================================
-- TickShift Academy — SECURITY FIX: role escalation
-- Run this ONCE in your Supabase dashboard → SQL Editor.
--
-- Problem: the "Users update own profile" policy let any
-- logged-in student change their own `role` to 'admin' with a
-- single API request, gaining full admin access.
--
-- Fix: replace the policy so users can update their own profile
-- but can never change their `role` or `email`. Admin actions
-- (invites, role changes) go through the service role, which is
-- unaffected.
-- ============================================================

-- Helper functions read the caller's CURRENT role/email.
-- SECURITY DEFINER means they bypass RLS, so there is no
-- policy recursion when used inside a profiles policy.

create or replace function public.my_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function public.my_profile_email()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from profiles where id = auth.uid();
$$;

-- Replace the vulnerable policy
drop policy if exists "Users update own profile" on profiles;

create policy "Users update own profile" on profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role  = public.my_profile_role()   -- role cannot change
    and email = public.my_profile_email()  -- email cannot change
  );

select 'Role escalation fix applied successfully.' as status;
