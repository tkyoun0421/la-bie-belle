# P4-T01 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-16

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-16 | 최초 작성. 기획 결정 4건(알림함 실데이터 연결 포함, 확정 알림 1종 앞당김, 그룹 경계 Asia/Seoul 고정, 무제한 보존)의 구현 설계. |

- 관련 spec: PRD:AC-11, PRD 9장(알림), DOMAIN:NOTIFICATIONS, ADR:0005
- 적용 깊이: 깊음 — 새 도메인 경계(NOTIFICATIONS)의 첫 스키마 3종, 배포된 정의자 함수 1종 재정의(confirm_schedule 알림 결합), 새 RPC 2종, 화면 실데이터 전환.
- test mode: tdd
- 예정 check IDs: outbox-integration(확정 트랜잭션 결합·롤백·pgTAP), outbox-idempotency(멱등성 키 중복 차단)

## 전제

- 기획 승인(2026-08-16)이 소유한 제품 결정을 다시 열지 않는다: 알림함 실데이터 연결은 이 task, 시범 사건은 스케줄 확정 1종(P4-T03에서 이관), 오늘/이번 주 그룹 경계는 Asia/Seoul 고정, 보존 무제한(정리 로직 없음).
- ADR-0005가 outbox 구조의 정본: 같은 트랜잭션 기록, 멱등성 키 `event_type + aggregate_id + recipient_id + revision`, 발송 상태·시도 횟수·마지막 오류·다음 시도 시각, 앱 내 알림과 푸시의 독립성, 만료 구독 비활성화.
- 설계 보강(기획 문면의 구체화): 확정 알림 수신자는 **정식 배정자 ∪ 교육생 전원**이다 — PRD "확정 시 모든 배정자"의 배정에는 교육생 행(assignment_trainees)이 포함된다. 같은 사람이 정식·교육생에 겹칠 수 없으므로(LB024) 사람 단위 중복은 구조상 없다.
- 코드 대조 확정 사실: `confirm_schedule` 최종본은 20260818000000(P3-T11). 알림함 화면 `NotificationsView`·`NotificationRow`(shared/ui)·스와이프 읽음·모두 읽음 버튼은 mock 기반으로 완성돼 있고, 탭 배지(`(tabs)/layout.tsx`)도 mock(`MIXED_NOTIFICATIONS`)에서 unread를 계산한다. 알림 클릭 이동은 `/schedule/<date>`이며 근무자 상세 라우트 `[id]`는 work_date를 받는다(P3-T09 `selectScheduleForWorkDate`). `groupNotificationsByRecency(items, now)`는 date-fns의 기기 로컬 경계를 쓴다 — Seoul 전환 대상. Seoul 달력 계산의 저장소 관례는 `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" })`(8곳 사용 중, date-fns-tz 미설치 — 새 의존성 추가 없음). e2e 밴드 마지막 사용 구간은 495~526(confirmationJourney).

## Requirements

### 범위와 비목표

범위: 마이그레이션 1개(스키마 3종 + 읽음 RPC 2종 + `confirm_schedule` 알림 결합 재정의), pgTAP 신규 24번, `entities/notification` api 신설·model Seoul 전환, `features/notification` 신설(읽음 server action 2종), 알림함 page·view 실데이터 전환, 탭 배지 실데이터 전환, e2e 신규 1 spec(밴드 528~559), backlog 없음.

비목표: 푸시 실발송·Service Worker·VAPID 구독(P4-T02), outbox 소비자·재시도 실행·Cron(P4-T08 — 이 task는 outbox 행 생성과 상태 모델까지), 확정 외 알림 생성(P4-T03), 알림 삭제·정리 로직(보존 무제한 — 기획), 문자·카카오톡(PRD 제외), `push_subscriptions`의 쓰기 경로(T02 몫 — 스키마·RLS만).

### 불변 규칙

