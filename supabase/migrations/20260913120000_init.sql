-- Apartment maintenance portal: initial schema, security, and helpers.
-- Applies cleanly to a fresh Supabase project.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'tenant');
create type public.request_category as enum ('plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'other');
create type public.request_priority as enum ('low', 'normal', 'urgent');
create type public.request_status as enum ('new', 'in_progress', 'done', 'cancelled');
create type public.fee_status as enum ('unpaid', 'paid');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.apartments (
  id          uuid primary key default gen_random_uuid(),
  unit_number text not null unique check (length(trim(unit_number)) between 1 and 20),
  floor       integer,
  notes       text check (notes is null or length(notes) <= 500),
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  full_name      text not null default '' check (length(full_name) <= 80),
  phone          text check (phone is null or length(phone) <= 30),
  role           public.user_role not null default 'tenant',
  apartment_id   uuid references public.apartments (id) on delete set null,
  preferred_lang text not null default 'en' check (preferred_lang in ('en', 'ar')),
  is_active      boolean not null default true,
  email          text,
  created_at     timestamptz not null default now()
);
create index profiles_apartment_id_idx on public.profiles (apartment_id);
create index profiles_role_idx on public.profiles (role);

create table public.maintenance_requests (
  id           uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  created_by   uuid not null references public.profiles (id) on delete cascade,
  title        text not null check (length(trim(title)) between 3 and 120),
  description  text not null check (length(trim(description)) between 10 and 2000),
  category     public.request_category not null,
  priority     public.request_priority not null default 'normal',
  status       public.request_status not null default 'new',
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index maintenance_requests_apartment_id_idx on public.maintenance_requests (apartment_id);
create index maintenance_requests_status_idx on public.maintenance_requests (status);
create index maintenance_requests_created_at_idx on public.maintenance_requests (created_at desc);

-- Admin-only notes live in their own table so RLS can hide them entirely from tenants.
create table public.request_admin_notes (
  request_id uuid primary key references public.maintenance_requests (id) on delete cascade,
  body       text not null default '' check (length(body) <= 2000),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.request_photos (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references public.maintenance_requests (id) on delete cascade,
  storage_path text not null unique,
  uploaded_by  uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index request_photos_request_id_idx on public.request_photos (request_id);

create table public.request_comments (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.maintenance_requests (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index request_comments_request_id_idx on public.request_comments (request_id, created_at);

create table public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (length(trim(title)) between 3 and 120),
  body         text not null check (length(trim(body)) between 5 and 4000),
  pinned       boolean not null default false,
  published_at timestamptz not null default now(),
  created_by   uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);
create index announcements_order_idx on public.announcements (pinned desc, published_at desc);

create table public.fees (
  id           uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  title        text not null check (length(trim(title)) between 2 and 120),
  amount       numeric(10, 2) not null check (amount > 0),
  due_date     date not null,
  status       public.fee_status not null default 'unpaid',
  paid_at      timestamptz,
  note         text check (note is null or length(note) <= 300),
  created_at   timestamptz not null default now()
);
create index fees_apartment_id_idx on public.fees (apartment_id);
create index fees_status_idx on public.fees (status);

-- ---------------------------------------------------------------------------
-- Helper functions used by policies
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role = 'admin' and p.is_active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Returns NULL for inactive users, which makes every tenant policy fail closed.
create or replace function public.my_apartment_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.apartment_id
  from public.profiles p
  where p.id = auth.uid() and p.is_active;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.my_apartment_id() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_apartment_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create a profile row for every new auth user; carry over invite metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, preferred_lang)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when new.raw_user_meta_data ->> 'preferred_lang' in ('en', 'ar')
         then new.raw_user_meta_data ->> 'preferred_lang' else 'en' end
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if the auth email changes.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- Tenants may only edit a limited set of their own profile columns.
-- auth.uid() is null for the service role / SQL editor, which bypass RLS anyway.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null or public.is_admin() then
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

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Maintain updated_at / resolved_at and restrict what tenants can change.
create or replace function public.maintenance_requests_before_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  if new.status = 'done' and old.status <> 'done' then
    new.resolved_at := now();
  elsif new.status <> 'done' then
    new.resolved_at := null;
  end if;

  if auth.uid() is not null and not public.is_admin() then
    -- Tenants can only touch requests that are still new...
    if old.status <> 'new' then
      raise exception 'insufficient_privilege' using errcode = '42501';
    end if;
    -- ...and may only edit content or cancel.
    if new.status not in ('new', 'cancelled')
       or new.apartment_id is distinct from old.apartment_id
       or new.created_by is distinct from old.created_by
       or new.created_at is distinct from old.created_at then
      raise exception 'insufficient_privilege' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger maintenance_requests_before_update
  before update on public.maintenance_requests
  for each row execute function public.maintenance_requests_before_update();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger request_admin_notes_touch
  before update on public.request_admin_notes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.apartments           enable row level security;
alter table public.profiles             enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.request_admin_notes  enable row level security;
alter table public.request_photos       enable row level security;
alter table public.request_comments     enable row level security;
alter table public.announcements        enable row level security;
alter table public.fees                 enable row level security;

-- apartments
create policy "admin full access" on public.apartments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tenant reads own apartment" on public.apartments
  for select to authenticated using (id = public.my_apartment_id());

-- profiles
create policy "admin full access" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "user reads own profile" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "user updates own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Tenants can see names/roles of people who commented on their requests.
create policy "tenant reads co-tenants and admins" on public.profiles
  for select to authenticated
  using (
    public.my_apartment_id() is not null
    and (apartment_id = public.my_apartment_id() or role = 'admin')
  );

-- maintenance_requests
create policy "admin full access" on public.maintenance_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tenant reads own apartment requests" on public.maintenance_requests
  for select to authenticated using (apartment_id = public.my_apartment_id());
create policy "tenant creates request for own apartment" on public.maintenance_requests
  for insert to authenticated
  with check (
    apartment_id = public.my_apartment_id()
    and created_by = auth.uid()
    and status = 'new'
  );
create policy "tenant edits own new request" on public.maintenance_requests
  for update to authenticated
  using (apartment_id = public.my_apartment_id() and status = 'new')
  with check (apartment_id = public.my_apartment_id());

-- request_admin_notes: admins only, no tenant policy at all
create policy "admin full access" on public.request_admin_notes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- request_photos
create policy "admin full access" on public.request_photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tenant reads own apartment photos" on public.request_photos
  for select to authenticated
  using (exists (
    select 1 from public.maintenance_requests r
    where r.id = request_id and r.apartment_id = public.my_apartment_id()
  ));
create policy "tenant adds photos to own requests" on public.request_photos
  for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.maintenance_requests r
      where r.id = request_id and r.apartment_id = public.my_apartment_id()
    )
  );

-- request_comments
create policy "admin full access" on public.request_comments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tenant reads own apartment comments" on public.request_comments
  for select to authenticated
  using (exists (
    select 1 from public.maintenance_requests r
    where r.id = request_id and r.apartment_id = public.my_apartment_id()
  ));
create policy "tenant comments on own requests" on public.request_comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.maintenance_requests r
      where r.id = request_id
        and r.apartment_id = public.my_apartment_id()
        and r.status in ('new', 'in_progress')
    )
  );

