create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own_approved
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    and approved_at is not null
  );
