begin;
select plan(15);

select set_eq(
  $$select name, default_required_count, gender_requirement::text, is_default
    from positions$$,
  $$values
      ('팀장'::text,        1, 'any'::text,    false),
      ('스캔'::text,        1, 'any'::text,    false),
      ('메인'::text,        1, 'any'::text,    false),
      ('드레스'::text,      1, 'female'::text, false),
      ('축가'::text,        1, 'any'::text,    true),
      ('매니저'::text,      2, 'any'::text,    true),
      ('안내'::text,        2, 'male'::text,   true),
      ('드레스실'::text,    1, 'female'::text, false),
      ('신부 대기실'::text, 1, 'female'::text, false)$$,
  'positions match the PRD table'
);

select is(
  (select count(*)::int from positions),
  9,
  'exactly nine seeded positions'
);

select is(
  (select name from positions where code = 'team_lead'),
  '팀장',
  'team_lead code maps to 팀장'
);

select is(
  (select count(*)::int from positions where code is not null),
  1,
  'team_lead is the only system position'
);

select is(
  (select count(*)::int from positions where not is_active),
  0,
  'every seeded position starts active'
);

select is(
  (select gps_radius_m from venue_settings),
  100,
  'gps radius is 100m'
);

select is(
  (select location_accuracy_limit_m from venue_settings),
  100,
  'location accuracy limit is 100m'
);

select is(
  (select count(*)::int from venue_settings),
  1,
  'exactly one venue_settings row'
);

select set_eq(
  $$select first_ceremony_at::text, recommended_check_in::text from check_in_rules$$,
  $$values
      ('10:00:00'::text, '08:20:00'::text),
      ('11:00:00'::text, '09:10:00'::text)$$,
  'check-in rules match the PRD initial rules'
);

insert into positions (code, name, default_required_count, gender_requirement, is_default)
values
  ('team_lead', '팀장', 1, 'any', false),
  (null, '스캔', 1, 'any', false),
  (null, '메인', 1, 'any', false),
  (null, '드레스', 1, 'female', false),
  (null, '축가', 1, 'any', true),
  (null, '매니저', 2, 'any', true),
  (null, '안내', 2, 'male', true),
  (null, '드레스실', 1, 'female', false),
  (null, '신부 대기실', 1, 'female', false)
on conflict do nothing;

insert into venue_settings (
  latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage
)
select 37.566500, 126.978000, 100, 100, 12000
where not exists (select 1 from venue_settings);

insert into check_in_rules (first_ceremony_at, recommended_check_in)
values
  ('10:00', '08:20'),
  ('11:00', '09:10')
on conflict (first_ceremony_at) do nothing;

select is(
  (select count(*)::int from positions),
  9,
  'reapplied position insert leaves nine rows'
);
select is(
  (select count(*)::int from venue_settings),
  1,
  'reapplied venue insert leaves one row'
);
select is(
  (select count(*)::int from check_in_rules),
  2,
  'reapplied check-in insert leaves two rows'
);

update positions set name = '총괄 팀장' where code = 'team_lead';

select lives_ok(
  $$insert into positions (code, name, default_required_count, gender_requirement, is_default)
    values
      ('team_lead', '팀장', 1, 'any', false),
      (null, '스캔', 1, 'any', false),
      (null, '메인', 1, 'any', false),
      (null, '드레스', 1, 'female', false),
      (null, '축가', 1, 'any', true),
      (null, '매니저', 2, 'any', true),
      (null, '안내', 2, 'male', true),
      (null, '드레스실', 1, 'female', false),
      (null, '신부 대기실', 1, 'female', false)
    on conflict do nothing$$,
  'reapply after renaming the system position does not abort'
);

select is(
  (select count(*)::int from positions),
  9,
  'renamed reapply still leaves nine rows'
);
select is(
  (select name from positions where code = 'team_lead'),
  '총괄 팀장',
  'renamed system position is not overwritten by reapply'
);

select * from finish();
rollback;
