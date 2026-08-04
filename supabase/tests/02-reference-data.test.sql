begin;
select plan(9);

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

select * from finish();
rollback;