- 도메인 변경과 앱 내 알림·outbox 기록은 같은 트랜잭션이다. 확정이 실패하면 알림도 남지 않고, 알림 기록 실패는 확정을 함께 실패시킨다.
- 멱등성 키 `(event_type, aggregate_id, recipient_id, revision)`은 notifications·notification_outbox 양쪽의 unique 제약이고, 재기록은 `on conflict do nothing`으로 흡수한다 — 같은 키의 중복 알림은 구조상 불가능하다.
- 앱 내 알림 행은 outbox 상태와 독립이다. outbox가 어떤 상태로 남아도 notifications 행과 읽음 처리에 영향을 주지 않는다.
- 읽음은 recipient 본인만, RPC로만 쓴다. `read_at`은 서버 시각(DEV-TIME-02)이고 이미 읽은 행의 재읽음은 시각을 덮어쓰지 않는다.
- notifications select는 본인 행만이다(RLS). 다른 사람의 알림은 목록·개수 어디에도 새지 않는다.
- 오늘/이번 주 그룹 경계는 Asia/Seoul 달력 기준이며(일요일 주 시작 유지) 기기 시간대와 무관하다. 계산은 model 순수 함수에만 있다.
- `confirm_schedule`의 기존 계약(차단 4종·상태 전이·스냅샷·경고·감사·반환 형태·권한)은 무수정이다 — 알림 기록 블록만 더한다.

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- 실데이터 전환이 `src/shared/ui/**` 변경을 요구하는 경우(NotificationRow 포함).
- mock 파일 제거·개정이 preview(`page.dev.tsx`)·catalog 등 이 task 밖 화면을 깨뜨리는 경우 — mock은 유지하고 실화면 배선만 바꾸는 것이 기본이며, 그래도 충돌하면 멈춘다.
- 기존 pgTAP(21~23)·단위·e2e가 confirm_schedule의 반환 형태나 부수 효과 부재를 고정해 알림 결합과 충돌하는 경우.
- 탭 배지의 실데이터 전환이 레이아웃 구조 변경(서버·클라이언트 경계 재편)을 요구해 `(tabs)/layout.tsx` 한 파일로 끝나지 않는 경우.

### 기술 인수 조건

