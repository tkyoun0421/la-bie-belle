alter table profiles
  add column hourly_wage integer
    constraint profiles_hourly_wage_positive check (hourly_wage > 0);

create table worker_position_eligibilities (
  profile_id uuid not null references profiles (id) on delete cascade,
  position_id uuid not null references positions (id) on delete restrict,
  granted_at timestamptz not null default now(),
  granted_by uuid references profiles (id),
  primary key (profile_id, position_id)
);

alter table worker_position_eligibilities enable row level security;

create policy worker_position_eligibilities_select_admin
on worker_position_eligibilities
for select
using (is_admin(auth.uid()));

create policy worker_position_eligibilities_select_own
on worker_position_eligibilities
for select
using (auth.uid() = profile_id);

create function reject_default_position_eligibility() returns trigger
language plpgsql
as $$
declare
  target_is_default boolean;
begin
  select is_default into target_is_default from positions where id = new.position_id;

  if coalesce(target_is_default, false) then
    raise exception '기본 포지션은 가능 포지션으로 저장할 수 없습니다. 자동으로 적용됩니다';
  end if;

  return new;
end;
$$;

create trigger worker_position_eligibilities_reject_default
before insert on worker_position_eligibilities
for each row execute function reject_default_position_eligibility();

create function is_active_worker(target_uid uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select 'worker' = any(effective_roles(target_uid));
$$;

create policy positions_select_active_worker
on positions
for select
using ((select is_active_worker(auth.uid())));

create policy venue_settings_select_active_worker
on venue_settings
for select
using ((select is_active_worker(auth.uid())));

create function update_worker_info(
  target_profile_id uuid,
  new_name text,
  new_gender gender,
  new_birth_date date,
  new_phone text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  old_name text;
  old_gender gender;
  old_birth_date date;
  old_phone text;
  changes jsonb := '{}'::jsonb;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select name, gender, birth_date, phone
    into old_name, old_gender, old_birth_date, old_phone
    from profiles
    where id = target_profile_id;

  if not found then
    return;
  end if;

  if old_name is distinct from new_name then
    changes := changes
      || jsonb_build_object('name', jsonb_build_object('before', old_name, 'after', new_name));
  end if;
  if old_gender is distinct from new_gender then
    changes := changes
      || jsonb_build_object('gender', jsonb_build_object('before', old_gender, 'after', new_gender));
  end if;
  if old_birth_date is distinct from new_birth_date then
    changes := changes || jsonb_build_object(
      'birth_date', jsonb_build_object('before', old_birth_date, 'after', new_birth_date)
    );
  end if;
  if old_phone is distinct from new_phone then
    changes := changes
      || jsonb_build_object('phone', jsonb_build_object('before', old_phone, 'after', new_phone));
  end if;

  if changes = '{}'::jsonb then
    return;
  end if;

  update profiles
     set name = new_name, gender = new_gender, birth_date = new_birth_date, phone = new_phone
   where id = target_profile_id;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values ('worker_info_updated', actor_id, target_profile_id, changes);
end;
$$;

create function set_hourly_wage(target_profile_id uuid, new_wage integer) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  old_wage integer;
begin
  if not (is_admin(actor_id) or actor_id = target_profile_id) then
    raise exception '본인 또는 관리자만 시급을 수정할 수 있습니다' using errcode = '42501';
  end if;

  if new_wage is null or new_wage <= 0 or new_wage > 100000 then
    raise exception '시급은 1원 이상 100000원 이하여야 합니다' using errcode = 'LB001';
  end if;

  select hourly_wage into old_wage from profiles where id = target_profile_id;

  if not found then
    return;
  end if;

  if old_wage is not distinct from new_wage then
    return;
  end if;

  update profiles set hourly_wage = new_wage where id = target_profile_id;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values (
    'hourly_wage_updated',
    actor_id,
    target_profile_id,
    jsonb_build_object('before', old_wage, 'after', new_wage)
  );
end;
$$;

create function update_own_phone(new_phone text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  old_phone text;
begin
  if actor_id is null then
    raise exception '로그인이 필요합니다' using errcode = '42501';
  end if;

  select phone into old_phone from profiles where id = actor_id;

  if not found then
    return;
  end if;

  if old_phone is not distinct from new_phone then
    return;
  end if;

  update profiles set phone = new_phone where id = actor_id;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values (
    'phone_updated', actor_id, actor_id, jsonb_build_object('before', old_phone, 'after', new_phone)
  );
end;
$$;

create function grant_position_eligibility(target_profile_id uuid, target_position_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  position_active boolean;
  inserted_count int;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  select is_active into position_active from positions where id = target_position_id;

  if position_active is distinct from true then
    raise exception '비활성 포지션은 부여할 수 없습니다' using errcode = 'LB002';
  end if;

  insert into worker_position_eligibilities (profile_id, position_id, granted_by)
  values (target_profile_id, target_position_id, actor_id)
  on conflict (profile_id, position_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    return;
  end if;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values (
    'position_granted', actor_id, target_profile_id,
    jsonb_build_object('position_id', target_position_id)
  );
end;
$$;

create function revoke_position_eligibility(target_profile_id uuid, target_position_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  deleted_count int;
begin
  if not is_admin(actor_id) then
    raise exception '관리자 권한이 필요합니다' using errcode = '42501';
  end if;

  delete from worker_position_eligibilities
   where profile_id = target_profile_id and position_id = target_position_id;

  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    return;
  end if;

  insert into identity_audit_logs (event, actor_profile_id, target_profile_id, detail)
  values (
    'position_revoked', actor_id, target_profile_id,
    jsonb_build_object('position_id', target_position_id)
  );
end;
$$;
