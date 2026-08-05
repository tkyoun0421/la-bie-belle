begin;
select plan(42);

delete from check_in_rules;
delete from venue_settings;

select has_type('public', 'gender', 'gender enum');
select enum_has_labels('public', 'gender', array['male', 'female'], 'gender labels');
select has_type('public', 'gender_requirement', 'gender_requirement enum');
select enum_has_labels(
  'public',
  'gender_requirement',
  array['any', 'male', 'female'],
  'gender_requirement labels'
);

select has_table('public', 'positions', 'positions table');
select col_is_pk('public', 'positions', 'id', 'positions pk');
select col_type_is('public', 'positions', 'id', 'uuid', 'positions.id type');
select col_type_is('public', 'positions', 'code', 'text', 'positions.code type');
select col_is_unique('public', 'positions', 'code', 'positions.code unique');
select col_is_null('public', 'positions', 'code', 'positions.code nullable');
select col_not_null('public', 'positions', 'name', 'positions.name not null');
select col_is_unique('public', 'positions', 'name', 'positions.name unique');
select col_not_null(
  'public', 'positions', 'default_required_count', 'positions.default_required_count not null'
);
select col_type_is(
  'public', 'positions', 'gender_requirement', 'gender_requirement',
  'positions.gender_requirement type'
);
select col_not_null('public', 'positions', 'is_default', 'positions.is_default not null');
select col_not_null('public', 'positions', 'is_active', 'positions.is_active not null');
select col_type_is(
  'public', 'positions', 'created_at', 'timestamp with time zone', 'positions.created_at type'
);
select col_type_is(
  'public', 'positions', 'updated_at', 'timestamp with time zone', 'positions.updated_at type'
);

select has_table('public', 'venue_settings', 'venue_settings table');
select col_is_pk('public', 'venue_settings', 'id', 'venue_settings pk');
select col_not_null('public', 'venue_settings', 'latitude', 'venue_settings.latitude not null');
select col_not_null('public', 'venue_settings', 'longitude', 'venue_settings.longitude not null');
select col_not_null(
  'public', 'venue_settings', 'gps_radius_m', 'venue_settings.gps_radius_m not null'
);
select col_not_null(
  'public', 'venue_settings', 'location_accuracy_limit_m',
  'venue_settings.location_accuracy_limit_m not null'
);
select col_not_null(
  'public', 'venue_settings', 'default_hourly_wage', 'venue_settings.default_hourly_wage not null'
);

select has_table('public', 'check_in_rules', 'check_in_rules table');
select col_is_pk('public', 'check_in_rules', 'id', 'check_in_rules pk');
select col_type_is(
  'public', 'check_in_rules', 'first_ceremony_at', 'time without time zone',
  'check_in_rules.first_ceremony_at type'
);
select col_is_unique(
  'public', 'check_in_rules', 'first_ceremony_at', 'check_in_rules.first_ceremony_at unique'
);
select col_type_is(
  'public', 'check_in_rules', 'recommended_check_in', 'time without time zone',
  'check_in_rules.recommended_check_in type'
);

select throws_ok(
  $$insert into positions (name, default_required_count, gender_requirement)
    values ('   ', 1, 'any')$$,
  '23514',
  null,
  'blank position name rejected'
);

select throws_ok(
  $$insert into positions (name, default_required_count, gender_requirement)
    values ('음수 인원', -1, 'any')$$,
  '23514',
  null,
  'negative required count rejected'
);

select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (37.5, 127.0, 0, 100, 12000)$$,
  '23514',
  null,
  'zero gps radius rejected'
);

select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (91.0, 127.0, 100, 100, 12000)$$,
  '23514',
  null,
  'latitude above 90 rejected'
);

select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (-91.0, 127.0, 100, 100, 12000)$$,
  '23514',
  null,
  'latitude below -90 rejected'
);

select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (37.5, 181.0, 100, 100, 12000)$$,
  '23514',
  null,
  'longitude above 180 rejected'
);

select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (37.5, 127.0, 100, 0, 12000)$$,
  '23514',
  null,
  'zero accuracy limit rejected'
);

select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (37.5, 127.0, 100, 100, -1)$$,
  '23514',
  null,
  'negative hourly wage rejected'
);

select lives_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (37.5, 127.0, 1, 1, 0)$$,
  'boundary values inside range accepted'
);

select throws_ok(
  $$insert into venue_settings
      (latitude, longitude, gps_radius_m, location_accuracy_limit_m, default_hourly_wage)
    values (37.6, 127.1, 100, 100, 12000)$$,
  '23505',
  null,
  'second venue_settings row rejected'
);

select lives_ok(
  $$insert into check_in_rules (first_ceremony_at, recommended_check_in)
    values ('06:00', '05:00')$$,
  'new ceremony time accepted'
);

select throws_ok(
  $$insert into check_in_rules (first_ceremony_at, recommended_check_in)
    values ('06:00', '04:30')$$,
  '23505',
  null,
  'duplicate ceremony time rejected so the table stays a function'
);

select * from finish();
rollback;