1. notifications·notification_outbox·push_subscriptions 스키마가 만들어지고, 멱등성 키 unique·outbox 상태(PENDING 초기값)·시도 횟수·마지막 오류·다음 시도 시각·읽음 시각·구독 비활성화 시각 컬럼이 ADR-0005 그대로 존재한다(pgTAP).
2. 스케줄 확정이 정식 배정자 ∪ 교육생 전원에게 notifications+outbox 행을 확정과 같은 트랜잭션에 만든다 — 수신자 집합·title·body·target(date 포함) 값 단언(pgTAP).
3. 확정이 구조 오류(LB030 등)로 실패하면 알림·outbox 행이 0건이다 — 롤백 단언(pgTAP).
4. 같은 멱등성 키의 재기록이 중복 행을 만들지 않는다(on conflict 흡수, pgTAP).
5. RLS: 본인 알림만 select되고, 읽음 RPC는 본인 행만 갱신하며 남의 알림 id로는 0행(무해 no-op)이다. 이미 읽은 행의 재읽음이 read_at을 바꾸지 않는다(pgTAP).
6. `mark_notification_read`·`mark_all_notifications_read`가 authenticated에만 grant되고 anon·service_role 거부가 단언된다(pgTAP — 15번 3롤 관례).
7. `groupNotificationsByRecency`가 Asia/Seoul 경계로 오늘/이번 주/이전을 나눈다 — KST 자정 직전·직후, 주 경계(일요일 시작), 기기 tz와 무관 케이스(단위 — RED 먼저, DEV-TIME-05 주입 now).
8. 알림함 화면이 실데이터로 목록·그룹·읽음 상태를 그리고, 개별 탭·스와이프·모두 읽음이 서버에 반영돼 새로고침 후에도 유지된다(단위 + e2e).
9. 탭 배지가 실데이터 unread 유무를 반영한다(e2e — 확정 알림 수신 후 배지 표시, 모두 읽음 후 소멸).
10. e2e 여정: 관리자 확정 → 근무자 알림함에서 확정 알림 확인 → 탭하면 해당 날짜 상세로 이동(전용 밴드 528~559, 다중 테스트면 splitBand).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1·2 스키마·확정 결합 | 테스트함 — 확정 후 수신자 집합·본문·target 값 단언 | 테스트함 — 3 롤백 단언이 소유 | 테스트함 — 교육생만 있는 포지션 포함, 배정 0명 스케줄은 알림 0건 | 테스트함 — RLS 격리(5) | 테스트함 — 4 멱등 단언이 소유 | 해당 없음 — 확정 잠금은 P3-T06 소유 |
| 3 롤백 | 해당 없음 — 실패 칸이 본체 | 테스트함 — LB030 유도 후 알림·outbox 0건 | 테스트함 — 확정 성공 직전까지의 다른 차단(LB026 계열)도 동일 | 해당 없음 — 확정 권한은 P3-T06 pgTAP 소유 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 확정 잠금은 P3-T06 소유 |
| 4 멱등성 | 테스트함 — 같은 키 재삽입 무증가 | 테스트함 — 키 4요소 중 하나라도 다르면 새 행 | 테스트함 — revision 다른 재기록은 별개 행(향후 변경 알림 대비) | 해당 없음 — 삽입 경로가 정의자 함수 내부뿐 | 테스트함 — 본체 | 테스트함 — unique 제약이 DB 경계에서 강제 |
| 5·6 읽음·RLS | 테스트함 — 본인 읽음 후 read_at 서버 시각 | 테스트함 — 남의 알림 id no-op·목록 미노출 | 테스트함 — 재읽음 시각 불변, 모두 읽음이 미읽음만 갱신 | 테스트함 — 3롤 grant 행렬 | 테스트함 — 읽음 멱등 | 해당 없음 — 단일 update |
| 7 Seoul 경계 | 테스트함 — 그룹 3분류 기본 | 테스트함 — 기기 tz가 달라도 결과 동일(주입 now) | 테스트함 — KST 자정·일요일 경계·연말 | 해당 없음 — 순수 함수 | 해당 없음 — 순수 함수 | 해당 없음 — 순수 함수 |
| 8·9·10 화면·여정 | 테스트함 — e2e 확정→알림→이동, 단위로 읽음 콜백 배선 | 테스트함 — 알림 0건 빈 상태 유지 | 테스트함 — 새로고침 후 읽음 유지 | 테스트함 — e2e 근무자 계정 | 해당 없음 — 읽음 멱등이 5 소유 | 해당 없음 — 표시 계층, DB 강제는 4 소유 |

- 보충 위험: **기존 단언 대조 선확인(조사 완료)** — mock 전제 단언은 `NotificationsView.test.tsx`(prop 확장 정합), `notification-group` 단위(Seoul 전환 정합), `tab-navigation.spec.ts:392`(mock 예상 급여 알림 클릭 — 시딩 전환), `motion-render-budget.spec.ts`(알림 행 stagger 측정 — 시딩 전환)이다. 전부 허용 경로 안의 알려진 범위 갱신이고 단언 약화는 금지다. **confirm_schedule 3번째 재정의** — 21~23번 pgTAP 기존 단언은 반환 형태 불변으로 GREEN 유지가 전제다. **e2e 밴드** — 신규 spec은 전용 밴드 528~559를 레지스트리에 등록하고 다중 테스트는 splitBand 정적 하위 구간(P3-T10 관례). **알림함 e2e의 근무자 정리** — FK 체인(assignments→profiles) 정리 관례 준수.

### DEV-* 적용 상태

