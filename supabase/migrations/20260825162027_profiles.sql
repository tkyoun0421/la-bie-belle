create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create function public.create_profile_for_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.create_profile_for_new_user();
