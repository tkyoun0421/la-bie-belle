alter table profiles
  add column inactivity_anchor_at timestamptz;

update profiles set inactivity_anchor_at = now() where status = 'active';

alter table profiles
  add constraint profiles_inactivity_anchor_required
  check (status not in ('active', 'dormant') or inactivity_anchor_at is not null);

create or replace function approve_signup(target uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status profile_status;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status
  from profiles
  where id = target
  for update;

  if target_status is distinct from 'pending' then
    raise exception '이미 처리된 신청입니다' using errcode = '22023';
  end if;

  update profiles set status = 'active', inactivity_anchor_at = now() where id = target;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values ('signup_approved', actor_id, target, '{}'::jsonb);
end;
$$;

create or replace function bootstrap_super_admin(bootstrap_email text) returns boolean
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
    update profiles
       set status = 'active', inactivity_anchor_at = now()
     where id = target_id and status = 'pending';
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

create function deactivate_worker(target_profile_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status profile_status;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status
  from profiles
  where id = target_profile_id
  for update;

  if target_status is distinct from 'active' then
    raise exception '활성 상태만 휴면으로 전환할 수 있습니다' using errcode = 'LB010';
  end if;

  update profiles set status = 'dormant' where id = target_profile_id;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values (
    'profile_dormanted', actor_id, target_profile_id,
    jsonb_build_object('before', 'active', 'after', 'dormant')
  );
end;
$$;

revoke execute on function deactivate_worker(uuid) from public, anon, authenticated, service_role;
grant execute on function deactivate_worker(uuid) to authenticated;

create function reactivate_worker(target_profile_id uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status profile_status;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status
  from profiles
  where id = target_profile_id
  for update;

  if target_status is distinct from 'dormant' then
    raise exception '휴면 상태만 재활성화할 수 있습니다' using errcode = 'LB011';
  end if;

  update profiles set status = 'active', inactivity_anchor_at = now() where id = target_profile_id;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values (
    'profile_reactivated', actor_id, target_profile_id,
    jsonb_build_object('before', 'dormant', 'after', 'active')
  );
end;
$$;

revoke execute on function reactivate_worker(uuid) from public, anon, authenticated, service_role;
grant execute on function reactivate_worker(uuid) to authenticated;

create function reactivate_own_profile() returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status profile_status;
begin
  if actor_id is null then
    raise exception '로그인이 필요합니다' using errcode = '42501';
  end if;

  select status into target_status
  from profiles
  where id = actor_id
  for update;

  if target_status is distinct from 'dormant' then
    raise exception '휴면 상태만 재활성화할 수 있습니다' using errcode = 'LB011';
  end if;

  update profiles set status = 'active', inactivity_anchor_at = now() where id = actor_id;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values (
    'profile_reactivated', actor_id, actor_id,
    jsonb_build_object('before', 'dormant', 'after', 'active')
  );
end;
$$;

revoke execute on function reactivate_own_profile() from public, anon, authenticated, service_role;
grant execute on function reactivate_own_profile() to authenticated;
