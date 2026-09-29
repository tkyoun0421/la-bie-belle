-- 공휴일 받기도 Postgres 밖으로 한 번 나간다. Postgres 함수가 외부 HTTP를 못 불러서, cron이
-- 조건을 보고 pg_net이 Edge Function `import-holidays`를 쏜다 — 그 함수가 공공 API를 부르고
-- 결과를 `internal.import_holidays`에 넘긴다(payroll/design.md 「공휴일 받기」).
--
-- 둘 다 앞선 마이그레이션이 이미 켰다. pg_net은 비우기가(20260929091501_profile_erasure.sql),
-- pg_cron은 요청 만료 배치가(20260927091506_schedule_requests.sql) 켠다.
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 다음 해 공휴일이 안 받아졌으면 받아오기를 쏜다(PAY-023).
--
-- **완료 표시가 데이터 자체다.** 받았다는 것을 적는 열이 없고 「그 해에 `api` 행이 있나」가
-- 곧 조건이다 — `internal.erase_profiles`가 `user_id`의 유무를 보는 것과 같은 꼴이다.
-- 그래서 한 해에 실제로 밖을 부르는 것은 한 번이고, 그 한 번이 성공하면 이듬해까지 질의
-- 하나로 끝난다.
--
-- **`manual` 행은 안 센다.** 관리자가 손으로 켠 임시공휴일 하나가 그 해를 「받아진 해」로
-- 만들면 받아오기가 영영 안 돈다.
--
-- **다음 해만 본다.** 올해가 비어 있는 것은 이 함수가 못 고친다 — 첫 배포 때 손으로 채운다.
--
-- **`internal` 스키마라 호출자 검사가 없다.** cron만 부른다(data-access.md 「함수 안의 규칙」).
create function internal.fetch_holidays()
  returns void
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  -- crontab이 UTC로 읽히니 해도 UTC로 센다.
  v_year integer := extract(year from (now() at time zone 'utc'))::integer + 1;
  v_url text;
  v_service_key text;
begin
  if exists (
    select 1
    from public.holidays
    where holidays.source = 'api'
      and holidays.holiday_date >= make_date(v_year, 1, 1)
      and holidays.holiday_date < make_date(v_year + 1, 1, 1)
  ) then
    return;
  end if;

  -- 쏘는 단계가 예외를 삼킨다. vault 항목이 비면 여기가 예외를 던지는데 그것이 밖으로 나가면
  -- cron 작업이 날마다 실패로 남아 로그가 못 읽을 것이 된다 — `internal.erase_profiles`가 같은
  -- 손을 쓴다.
  begin
    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'import_holidays_url';

    select decrypted_secret into v_service_key
    from vault.decrypted_secrets
    where name = 'import_holidays_service_role_key';

    -- 주소도 키도 vault에만 산다. 마이그레이션에는 비밀의 이름만 들어간다.
    if v_url is null or v_service_key is null then
      raise exception 'vault에 import_holidays_url과 import_holidays_service_role_key가 있어야 한다';
    end if;

    -- 응답을 안 기다린다. 결과는 Edge Function이 `import_holidays`로 넣고, 그 성패는 다음 날
    -- 같은 조건이 말해준다 — 날마다 도는 것이 곧 재시도라 실패 큐가 없다.
    --
    -- 어느 해를 받는지는 여기가 정한다. 비어 있는 해를 아는 자리가 이 조건 하나여야 받는 쪽이
    -- 같은 계산을 두 번 하지 않는다.
    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('year', v_year),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      )
    );
  exception
    when others then
      raise warning 'fetch_holidays: import-holidays 호출이 실패했다 — %', sqlerrm;
  end;
end;
$$;

-- 받는 쪽이다. 알맹이는 `internal.import_holidays`인데 **서비스 키로도 `internal`은 못 부른다**
-- — PostgREST가 노출 목록(`public`·`graphql_public`) 밖의 스키마를 라우팅 단계에서 끊어 키와
-- 무관하게 `PGRST106`이다. 그래서 Edge Function이 닿는 문을 `public`에 세운다
-- (data-access.md 「서비스 키 자리」).
--
-- **`internal`을 노출 목록에 넣는 길은 안 간다.** 그 한 줄이 신원을 인자로 받는 다른 `internal`
-- 함수까지 같이 연다.
--
-- 껍데기·알맹이의 평소 관례 그대로다 — 호출자 검사는 여기가 하고 알맹이는 안 한다. 다른
-- 껍데기가 `is_admin()`을 보는 자리에서 이것만 `auth.role()`을 보는데, 부르는 것이 사람이
-- 아니라 cron이 쏘는 Edge Function이라 볼 프로필이 없어서다.
create function public.import_holidays(p_year integer, p_rows jsonb)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  -- `is distinct from`이다. JWT가 없는 호출은 `auth.role()`이 널이고, `<>`로 쓰면 널 비교가
  -- 널이라 조건이 거짓이 되어 그대로 통과한다.
  if auth.role() is distinct from 'service_role' then
    raise exception using message = 'not_allowed';
  end if;

  perform internal.import_holidays(p_year, p_rows);
end;
$$;

-- 한국 시각 새벽 3시에 하루 한 번이다. crontab은 UTC로 읽혀 18시다. 비우기가 새벽 4시라
-- 한 시간 앞에 둔다 — 둘이 같은 시각에 몰릴 이유가 없고 갈라두면 로그를 읽기 쉽다.
select cron.schedule(
  'fetch-holidays',
  '0 18 * * *',
  $$select internal.fetch_holidays()$$
);

revoke all on all functions in schema internal from anon, authenticated;
