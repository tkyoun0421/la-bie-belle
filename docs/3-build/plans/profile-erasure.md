---
sources:
  - ../../2-design/modules/account/design.md#퇴사-1년-뒤
  - ../../2-design/modules/account/design.md#비우기
  - ../../2-design/modules/account/design.md#사진-저장
  - ../../2-design/modules/account/README.md#acc-011
  - ../../2-design/system/data-access.md#이름과-자리
  - ../../2-design/system/data-access.md#함수-안의-규칙
  - ../../2-design/system/data-access.md#서비스-키-자리
  - ../../2-design/system/data-access.md#오류의-모양
  - ../../2-design/modules/notification/design.md#푸시-보내기
---

# 퇴사 1년 뒤 비우기를 만든다 — 구현 계획

## 입력 명세·기준

정본은 [account/design.md](../../2-design/modules/account/design.md#퇴사-1년-뒤)의 [퇴사 1년 뒤](../../2-design/modules/account/design.md#퇴사-1년-뒤)와 [비우기](../../2-design/modules/account/design.md#비우기)다. 업무 규칙은 [ACC-011](../../2-design/modules/account/README.md#acc-011)이다.

pg_cron 작업 하나(`erase_profiles`)와 Edge Function 하나(`erase-account`)가 이 task의 산출이다. **표도 화면도 안 만든다** — `profiles.erased_at`과 `profile_private`는 [`account-data`](account-data.md#ac-01)가 이미 냈다.

선행이 둘이다. [`account-data`](account-data.md)가 비울 표와 열을 냈고, [`edge-function-import`](edge-function-import.md)가 Deno가 `supabase/functions` 밖을 읽는지를 확인했다.

정본에서 확인한 넷이 plan의 방향을 정한다.

- **「삭제」가 비우기다.** 지우는 것은 `profile_private` 행과 사진이고 `display_name`과 배정·인증·시급 FK는 남는다([비우기](../../2-design/modules/account/design.md#비우기)). 통계와 지난 근무표가 그 이름 위에 서 있어서다
- **계기와 호출이 갈린다.** `auth.users`를 지우는 길은 Admin API뿐인데 Postgres 함수가 외부 HTTP를 못 부른다. pg_cron이 조건을 보고 `pg_net`으로 Edge Function을 쏘면 그 함수가 서비스 키로 계정을 지운다
- **완료 표시가 데이터 자체다.** 큐 표가 없다. `user_id`가 `on delete set null`이라 계정이 사라지면 그 열이 널이 되고, 다음 날 cron이 「`erased_at`은 있고 `user_id`도 있는」 행을 다시 본다 — 그것이 재시도다([비우기](../../2-design/modules/account/design.md#비우기))
- **비우는 것과 계정을 지우는 것이 한 번에 안 끝난다.** DB 함수가 개인정보를 지운 시점과 계정이 사라진 시점 사이가 길면 하루다. 그 사이의 행은 이름과 `erased_at`만 든 채 `user_id`를 아직 들고 있다

`erase-account`가 서비스 키를 쥐는 자리 둘 중 하나다 — 나머지 하나가 알림의 `send-push`다([서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리)).

저장소에서 확인한 것이 셋이다. pg_cron은 `supabase/migrations/20260927091506_schedule_requests.sql` 첫 줄이 이미 켰고, `supabase/functions` 폴더는 아직 없고, CI는 `supabase start -x ... edge-runtime`으로 edge-runtime을 빼고 띄운다(`.github/workflows/ci.yml`).

## 완료 조건

### AC-01

**비우는 함수.**

`internal.erase_profiles(p_now timestamptz)` — pg_cron이 날마다 한 번 부른다.

- 대상은 `left_at`이 `p_now`보다 1년 이상 전이고 `erased_at`이 널인 `profiles` 행이다. **`left_at`이 널이면 비교가 참이 안 돼 조건에 안 든다** — 퇴사 안 한 사람은 처음부터 밖이다
- 그 행의 `profile_private`를 지우고 `photo_url`을 널로, `erased_at`을 `p_now`로 찍는다
- **`avatars` 버킷의 그 사람 객체도 같이 지운다.** 공개 버킷이라 행만 비우면 주소를 아는 사람에게 얼굴이 계속 열린다([비우기](../../2-design/modules/account/design.md#비우기)). 객체는 `storage.objects`에 살아 같은 함수 안에서 지운다 — 밖으로 나갈 일이 없다
- **알림 행은 안 비운다.** [ACC-011](../../2-design/modules/account/README.md#acc-011)이 활동 기록을 안 지운다고 정했고 알림 행에는 종류와 목적지만 든다
- **`display_name`은 남는다.** 배정·인증·시급 FK도 그대로다([비우기](../../2-design/modules/account/design.md#비우기))
- **`internal` 스키마라 호출자 검사가 없다.** cron만 부른다([이름과 자리](../../2-design/system/data-access.md#이름과-자리)). `security invoker`로 둔다 — `internal`에 걸린 의도된 예외다([함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙))
- **시각 경계가 들어 `p_now`를 인자로 받는다.** 껍데기가 `now()`를 넘기는 유일한 호출자고 테스트는 그 자리로 1년 경계를 때린다([함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙))
- `erased_at is null` 조건이 멱등을 지킨다. 두 번 돌아도 먼저 찍힌 시각이 안 밀린다

### AC-02

**쏘는 단계.**

같은 함수의 둘째 단계다. 비우기가 끝난 뒤 이어 돈다.

- 조건은 `erased_at`이 있고 `user_id`도 있는 행 전부다. **그날 비운 행만 보는 것이 아니다** — 어제 못 지운 계정이 이 조건에 그대로 남아 다시 잡힌다
- 행마다 `pg_net`으로 Edge Function `erase-account`를 한 번 쏜다. 본문에 그 행의 `user_id`를 싣는다
- **응답을 안 기다린다.** `pg_net`이 응답을 제 표에 남기지만 이 함수는 안 읽는다. 결과는 다음 날 같은 조건이 말해준다
- **같은 행이 이틀 연속 나갈 수 있다.** 계정이 지워졌는데 그 행의 `user_id`가 아직 널이 아닌 순간이 있어서다 — 받는 쪽이 멱등이어야 한다([AC-03](#ac-03))
- **쏘기가 던진 예외를 삼킨다.** `begin ... exception when others then raise warning ...; end`로 감싸 [AC-01](#ac-01)이 지운 것이 롤백에 되살아나지 않게 한다([비우기](../../2-design/modules/account/design.md#비우기)). `net.http_post`는 vault 항목이 비었거나 주소가 널이면 예외를 던지는데, 한 트랜잭션으로 두면 그날 비우기가 통째로 없던 일이 되고 다음 날 같은 실패가 되풀이돼 **개인정보가 영영 안 지워진다**
- Edge Function 주소와 서비스 키는 `vault`에 둔다. **마이그레이션에는 비밀의 이름만 들어가고 값이 안 들어간다**
- **로컬 테스트는 그 vault 항목을 스스로 만든다.** 이름만 있고 값이 없으면 `net.http_post`가 아예 안 불려 쏘는 조건을 못 본다. `seed.sql`로 심으면 `supabase db reset`마다 도는 전역 상태가 돼 다른 테스트에 새니, 테스트가 `beforeAll`에서 `vault.create_secret`으로 로컬 전용 가짜 주소(`http://127.0.0.1:54321/functions/v1/erase-account`)를 넣고 끝나며 지운다. [`payroll-holidays`](payroll-holidays.md)가 같은 구멍을 안고 있어 그 task도 이 길을 쓴다

### AC-03

**Edge Function `erase-account`.**

`supabase/functions/erase-account/index.ts` — **저장소의 첫 Edge Function이다.** 폴더부터 이 task가 만든다.

- 본문의 `user_id`를 받아 service role로 Supabase Admin API를 불러 `auth.users` 행을 지운다([서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리))
- **없는 계정이면 성공으로 끝낸다.** 이미 지운 행이 한 번 더 오는 것이 정상 경로다([AC-02](#ac-02))
- **호출자가 service role인지 본다.** 아무나 부르면 남의 계정이 사라지는 자리고, 유효한 토큰인지만 보는 기본 검사로는 anon 키도 통과한다
- **`src/`의 함수를 안 부른다.** 받은 id 하나를 Admin API에 넘기는 것이 전부고 판단이 없다. 그래서 [notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기)가 적은 `_shared/` 복사 단계가 **이 task에 안 든다** — 그 단계는 알림 task의 plan이 든다
- 로그에 성공·실패와 지운 id를 남긴다. 사람이 안 보는 동작이라 로그가 유일한 창이다

### AC-04

**cron 등록과 확장.**

- `create extension if not exists pg_net` — **아직 아무도 안 켠 확장이라 이 task가 켠다.** [`payroll-holidays`](payroll-holidays.md#ac-03)가 같은 둘을 쓰니 먼저 선 쪽이 만들고 뒤는 `if not exists`로 지난다
- `create extension if not exists pg_cron` — [`schedule-requests`](schedule-requests.md#ac-04)가 이미 켰다
- **한국 시각 새벽 4시에 하루 한 번이다**([비우기](../../2-design/modules/account/design.md#비우기)). crontab은 UTC로 읽혀 `0 19 * * *`고, 같은 마이그레이션 파일에 든다. 로컬에서도 같은 줄이 돌아 `pnpm test:integration:run`이 작업의 존재를 본다([`schedule-requests`](schedule-requests.md#ac-04)의 선례)
- 등록하는 문장이 `internal.erase_profiles(now())`를 부른다 — `p_now`에 실제 시각이 들어가는 유일한 자리다
- **작업 이름은 `erase-profiles`다.** `cron.job`을 읽는 테스트가 그 이름으로 단언하고, `expire-requests`가 같은 꼴로 앞섰다

### AC-05

**클라이언트가 못 부른다.**

- `internal`은 PostgREST가 모르는 스키마다. `supabase/config.toml`의 노출 목록이 `["public", "graphql_public"]`이고 마이그레이션이 `revoke all on all functions in schema internal from anon, authenticated`를 건다
- **integration이 그것을 단언한다.** 로그인한 클라이언트가 `rpc("erase_profiles")`를 불러 못 잡히는 것을 본다 — `import_holidays`가 같은 테스트를 이미 들고 있다
- [함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙)은 신원을 인자로 안 받는 `internal` 함수에 이 테스트를 면제한다. **면제되는 쪽인데도 낸다** — 뚫렸을 때 사라지는 것이 개인정보라 한 겹을 더 둔다
- **다만 이 테스트가 보는 것은 세 겹 중 라우팅 한 겹이다.** `internal`이 `config.toml`의 노출 목록에 없으면 PostgREST가 함수 이름을 몰라 요청이 Postgres까지 안 간다 — `revoke` 두 줄이 통째로 빠져도 초록이 난다. 저장소에 선 같은 테스트가 다 그렇고([관찰 031](../../observations/031-internal-exposure-test-covers-one-layer.md)) 이 task가 만든 구멍이 아니다. 「세 겹을 지킨다」의 근거로 쓰지 않는다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_profile_erasure.sql` — **날짜 자리는 구현이 정한다** | 확장 둘, `internal.erase_profiles`, cron 등록, `revoke` | AC-01·AC-02·AC-04·AC-05 |
| `supabase/functions/erase-account/index.ts` | Admin API로 `auth.users` 지우기. 저장소의 첫 Edge Function이다 | AC-03 |
| `supabase/config.toml` | `erase-account` 함수 항목과 호출자 검사 설정 | AC-03 |
| `src/entities/profile/api/__tests__/erase-profiles.integration.test.ts` | 1년 경계, 남는 것, 사진 객체가 사라지는 것, 알림 행이 남는 것, 멱등, 쏘는 조건, `internal` 노출 | AC-01·AC-02·AC-04·AC-05 |
| `tests/integration/postgres.ts` | 퇴사 시각을 과거로 미는 헬퍼 | AC-01 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `integration-test-writer` → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-05를 배정한다. **unit이 없다** — 함수 안에 판단이 없고 Edge Function은 Admin API 호출 하나라 전부 integration과 손 확인이다
2. `integration-test-writer`가 `erase_profiles`를 직접 불러 경계를 쓴다. `p_now`를 경계 하루 전과 하루 뒤로 넘겨 두 방향을 본다. 퇴사 시각을 과거로 미는 헬퍼가 그 테스트의 입력이라 같이 온다
3. `implementer`가 확장 → 함수 → cron 등록 → Edge Function 순으로 초록을 만든다. 확장이 먼저 서야 `net.http_post`를 부르는 줄이 컴파일된다
4. `pr-diff`가 diff를 본다 — **서비스 키와 함수 주소가 커밋에 든 줄이 없는지.** 공개 저장소라 이 확인이 이 task에서 가장 무겁다
5. 배포 뒤 첫 실행을 손으로 확인하고 결과를 [backlog.md](../../backlog.md)에 적는다

## 리스크·전환·되돌리기

- **지워진 개인정보는 안 돌아온다.** 되돌리기 마이그레이션이 cron을 지워도 이미 빈 행은 그대로다. 조건 한 줄이 틀리면 — 1년이 한 달이 되거나 `erased_at is null`이 빠지면 — 그 실수가 영구다. **경계 테스트가 이 task의 중심인 이유가 이것이다**
- **계정 삭제도 같은 방향이다.** `auth.users` 행이 사라지면 그 사람은 다시 로그인하지 못한다. 프로필 행은 남지만 계정에 다시 잇는 길은 1차에 없다
- **로컬에서 Edge Function이 안 돈다.** CI가 edge-runtime을 빼고 Supabase를 띄운다(`.github/workflows/ci.yml`). integration은 `pg_net` 호출이 나갔는지까지만 보고 **실제로 `auth.users`가 사라지는 것은 배포 뒤 손 확인이다** — [`payroll-holidays`](payroll-holidays.md#리스크전환되돌리기)가 적은 한계와 같은 자리다
- **조용히 안 돈다.** 사람이 안 보는 동작이라 실패가 알림으로 안 온다. `erased_at`이 안 찍히거나 `user_id`가 계속 남아 있는 것을 눈치채는 자리가 없다 — 1차에서는 로그와 손 확인이 전부다
- **비운 뒤 계정이 남아 있는 창이 길면 하루다.** 그 사이 본인이 로그인하면 이름과 지난 급여·근무 기록을 그대로 본다 — 셋 다 안 지우는 것이라 화면이 비는 자리는 없다([비우기](../../2-design/modules/account/design.md#비우기)). 다만 **그 창에서 프로필 화면이 널이 된 사진과 없어진 연락처를 어떻게 그리는지는 손으로 봐야 한다**
- **사진 파일 지우기가 `storage.objects`를 직접 때린다.** Storage API가 아니라 SQL로 지우는 자리라 경로 규칙(`<user_id>/<uuid>.jpg`)이 바뀌면 조용히 아무것도 안 지운다. 지운 개수를 세는 단언이 필요하다
- 되돌리기는 cron 등록을 지우는 마이그레이션이다 — `cron.unschedule`로 항목을 뺀다. Edge Function은 배포를 내린다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 1년이 안 지난 사람이 비워진다 | integration `src/entities/profile/api/__tests__/erase-profiles.integration.test.ts`(예정) | `pnpm test:integration:run`, 로컬 Supabase | `p_now`가 경계 하루 전이면 그 행이 그대로다 |
| AC-01 | 1년이 지났는데 안 비워진다 | integration 위 | 위와 같다 | 하루 뒤면 `profile_private` 행이 없고 `photo_url`이 널이고 `erased_at`이 찍힌다 |
| AC-01 | 남아야 할 것이 같이 사라진다 | integration 위 | 위와 같다 | `display_name`과 그 사람의 배정·인증·시급 행이 그대로다 |
| AC-01 | `left_at`이 널인 사람이 걸린다 | integration 위 | 위와 같다 | 퇴사 안 한 행은 한 건도 안 바뀐다 |
| AC-01 | 두 번 돌면 `erased_at`이 밀린다 | integration 위 | 위와 같다 | 같은 인자로 두 번 불러도 첫 시각이 그대로다 |
| AC-01 | 사진 파일이 버킷에 남는다 | integration 위 — `storage.objects`를 센다 | 위와 같다 | 그 사람 경로의 객체가 0건이고 남의 객체는 그대로다 |
| AC-01 | 알림 행이 같이 사라진다 | integration 위 | 위와 같다 | 그 사람의 `notifications` 행이 그대로다 |
| AC-02 | 지워진 계정을 또 쏜다 | integration 위 — `net` 스키마의 요청 표를 센다 | 위와 같다 | `user_id`가 널인 행은 호출이 0 |
| AC-02 | 어제 못 지운 계정을 다시 안 쏜다 | integration 위 | 위와 같다 | `erased_at`이 옛 시각이고 `user_id`가 있으면 호출이 1 |
| AC-04 | crontab 항목이 안 선다 | integration 위 — `cron.job`을 읽는다 | 위와 같다 | 그 이름의 행이 하나 |
| AC-05 | `internal`이 PostgREST로 샌다 | integration 위 | 위와 같다 | 로그인한 클라이언트의 `rpc("erase_profiles")`가 못 잡는다 |
| AC-03 | 같은 id가 두 번 와서 실패한다 | 수동 — 배포 뒤 같은 본문으로 두 번 부른다 | 운영 | 두 번째도 성공으로 끝난다 |
| AC-03 | 아무나 불러 남의 계정을 지운다 | 수동 — 배포 뒤 anon 키로 한 번 부른다 | 운영 | 거절된다 |
| AC-03 | 실제로 `auth.users`가 안 지워진다 | 수동 — 배포 뒤 첫 실행을 본다 | 운영 | 하루 뒤 그 프로필의 `user_id`가 널이다 |
| AC-02·AC-03 | 서비스 키나 함수 주소가 커밋에 든다 | 수동 — `pr-diff`가 diff 전문을 본다 | — | 그 문자열이 어느 파일에도 없다 |
| AC-01 | 비운 사람이 앱을 열면 화면이 깨진다 | 수동 — 계정이 살아 있는 창에 프로필과 급여를 연다 | 시뮬레이터 | 이름과 지난 급여가 그대로 서고 사진 자리가 기본 이미지다 |

- 배정하지 않은 것: Edge Function이 실제로 `auth.users`를 지우는 것 — 로컬과 CI가 edge-runtime을 빼고 띄워 못 본다
- 막힌 것: 지금은 없다

## 범위 밖

- 퇴사 처리와 되돌리기(`mark_leave`·`undo_leave`) — [퇴사 처리와 되돌리기](../../2-design/modules/account/design.md#퇴사-처리와-되돌리기)가 정본이고 함수는 이미 섰다
- 차단과 해제 — [차단](../../2-design/modules/account/design.md#차단)이다. 차단은 비우기를 안 부른다
- 본인이 계정을 스스로 지우는 길. 1차 릴리스 목록에 없다([roadmap](../../1-plan/roadmap.md#릴리스-목록))
- 알림 쪽 Edge Function `send-push`와 `_shared/` 복사 단계 — 알림 영역이다([notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기))
- 비운 결과를 사람에게 알리는 길. 위 리스크에 적었다
