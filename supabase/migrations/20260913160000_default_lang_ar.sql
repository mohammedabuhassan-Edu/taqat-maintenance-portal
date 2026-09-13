-- Arabic is the portal's default language.

alter table public.profiles
  alter column preferred_lang set default 'ar';

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
         then new.raw_user_meta_data ->> 'preferred_lang' else 'ar' end
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

update public.profiles set preferred_lang = 'ar' where is_demo;
