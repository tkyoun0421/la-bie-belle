create function save_push_subscription(
  target_endpoint text,
  target_p256dh text,
  target_auth text
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception '인증이 필요합니다' using errcode = '42501';
  end if;

  insert into push_subscriptions (profile_id, endpoint, p256dh, auth)
  values (actor_id, target_endpoint, target_p256dh, target_auth)
  on conflict (endpoint) do update
    set profile_id = excluded.profile_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        disabled_at = null;
end;
$$;

revoke execute on function save_push_subscription(text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function save_push_subscription(text, text, text) to authenticated;

create function remove_push_subscription(target_endpoint text) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception '인증이 필요합니다' using errcode = '42501';
  end if;

  update push_subscriptions
    set disabled_at = coalesce(disabled_at, now())
    where endpoint = target_endpoint
      and profile_id = actor_id;
end;
$$;

revoke execute on function remove_push_subscription(text)
  from public, anon, authenticated, service_role;
grant execute on function remove_push_subscription(text) to authenticated;
