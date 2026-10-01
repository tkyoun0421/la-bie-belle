---
sources:
  - ../../2-design/modules/notification/design.md#푸시-보내기
  - ../../2-design/modules/notification/design.md#알림을-받나
  - ../../2-design/modules/notification/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/notification/README.md#ntf-001
  - ../../2-design/modules/notification/README.md#ntf-019
  - ../../2-design/modules/notification/README.md#ntf-027
  - ../../2-design/modules/notification/README.md#ntf-029
  - ../../2-design/modules/notification/README.md#ntf-034
  - ../../2-design/modules/notification/README.md#ntf-035
  - ../../2-design/modules/notification/screens/notifications.md#알림-제목
  - ../../2-design/system/data-access.md#서비스-키-자리
  - ../../2-design/system/data-access.md#이름과-자리
  - ../../2-design/system/data-access.md#함수-안의-규칙
---

# 푸시를 쏘는 자리를 만든다 — 구현 계획

## 입력 명세·기준

정본은 [notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기)의 [푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기)다. 문장은 [notifications.md](../../2-design/modules/notification/screens/notifications.md#알림-제목)의 「알림 제목」이 정본이고, 업무 규칙은 [NTF-001](../../2-design/modules/notification/README.md#ntf-001)·[NTF-019](../../2-design/modules/notification/README.md#ntf-019)·[NTF-027](../../2-design/modules/notification/README.md#ntf-027)·[NTF-029](../../2-design/modules/notification/README.md#ntf-029)·[NTF-034](../../2-design/modules/notification/README.md#ntf-034)·[NTF-035](../../2-design/modules/notification/README.md#ntf-035)다.

산출은 넷이다 — Edge Function `send-push`, 그 함수가 부르는 DB 함수 하나, `notifications`를 행 하나가 들어올 때 쏘는 트리거와 매분 도는 cron, 그리고 `src/features/notification/model/`의 순수 함수들이다. **표는 안 만든다** — `notifications`와 `push_tokens`는 [`notification-data`](notification-data.md#ac-01)가 이미 냈다. 열 하나만 붙는다(AC-01).

선행이 넷이다. [`notification-data`](notification-data.md)가 표와 뷰와 함수 넷을 냈고, [`notification-list`](notification-list.md)가 문장을 조립하는 순수 함수를 내고, [`edge-function-import`](edge-function-import.md)가 Deno의 마운트 경계를 확인했고, [`profile-erasure`](profile-erasure.md)·[`payroll-holidays`](payroll-holidays.md)가 pg_cron·pg_net·Edge Function의 길을 밟았다.

정본과 저장소에서 확인한 여섯이 plan의 방향을 정한다.

- **경로 둘, 함수 하나.** 행이 들어오면 트리거가 `send-push`를 쏘고, 놓친 것은 매분 도는 `retry_push`가 같은 함수를 다시 부른다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))
- **잡기와 성공이 다른 열이다.** `claimed_at`·`push_attempts`로 잡고 `pushed_at`으로 성공을 찍는다. 잡는 질의의 `returning`이 두 경로가 같은 행을 두 번 보내는 것을 막는다
- **서비스 키로는 `internal`에 못 닿는다.** PostgREST가 노출 목록 밖의 스키마를 라우팅 단계에서 끊어 키와 무관하게 `PGRST106`이다([관찰 033](../../observations/033-service-key-cannot-reach-internal.md)). 그래서 잡기가 `public` 껍데기를 타고, 그 첫 줄이 `auth.role()`을 본다 — [`payroll-holidays`](payroll-holidays.md#ac-02)가 낸 길 그대로다
- **Deno는 `supabase/functions` 밖을 못 읽는다.** edge-runtime 컨테이너에 그 폴더 하나만 마운트된다([edge-function-import](edge-function-import.md)). 정본이 복사 단계를 이 task 몫으로 뒀다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))
- **부치는 답과 닿은 결과가 다른 순간에 온다.** 접수증이 먼저 오고 기기까지 닿았는지는 십오 분쯤 뒤에 따로 물어야 안다. 접수증 번호를 알림 행에 적고 다음 회차가 긁는다
- **문장은 여기서 안 만든다.** 푸시의 제목이 [알림 제목](../../2-design/modules/notification/screens/notifications.md#알림-제목) 표의 문장인데 그 함수는 [`notification-list`](notification-list.md#ac-01)의 산출이다 — 이 task가 그것을 가져다 쓴다. 두 곳이 문장을 따로 들면 같은 알림이 기기와 화면에서 다르게 읽힌다

저장소에서 확인한 것이 넷이다. pg_cron과 pg_net은 이미 켜져 있고(`supabase/migrations/20260927091506_schedule_requests.sql`, `20260929091501_profile_erasure.sql`), Edge Function이 둘 서 있고(`erase-account`·`import-holidays`), CI는 `supabase start -x ... edge-runtime`으로 edge-runtime을 빼고 띄우고(`.github/workflows/ci.yml`), `deno.json`은 아직 어디에도 없다.

## 이 plan이 정본에 박은 판정

정본이 이 task에 미뤄둔 것과 정본끼리 부딪힌 자리를 여기서 닫았다. 문서는 같은 PR이 고친다.

- **보낼 것이 없어도 긁는다**([Q-02](../../2-design/modules/notification/design.md#아직-안-정한-것) 닫음). `send-push`의 첫 단계가 언제나 접수증 긁기고, 잡을 알림이 없으면 거기서 끝난다. 긁기 전용 cron을 따로 두지 않는 것은 서비스 키를 쥔 자리를 안 늘리려는 것이다([서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리))
- **`notification-list`가 앞에 선다.** 푸시 제목이 그 task의 문장 함수라 순서가 뒤집히면 보낼 제목이 없다. backlog의 `ready` 순서도 그렇게 세웠다
- **접수증 번호 열은 이 task가 붙인다.** `notification-data`의 표에 `push_receipt_id`가 없다. 정본이 「알림 행에 적어두고」라 적었으니 열 이름만 여기서 정한다

## 완료 조건

### AC-01

**접수증 번호 열.**

`notifications`에 `push_receipt_id text` 한 열을 붙인다.

- 부친 뒤 접수증 번호를 여기 적고, 긁고 나면 널로 되돌린다. **널로 되돌리는 것이 「긁었다」 표시다** — 열을 하나 더 두지 않는다
- 긁을 대상은 `push_receipt_id is not null and pushed_at < p_now - interval '15 minutes'`다. 열다섯 분은 정본의 수다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))

### AC-02

**잡는 함수.**

`internal.claim_notifications(p_ids uuid[], p_now timestamptz)`와 그것을 부르는 `public.claim_notifications(p_ids uuid[])` 껍데기다.

- 조건은 정본의 질의 그대로다 — `pushed_at is null and push_attempts < 5 and (claimed_at is null or claimed_at < p_now - interval '2 minutes')`. 잡으면서 `claimed_at = p_now`, `push_attempts = push_attempts + 1`
- **`p_ids`가 널이면 조건에 맞는 행 전부를 잡는다.** 트리거는 방금 들어온 id 하나를 넘기고 `retry_push`는 널을 넘긴다 — 같은 함수가 두 경로를 받는다
- **끈 사람의 행은 안 잡힌다.** `profiles.notifications_enabled`가 거짓이면 조건 밖이다([알림을 받나](../../2-design/modules/notification/design.md#알림을-받나)). 행은 그대로 서고 푸시만 안 나간다
- **주소가 없는 사람의 행도 잡힌다.** 잡는 조건에 `push_tokens`를 안 넣는다 — 메시지가 0건이라 아무것도 안 나가고 시도만 오르다 다섯 번째에 멈춘다([NTF-029](../../2-design/modules/notification/README.md#ntf-029)). **안 잡는 쪽으로 만들면 그 행이 영원히 대상으로 남아**, 그 사람이 한 달 뒤 앱을 깔았을 때 지난 알림이 한꺼번에 날아간다
- **알림끼리 안 묶는다.** 한 사람의 행 둘이 같은 회차에 잡혀도 각자 한 건이다([NTF-035](../../2-design/modules/notification/README.md#ntf-035))
- 돌려주는 것은 잡힌 행의 `id`·`profile_id`·`kind`·`payload`와 그 사람의 주소 목록이다. **주소는 배열 한 칸에 모은다** — `update ... from push_tokens`로 조인하면 주소가 둘인 사람의 행에 여러 매치가 붙어 한쪽만 남는다. `update ... returning`을 CTE로 두고 밖에서 `array_agg`로 묶는다
- 껍데기의 첫 줄이 `auth.role() is distinct from 'service_role'`을 보고 아니면 거절한다. **`<>`가 아니다** — JWT 없는 호출은 `auth.role()`이 널이고 널 비교는 널이라 검사를 그냥 통과한다([payroll-holidays AC-04](payroll-holidays.md#ac-02))
- 알맹이는 `security invoker`로 두고 시각을 `p_now`로 받는다([함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙))

### AC-03

**보낸 결과를 쓰는 함수.**

`public.settle_push(p_pushed jsonb, p_dead_tokens text[])` 하나다. 껍데기·알맹이 짝은 AC-02와 같다.

- `p_pushed`는 `[{"id": "...", "receipt_id": "..."}]` 꼴이다. 그 행에 `pushed_at = now()`와 `push_receipt_id`를 찍는다
- `p_dead_tokens`의 주소를 `push_tokens`에서 지운다. **주소를 지우는 것은 결과를 읽는 자리뿐이다** — 부치는 순간에는 못 지운다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))
- 둘 다 빈 값이면 아무 일도 안 하고 끝난다

### AC-04

**긁는 함수.**

`internal.receipts_to_scrape`·`internal.clear_receipts`와 그 짝인 `public` 껍데기 둘이다. **호출자 검사는 AC-02·AC-03과 같다** — 껍데기 첫 줄이 `auth.role() is distinct from 'service_role'`을 본다. 검사가 없으면 로그인한 아무나 `clear_receipts`로 남의 기기 주소를 지울 수 있다([함수 안의 규칙](../../2-design/system/data-access.md#함수-안의-규칙)).

- 앞엣것이 AC-01의 조건으로 대상 행의 `id`·`push_receipt_id`·주소를 낸다
- 뒤엣것이 긁은 행의 `push_receipt_id`를 널로 되돌리고, 죽은 주소를 지운다
- **긁기가 실패해도 보내기는 돈다.** 접수증 서비스가 답을 안 줘도 그 회차의 발송이 막히지 않는다

### AC-05

**부치는 자리 — Edge Function `send-push`.**

- 첫 줄이 `Authorization` 헤더를 `SUPABASE_SERVICE_ROLE_KEY`와 타이밍 안전하게 대조한다. 게이트웨이의 `verify_jwt`는 유효한 토큰인지만 봐서 anon 키도 통과한다([payroll-holidays AC-03](payroll-holidays.md#ac-03))
- 순서는 정본의 얼개 그대로다 — 지난 접수증 긁기 → 잡기 → 메시지 만들기 → 부치기 → `settle_push`
- **한 번에 백 건까지 한 요청에 묶고 그보다 많으면 나눈다**([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))
- 부치는 접근 토큰은 Edge Function secret이다. **저장소에 안 들어간다** — 로컬은 `supabase/functions/.env`(gitignore), 운영은 Supabase 대시보드다
- 판단은 전부 `src/`의 순수 함수에 있다. 이 파일에는 HTTP와 순서만 산다

### AC-06

**순수 함수 — 메시지 만들기.**

`src/features/notification/model/push-message.ts`.

- 잡힌 행과 주소 목록을 받아 부칠 메시지 배열을 낸다. 주소가 둘이면 메시지도 둘이다
- 실을 것은 `kind`와 목적지뿐이다. **문안을 `data`에 안 싣는다** — payload가 4KB를 넘으면 통째로 거절당하고 문안은 화면이 그린다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))
- 제목과 아래 줄은 [`notification-list`](notification-list.md#ac-01)의 문장 함수가 낸다. 그 함수가 널을 내는 종류(2차 다섯과 관리자 공지)는 못 보낸 채 남는다
- 백 건씩 끊는 것도 여기다 — 부치는 자리는 끊긴 묶음을 받기만 한다

### AC-07

**순수 함수 — 실패를 가르기.**

`src/features/notification/model/push-result.ts`.

- 부친 답을 받아 셋으로 가른다 — 성공(접수증 번호), 주소 폐기, 다시 시도
- 기기가 등록을 잃은 것(`DeviceNotRegistered`)이 주소 폐기다. 너무 잦은 것은 다시 시도고, 자격 증명이 틀린 것은 사람이 봐야 해 로그만 남기고 다시 시도로 안 친다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))
- 긁은 접수증도 같은 갈래로 가른다
- **`node:` import를 안 쓴다.** 그 폴더가 Deno로 복사돼 돈다 — 막는 규칙은 AC-10이 세운다

### AC-08

**두 경로 — 트리거와 cron.**

- `notifications`에 행이 들어오면 `after insert` 트리거가 `pg_net`으로 `send-push`를 쏜다. 본문에 그 행의 `id`를 싣는다
- **인증 헤더를 Vault에서 읽는다.** 트리거 정의에 리터럴로 넣으면 마이그레이션에 실려 PUBLIC 저장소에 올라간다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기))
- **쏘는 단계가 예외를 삼킨다.** 알림 행을 낳는 것은 사건 함수의 트랜잭션 안이라, 쏘기가 던지면 근무표 확정 자체가 롤백된다([profile-erasure AC-02](profile-erasure.md#ac-02)가 밟은 자리와 같다). **이 task가 보는 것은 트리거 자신이 안 던진다는 것까지다** — 사건 함수가 알림을 낳는 줄은 [`notification-emit`](notification-emit.md)이 심어서, 「여러 쓰기와 한 트랜잭션에 있어도 안 말린다」는 그 task가 확정 함수로 한 번 더 본다
- cron `retry_push`가 매분 같은 함수를 부른다. 본문의 id는 널이다. **작업 이름은 `retry-push`**고 vault 항목은 `send_push_url`·`send_push_service_role_key`다 — `erase-profiles`·`fetch-holidays`가 같은 꼴로 앞섰다

### AC-09

**`_shared` 복사 단계.**

- `scripts/sync-edge-shared.mts`가 `src/features/notification/model/`을 `supabase/functions/_shared/notification/`으로 옮긴다. 옮기면서 상대 import에 `.ts`를 붙이고 `@/`로 시작하는 별칭을 복사본 뿌리로 다시 쓴다
- 복사본은 생성물이라 커밋하지 않는다. `.gitignore`에 든다. 정본은 `src/`다
- **`import-holidays`도 같은 길로 옮긴다.** 지금 그 함수가 `../../../src/`를 직접 import하는데, 마운트 경계 밖이라 로컬에서 서면 부팅이 깨진다. edge-runtime을 안 띄워 아직 안 드러났을 뿐이다([관찰 035](../../observations/035-edge-function-reaches-outside-mount.md))
- `pnpm dev`와 CI가 이 단계를 부른다

### AC-10

**경계를 글자로 막는 lint 규칙 둘.**

하나는 `supabase/functions/` 아래에서 `../../../src/`로 시작하는 import를 막는다. 다른 하나는 `src/features/notification/model/`에서 `node:` import를 막는다 — **그 폴더가 Deno로 복사돼 도는 자리라** Node 전용 API를 쓰면 런타임에서 깨진다([푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기)가 「lint가 막는다」고 이미 적는데 그 규칙이 저장소에 없다).

- **복사 단계만으로는 재발을 못 막는다.** edge-runtime을 안 띄우니 다음 Edge Function이 또 마운트 밖을 가리켜도 어떤 검사도 안 걸린다([관찰 035](../../observations/035-edge-function-reaches-outside-mount.md)). 경계 위반이 이미 main에 한 번 들어갔다(#464)
- `eslint-rules/`의 기존 규칙과 같은 꼴로 세운다. **규칙 카탈로그에도 줄을 더해야 한다** — `tests/lint/rules.ts`와 그 표를 읽는 테스트가 빠진 줄을 잡는다
- 고치는 길은 `_shared` 복사본을 가리키는 것이다. 규칙 메시지가 그 길을 든다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `supabase/migrations/<날짜>_notification_push.sql` — **날짜 자리는 구현이 정한다** | `push_receipt_id` 열, 함수 다섯(알맹이·껍데기), 트리거, cron 등록 | AC-01~AC-04·AC-08 |
| `supabase/functions/send-push/index.ts` | 긁기·잡기·부치기·쓰기의 순서와 HTTP | AC-05 |
| `supabase/functions/import-holidays/index.ts` | `_shared` 복사본을 보도록 import를 고친다 | AC-09 |
| `supabase/config.toml` | `send-push` 항목 | AC-05 |
| `src/features/notification/model/push-message.ts` | 메시지 만들기와 백 건 끊기 | AC-06 |
| `src/features/notification/model/push-result.ts` | 성공·폐기·재시도 가르기 | AC-07 |
| `scripts/sync-edge-shared.mts` | 복사와 import 고쳐 쓰기 | AC-09 |
| `.github/workflows/ci.yml` | `supabase start` 앞에 복사 단계 | AC-09 |
| `package.json` | 복사 스크립트 항목 | AC-09 |
| `eslint-rules/<이름>.mjs` 둘·`eslint-rules/index.mjs`·`eslint.config.mjs`·`tests/lint/rules.ts`와 그 표 | 마운트 밖 import 막기, `node:` import 막기 | AC-10 |
| `src/features/notification/model/__tests__/*.test.ts` | 메시지 만들기, 실패 가르기 | AC-06·AC-07 |
| `src/entities/notification/api/__tests__/push-dispatch.integration.test.ts` | 잡기 조건, 끈 사람, 주소 없는 사람, 재시도 상한, 결과 쓰기, 긁기, 트리거와 cron | AC-01~AC-04·AC-08 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → `unit-test-writer`·`integration-test-writer` → `implementer` → `pr-diff`.

1. `test-planner`가 AC-01~AC-10을 배정한다. **정본 모순을 명시로 돌려받는다** — 특히 AC-09의 CI 단계를 어느 층이 지키는지, AC-05를 로컬에서 볼 수 있는지
2. `unit-test-writer`가 AC-06~AC-07을 쓴다. 폐기 갈래가 좁은지가 이 층의 중심이다
3. `integration-test-writer`가 잡는 함수를 직접 불러 조건을 때린다. `p_now`를 2분 경계 앞뒤로 넘기고 `push_attempts`를 5로 밀어 상한을 본다
4. `implementer`가 열 → 함수 → 트리거·cron → 복사 스크립트 → Edge Function 순으로 초록을 만든다
5. `pr-diff`가 diff를 본다 — **부치는 접근 토큰과 서비스 키가 커밋에 든 줄이 없는지.** 이 task가 저장소에서 시크릿 위험이 가장 높다
6. 배포 뒤 실기기로 한 번 받아 보고 결과를 [backlog.md](../../backlog.md)에 적는다

## 리스크·전환·되돌리기

- **실기기가 아니면 푸시가 안 온다.** Expo Go로는 못 본다 — 개발 빌드가 필요하고 그 빌드가 아직 없다. **AC-05의 끝(기기에 알림이 뜨는 것)은 배포 뒤 손 확인이다**
- **로컬·CI에서 Edge Function이 안 돈다.** `supabase start`가 edge-runtime을 빼고 띄운다. integration은 `pg_net` 호출이 나갔는지까지만 보고, 그 너머는 `payroll-holidays`·`profile-erasure`와 같은 한계다
- **트리거가 사건 함수의 트랜잭션 안에 있다.** 쏘기가 던지면 근무표 확정이나 승인 자체가 롤백된다. 예외를 삼키는 한 겹이 이 task에서 가장 무거운 한 줄이다
- **잡기가 두 경로에서 동시에 온다.** 트리거가 쏜 회차와 cron 회차가 겹치면 같은 행을 두 번 본다. `returning`이 막지만 그 질의가 한 문장이어야 한다 — 읽고 나서 쓰면 그 사이에 다른 회차가 들어온다
- **다섯 번을 태운 행은 조용히 남는다.** 사람이 안 보는 동작이라 실패가 알림으로 안 온다. 앱을 열면 알림 행은 그대로 있다는 것이 1차의 답이다
- **주소를 잘못 지우면 그 기기는 다시 켤 때까지 아무것도 못 받는다.** 폐기 갈래를 넓게 잡으면 살아 있는 주소가 사라진다 — AC-08의 단언이 좁아야 한다
- **접수증 긁기가 영영 안 도는 자리가 있다.** `retry_push`가 매분 도니 이제는 보낼 것이 없어도 긁는다(Q-02 판정). 그 판정이 뒤집히면 앱을 지운 사람의 주소가 남아 관리자 화면이 「알림 받는 중」이라 말한다([NTF-034](../../2-design/modules/notification/README.md#ntf-034))
- 되돌리기는 cron과 트리거를 지우는 마이그레이션이다. 열과 함수는 남겨도 해가 없다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-02 | 2분이 안 지난 행이 다시 잡힌다 | integration `src/entities/notification/api/__tests__/push-dispatch.integration.test.ts`(예정) | `pnpm test:integration:run`, 로컬 Supabase | `claimed_at`이 1분 전이면 안 잡힌다 |
| AC-02 | 2분이 지났는데 안 잡힌다 | integration 위 | 위와 같다 | 3분 전이면 잡히고 `push_attempts`가 1 오른다 |
| AC-02 | 다섯 번을 태운 행이 또 잡힌다 | integration 위 | 위와 같다 | `push_attempts = 5`면 안 잡힌다 |
| AC-02 | 끈 사람에게 푸시가 나간다 | integration 위 | 위와 같다 | `notifications_enabled`가 거짓이면 그 행이 안 잡힌다 |
| AC-02 | 주소 없는 사람의 행이 시도를 태운다 | integration 위 | 위와 같다 | `push_tokens`가 없으면 안 잡힌다 |
| AC-02 | 같은 사람의 행 둘이 하나로 묶인다 | integration 위 | 위와 같다 | 둘 다 각각 잡힌다 |
| AC-02 | 아무나 잡는 함수를 부른다 | integration 위 | 위와 같다 | 관리자 세션의 `rpc("claim_notifications")`가 거절된다 |
| AC-03 | 성공 표시가 안 남는다 | integration 위 | 위와 같다 | `pushed_at`과 `push_receipt_id`가 찍힌다 |
| AC-03 | 죽은 주소가 안 지워진다 | integration 위 | 위와 같다 | 넘긴 주소의 `push_tokens` 행이 없다 |
| AC-01·AC-04 | 긁을 것을 못 찾는다 | integration 위 | 위와 같다 | 부친 지 16분이면 나오고 14분이면 안 나온다 |
| AC-04 | 긁은 뒤에도 또 긁힌다 | integration 위 | 위와 같다 | `clear_receipts` 뒤에는 대상에서 빠진다 |
| AC-08 | 행이 들어와도 안 쏜다 | integration 위 — `net`의 요청 시퀀스를 센다([관찰 034](../../observations/034-pg-net-response-row-is-async.md)) | 위와 같다 | `notifications` insert 하나에 호출이 1 |
| AC-08 | 쏘기가 실패해 사건이 롤백된다 | integration 위 — vault 항목을 지우고 알림을 낳는다 | 위와 같다 | 알림 행이 남고 예외가 안 난다 |
| AC-08 | crontab 항목이 안 선다 | integration 위 — `cron.job`을 읽는다 | 위와 같다 | `retry_push` 행이 하나 |
| AC-06 | payload에 문안이 실린다 | unit `src/features/notification/model/__tests__/push-message.test.ts`(예정) | `pnpm test` | `data`에 `kind`와 목적지만 있다 |
| AC-06 | 백 건을 안 끊는다 | unit 위 | 위와 같다 | 250건이 묶음 셋이 된다 |
| AC-06 | 주소 둘인 사람에게 한 번만 간다 | unit 위 | 위와 같다 | 메시지가 둘이다 |
| AC-07 | 살아 있는 주소를 지운다 | unit `push-result.test.ts`(예정) | 위와 같다 | 폐기는 기기 등록이 사라진 답 하나뿐이다 |
| AC-07 | 자격 증명 오류를 계속 되쏜다 | unit 위 | 위와 같다 | 재시도 갈래에 안 든다 |
| AC-09 | 복사본이 옛것이다 | 수동 — 복사 뒤 `_shared`를 읽는다 | `pnpm edge:sync` | 파일 내용이 `src/`와 같고 import에 `.ts`가 붙는다 |
| AC-09 | 복사본이 커밋에 든다 | 수동 — `pr-diff`가 diff를 본다 | — | `supabase/functions/_shared/`가 diff에 없다 |
| AC-10 | 마운트 밖 import가 또 들어온다 | unit `eslint-rules/__tests__/`의 규칙 테스트(예정) | `pnpm test` | `supabase/functions/x/index.ts`의 `../../../src/...` import가 걸리고 `_shared`·`npm:`·`jsr:`·`https:`는 안 걸린다 |
| AC-10 | 복사되는 폴더에 `node:` import가 들어온다 | unit 위 | 위와 같다 | `src/features/notification/model/`의 `node:crypto` import가 걸리고 다른 폴더는 안 걸린다 |
| AC-02 | 주소가 둘인 사람의 행이 쪼개지거나 주소가 하나만 실린다 | integration 위 | 위와 같다 | 행은 하나고 주소 배열에 둘 다 든다 |
| AC-02 | 주소가 없는 사람의 행이 안 잡힌다 | integration 위 | 위와 같다 | 잡히고 `push_attempts`가 오른다 |
| AC-02·AC-03·AC-04 | JWT가 아예 없는 호출이 검사를 그냥 지난다 | integration 위 — `execSql`로 직접 부른다(그 세션은 `auth.role()`이 널이다) | 위와 같다 | `not_allowed`가 던져진다 — `<>`가 아니라 `is distinct from`인 것을 때리는 자리다 |
| AC-06 | 2차 kind에도 메시지가 나간다 | unit 위 | 위와 같다 | 문장이 널인 행은 메시지가 0건 |
| AC-07 | 자격 증명 오류가 어느 갈래도 아니다 | unit 위 | 위와 같다 | 넷째 갈래로 나오고 재시도에 안 든다 |
| AC-05 | 아무나 불러 발송을 태운다 | 수동 — 배포 뒤 anon 키로 부른다 | 운영 | 거절된다 |
| AC-05 | 기기에 알림이 안 뜬다 | 수동 — 실기기에서 알림을 받는다 | 개발 빌드 | 제목이 표의 문장이고 누르면 목적지로 간다 |
| AC-05·AC-08 | 접근 토큰이나 서비스 키가 커밋에 든다 | 수동 — `pr-diff`가 diff 전문을 본다 | — | 그 문자열이 어느 파일에도 없다 |

- 배정하지 않은 것: 기기에 실제로 알림이 뜨는 것과 접수증 서비스의 답 — 로컬과 CI가 edge-runtime을 빼고 띄우고 개발 빌드가 아직 없다
- 막힌 것: 지금은 없다

## 범위 밖

- 알림을 낳는 자리 — [`notification-emit`](notification-emit.md)이다. 이 task는 이미 들어온 행을 보낸다
- 시각을 보고 나가는 알림 — [`notification-schedule`](notification-schedule.md)이다
- 알림 목록 화면과 안 본 알림, 문장을 조립하는 순수 함수 — [`notification-list`](notification-list.md)다. 이 task는 그 함수를 가져다 쓴다
- 권한 받기와 주소 저장, 알림 스위치 — `notification-settings`다([backlog.md](../../backlog.md)). `save_push_token`은 [`notification-data`](notification-data.md#ac-03)가 이미 냈다
- 한 알림에 기기가 둘일 때 한쪽만 성공한 것을 나타내는 일 — [Q-01](../../2-design/modules/notification/design.md#q-01)로 남는다
