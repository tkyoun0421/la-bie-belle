create type gender as enum ('male', 'female');
create type gender_requirement as enum ('any', 'male', 'female');

create function set_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table positions (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null unique constraint positions_name_not_blank check (length(btrim(name)) > 0),
  default_required_count int not null
    constraint positions_required_count_non_negative check (default_required_count >= 0),
  gender_requirement gender_requirement not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger positions_set_updated_at
before update on positions
for each row execute function set_updated_at();

create function reject_system_position_change() returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception '시스템 포지션 %는 삭제할 수 없습니다. 권한 파생이 이 포지션에 묶여 있습니다', old.code;
  end if;

  if new.code is distinct from old.code then
    raise exception '시스템 포지션 %의 code는 바꿀 수 없습니다. 표시명만 수정할 수 있습니다', old.code;
  end if;

  if not new.is_active then
    raise exception '시스템 포지션 %는 비활성화할 수 없습니다', old.code;
  end if;

  return new;
end;
$$;

create trigger positions_protect_system_delete
before delete on positions
for each row when (old.code is not null)
execute function reject_system_position_change();

create trigger positions_protect_system_update
before update on positions
for each row when (old.code is not null)
execute function reject_system_position_change();

create table venue_settings (
  id uuid primary key default gen_random_uuid(),
  latitude numeric(9, 6) not null
    constraint venue_settings_latitude_range check (latitude between -90 and 90),
  longitude numeric(9, 6) not null
    constraint venue_settings_longitude_range check (longitude between -180 and 180),
  gps_radius_m int not null
    constraint venue_settings_gps_radius_positive check (gps_radius_m > 0),
  location_accuracy_limit_m int not null
    constraint venue_settings_accuracy_limit_positive check (location_accuracy_limit_m > 0),
  default_hourly_wage int not null
    constraint venue_settings_hourly_wage_non_negative check (default_hourly_wage >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index venue_settings_single_row on venue_settings ((true));

create trigger venue_settings_set_updated_at
before update on venue_settings
for each row execute function set_updated_at();

create table check_in_rules (
  id uuid primary key default gen_random_uuid(),
  first_ceremony_at time not null unique,
  recommended_check_in time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger check_in_rules_set_updated_at
before update on check_in_rules
for each row execute function set_updated_at();

alter table positions enable row level security;
alter table venue_settings enable row level security;
alter table check_in_rules enable row level security;
