create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  display_name text,
  photo_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  blocked_at timestamptz,
  left_at timestamptz,
  erased_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  phone text,
  birth_date date,
  gender text
);

create function public.is_approved()
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and approved_at is not null
      and blocked_at is null
  );
$$;

create function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_approved());

create policy profile_private_select
  on public.profile_private
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = profile_private.profile_id
        and profiles.user_id = (select auth.uid())
    )
    or public.is_admin()
  );

create policy profile_private_update_own
  on public.profile_private
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = profile_private.profile_id
        and profiles.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = profile_private.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;

revoke all on public.profile_private from anon, authenticated;
grant select on public.profile_private to authenticated;
grant update (phone) on public.profile_private to authenticated;

create function public.ensure_profile()
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception using message = 'not_allowed';
  end if;

  insert into public.profiles (user_id)
  values (caller)
  on conflict (user_id) do nothing;
end;
$$;

create function public.submit_profile(
  display_name text,
  phone text,
  birth_date date,
  gender text
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile public.profiles;
begin
  select * into caller_profile
  from public.profiles
  where user_id = auth.uid();

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if caller_profile.submitted_at is not null and caller_profile.rejected_at is null then
    raise exception using message = 'already_submitted';
  end if;

  update public.profiles
  set display_name = submit_profile.display_name,
      submitted_at = now(),
      rejected_at = null
  where id = caller_profile.id;

  insert into public.profile_private (profile_id, phone, birth_date, gender)
  values (
    caller_profile.id,
    submit_profile.phone,
    submit_profile.birth_date,
    submit_profile.gender
  )
  on conflict (profile_id) do update
  set phone = excluded.phone,
      birth_date = excluded.birth_date,
      gender = excluded.gender;
end;
$$;

create function public.update_my_photo(photo_url text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception using message = 'not_allowed';
  end if;

  update public.profiles
  set photo_url = update_my_photo.photo_url
  where user_id = caller;
end;
$$;

create function public.approve_member(profile_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  update public.profiles
  set approved_at = now(),
      rejected_at = null
  where id = approve_member.profile_id
    and approved_at is null;
end;
$$;

create function public.reject_member(profile_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception using message = 'not_allowed';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = reject_member.profile_id
      and approved_at is not null
  ) then
    raise exception using message = 'already_approved';
  end if;

  update public.profiles
  set rejected_at = now()
  where id = reject_member.profile_id;
end;
$$;
