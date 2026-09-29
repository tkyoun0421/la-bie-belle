-- 알림 행을 기기로 내보내는 자리다(notification/design.md 「푸시 보내기」). 경로가 둘이고
-- 부르는 함수는 하나다 — 행이 들어오면 트리거가 Edge Function `send-push`를 쏘고, 놓친 것은
-- 매분 도는 cron이 같은 함수를 다시 부른다.
--
-- pg_net과 pg_cron은 앞선 마이그레이션이 이미 켰다(20260929091501_profile_erasure.sql,
-- 20260927091506_schedule_requests.sql).
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 부치면 접수증 번호가 먼저 오고 기기까지 닿았는지는 십오 분쯤 뒤에 따로 물어야 안다.
-- 그 번호를 여기 적어두고, 긁고 나면 **널로 되돌리는 것이 「긁었다」 표시다** — 열을 하나
-- 더 두면 두 열이 어긋날 자리가 생긴다.
alter table public.notifications
  add column push_receipt_id text;

-- 보낼 행을 잡는다. **한 문장이어야 한다** — 읽고 나서 쓰면 트리거가 쏜 회차와 cron 회차가
-- 그 사이에 겹쳐 같은 행이 두 번 나간다. `update ... returning`의 원자성이 그것을 막는다.
--
-- **주소는 CTE 밖에서 묶는다.** `update ... from public.push_tokens`로 조인하면 주소가 둘인
-- 사람의 행에 매치가 둘 붙어 한쪽만 남는다(NTF-019). 잡는 것은 알림 행이고 주소는 그 뒤에
-- 배열 한 칸으로 따라붙는다.
--
-- **끈 사람의 행은 안 잡힌다.** 행은 그대로 서고 푸시만 안 나간다(NTF-029, 「알림을 받나」).
--
-- **주소가 없는 사람의 행은 잡힌다.** 메시지가 0건이라 아무것도 안 나가고 시도만 오르다
-- 다섯 번째에 멈춘다 — 안 잡는 쪽으로 만들면 그 행이 영영 대상으로 남아, 그 사람이 한 달 뒤
-- 앱을 깔았을 때 지난 알림이 한꺼번에 날아간다.
--
-- `p_ids`가 널이면 조건에 맞는 행 전부다. 트리거는 방금 들어온 id 하나를 넘기고 cron은 널을
-- 넘긴다 — 같은 함수가 두 경로를 받는다.
--
-- 시각을 `p_now`로 받는 것은 2분 경계를 실제 시계로는 양쪽에서 못 때려서다
-- (data-access.md 「함수 안의 규칙」).
create function internal.claim_notifications(p_ids uuid[], p_now timestamptz)
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
    where (p_ids is null or notifications.id = any(p_ids))
      and notifications.pushed_at is null
      and notifications.push_attempts < 5
      and (
        notifications.claimed_at is null
        or notifications.claimed_at < p_now - interval '2 minutes'
      )
      and exists (
        select 1
        from public.profiles
        where profiles.id = notifications.profile_id
          and profiles.notifications_enabled
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

-- 보낸 결과를 쓴다. 성공한 행에 `pushed_at`과 접수증 번호를 찍고, 죽은 주소를 지운다.
--
-- **주소를 지우는 것은 결과를 읽는 자리뿐이다.** 부치는 순간에 오는 실패는 기기가 사라진
-- 것인지 잠깐 막힌 것인지 구별이 안 된다(「푸시 보내기」).
create function internal.settle_push(p_pushed jsonb, p_dead_tokens text[])
  returns void
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  update public.notifications
  set pushed_at = now(),
      push_receipt_id = pushed.receipt_id
  from (
    select
      (entry ->> 'id')::uuid as id,
      entry ->> 'receipt_id' as receipt_id
    from jsonb_array_elements(coalesce(p_pushed, '[]'::jsonb)) as entry
  ) as pushed
  where notifications.id = pushed.id;

  delete from public.push_tokens
  where push_tokens.token = any(coalesce(p_dead_tokens, '{}'::text[]));
end;
$$;

-- 긁을 접수증을 낸다. 열다섯 분은 정본의 수다(「푸시 보내기」).
create function internal.receipts_to_scrape(p_now timestamptz)
  returns table (
    id uuid,
    receipt_id text,
    addresses text[]
  )
  language sql
  security invoker
  set search_path = ''
as $$
  select
    notifications.id,
    notifications.push_receipt_id,
    coalesce(
      (
        select array_agg(push_tokens.token order by push_tokens.token)
        from public.push_tokens
        where push_tokens.profile_id = notifications.profile_id
      ),
      '{}'::text[]
    )
  from public.notifications
  where notifications.push_receipt_id is not null
    and notifications.pushed_at < p_now - interval '15 minutes';
$$;

-- 긁은 뒤다. 접수증 번호를 널로 되돌리는 것이 「긁었다」 표시고, 그것이 곧 다음 회차의
-- 대상에서 빠지는 길이다.
create function internal.clear_receipts(p_ids uuid[], p_dead_tokens text[])
  returns void
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  update public.notifications
  set push_receipt_id = null
  where notifications.id = any(coalesce(p_ids, '{}'::uuid[]));

  delete from public.push_tokens
  where push_tokens.token = any(coalesce(p_dead_tokens, '{}'::text[]));
end;
$$;

-- Edge Function이 닿는 문 넷이다. **서비스 키로도 `internal`은 못 부른다** — PostgREST가
-- 노출 목록 밖의 스키마를 라우팅 단계에서 끊어 키와 무관하게 `PGRST106`이다
-- (data-access.md 「서비스 키 자리」).
--
-- 껍데기의 첫 줄이 `auth.role() is distinct from 'service_role'`을 본다. **`<>`가 아니다** —
-- JWT가 없는 호출은 `auth.role()`이 널이고 널 비교는 널이라 `<>`로 쓰면 검사를 그냥 지난다.
-- 검사가 없으면 로그인한 아무나 `clear_receipts`로 남의 기기 주소를 지운다.
create function public.claim_notifications(p_ids uuid[])
  returns table (
    id uuid,
    profile_id uuid,
    kind text,
    payload jsonb,
    addresses text[]
  )
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using message = 'not_allowed';
  end if;

  return query select * from internal.claim_notifications(p_ids, now());
end;
$$;

create function public.settle_push(p_pushed jsonb, p_dead_tokens text[])
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using message = 'not_allowed';
  end if;

  perform internal.settle_push(p_pushed, p_dead_tokens);
end;
$$;

create function public.receipts_to_scrape()
  returns table (
    id uuid,
    receipt_id text,
    addresses text[]
  )
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using message = 'not_allowed';
  end if;

  return query select * from internal.receipts_to_scrape(now());
end;
$$;

create function public.clear_receipts(p_ids uuid[], p_dead_tokens text[])
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception using message = 'not_allowed';
  end if;

  perform internal.clear_receipts(p_ids, p_dead_tokens);
end;
$$;

-- 쏘는 자리다. 두 경로가 여기서 만난다 — 트리거는 방금 들어온 id 하나를, cron은 널을 넘긴다.
--
-- **인증 헤더를 Vault에서 읽는다.** 정의에 리터럴로 넣으면 마이그레이션에 실려 PUBLIC
-- 저장소에 올라간다(「푸시 보내기」).
--
-- **쏘는 단계가 예외를 삼킨다.** 알림 행을 낳는 것은 사건 함수의 트랜잭션 안이라, 쏘기가
-- 던지면 근무표 확정이나 승인 자체가 롤백된다 — `internal.erase_profiles`가 밟은 자리와
-- 같은 손이다.
--
-- `security invoker`다(data-access.md 「함수 안의 규칙」). `public.notifications`는
-- `anon`·`authenticated`에게 `select`만 열려 있어 행을 넣는 길이 `security definer` 함수와
-- 슈퍼유저뿐이고, 그 둘은 vault와 `net`에 닿는다.
create function internal.call_send_push(p_ids uuid[])
  returns void
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_url text;
  v_service_key text;
begin
  begin
    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'send_push_url';

    select decrypted_secret into v_service_key
    from vault.decrypted_secrets
    where name = 'send_push_service_role_key';

    if v_url is null or v_service_key is null then
      raise exception 'vault에 send_push_url과 send_push_service_role_key가 있어야 한다';
    end if;

    -- 응답을 안 기다린다. 결과는 `settle_push`가 쓰고, 못 쏜 행은 2분 뒤 cron이 다시 잡는다.
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('ids', to_jsonb(p_ids)),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      )
    );
  exception
    when others then
      raise warning 'call_send_push: send-push 호출이 실패했다 — %', sqlerrm;
  end;
end;
$$;

create function internal.call_send_push_on_insert()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  perform internal.call_send_push(array[new.id]);
  return null;
end;
$$;

create trigger notifications_call_send_push
  after insert on public.notifications
  for each row
  execute function internal.call_send_push_on_insert();

-- 놓친 것을 매분 다시 본다. pg_net은 한 번 쏘고 끝이라 트리거가 쏜 회차가 사라지면 그 행을
-- 아무도 안 본다. **보낼 것이 없어도 돈다** — 지난 접수증 긁기가 `send-push`의 첫 단계라,
-- 긁기 전용 cron을 따로 두면 service role을 쥔 자리가 하나 는다(data-access.md 「서비스 키
-- 자리」).
select cron.schedule(
  'retry-push',
  '* * * * *',
  $$select internal.call_send_push(null::uuid[])$$
);

revoke all on all functions in schema internal from anon, authenticated;
