-- Shared demo accounts: credentials are public, so the password and email
-- must not be changeable by anyone holding the session.

alter table public.profiles
  add column is_demo boolean not null default false;

-- Only the service role / SQL editor may flip the demo flag.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.is_demo is distinct from old.is_demo then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  if public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.apartment_id is distinct from old.apartment_id
     or new.is_active is distinct from old.is_active
     or new.email is distinct from old.email
     or new.id is distinct from old.id then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Reject credential changes on auth.users for demo accounts. Runs for every
-- path that touches the password or email: profile page, password recovery,
-- and the Auth admin API.
create or replace function public.protect_demo_credentials()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.profiles p where p.id = old.id and p.is_demo) then
    if new.encrypted_password is distinct from old.encrypted_password
       or new.email is distinct from old.email
       or coalesce(new.email_change, '') <> coalesce(old.email_change, '')
       or coalesce(new.phone, '') <> coalesce(old.phone, '') then
      raise exception 'credentials_locked: this is a shared demo account; its password and email cannot be changed'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_demo_credentials
  before update on auth.users
  for each row execute function public.protect_demo_credentials();

update public.profiles set is_demo = true where email = 'admin@admin.com';