-- announcements
create policy "admin full access" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "active users read announcements" on public.announcements
  for select to authenticated using (public.my_apartment_id() is not null);

-- fees
create policy "admin full access" on public.fees
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "tenant reads own apartment fees" on public.fees
  for select to authenticated using (apartment_id = public.my_apartment_id());

-- ---------------------------------------------------------------------------
-- Storage: private bucket for request photos
-- Path convention: {apartment_id}/{request_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin manages request photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'request-photos' and public.is_admin())
  with check (bucket_id = 'request-photos' and public.is_admin());

create policy "tenant reads own apartment photo objects" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'request-photos'
    and (storage.foldername(name))[1] = public.my_apartment_id()::text
  );

create policy "tenant uploads own apartment photo objects" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'request-photos'
    and (storage.foldername(name))[1] = public.my_apartment_id()::text
  );

-- ---------------------------------------------------------------------------
-- Admin dashboard aggregate
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns table (
  new_count          bigint,
  in_progress_count  bigint,
  done_count         bigint,
  urgent_open_count  bigint,
  unpaid_total       numeric,
  unpaid_count       bigint,
  tenants_count      bigint,
  apartments_count   bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    (select count(*) from public.maintenance_requests where status = 'new'),
    (select count(*) from public.maintenance_requests where status = 'in_progress'),
    (select count(*) from public.maintenance_requests where status = 'done'),
    (select count(*) from public.maintenance_requests where status in ('new', 'in_progress') and priority = 'urgent'),
    (select coalesce(sum(amount), 0) from public.fees where status = 'unpaid'),
    (select count(*) from public.fees where status = 'unpaid'),
    (select count(*) from public.profiles where role = 'tenant' and is_active),
    (select count(*) from public.apartments);
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- One-off admin bootstrap. Run from the SQL editor after creating the first
-- user in Authentication > Users:
--   select public.promote_to_admin('you@example.com');
-- Not callable through the API.
-- ---------------------------------------------------------------------------
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then
    raise exception 'No auth user with email %', target_email;
  end if;
  insert into public.profiles (id, email, full_name, role)
  values (uid, target_email, split_part(target_email, '@', 1), 'admin')
  on conflict (id) do update set role = 'admin', is_active = true;
end;
$$;

revoke all on function public.promote_to_admin(text) from public, anon, authenticated;
