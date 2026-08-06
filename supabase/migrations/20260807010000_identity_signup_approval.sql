create function approve_signup(target uuid) returns void
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

  update profiles set status = 'active' where id = target;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values ('signup_approved', actor_id, target, '{}'::jsonb);
end;
$$;

create function reject_signup(target uuid, reason text default null) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_status profile_status;
  normalized_reason text;
  audit_detail jsonb;
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

  update profiles set status = 'rejected' where id = target;

  normalized_reason := nullif(btrim(coalesce(reason, '')), '');
  audit_detail := case
    when normalized_reason is null then '{}'::jsonb
    else jsonb_build_object('reason', normalized_reason)
  end;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values ('signup_rejected', actor_id, target, audit_detail);
end;
$$;
