---
sources:
  - ../../2-design/modules/notification/design.md#푸시-보내기
  - ../../2-design/modules/notification/design.md#행위-밖의-실행-동작
  - ../../2-design/modules/notification/design.md#기기-주소
  - ../../2-design/modules/notification/design.md#알림을-받나
  - ../../2-design/modules/notification/design.md#코드와의-차이
  - ../../2-design/modules/notification/README.md#ntf-021
  - ../../2-design/modules/notification/README.md#ntf-029
  - ../../2-design/modules/notification/README.md#ntf-035
  - ../../2-design/system/data-access.md#서비스-키-자리
  - ../../2-design/system/architecture.md#경계-하나
---

# 푸시를 쏘는 자리를 만든다 — 구현 계획

## 입력 명세·기준

정본은 [notification/design.md](../../2-design/modules/notification/design.md#푸시-보내기)의 [푸시 보내기](../../2-design/modules/notification/design.md#푸시-보내기)와 [행위 밖의 실행 동작](../../2-design/modules/notification/design.md#행위-밖의-실행-동작)이다.

Edge Function 하나(`send-push`)와 Database Webhook 하나와 pg_cron 작업 하나(`retry_push`)가 이 task의 산출이다. **알림 행을 만들지 않는다** — [`notification-data`](notification-data.md)가 그릇을 냈고 [`notification-emit`](notification-emit.md)이 행을 낳는다. 이 task는 이미 선 행을 집어 기기로 보낸다.

선행이 둘이다. [`notification-data`](notification-data.md)가 `push_attempts`·`claimed_at`·`pushed_at` 열을 냈고, [`edge-function-import`](edge-function-import.md)가 Edge Function이 `supabase/functions` 밖을 import할 수 있는지를 확인했다.

정본에서 확인한 다섯이 plan의 방향을 정한다.

- **문이 둘인데 함수는 하나다.** Database Webhook이 행이 서는 즉시 쏘고, 못 나간 것은 `retry_push`가 매분 다시 집는다. 둘 다 같은 `send-push`를 부른다
- **잡기가 곧 경쟁 방어다.** 웹훅과 cron이 같은 행을 동시에 집을 수 있다. `claimed_at`을 찍는 update의 `returning`이 실제로 잡은 행만 돌려줘서 한 번만 나간다
- **다섯 번이 끝이다.** 실패가 영원히 돌지 않는다. 다섯 번 넘은 행은 조용히 남는다 — 사람은 앱을 열면 대시보드에서 본다([NTF-029](../../2-design/modules/notification/README.md#ntf-029))
- **service role이 이 함수 안에만 있다.** 브라우저에도 다른 Edge Function에도 없다([서비스 키 자리](../../2-design/system/data-access.md#서비스-키-자리))
- **Deno가 `src/`를 못 읽는다.** payload를 만드는 순수 함수는 `src/features/notification/model/`에 살고 CI가 `supabase/functions/_shared/`로 복사한다. 복사본은 생성물이라 안 커밋한다

## 완료 조건

### AC-01

**payload를 만드는 순수 함수.**

`src/features/notification/model/push-payload.ts`

- 알림 행 하나를 받아 `{ title, body, url }`을 낸다. 제목 문장의 정본은 [notifications.md](../../2-design/modules/notification/screens/notifications.md#알림-제목)의 「알림 제목」 표고 `url`은 [design.md의 UI 연결](../../2-design/modules/notification/design.md#ui-연결) 표다
- **`node:` import가 없다.** Deno가 읽을 파일이라 Node 전용 API를 못 쓴다 — lint 규칙이 `src/features/notification/model/` 아래를 본다([코드와의 차이](../../2-design/modules/notification/design.md#코드와의-차이))
- DB도 네트워크도 안 만진다. 입력이 같으면 출력이 같다
- **관리자 공지는 `url`이 없다.** 갈 곳이 없는 유일한 종류다

### AC-02

**Edge Function `send-push`.**

`supabase/functions/send-push/index.ts`

- 알림 id 배열을 받는다. 웹훅은 한 건, cron은 여럿이다
- **행을 먼저 잡는다.**

```sql
update notifications set claimed_at = now(), push_attempts = push_attempts + 1
where id = any($1)
  and pushed_at is null
  and push_attempts < 5
  and (claimed_at is null or claimed_at < now() - interval '2 minutes')
returning *
```

- **돌아온 행만 보낸다.** 남이 이미 잡은 행은 안 돌아와서 두 번 안 나간다
- 잡은 행의 `profile_id`로 `push_subscriptions`를 읽는다. **`profiles.notifications_enabled`가 거짓인 사람은 거른다** — 껐는데 구독이 남아 있는 틈을 여기서 한 번 더 막는다
- `src/features/notification/model/`의 순수 함수로 payload를 만들고 `npm:web-push`로 보낸다
- 성공이면 `pushed_at`을 칠한다. **410이면 그 구독 행을 지운다** — 기기가 앱을 지웠다는 뜻이다
- 기기가 여럿이면 각각 보낸다. 하나라도 성공하면 `pushed_at`을 칠한다 — 부분 성공을 못 나타내는 것은 [Q-01](../../2-design/modules/notification/design.md#q-01)이 두고 보기로 한 자리다
- service role로 DB를 만진다

### AC-03

**Database Webhook.**

- `notifications` insert에 걸린다. 행이 서는 즉시 `send-push`를 쏜다
- **인증 헤더를 Vault에서 읽는다.** 마이그레이션에 값이 안 들어간다 — 공개 저장소다
- 응답을 안 기다린다. 알림을 낳는 트랜잭션이 푸시 때문에 늦어지지 않는다

### AC-04

**cron 작업 `retry_push`.**

`internal.retry_push()` — pg_cron이 매분 부른다

- `pushed_at`이 널이고 `push_attempts < 5`이고 `claimed_at`이 널이거나 2분 지난 행을 모은다
- 없으면 아무것도 안 한다. 대부분의 분이 질의 하나로 끝난다
- 있으면 `pg_net`으로 `send-push`를 한 번 쏜다. id를 배열로 넘긴다
- **한 번에 집는 수에 상한을 둔다.** 웹훅이 통째로 죽은 뒤 밀린 것이 한꺼번에 쏟아지는 것을 막는다

### AC-05

**키와 설정.**

- VAPID 공개키는 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, 비밀키는 Edge Function secret이다
- service role 키와 웹훅 인증 헤더는 `vault`에 둔다
- `pg_net`과 `pg_cron` 확장이 선다. [`payroll-holidays`](payroll-holidays.md#ac-03)와 [`profile-erasure`](../../backlog.md)가 같은 둘을 쓴다 — **먼저 선 쪽이 만들고 뒤는 `create extension if not exists`다**
- `.env.example`에 이름만 든다. 값은 없다
- CI가 `src/features/notification/model/`을 `supabase/functions/_shared/`로 복사한 뒤 Supabase를 띄운다. 복사본은 `.gitignore`에 든다

## 변경 파일

| 파일·영역 | 바꿀 책임 | 참조 완료 조건·규칙 |
| --- | --- | --- |
| `src/features/notification/model/push-payload.ts` | 행에서 제목·본문·목적지 | AC-01 |
| `src/features/notification/model/__tests__/` | 종류마다의 payload | AC-01 |
| `supabase/functions/send-push/index.ts` | 잡기·보내기·표시 | AC-02 |
| `supabase/migrations/<날짜>_push_webhook.sql` | 웹훅 등록, Vault 읽기 | AC-03 |
| `supabase/migrations/<날짜>_retry_push.sql` | `internal.retry_push`, cron 등록, 확장 | AC-04·AC-05 |
| `.github/workflows/` | `_shared/` 복사 단계 | AC-05 |
| `.gitignore` | `supabase/functions/_shared/` | AC-05 |
| `.env.example` | VAPID 공개키 이름 | AC-05 |

## 구현 순서

기능 task 파이프라인이다 — `test-planner` → writer 셋 → `implementer` → `pr-diff`. [`notification-data`](notification-data.md)와 [`edge-function-import`](edge-function-import.md)가 둘 다 merge된 뒤에 시작한다.

1. `test-planner`가 AC-01~AC-05를 배정한다. **AC-01은 unit이 전부고 AC-02~AC-04는 integration이다**
2. `unit-test-writer`가 payload 함수를 쓴다. 종류마다 제목과 목적지가 표대로 나오는지, 관리자 공지에 `url`이 없는지다
3. `integration-test-writer`가 잡기의 경쟁을 쓴다. **같은 행을 두 번 잡으려 할 때 한 번만 돌아오는 것이 이 task의 핵심 단언이다**
4. `implementer`가 순수 함수 → Edge Function → 웹훅 → cron 순으로 초록을 만든다
5. `pr-diff`가 diff를 본다 — **VAPID 비밀키와 service role 키가 커밋에 든 줄이 없는지.** 공개 저장소라 이 확인이 이 task에서 가장 중요하다
6. 배포 뒤 진짜 기기로 한 번 받아보고 결과를 backlog에 적는다

## 리스크·전환·되돌리기

- **시크릿이 저장소에 들어갈 위험이 높다.** VAPID 비밀키, service role 키, 웹훅 헤더 셋을 다룬다. `.env`는 로컬만이고 pre-commit 훅이 패턴을 본다 — 그 위에 `pr-diff`가 한 겹 더 본다
- **같은 알림이 두 번 갈 수 있다.** 웹훅과 cron이 동시에 같은 행을 집으면 그렇다. `claimed_at` update의 `returning`이 막는데, 이 한 줄이 틀리면 조용히 두 번 울린다 — [NTF-035](../../2-design/modules/notification/README.md#ntf-035)가 묶지 말라고 한 것과 달리 이건 중복이다. integration이 본다
- **로컬에서 진짜 푸시를 못 쏜다.** integration은 `send-push`가 불리는 것과 DB 상태 변화까지만 본다. 기기가 실제로 울리는 것은 배포 뒤 손 확인이다
- **웹훅이 조용히 죽어도 티가 안 난다.** 그때는 cron이 1분 늦게 집어 메운다 — 그것이 이 구조의 두 번째 문이다. 둘 다 죽으면 아무도 모른다. 1차에서는 로그가 전부다
- **`_shared/` 복사가 CI에만 있으면 로컬 integration이 깨진다.** 로컬에서도 같은 복사를 돌리는 스크립트가 필요하다 — [`edge-function-import`](edge-function-import.md)가 그 모양을 정한다
- 되돌리기는 웹훅과 cron 등록을 지우는 마이그레이션이다. Edge Function은 배포를 내린다. 알림 행은 그대로 남고 앱을 열면 보인다

## 검증 방법

| 완료 조건·규칙 참조 | 깨질 수 있는 것 | 테스트 층·위치 또는 수동 시나리오 | 명령·환경 | 확인할 결과 |
| --- | --- | --- | --- | --- |
| AC-01 | 제목이 표와 다르다 | unit `src/features/notification/model/__tests__/`(예정) | `pnpm test` | 종류마다 표의 문장 |
| AC-01 | 관리자 공지에 목적지가 붙는다 | unit 위 | `pnpm test` | `url`이 없다 |
| AC-01 | `node:` import가 들어온다 | unit `pnpm lint` | `pnpm lint` | 규칙 위반 0 |
| AC-02 | 같은 행이 두 번 나간다 | integration `tests/integration/push-claim.test.ts`(예정) | `pnpm test:integration:run` | 동시에 집어도 `returning`이 한 쪽만 |
| AC-02 | 다섯 번 넘어도 계속 돈다 | integration 위 | 위와 같다 | `push_attempts`가 5면 안 잡힌다 |
| AC-02 | 껐는데 푸시가 간다 | integration 위 | 위와 같다 | `notifications_enabled`가 거짓이면 대상 0 |
| AC-02 | 410인데 구독이 남는다 | integration 위 | 위와 같다 | 그 행이 지워진다 |
| AC-04 | 2분 전에 다시 집는다 | integration 위 | 위와 같다 | `claimed_at`이 1분 전이면 안 잡힌다 |
| AC-05 | 키가 커밋에 든다 | 수동 — `pr-diff`가 diff 전문을 본다 | — | 키 문자열이 어느 파일에도 없다 |
| AC-02 | 기기가 안 울린다 | 수동 — 배포 뒤 진짜 기기로 받는다 | 운영 | 알림이 울리고 누르면 목적지로 간다 |

- 배정하지 않은 것: 기기가 실제로 울리는 것 — 로컬에서 밖을 안 불러 배포 뒤 손으로 본다. 기기 둘 중 하나만 성공한 것의 표시 — [Q-01](../../2-design/modules/notification/design.md#q-01)이 두고 보기로 했다
- 막힌 것: [`edge-function-import`](edge-function-import.md)가 열려 있으면 이 task가 못 선다

## 범위 밖

- 표와 함수 — [`notification-data`](notification-data.md)
- 알림 행을 낳는 자리 — [`notification-emit`](notification-emit.md)
- 브라우저에서 구독을 만드는 것(권한·Service Worker) — [`notification-settings`](notification-settings.md)
- 알림 목록 화면 — [`notification-list`](notification-list.md)
- 푸시를 눌렀을 때 앱이 여는 길 — [`notification-settings`](notification-settings.md)의 Service Worker가 맡는다
