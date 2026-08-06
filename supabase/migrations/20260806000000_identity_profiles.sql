create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy profiles_select_own
on profiles
for select
using (auth.uid() = id);
