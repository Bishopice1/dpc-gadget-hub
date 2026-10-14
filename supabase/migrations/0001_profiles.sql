-- 0001_profiles.sql
-- User profiles: one row per auth.users row, created automatically on signup.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing profile data for each authenticated user.';

-- Populate profiles from OAuth metadata (Google provides full_name).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    null
  )
  -- Never overwrite a name the user set themselves on later sign-ins;
  -- only fill it in when the profile row has nothing yet.
  on conflict (id) do update
    set full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

-- Least privilege: only the auth system (trigger owner) needs to call this.
revoke all on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();