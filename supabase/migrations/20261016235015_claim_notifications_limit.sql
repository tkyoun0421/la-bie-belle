-- 보낼 행을 한 번에 오래된 것부터 500행까지만 잡는다(notification/design.md 「푸시 보내기」).
-- 잡힌 행은 `rpc` 응답으로 돌아와야 보내지는데, PostgREST `max_rows`(1000)를 넘긴 행은
-- 잡히고도 안 돌아와 시도만 오른다. 남은 행은 다음 회차의 `retry_push`가 잡는다.
--
-- `create or replace`는 함수의 권한을 그대로 둔다 — `PUBLIC`에서 걷은 EXECUTE가 안 돌아온다
-- (20261015074243_internal_functions_revoke_public.sql).
create or replace function internal.claim_notifications(p_ids uuid[], p_now timestamptz)
  returns table (
    id uuid,
    profile_id uuid,
    kind text,
    payload jsonb,
    addresses text[]
  )
  language sql
  security invoker
  set search_path = ''
as $$
  with claimed as (
    update public.notifications
    set claimed_at = p_now,
        push_attempts = notifications.push_attempts + 1
    where notifications.id in (
      select candidates.id
      from public.notifications as candidates
      where (p_ids is null or candidates.id = any(p_ids))
        and candidates.pushed_at is null
        and candidates.push_attempts < 5
        and (
          candidates.claimed_at is null
          or candidates.claimed_at < p_now - interval '2 minutes'
        )
        and exists (
          select 1
          from public.profiles
          where profiles.id = candidates.profile_id
            and profiles.notifications_enabled
        )
      order by candidates.created_at, candidates.id
      limit 500
      for update of candidates skip locked
    )
    returning
      notifications.id,
      notifications.profile_id,
      notifications.kind,
      notifications.payload
  )
  select
    claimed.id,
    claimed.profile_id,
    claimed.kind,
    claimed.payload,
    coalesce(
      (
        select array_agg(push_tokens.token order by push_tokens.token)
        from public.push_tokens
        where push_tokens.profile_id = claimed.profile_id
      ),
      '{}'::text[]
    )
  from claimed;
$$;

revoke execute on function internal.claim_notifications(uuid[], timestamptz) from public;