- DEV-SEC: 기본 적용 — RPC 2종 definer·search_path 고정·revoke/grant 3롤 행렬, RLS 본인 행. 알림 본문에 개인정보 없음(제목·문구·날짜만).
- DEV-DATA·DEV-SSOT: 기본 적용 — 알림 정본은 notifications 행, 읽음 정본은 read_at, 발송 상태 정본은 outbox. 화면 로컬 상태는 표시용 낙관 갱신뿐.
- DEV-TIME: 적용 — created_at·read_at은 서버 timestamptz(02), 그룹 경계는 Seoul 달력(03), 클라이언트 시각은 정본 아님(04), 주입 now와 경계 테스트(05).
- DEV-CACHE: 기본 적용 — 읽음 후 revalidate 기존 관례. 새 캐시 계층 없음.
- DEV-CODE-07·주석 금지·barrel 금지·server-only: 기본 적용 — entities/features api는 `import "server-only"` 첫 줄.

## Architecture

- DB 경계가 정본: 기록·멱등·읽음 전부 정의자 함수와 제약 안. 클라이언트는 표시와 낙관 갱신만.
- `entities/notification/api/list-notifications.ts`(신설, server-only, 단위 필수) — 본인 알림 목록 + unread 개수를 한 번에 반환(`{ items, unreadCount }`), created_at desc, limit 1000 절단 가드 관례. DB 행 → `NotificationItem` 매핑(read = read_at 비null, target jsonb 파싱 — 알 수 없는 screen 값은 행 제외하고 로그).
- `entities/notification/model/notification-group.ts` — 시그니처 유지(items, now), 내부를 Seoul 달력 계산으로 전환(`Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" })` 관례, 일요일 주 시작 유지). date-fns 로컬 경계 함수 제거.
- `features/notification/api/mark-notification-read.ts`·`mark-all-notifications-read.ts`(신설, server action, 단위 필수) — RPC 호출 + 기존 오류 매핑 관례 + revalidatePath. 새 오류 코드 없음(0행 갱신은 성공 취급 — 읽음은 멱등).
- `views/notifications/ui/NotificationsView.tsx` — 기존 낙관 갱신 유지, `onMarkRead`·`onMarkAllRead` prop 추가(필수 — P3-T11 F-02 교훈, 선택 prop 금지). 계산 로직 추가 없음.
- `app/(protected)/(tabs)/notifications/page.tsx` — mock 제거, 서버에서 목록·now를 받아 클라이언트 래퍼에 전달(이동 로직 기존 유지). `(tabs)/layout.tsx` — mock unread를 `list-notifications`의 unreadCount(또는 전용 count 호출)로 대체, 한 파일 범위.
- mock 파일(`notification-item.mock.ts`·`views/.../notifications.mock.ts`)은 preview·catalog가 쓰는 한 유지한다 — 실화면 배선에서만 제거.

## Data model

- 새 마이그레이션 `supabase/migrations/20260819000000_notifications_foundation.sql` 하나.
  - `notifications` — id uuid pk default gen_random_uuid(), recipient_id uuid not null references profiles, event_type text not null, aggregate_id uuid not null, revision integer not null, title text not null, body text not null, target jsonb not null, created_at timestamptz not null default now(), read_at timestamptz. unique `(event_type, aggregate_id, recipient_id, revision)`. RLS enable — select 본인(recipient_id = auth.uid()) 정책만, 클라이언트 insert/update/delete 정책 없음.
  - `notification_outbox` — id uuid pk, notification_id uuid not null references notifications unique, status notification_outbox_status not null default 'PENDING'(enum: PENDING·SENT·FAILED·DEAD — 소비 semantics는 T08 몫), attempt_count integer not null default 0, last_error text, next_attempt_at timestamptz not null default now(), created_at·sent_at timestamptz. RLS enable — 클라이언트 정책 없음(관리자 화면도 없음, 소비자는 service 경로).
  - `push_subscriptions` — id uuid pk, profile_id uuid not null references profiles, endpoint text not null unique, p256dh text not null, auth text not null, created_at timestamptz not null default now(), disabled_at timestamptz. RLS enable — 본인 select 정책만(쓰기 흐름은 T02에서 추가).
  - `mark_notification_read(target_notification_id uuid) returns void` — definer, `update ... set read_at = now() where id = target and recipient_id = auth.uid() and read_at is null`. `mark_all_notifications_read() returns integer`(갱신 행수) — 동일 조건 bulk. 둘 다 revoke 전체 후 authenticated grant.
  - `confirm_schedule` 재정의(20260818 본문 기준) — 감사 insert 뒤에 알림 블록 추가: 정식 배정자 ∪ 교육생 select로 notifications 일괄 insert(`event_type 'schedule_confirmed'`, aggregate = schedule id, revision = target_revision, title '근무 배정이 확정됐어요', body 'M월 D일 근무가 확정됐어요'(work_date의 Seoul 표기, to_char), target `{"screen":"schedule-detail","date":<work_date>}`) `on conflict do nothing`, 이어서 만들어진 행들의 outbox insert `on conflict do nothing`. 본문 나머지·반환 무수정.
