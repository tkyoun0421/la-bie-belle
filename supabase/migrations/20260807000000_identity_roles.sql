create type profile_role as enum ('admin', 'super_admin');

create table profile_roles (
  profile_id uuid not null references profiles (id) on delete cascade,
  role profile_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references profiles (id),
  primary key (profile_id, role)
);

alter table profile_roles enable row level security;

create table identity_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null
    constraint identity_audit_logs_event_not_blank check (length(btrim(event)) > 0),
  actor_profile_id uuid references profiles (id),
  target_profile_id uuid not null references profiles (id),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table identity_audit_logs enable row level security;

create function effective_roles(target_uid uuid) returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_status profile_status;
  granted text[];
  result text[];
begin
  select status into target_status from profiles where id = target_uid;

  if target_status is distinct from 'active' then
    return array[]::text[];
  end if;

  select coalesce(array_agg(role::text), array[]::text[])
    into granted
    from profile_roles
    where profile_id = target_uid;

  result := array['worker'] || granted;

  if 'super_admin' = any(granted) and not ('admin' = any(granted)) then
    result := result || array['admin'];
  end if;

  return (
    select array_agg(role_name order by
      case role_name when 'worker' then 0 when 'admin' then 1 when 'super_admin' then 2 else 3 end
    )
    from unnest(result) as role_name
  );
end;
$$;

revoke execute on function effective_roles(uuid) from public, anon, authenticated, service_role;

create function own_effective_roles() returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select effective_roles(auth.uid());
$$;

revoke execute on function own_effective_roles() from public, anon, authenticated, service_role;
grant execute on function own_effective_roles() to authenticated;

create function is_admin(target_uid uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select 'admin' = any(effective_roles(target_uid));
$$;

create function is_super_admin(target_uid uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select 'super_admin' = any(effective_roles(target_uid));
$$;

create function grant_admin_role(target_profile_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status profile_status;
  inserted_count int;
begin
  if not is_super_admin(actor_id) then
    raise exception 'super_admin 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status from profiles where id = target_profile_id;

  if target_status is distinct from 'active' then
    raise exception '활성 근무자만 임명할 수 있습니다' using errcode = '22023';
  end if;

  insert into profile_roles (profile_id, role, granted_by)
  values (target_profile_id, 'admin', actor_id)
  on conflict (profile_id, role) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    return;
  end if;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values ('admin_role_granted', actor_id, target_profile_id, jsonb_build_object('role', 'admin'));
end;
$$;

create function revoke_admin_role(target_profile_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  deleted_count int;
begin
  if not is_super_admin(actor_id) then
    raise exception 'super_admin 권한이 필요합니다' using errcode = '42501';
  end if;

  delete from profile_roles
  where profile_id = target_profile_id and role = 'admin';

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    return;
  end if;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values ('admin_role_revoked', actor_id, target_profile_id, jsonb_build_object('role', 'admin'));
end;
$$;

create function bootstrap_super_admin(bootstrap_email text) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  current_status profile_status;
  updated_count int;
  inserted_count int;
  promoted boolean := false;
  granted boolean := false;
begin
  select u.id into target_id
  from auth.users u
  where lower(u.email) = lower(bootstrap_email)
  limit 1;

  if target_id is null then
    return false;
  end if;

  select status into current_status from profiles where id = target_id;

  if current_status is null then
    return false;
  end if;

  if current_status = 'pending' then
    update profiles set status = 'active' where id = target_id and status = 'pending';
    get diagnostics updated_count = row_count;
    promoted := updated_count > 0;
    if promoted then
      current_status := 'active';
    end if;
  end if;

  if current_status = 'active' then
    insert into profile_roles (profile_id, role, granted_by)
    values (target_id, 'super_admin', null)
    on conflict (profile_id, role) do nothing;
    get diagnostics inserted_count = row_count;
    granted := inserted_count > 0;
  end if;

  if promoted or granted then
    insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
    values (
      'super_admin_bootstrap',
      null,
      target_id,
      jsonb_build_object('promoted', promoted, 'granted_super_admin', granted)
    );
  end if;

  return current_status = 'active';
end;
$$;

revoke execute on function bootstrap_super_admin(text) from public, anon, authenticated, service_role;
grant execute on function bootstrap_super_admin(text) to service_role;

create policy profiles_select_admin
on profiles
for select
using (is_admin(auth.uid()));

create policy profile_roles_select_admin
on profile_roles
for select
using (is_admin(auth.uid()));
