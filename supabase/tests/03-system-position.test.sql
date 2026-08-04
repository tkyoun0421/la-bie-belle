begin;
select plan(8);

select throws_ok(
  $$delete from positions where code = 'team_lead'$$,
  'P0001',
  null,
  'system position cannot be deleted'
);

select throws_ok(
  $$update positions set is_active = false where code = 'team_lead'$$,
  'P0001',
  null,
  'system position cannot be deactivated'
);

select throws_ok(
  $$update positions set code = 'renamed' where code = 'team_lead'$$,
  'P0001',
  null,
  'system position code cannot change'
);

select throws_ok(
  $$update positions set code = null where code = 'team_lead'$$,
  'P0001',
  null,
  'system position code cannot be cleared'
);

select lives_ok(
  $$update positions set name = '팀리더' where code = 'team_lead'$$,
  'system position display name can change'
);

select lives_ok(
  $$insert into positions (name, default_required_count, gender_requirement)
    values ('임시 포지션', 1, 'any')$$,
  'ordinary position can be created'
);

select lives_ok(
  $$update positions set is_active = false where name = '임시 포지션'$$,
  'ordinary position can be deactivated'
);

select lives_ok(
  $$delete from positions where name = '임시 포지션'$$,
  'ordinary position can be deleted'
);

select * from finish();
rollback;
