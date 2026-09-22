alter table public.profile_private
  add constraint profile_private_phone_format
  check (phone is null or phone ~ '^010-\d{4}-\d{4}$');

create or replace function public.submit_profile(
  display_name text,
  phone text,
  birth_date date,
  gender text
)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile public.profiles;
begin
  select * into caller_profile
  from public.profiles
  where user_id = auth.uid();

  if not found then
    raise exception using message = 'not_allowed';
  end if;

  if submit_profile.phone is null or submit_profile.phone !~ '^010-\d{4}-\d{4}$' then
    raise exception using message = 'invalid_phone';
  end if;

  if caller_profile.submitted_at is not null and caller_profile.rejected_at is null then
    raise exception using message = 'already_submitted';
  end if;

  update public.profiles
  set display_name = submit_profile.display_name,
      submitted_at = now(),
      rejected_at = null
  where id = caller_profile.id;

  insert into public.profile_private (profile_id, phone, birth_date, gender)
  values (
    caller_profile.id,
    submit_profile.phone,
    submit_profile.birth_date,
    submit_profile.gender
  )
  on conflict (profile_id) do update
  set phone = excluded.phone,
      birth_date = excluded.birth_date,
      gender = excluded.gender;
end;
$$;
