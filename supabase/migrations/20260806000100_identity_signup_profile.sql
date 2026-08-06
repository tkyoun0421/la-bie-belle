create type profile_status as enum ('pending', 'active', 'rejected', 'dormant', 'departed');

alter table profiles
  add column name text not null,
  add column phone text not null unique
    constraint profiles_phone_format check (phone ~ '^01[0-9]{8,9}$'),
  add column gender gender not null,
  add column birth_date date not null,
  add column status profile_status not null default 'pending';

create policy profiles_insert_own_pending
on profiles
for insert
with check (auth.uid() = id and status = 'pending');
