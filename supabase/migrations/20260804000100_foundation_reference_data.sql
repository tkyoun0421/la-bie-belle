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
