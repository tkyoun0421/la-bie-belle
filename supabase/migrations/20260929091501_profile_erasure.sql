-- 비우기가 Postgres 밖으로 한 번 나간다. `auth.users`를 지우는 길은 Admin API뿐인데 Postgres
-- 함수가 외부 HTTP를 못 불러서, cron이 조건을 보고 pg_net이 Edge Function을 쏜다
-- (account/design.md 「비우기」). 이 저장소가 pg_net을 처음 켜는 자리다.
create extension if not exists pg_net;

-- pg_cron은 요청 만료 배치가 이미 켰다(20260927091506_schedule_requests.sql).
create extension if not exists pg_cron;

-- 퇴사한 지 1년이 지난 사람의 개인정보를 비우고 계정 삭제를 쏜다(ACC-011).
--
-- 시각을 인자로 받는 것은 경계 테스트 때문이다. cron이 부르는 함수라 실제 시계로는 1년
-- 경계를 양쪽에서 못 때린다 — `now()`를 넘기는 유일한 호출자가 아래 cron 등록이다
-- (data-access.md 「함수 안의 규칙」).
create function internal.erase_profiles(p_now timestamptz)
  returns void
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_profile_ids uuid[];
  v_owner_folders text[];
  v_url text;
  v_service_key text;
  v_user_id uuid;
begin
  -- `left_at`이 널이면 비교가 참이 안 돼 퇴사 안 한 사람은 처음부터 밖이다.
  -- `erased_at is null`이 멱등을 지킨다 — 두 번 돌아도 먼저 찍힌 시각이 안 밀린다.
  select
    coalesce(array_agg(id), '{}'::uuid[]),
    coalesce(
      array_agg(user_id::text) filter (where user_id is not null),
      '{}'::text[]
    )
  into v_profile_ids, v_owner_folders
  from public.profiles
  where left_at <= p_now - interval '1 year'
    and erased_at is null;

  delete from public.profile_private
  where profile_id = any(v_profile_ids);

  -- `avatars`는 공개 버킷이라 `photo_url`만 널로 만들면 주소를 아는 사람에게 얼굴이 계속
  -- 열린다(account/design.md 「비우기」). 객체 경로가 `<user_id>/<uuid>.<확장자>`라 첫 칸으로
  -- 고른다 — 사진 올리는 정책이 그 꼴을 강제한다
  -- (20260927091501_profile_submit_checks_and_avatars.sql).
  --
  -- `storage.protect_delete` 트리거가 표를 직접 지우는 것을 막는다. 실수로 지운 행이 파일을
  -- 백엔드에 고아로 남기기 때문인데, 여기는 그 고아를 받아들이고 행을 지운다 — 행이 없으면
  -- 공개 주소가 404라 얼굴이 닫힌다. 트리거가 보는 스위치를 이 문장 하나에만 열고 바로 닫아
  -- 같은 트랜잭션의 다른 문장에는 안 남긴다.
  perform set_config('storage.allow_delete_query', 'true', true);

  delete from storage.objects
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = any(v_owner_folders);

  perform set_config('storage.allow_delete_query', 'false', true);

  -- `display_name`과 배정·인증·시급 행은 남는다. 통계와 지난 근무표가 그 이름 위에 서 있고
  -- 알림 행에는 종류와 목적지만 들어 활동 기록으로 안 센다(ACC-011).
  update public.profiles
  set photo_url = null,
      erased_at = p_now
  where id = any(v_profile_ids);

  -- 쏘는 단계를 제 트랜잭션에 가둔다. 한 덩이로 두면 `net.http_post`가 던진 예외에 방금 지운
  -- 개인정보가 롤백으로 되살아나고, 같은 실패가 날마다 되풀이돼 비우기가 영영 안 끝난다
  -- (account/design.md 「비우기」).
  begin
    select decrypted_secret into v_url
    from vault.decrypted_secrets
    where name = 'erase_account_url';

    select decrypted_secret into v_service_key
    from vault.decrypted_secrets
    where name = 'erase_account_service_role_key';

    -- 주소도 키도 vault에만 산다. 마이그레이션에는 비밀의 이름만 들어간다.
    if v_url is null or v_service_key is null then
      raise exception 'vault에 erase_account_url과 erase_account_service_role_key가 있어야 한다';
    end if;

    -- 그날 비운 행만 보는 것이 아니다. 계정이 안 지워진 행은 `user_id`를 그대로 들고 같은
    -- 조건에 남아 다음 날 다시 잡힌다 — 큐 표가 따로 없는 이유다.
    --
    -- 응답은 안 기다린다. 결과는 다음 날 같은 조건이 말해주고, 같은 행이 이틀 연속 나갈 수
    -- 있어 받는 쪽이 멱등이다.
    for v_user_id in
      select user_id
      from public.profiles
      where erased_at is not null
        and user_id is not null
    loop
      perform net.http_post(
        url := v_url,
        body := jsonb_build_object('user_id', v_user_id),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        )
      );
    end loop;
  exception
    when others then
      raise warning 'erase_profiles: erase-account 호출이 실패했다 — %', sqlerrm;
  end;
end;
$$;

-- 한국 시각 새벽 4시에 하루 한 번이다. 사람이 앱을 안 보는 시각이라 비우는 중에 화면이
-- 흔들리는 것을 안 본다(account/design.md 「비우기」). crontab은 UTC로 읽혀 19시다.
select cron.schedule(
  'erase-profiles',
  '0 19 * * *',
  $$select internal.erase_profiles(now())$$
);

revoke all on all functions in schema internal from anon, authenticated;
