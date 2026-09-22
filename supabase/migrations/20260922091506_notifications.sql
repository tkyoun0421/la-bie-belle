create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  subject_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  claimed_at timestamptz,
  push_attempts integer not null default 0,
  pushed_at timestamptz
);

create index notifications_profile_id_created_at_idx
  on public.notifications (profile_id, created_at desc);

create index notifications_unread_idx
  on public.notifications (profile_id)
  where read_at is null;

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column notifications_enabled boolean not null default true;

create view public.push_reachable
  with (security_invoker = false)
as
select
  profiles.id as profile_id,
  exists (
    select 1
    from public.push_tokens
    where push_tokens.profile_id = profiles.id
  ) as has_device
from public.profiles
where public.is_admin();

alter table public.notifications enable row level security;
alter table public.push_tokens enable row level security;

create policy notifications_select
  on public.notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = notifications.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

create policy push_tokens_select
  on public.push_tokens
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = push_tokens.profile_id
        and profiles.user_id = (select auth.uid())
    )
  );

revoke all on public.notifications from anon, authenticated;
revoke all on public.push_tokens from anon, authenticated;
revoke all on public.push_reachable from anon, authenticated;

grant select on public.notifications to authenticated;
grant select on public.push_tokens to authenticated;
grant select on public.push_reachable to authenticated;
