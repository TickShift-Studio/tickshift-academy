-- ============================================================
-- TickShift Academy — Signup Trigger Fix
-- Run this in your Supabase dashboard → SQL Editor
-- ============================================================

-- 1. Drop old trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- 2. Make sure the profiles table has all required columns
alter table public.profiles
  add column if not exists email text,
    add column if not exists full_name text,
      add column if not exists role text not null default 'student',
        add column if not exists created_at timestamp with time zone default now();

        -- Add unique constraint on email if it doesn't exist
        do $$
        begin
          if not exists (
              select 1 from information_schema.table_constraints
                  where table_name = 'profiles' and constraint_name = 'profiles_email_key'
                    ) then
                        alter table public.profiles add constraint profiles_email_key unique (email);
                          end if;
                          end $$;

                          -- 3. Add check constraint for role (if not already there)
                          do $$
                          begin
                            if not exists (
                                select 1 from information_schema.table_constraints
                                    where table_name = 'profiles' and constraint_name = 'profiles_role_check'
                                      ) then
                                          alter table public.profiles
                                                add constraint profiles_role_check check (role in ('student', 'admin'));
                                                  end if;
                                                  end $$;

                                                  -- 4. Recreate the trigger function (robust version)
                                                  create or replace function handle_new_user()
                                                  returns trigger
                                                  language plpgsql
                                                  security definer
                                                  set search_path = public
                                                  as $$
                                                  begin
                                                    insert into public.profiles (id, email, full_name, role)
                                                      values (
                                                          new.id,
                                                              new.email,
                                                                  coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
                                                                      'student'
                                                                        )
                                                                          on conflict (id) do nothing;
                                                                            return new;
                                                                            end;
                                                                            $$;

                                                                            -- 5. Recreate the trigger
                                                                            create trigger on_auth_user_created
                                                                              after insert on auth.users
                                                                                for each row execute procedure handle_new_user();

                                                                                -- 6. Add INSERT policy so the app can also upsert profiles as a fallback
                                                                                drop policy if exists "Users insert own profile" on public.profiles;
                                                                                create policy "Users insert own profile" on public.profiles
                                                                                  for insert with check (auth.uid() = id);

                                                                                  -- Done!
                                                                                  select 'Signup trigger fix applied successfully.' as status;