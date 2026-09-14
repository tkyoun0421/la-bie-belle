# 알림 — 설계

짝은 [README.md](README.md)다. 알림의 데이터와 API와 실행 동작이 여기 산다.

## 참조 규칙

공통 스키마·권한·컬럼 규약은 [data-model/README.md](../../architecture/data-model/README.md), 읽기·쓰기·타입·에러 계약은 [api/README.md](../../architecture/api/README.md), 캐시 계층·무효화 표·시각은 [runtime/README.md](../../architecture/runtime/README.md)를 따른다.

키는 `['notifications']`(`useInfiniteQuery` + `range()` 50건)와 `['notifications', 'unread']`(안 읽은 수, `head: true` count 질의)다. 무효화는 [runtime/README.md](../../architecture/runtime/README.md#무효화-표)에 있다.

## 소유 데이터

표는 `notifications`·`push_subscriptions` 둘이다.

### 알림 행

`notifications(profile_id, kind, subject_id, payload, created_at, read_at, claimed_at, push_attempts, pushed_at)`. 지워지지 않고 `read_at`만 찍힌다. 본인 행만 읽는다. 문안은 저장하지 않는다 — `kind`와 `payload`를 받아 화면이 `writing.md`대로 그린다.

`claimed_at`은 푸시를 잡은 시각, `pushed_at`은 성공한 시각이다. 둘이 다른 이유와 재시도는 [푸시 보내기](#푸시-보내기)에 있다.

### 누가 넣나

**사건 알림은 같은 함수 트랜잭션 안에서 insert한다.** `approve_swap()`이 배정을 바꾸고 같은 함수 안에서 `notifications` 행을 넣는다 — 배정은 바뀌었는데 알림이 없는 상태가 안 생긴다. 「자기 행동은 안 알린다」·「전부 끝나면 한 번」 같은 묶기 규칙이 함수 안에 산다.

**시각 알림은 pg_cron이 insert한다.** 전날 저녁 9시 미리알림, 시작 10분 전, 예식 3일 전 빈자리 재촉이 여기다. 매 분 돌며 조건에 맞는 행을 넣는다. 「이미 보냈나」는 cron이 넣는 kind에만 `(profile_id, kind, subject_id)` unique로 막는다 — 사건 알림은 트랜잭션이 이미 중복을 막는다.

### 기기 구독

`push_subscriptions(profile_id, endpoint, keys, created_at) unique(endpoint)`. 기기마다 하나라 한 사람에 여럿이다. 본인 행만 읽고, 410이 오면 발송 함수가 지운다.

## 행위별 구현 계약

### 공지 보내기

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `post_announcement` | 관리자 | 공지. 승인된 전원에게 행이 선다 |

### 읽음 찍기

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `mark_notifications_read` | 근무자 | 읽음 찍기 |

domain대로 ✕·CTA·답 셋 중 하나를 눌러야 읽음이다. 목록을 훑는 것으로는 안 바뀐다. 누른 행의 `read_at`을 즉시 칠하고 `mark_notifications_read`를 보낸다. 실패하면 되돌린다 — 다시 나타난 행을 사람이 다시 누른다.

### 기기 구독

| 함수 | 누가 | 하는 일 |
| --- | --- | --- |
| `save_push_subscription`, `remove_push_subscription` | 근무자 | 기기 구독 |

로그인 뒤 첫 화면에서 `'Notification' in window`를 먼저 본다 — iOS Safari 탭에는 이 객체가 없고 홈 화면 앱에만 있다. `permission === 'granted'`면 `pushManager.getSubscription()`으로 구독을 받아 `save_push_subscription`을 부른다. 권한은 있는데 구독이 없을 수 있고 `endpoint`가 바뀌는 일도 있어 매 진입에 보낸다 — 함수는 `endpoint` upsert다. `default`면 알림 설정 화면의 버튼이 사용자 제스처 안에서 묻는다. 진입 즉시 권한을 묻지 않는다.

### 푸시 보내기

**경로 둘, 함수 하나.** `notifications`에 행이 들어오면 Database Webhook이 Edge Function `send-push`를 부른다. pg_net은 한 번 쏘고 끝이라 놓친 것은 pg_cron의 `retry_push`가 매분 같은 함수를 다시 부른다.

**잡기와 성공은 다른 열이다.** 함수가 먼저 잡는다 — `update notifications set claimed_at = now(), push_attempts = push_attempts + 1 where id = any($1) and pushed_at is null and push_attempts < 5 and (claimed_at is null or claimed_at < now() - interval '2 minutes') returning *`. 잡힌 행만 보내고 성공한 행에만 `pushed_at`을 찍는다. 보내다 죽으면 2분 뒤 다시 잡힌다. `retry_push`가 보는 조건이 이 문장과 같아 두 경로가 같은 규칙을 탄다. 다섯 번 넘으면 그만둔다 — 앱을 열면 알림 행은 그대로 있다.

**Edge Function은 얼개다.** 알림 행 잡기 → `src/features/notification/model/`의 순수 함수로 payload와 처리 방법 정하기 → `npm:web-push`로 보내기 → 성공이면 `pushed_at`, 410이면 구독 지우기. 판단(어떤 실패가 재시도인가, 어떤 것이 구독 폐기인가)은 전부 `src/`의 순수 함수라 unit 테스트가 지킨다. 그 함수들은 Node 전용 API를 안 쓴다 — lint가 `src/features/notification/model/`에서 `node:` import를 막는다.

**Deno는 `supabase/functions` 밖을 못 읽는다.** edge-runtime 컨테이너에 그 폴더 하나만 마운트돼서, `deno.json`이 `../../src/`를 맵핑해도 파일이 컨테이너 안에 없다. 심볼릭 링크도 타깃이 마운트 밖이라 끊긴다. 그래서 CI가 `src/features/notification/model/`을 `supabase/functions/_shared/`로 복사한 뒤 Supabase를 띄운다 — `.github/workflows/ci.yml`의 `ci` 잡, `supabase start` 줄 앞이다 — 그 줄은 지금 `-x`로 `edge-runtime`을 빼고 있어 같이 푼다. 복사본은 생성물이라 커밋하지 않는다. 정본은 `src/`다.

얼개 자체는 e2e가 본다. CI가 `supabase functions serve`를 띄우고 가짜 푸시 엔드포인트로 한 번 돌린다.

**service role은 `send-push` 안에만 있다.** 사용자 세션 없이 돌아 `notifications`와 `push_subscriptions`만 만진다 — 서비스 키 자리 둘 중 하나.

**비밀은 저장소 밖이다.** VAPID 키는 Edge Function secret이고 공개키만 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`로 브라우저에 간다. Webhook 트리거의 인증 헤더는 Vault에서 읽는다 — 트리거 정의에 리터럴로 넣으면 마이그레이션에 실려 PUBLIC 저장소에 올라간다.

Service Worker의 `push` 이벤트가 알림을 **항상** 띄운다 — iOS는 푸시를 받고 알림을 안 띄우는 일이 반복되면 구독을 회수한다. 누르면 `notificationclick`이 `payload`의 화면을 연다. 앱이 열려 있으면 `postMessage`로 `['notifications']`를 무효화한다. 사건이 닿는 도메인 키(강제 변경이면 `['schedule']`)는 탭 복귀 재조회에 맡긴다. 푸시가 안 오는 기기는 탭 복귀 때 다시 읽는 것이 전부다.

### 행위 밖의 실행 동작

사건 알림은 함수가 없다 — 사건을 일으킨 함수가 같은 트랜잭션에서 넣는다.

## UI 연결

pg_cron(`internal`) — `emit_reminders`(전날 저녁 9시·시작 10분 전·빈자리 재촉), `retry_push`(미발송 알림 다시 쏘기).

푸시를 누르든 대시보드 알림 영역의 CTA를 누르든 같은 곳이다. `payload`가 날짜·달을 든다. 관리자 목적지는 관리자 층으로 바로 착지하고 앱바 뒤로가 부모 경로로 간다([flows/README.md](../../architecture/flows/README.md#뒤로)).

표는 릴리스를 가리지 않고 전부 든다. 교대 다섯 줄과 관리자 공지는 2차다([roadmap](../../../1-plan/roadmap.md#릴리스-목록)) — 1차 알림 task는 나머지만 구현하고, 「교대 수락 → 관리자」의 미정은 2차 교대 알림 task가 닫는다.

| 종류 | 받는 사람 | 간다 |
| --- | --- | --- |
| 가입 승인 | 그 사람 | `/` |
| 신청 접수 열림 · 마감일 변경 | 승인된 전원 | `/schedule?month=` 제출 모드 |
| 근무표 확정 | 배정된 사람 | `/schedule?month=` |
| 근무표 변경 | 들어온 사람 | `/schedule?date=` |
| 근무표 변경 | 빠진 사람 | `/schedule?month=` — 그날 시트에 자기가 없다 |
| 미리 알림 | 배정된 사람 | `/schedule?date=`. 주말 묶음이면 그 사람의 첫 근무 날 |
| 출근 직전 | 배정된 사람 | `/check-in` |
| 근무 요청 도착 | 받은 사람 | `/schedule?date=` 요청 카드 |
| 근무 요청 수락 · 전부 소진 | 관리자 | `/admin/schedule?date=` |
| 교대 요청 도착 | 받은 사람 | `/schedule?date=` |
| 교대 수락 | 요청자 | `/schedule?date=` |
| 교대 수락 | 관리자 | 미정 — [`swap/design.md`](../swap/design.md#아직-안-정한-것) |
| 교대 승인 | 요청자 · 선택된 쪽 | `/schedule?date=` |
| 교대 전부 소진 | 요청자 | `/schedule?date=` |
| 근무 취소 요청 | 관리자 | `/admin/approvals` |
| 근무 취소 결과 | 그 사람 | 승인이면 `/schedule?month=`, 거절이면 `/schedule?date=` |
| 사유 결과 | 그 사람 | `/schedule?date=` 명단의 자기 상태 |
| 빈 자리 재촉 | 관리자 | `/admin/schedule?date=` |
| 관리자 공지 | 승인된 전원 | 없음. 대시보드 알림 영역이 곧 목적지라 CTA가 없고 ✕뿐이다 |

목적지로 가는 것과 읽음은 같은 순간이다 — CTA를 누르면 `mark_notifications_read`가 같이 나간다([읽음 찍기](#읽음-찍기)).

## 아직 안 정한 것

- 알림 끄기와 홈 화면 추가 여부를 어디 두나. `push_subscriptions` 없음만으로는 「안드로이드 안 켬」과 「아이폰 홈 추가 안 함」을 못 가른다
- 알림 하나에 기기 구독이 둘일 때 — `pushed_at`이 행에 하나라 한 기기만 성공한 것을 못 나타낸다. 서른 명 규모에서 드물어 두고 본다