- 스키마 밖 기존 테이블 변경 없음. 오류 코드 신설 없음.

## Interface

- `NotificationItem`·`NotificationTarget` 타입 무변경(mock과 실데이터가 같은 모양).
- `listNotifications(): { ok: true, items, unreadCount } | { ok: false, code }` 관례. 읽음 action은 `{ ok } | { ok: false, code }`.
- `NotificationsView` prop 확장: `onMarkRead(item)`·`onMarkAllRead()` 필수.
- RPC grant는 authenticated 한정, 3롤 거부 단언 동반(backlog 324 계열 교훈).

## Optimizations

- 알림함 진입 1왕복(목록+unread 동시), 읽음 1왕복. 확정 트랜잭션에 insert 2문 추가뿐 — 추가 왕복 없음.
- 되돌림: 함수 재정의는 이전 정의 재적용, 신설 테이블은 drop으로 되돌린다. 기존 데이터 마이그레이션 없음.

## 변경 허용 경로

```
supabase/migrations/20260819000000_notifications_foundation.sql
supabase/tests/24-notifications.test.sql
src/entities/notification/**
src/features/notification/**
src/views/notifications/**
src/app/(protected)/(tabs)/notifications/page.tsx
src/app/(protected)/(tabs)/layout.tsx
tests/e2e/notifications.spec.ts
tests/e2e/tab-navigation.spec.ts
tests/e2e/motion-render-budget.spec.ts
tests/e2e/support/**
docs/execution/radio/P4-T01-radio.md
docs/execution/runs/P4-T01/**
docs/execution/phases/index.jsonl
```

- 용도 한정: `tests/e2e/support/**`는 밴드 1개 추가(528~559)와 기존 헬퍼 재사용·최소 확장(알림 시딩 헬퍼 포함)에만 쓴다. `tab-navigation.spec.ts`는 mock 전제 시나리오(392행 예상 급여 알림 클릭)를 서비스 클라이언트 시딩 기반으로 바꾸는 정합 갱신에만, `motion-render-budget.spec.ts`는 측정 대상 알림 행을 시딩으로 확보하는 정합 갱신에만 쓴다 — 두 파일의 다른 시나리오·단언은 건드리지 않는다. `src/entities/notification/**`의 mock 2파일은 preview·catalog 호환 유지 범위에서만 손댄다. `(tabs)/layout.tsx`는 unread 실데이터 배선 한 곳이다. 기존 pgTAP(21~23)은 이 task의 허용 경로 밖 — confirm_schedule 재정의로 기존 단언이 깨지면 고치지 말고 멈춰 반환한다(정지 조건 3).
- `docs/product/**`·`docs/execution/reviews/**`는 의도적으로 빠져 있다. 정합화·backlog는 조정자 몫.
- 위 밖의 파일이 필요해지면 멈추고 반환한다.

## 미결 사항

- outbox 소비자의 상태 전이 semantics(SENT·FAILED·DEAD 전환 규칙, 재시도 간격)는 P4-T08 설계 몫 — 이 task는 PENDING 생성까지만.
- push_subscriptions 쓰기 흐름·VAPID 키 관리 — P4-T02 설계 몫.
- 알림 클릭 이동의 푸시 딥링크(알림함 밖 진입) — P4-T02/T03 몫.
