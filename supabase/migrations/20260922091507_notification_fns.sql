create function internal.active_profile_id()
  returns uuid
  language sql
  stable
  set search_path = ''
as $$
  select id
  from public.profiles
  where user_id = auth.uid()
    and blocked_at is null
    and left_at is null;
$$;

create function public.mark_notifications_read(p_ids uuid[])
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid := internal.active_profile_id();
begin
  if caller_profile_id is null then
    raise exception using message = 'not_allowed';
  end if;

  update public.notifications
  set read_at = now()
  where id = any(p_ids)
    and profile_id = caller_profile_id
    and read_at is null;
end;
$$;

create function public.save_push_token(p_token text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid := internal.active_profile_id();
begin
  if caller_profile_id is null then
    raise exception using message = 'not_allowed';
  end if;

  insert into public.push_tokens (profile_id, token)
  values (caller_profile_id, p_token)
  on conflict (token) do update
  set profile_id = excluded.profile_id,
      created_at = now();
end;
$$;

create function public.remove_push_token(p_token text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid := internal.active_profile_id();
begin
  if caller_profile_id is null then
    raise exception using message = 'not_allowed';
  end if;

  delete from public.push_tokens
  where token = p_token
    and profile_id = caller_profile_id;
end;
$$;

create function public.set_notifications_enabled(p_on boolean)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  caller_profile_id uuid := internal.active_profile_id();
begin
  if caller_profile_id is null then
    raise exception using message = 'not_allowed';
  end if;

  update public.profiles
  set notifications_enabled = p_on
  where id = caller_profile_id;

  if not p_on then
    delete from public.push_tokens
    where profile_id = caller_profile_id;
  end if;
end;
$$;

revoke all on all functions in schema internal from anon, authenticated;
