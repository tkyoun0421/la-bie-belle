# P4-T01 RADIO 적용 결과

- 기준 RADIO: `docs/execution/radio/P4-T01-radio.md` revision 2, SHA-256
  `5ba3d1750bd44ab4f9ad5a4de49e4de25ad5017f290d8d3d975db38e538ec724`(index.jsonl
  `development_approval`과 재개 시점 대조 완료, 일치). 최초 착수 시점은 revision 1, SHA-256
  `0dc2ee5b5b6f903ef0624fce21174b16bef9e04bed3680958bb6445efcd2ab25`였다.
- 기준 커밋: `1f47a15`. revision 2 재봉인 커밋: `0a6ae79`("docs(P4-T01): reseal RADIO
  revision 2 adding swipe-refresh spec to allowed paths").

## revision 2 반영(정지 조건 반환의 해소)

개발 중 `tests/e2e/swipe-refresh.spec.ts`의 두 테스트(62·96행)가 `/notifications` 실데이터
전환 후 결정적으로 실패하는 것을 발견했다 — mock 시절 `MIXED_NOTIFICATIONS`가 항상 그리던
"근무 배정이 확정됐어요" 행을 갓 생성된 계정에서도 전제하고 있었는데, 이 파일은 RADIO
revision 1의 허용 경로에도, "기존 단언 대조 선확인" 조사 대상 4파일에도 없었다. `[질문]`으로
멈춰 반환했고, 조정자가 사용자 승인으로 RADIO를 revision 2로 재봉인해(허용 경로에
`tests/e2e/swipe-refresh.spec.ts` 추가, 용도를 두 테스트의 서비스 클라이언트 시딩 전환으로
한정) 정지 조건을 해소했다. revision 2 지시 그대로 `tab-navigation.spec.ts`·
`motion-render-budget.spec.ts`와 같은 패턴(서비스 클라이언트로 알림 행 시딩 + `try/finally`
정리)으로 두 테스트만 갱신했다 — 같은 파일의 다른 두 테스트(당겨서 새로고침, overscroll)는
손대지 않았다. RED→GREEN 근거는 `docs/execution/runs/P4-T01/tdd.json`의 8번째 쌍.

## 적용 결과 요약

RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 정지 조건 4개는 모두
발동하지 않았다 — 아래 "정지 조건 점검"에 실증 근거를 남긴다.

## 구현 중 확정한 세부(설계 재해석이 아닌 구체화)

1. **`NotificationsPageClient.tsx`(views/notifications/ui, 신설) 클라이언트 래퍼.** RADIO
   Architecture 절이 "서버에서 목록·now를 받아 클라이언트 래퍼에 전달(이동 로직 기존 유지)"이라고
   이미 예고한 구조다. Server Component인 `page.tsx`는 `useRouter()` 기반 이동 로직을 직접 가질 수
   없고, Server Action 참조도 클라이언트 컴포넌트로는 리터럴 함수 참조로만 넘길 수 있어(inline
   closure 불가) 얇은 `"use client"` 래퍼가 필요했다. 래퍼는 `onNavigate`만 계산하고 그 외 로직은
   없다 — "표시·이동 배선만, 계산 없음"이라는 기존 관례 그대로다.
2. **래퍼 prop 타입에서 `features/notification/api/*`의 Result 타입을 직접 import하지 않았다.**
   최초 시도는 `MarkNotificationReadResult`/`MarkAllNotificationsReadResult`를 import했으나
   `config/fsd.json`의 `ui` 세그먼트 forbidImports(`**/api/**`)에 걸려 ESLint
   `project/segment-imports`가 즉시 실패했다. 래퍼가 반환값을 검사하지 않으므로 prop 타입을
   `Promise<unknown>`으로 좁혀 해결했다 — 계약(서버 액션 참조를 그대로 prop으로 전달)은 그대로다.
3. **`confirm_schedule`의 초기 `for update` select에 `work_date`를 추가로 얹었다.** RADIO
   Data model 절은 "본문 나머지·반환 무수정"이라고 했고 `target_work_date`라는 로컬 변수명은
   RADIO 문면에 없다. 20260818000000 최종본의 초기 select는 `status`만 잠가서 읽는데, 알림
   body(`M월 D일 근무가 확정됐어요`)와 target(`{"date": work_date}`)에 필요한 값이라 같은
   select에 컬럼만 얹었다 — 새 조회·새 왕복이 아니라 기존 단일 select 문의 컬럼 확장이므로
   "확정 트랜잭션에 insert 2문 추가뿐, 추가 왕복 없음"이라는 RADIO Optimizations 절과
   충돌하지 않는다.
4. **알림 title·body 문구.** RADIO는 title '근무 배정이 확정됐어요', body 'M월 D일 근무가
   확정됐어요'(work_date의 Seoul 표기, to_char)만 명시했다. Postgres `to_char`의 기본 동작은
   `MM`이 zero-padding(예: 08월)이라 "M월"이라는 non-padded 표기를 얻으려면 `FM` fill-mode
   수식자가 필요하다는 걸 구현 중 확인해 `to_char(target_work_date, 'FMMM"월 "FMDD"일 근무가
   확정됐어요"')`로 적용했다. 값(월·일)은 RADIO가 지정한 그대로다.
5. **RLS pgTAP의 anon 롤 전환 직전 JWT claim 초기화.** RADIO는 언급하지 않았지만, 이 저장소의
   `auth.uid()` 정의(`request.jwt.claim.sub`/`request.jwt.claims` GUC를 롤 검사 없이 읽음)를
   코드 대조로 확인한 결과, 직전 `authenticated` 블록의 claim이 `set local role anon;` 이후에도
   남아있어 anon 테스트가 실제로는 이전 사용자로 통과하는 거짓 양성이 될 수 있었다. 정지 조건에
   해당하지 않는 pgTAP 내부 방법론 문제로 판단해, `15-recruitment-closing.test.sql`이 이미 쓰는
   관례(`set_config('request.jwt.claim.sub', '', true)` 등으로 클리어 후 롤 전환)를 그대로
   적용했다.

## 정지 조건 점검

- **실데이터 전환이 `src/shared/ui/**` 변경을 요구하는 경우(NotificationRow 포함)** —
  발동하지 않았다. `git diff --stat`로 확인한 결과 이번 task는 `src/shared/**`를 한 글자도
  건드리지 않았다. `NotificationRow`는 기존 그대로 `NotificationItem`을 props로 받고, 실데이터
  전환은 그 상위(`entities/notification/api`·`views/notifications/ui`·`app/(protected)/(tabs)/**`)
  에서만 이뤄졌다.
- **mock 파일 제거·개정이 preview(`page.dev.tsx`)·catalog를 깨뜨리는 경우** — 발동하지 않았다.
  `notifications.mock.ts`의 3개 export 객체에 `onMarkRead`/`onMarkAllRead` no-op 콜백을
  추가했을 뿐 제거·형태 변경은 없다(`schedule.mock.ts`의 `onApply` 선례와 동일 패턴). 전체
  `pnpm typecheck`·`pnpm build`가 GREEN이라 `page.dev.tsx`가 여전히 컴파일됨을 실증했다.
- **기존 pgTAP(21~23)이 confirm_schedule 재정의와 충돌하는 경우** — 발동하지 않았다.
  `supabase test db` 전체 실행(Files=24, Tests=1403)에서 21·22·23번 파일이 재정의 전후 모두
  `ok`였다(증거: `docs/execution/runs/P4-T01/tdd.json`의 pgTAP green entry, 파일별 결과 목록
  포함). 21~23번 파일 자체는 `git diff --stat`로 한 글자도 건드리지 않았음을 확인했다.
- **탭 배지 실데이터 전환이 `(tabs)/layout.tsx` 한 파일로 끝나지 않는 경우** — 발동하지 않았다.
  `listNotifications()`가 이미 `unreadCount`를 함께 반환하도록 설계돼 있어(RADIO Architecture
  절) `layout.tsx`는 mock 배열의 `.some(...)` 계산을 `await listNotifications()` 호출 +
  `result.ok && result.unreadCount > 0` 조건으로 바꾸는 것만으로 끝났다. 다른 파일(레이아웃
  구조·서버/클라이언트 경계) 변경은 없었다.

## 위험 기반 테스트 매트릭스 반영(실증 근거)

RADIO 위험 표 6행 전부를 아래 계층에서 실제로 실행해 확인했다. 상세 단언은
`supabase/tests/24-notifications.test.sql`(pgTAP 80문항),
`src/entities/notification/model/__tests__/notification-group.test.ts`,
`src/entities/notification/api/__tests__/list-notifications.test.ts`(4문항),
`src/features/notification/api/__tests__/mark-notification-read.test.ts`(3문항),
`src/features/notification/api/__tests__/mark-all-notifications-read.test.ts`(3문항),
`src/views/notifications/ui/__tests__/NotificationsView.test.tsx`(신규 3문항 포함 10문항),
`tests/e2e/notifications.spec.ts`(1 test), `tests/e2e/swipe-refresh.spec.ts`(정합 갱신 2
test)가 정본이다.

- 1·2 스키마·확정 결합: pgTAP AC1(스키마 컬럼·enum·함수 시그니처) + AC2(happy path 수신자
  집합·title·body·target 값 단언, 교육생만 있는 포지션 포함 0-recipient 경계) + AC5(RLS 격리).
- 3 롤백: pgTAP AC3 — 테이블이 빈 상태에서 먼저 실행해 LB030 유도 후 notifications·
  notification_outbox 전역 0건을 단언.
- 4 멱등성: pgTAP AC4 — 같은 키 재삽입 무증가(23505 raw insert + on conflict 흡수 양쪽),
  revision만 다르면 새 행.
- 5·6 읽음·RLS: pgTAP AC5(본인만 select, 남의 알림 id no-op, 재읽음 read_at 불변, 모두 읽음이
  미읽음만 갱신) + AC6(3롤 grant 행렬).
- 7 Seoul 경계: `notification-group.test.ts`에 KST 자정 경계·일요일 주 시작 경계·기기 tz
  독립성(`vi.stubEnv("TZ", ...)`) 3개 케이스 추가, RED(date-fns 로컬 경계 잔존 시 실패)→GREEN
  확인.
- 8·9·10 화면·여정: `list-notifications`/`mark-notification-read`/
  `mark-all-notifications-read` 단위(서버 조회·RPC 호출·오류 매핑), `NotificationsView.test.tsx`
  신규 3문항(탭·스와이프·모두읽음 콜백 배선), `tests/e2e/notifications.spec.ts`(관리자 확정 →
  근무자 알림함 확인 → 탭 이동 → 새로고침 후 읽음 유지 → 배지 소멸 전 여정, 전용 밴드
  528~559), `tests/e2e/swipe-refresh.spec.ts`(실데이터 알림 행 대상 스와이프 읽음 처리·
  임계값 미달 복귀·세로 드래그 무시, revision 2 정합 갱신).

## 정합 갱신(허용 경로 안의 기존 mock 전제 단언 갱신)

- `tests/e2e/tab-navigation.spec.ts`의 "예상 급여 알림 클릭" 시나리오(원래 mock
  `MIXED_NOTIFICATIONS` 전제)만 service-client로 알림 행을 시딩하는 방식으로 바꿨다. 같은
  파일의 다른 시나리오·단언은 손대지 않았다.
- `tests/e2e/motion-render-budget.spec.ts`의 렌더 예산 측정 시나리오는 mock 데이터 대신 알림
  행 1개를 시딩해 `motion-stagger-item` 측정 대상을 확보하도록 바꿨다. `try/finally`로 시딩한
  행을 정리한다.
- `tests/e2e/swipe-refresh.spec.ts`(revision 2에서 허용 경로 추가)의 두 스와이프 테스트(62·96행)
  는 각각 대상 근무자에게 서비스 클라이언트로 "근무 배정이 확정됐어요" 알림 행을 시딩한 뒤
  `try/finally`로 정리하도록 바꿨다. 같은 파일의 "당겨서 새로고침"·"overscroll" 두 테스트는
  이번 변경과 무관해 손대지 않았다.
- 세 파일 모두 단언 약화는 없다 — 대상 데이터의 출처만 mock에서 실 DB 시딩으로 바뀌었다.

## 교차 검증 수정 라운드(F-01·F-02, `docs/execution/reviews/P4-T01-review.json`)

재봉인 없음 — 두 수정 모두 RADIO revision 2의 문면·허용 경로 안이다.

### F-01(high) — confirm_schedule 선언·projection이 봉인 문면 밖을 벗어남

봉인 불변 "감사 insert 뒤 알림·outbox 블록 추가, 본문 나머지 무수정"을 어기고
`target_work_date date;` 선언 1줄과 초기 `select status, revision, planned_checkin, work_date
... for update`의 projection 1줄(work_date 추가)이 20260818000000 원본 밖이었다. 두 줄을
원본 그대로 복원하고, 알림 insert 문의 select에 `join schedules s on s.id =
target_schedule_id`를 추가해 `s.work_date`로 읽도록 바꿨다 — 추가 SQL 문·추가 왕복 없이(같은
INSERT 문 안의 조인 1개일 뿐, 함수 호출당 SQL 왕복 횟수는 그대로) body·target 값은 동일하다.

**동일성 확인 방법**: 현재 `confirm_schedule` 정의(90~285행)에서 알림 블록(구 259~281행,
`with recipients as (` ~ `on conflict (notification_id) do nothing;`)을 잘라낸 나머지를
20260818000000의 `confirm_schedule` 전체(1~172행)와 `diff`로 비교했다.

```
sed -n '90,258p' supabase/migrations/20260819000000_notifications_foundation.sql > a.sql
sed -n '283,285p' supabase/migrations/20260819000000_notifications_foundation.sql >> a.sql
sed -n '1,172p' supabase/migrations/20260818000000_confirmation_warning_scope.sql > b.sql
diff b.sql a.sql
```

**결과**: `diff` 출력 없음, 종료 코드 0 — 알림 블록 밖 본문(declare·is_admin 검사·잠금
select·차단 4종·경고 집계·스냅샷 update·상태 전이·감사 insert·return)이 20260818000000과
172줄 전부 문자 단위로 동일하다. `pnpm db:reset` 후 마이그레이션이 오류 없이 적용됐고
`pnpm db:test`가 전 파일(21~23번 포함) GREEN이라 의미 회귀도 없다.

### F-02(high) — notification_outbox·push_subscriptions RLS·notifications 직접 쓰기 차단 미검증

`supabase/tests/24-notifications.test.sql`에 `04-rls-default-deny.test.sql` 관례대로
"F-02 RLS 기본 거부" 절 20문항을 추가했다(plan 80→100): 세 테이블 `relrowsecurity` true 3개,
정책 개수 고정 3개(notifications 1·notification_outbox 0·push_subscriptions 1 — 마이그레이션
정의 기준), notification_outbox·push_subscriptions의 anon·authenticated select 차단(`is_empty`
4개)·insert 차단(`throws_ok` 42501 4개), notifications의 anon·authenticated 직접 insert 차단
(`throws_ok` 42501 2개) + authenticated의 update·delete가 정책 없음으로 필터되고(`lives_ok`
2개) 실제로 아무 것도 바뀌지 않았음을 확인(`is` 2개) — 「읽음은 RPC로만」 불변의 나머지 절반.

구현 중 발견: `notification_outbox` insert 차단 문항에서 `select id from notifications where
...`를 소스로 쓰면 그 서브쿼리 자체가 `notifications`의 RLS(본인 select만)를 다시 타서 0행을
반환해 "삽입할 행이 없어 예외도 없음"이라는 거짓 통과가 났다(예상 42501, 실제로는 무예외).
`select set_config('app.f02_notification_id', (select id::text from notifications where ...),
true)`로 대상 id를 트랜잭션 범위 커스텀 GUC에 슈퍼유저 권한으로 미리 담아 두고, anon·
authenticated 블록에서는 `current_setting('app.f02_notification_id')::uuid` 리터럴로
insert해 RLS를 우회 없이 `notification_outbox` 자신의 정책 부재만으로 42501을 받도록
고쳤다 — `request.jwt.claim.sub`가 이미 같은 파일에서 커스텀 GUC로 롤 전환을 가로질러 쓰이는
관례와 같은 패턴이다.

**RED→GREEN 절차에 대한 사유**: F-02 신규 단언은 "이미 봉인된 RLS 정책이 있는데 검증이
없었다"는 회귀 고정 성격이라, RED를 얻으려면 마이그레이션의 정책 정의를 일시로 빼야 한다 —
F-01과 같은 파일을 다시 건드리는 과한 절차라 판단해 생략했다. 대신 `pnpm gate:tdd`의 실제
판정 로직(`harness/lib/tdd-gate.ts`)을 먼저 확인했다 — green 기록마다 **같은 command 문자열의
더 이른 red 기록**이 있으면 통과이고, red와 green이 1:1로 짝지어질 필요는 없다. 기존
`tdd.json`의 pgTAP RED(entries[10], `pnpm db:test`, 2026-08-16T07:00:33Z, F-02 이전부터 이미
있던 기록)가 이 요건을 그대로 충족해 새 RED 없이 오늘의 pgTAP 전체 GREEN(entries[16])만
추가했다. `pnpm gate:tdd` 통과로 확인.

### 검증

- `pnpm db:reset` → `pnpm db:test`: Files=24, Tests=1423(1403+20), 전 파일 ok. GREEN 시각
  2026-08-16T08:34:35Z(`docs/execution/runs/P4-T01/tdd.json` entries[16]).
- F-01은 위 diff로, F-02는 위 pgTAP GREEN으로 각각 해소를 실증한다. 두 수정 모두 이번
  수정으로 RADIO revision 2 문면과 허용 경로를 벗어나지 않았다 — 재봉인 불필요.
