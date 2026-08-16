# P4-T01 handoff

## 2026-08-16 · 개발 종료

- 작업 식별자: P4-T01
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-16T07:56:32Z

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P4-T01-radio.md` **revision 2**, SHA-256
  `5ba3d1750bd44ab4f9ad5a4de49e4de25ad5017f290d8d3d975db38e538ec724`(index.jsonl
  `development_approval`과 대조 완료, 일치). 착수 시점은 revision 1(SHA-256
  `0dc2ee5b5b6f903ef0624fce21174b16bef9e04bed3680958bb6445efcd2ab25`)이었다.
- 기준 커밋: `1f47a15`. revision 2 재봉인 커밋: `0a6ae79`(조정자, `radio.md`·`index.jsonl`만
  pathspec 커밋). 구현 커밋: 이 handoff 문서를 포함하는 본 커밋(P4-T01 feat) — 아래 최종
  보고에서 SHA를 확인할 수 있다.
- **중단·재개 경위**: 개발 중 `tests/e2e/swipe-refresh.spec.ts`(62·96행)가 `/notifications`
  실데이터 전환 후 결정적으로 실패하는 것을 발견했다. 이 파일은 RADIO revision 1의 허용
  경로와 "기존 단언 대조 선확인" 조사 대상 4파일 어디에도 없어 RADIO 공백으로 판단해
  `[질문]`으로 멈춰 반환했다(중단 시점 handoff는 `docs/execution/runs/P4-T01/tdd.json`·
  `radio.md`에 실증 근거를 남긴 채 미커밋 상태로 보존). 조정자가 사용자 승인으로 RADIO를
  revision 2로 재봉인해(허용 경로에 `swipe-refresh.spec.ts` 추가, 용도를 두 테스트의 서비스
  클라이언트 시딩 전환으로 한정) 정지 조건을 해소했고, 이 지시에 따라 재개했다.
- `docs/execution/phases/index.jsonl`의 P4-T01 상태는 `planned` → `in_progress`로 이미
  전환돼 있다(revision 2 재봉인 커밋 `0a6ae79`에 포함). **`done`으로는 올리지 않는다** —
  조정자 몫이다.
- RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 상세 적용 내역과
  정지 조건 점검, 위험 매트릭스 대비 실증 근거, revision 2 반영 경위는
  `docs/execution/runs/P4-T01/radio.md`에 전부 남겼다.
- `test_mode=tdd` 준수: RED→GREEN **8쌍**(`notification-group` 단위 1쌍, `list-notifications`
  단위 1쌍, `mark-notification-read` 단위 1쌍, `mark-all-notifications-read` 단위 1쌍,
  `NotificationsView` 단위 1쌍, pgTAP 1쌍, `notifications.spec.ts` e2e 1쌍,
  `swipe-refresh.spec.ts` e2e 1쌍) 전부 실제 명령 실행 결과로
  `docs/execution/runs/P4-T01/tdd.json`에 기록했다(16 entries). `pnpm gate:tdd` 통과.
  `swipe-refresh.spec.ts` RED는 HEAD 시점 파일을 `git show HEAD:...`로 임시 복원해 얻었고,
  GREEN은 시딩 로직을 되돌려 넣은 뒤 같은 명령으로 재실행해 얻었다(4/4 통과, 무관한 나머지
  2개 테스트도 함께 확인).
- RADIO revision 2의 정지 조건 4개(shared/ui 변경 필요, mock 파일 preview 파손, 기존 pgTAP
  21~23 충돌, 탭 배지 전환이 layout.tsx 한 파일을 넘는 경우)는 전부 발동하지 않았다 —
  `radio.md`의 "정지 조건 점검". revision 2가 다룬 다섯 번째 문제(`swipe-refresh.spec.ts`)는
  이 4개 정지 조건 목록에 없던 항목이라 `[질문]` 일반 경로로 반환했고, 재봉인으로 해소됐다.
- `pnpm verify`를 재개 후 완전한 한 번의 연속 실행으로 돌렸다. 결과는 아래 "verify 결과
  요약" 참고 — `recruitment-manage.spec.ts:112`는 이 task diff와 무관한 사전 known-flaky로
  판정했다(P3-T06 handoff에 동일 spec·동일 증상 선례 기록, 이번에도 격리 재실행으로 무관성
  재확인).
- pre-commit 훅(gate 4종 + lint-staged + 증분 typecheck + 단위 테스트) 통과 후 커밋한다.
  커밋에는 이 task의 관련 파일 전체를 스테이징한다(부분 스테이징 없음) — 세션 시작 전부터
  있던 무관한 `.gitignore` 수정, `docs/execution/reviews/**`, 다른 세션 산출물
  `docs/execution/runs/interviews/2026-08-16-agent-team-planning.md`는 제외했다.
- push는 하지 않는다(ci-finisher 소관).

### 미결 사항

- 없음 — RADIO 범위 안에서 결정이 필요한 항목은 남지 않았다. outbox 소비자 semantics
  (P4-T08), push_subscriptions 쓰기 흐름(P4-T02)은 RADIO가 이미 "미결 사항"으로 다음 task에
  명시적으로 넘긴 항목이라 여기서 새로 결정할 사항이 아니다.

### 다음 행동

1. 검증 단계 진입: 이번 구현 커밋을 기준으로 리뷰어가 `docs/execution/radio/P4-T01-radio.md`
   (revision 2)와 `docs/execution/runs/P4-T01/radio.md`(적용 결과) 대조, 위험 매트릭스 6행
   각각의 실증 근거(`docs/execution/runs/P4-T01/tdd.json`, pgTAP/단위/e2e 파일) 확인 —
   revision 2로 추가된 `swipe-refresh.spec.ts` 정합 갱신도 함께 대조.
2. `index.jsonl`의 P4-T01 상태를 `in_progress` → 검증 단계에 맞는 다음 상태로 전환하는 것은
   조정자 몫.

### 증거·산출물 경로

- 마이그레이션: `supabase/migrations/20260819000000_notifications_foundation.sql`
- pgTAP: `supabase/tests/24-notifications.test.sql`(plan 80)
- 조회: `src/entities/notification/api/list-notifications.ts` +
  `__tests__/list-notifications.test.ts`(4문항)
- model(Seoul 전환): `src/entities/notification/model/notification-group.ts` +
  `__tests__/notification-group.test.ts`
- 기능 슬라이스: `src/features/notification/api/mark-notification-read.ts` +
  `__tests__/mark-notification-read.test.ts`(3문항),
  `src/features/notification/api/mark-all-notifications-read.ts` +
  `__tests__/mark-all-notifications-read.test.ts`(3문항)
- 화면: `src/views/notifications/ui/NotificationsView.tsx`(prop 확장),
  `src/views/notifications/ui/NotificationsPageClient.tsx`(신설),
  `src/views/notifications/ui/notifications.mock.ts`,
  `src/views/notifications/ui/__tests__/NotificationsView.test.tsx`(신규 3문항)
- 배선: `src/app/(protected)/(tabs)/notifications/page.tsx`,
  `src/app/(protected)/(tabs)/layout.tsx`
- e2e: `tests/e2e/notifications.spec.ts`(1 test),
  `tests/e2e/support/work-date-band.ts`(`notifications` 밴드 528~559 추가),
  `tests/e2e/tab-navigation.spec.ts`(정합 갱신, 392행 시나리오만),
  `tests/e2e/motion-render-budget.spec.ts`(정합 갱신),
  `tests/e2e/swipe-refresh.spec.ts`(정합 갱신, 62·96행 시나리오만 — revision 2)
- TDD 증거: `docs/execution/runs/P4-T01/tdd.json`(RED→GREEN 8쌍, 16 entries)
- RADIO 적용 결과: `docs/execution/runs/P4-T01/radio.md`
- verify 로그(저장소 밖, 스크래치패드): `/private/tmp/claude-501/-Users-yuntaegwan-Desktop-projects-la-bie-belle/e2695cd7-5794-42bc-865a-372e27167d90/scratchpad/`(`verify-p4t01-run2.log`, `swipe_red.log`, `swipe_green.log` 등)
- 구현 커밋: 이 문서를 포함하는 본 커밋

## 2026-08-16 · 교차 검증 수정 라운드(F-01·F-02)

- 작업 식별자: P4-T01
- 현재 단계: 개발 종료 상태 유지, 교차 검증(`docs/execution/reviews/P4-T01-review.json`) 확정
  발견 high 2건 수정 라운드 → 다음 검증(리뷰어 재확인)
- 기준 시각: 2026-08-16T08:35:54Z

### 확정된 사실

- 재봉인 없음 — F-01·F-02 두 수정 모두 현행 RADIO revision 2(SHA-256
  `5ba3d1750bd44ab4f9ad5a4de49e4de25ad5017f290d8d3d975db38e538ec724`)의 문면·허용 경로 안이다.
  `index.jsonl`의 `development_approval`은 이번 라운드에서 변경하지 않았다.
- F-01(high): `confirm_schedule`의 `target_work_date` 선언·초기 select projection이
  20260818000000 원본 밖이었다. 원본 그대로 복원하고, 알림 insert의 select에 `join schedules
  s on s.id = target_schedule_id`를 추가해 `work_date`를 읽도록 바꿨다. 알림 블록을 제외한
  본문 전체(172줄)가 20260818000000과 문자 단위로 동일함을 `diff`로 확인했다(종료 코드 0,
  방법·명령은 `docs/execution/runs/P4-T01/radio.md`의 "교차 검증 수정 라운드" 절).
- F-02(high): `supabase/tests/24-notifications.test.sql`에 `04-rls-default-deny.test.sql`
  관례대로 "F-02 RLS 기본 거부" 문항 20개를 추가했다(plan 80→100) — 3테이블
  relrowsecurity·정책 개수 고정, notification_outbox·push_subscriptions의 anon·authenticated
  select/insert 차단, notifications의 authenticated 직접 insert/update/delete 차단(읽음은
  RPC로만의 나머지 절반). 구현 중 서브쿼리가 RLS를 다시 타 거짓 통과가 나는 문제를 발견해
  `current_setting`/`set_config` 커스텀 GUC로 대상 id를 미리 담아 두는 방식으로 고쳤다(상세는
  `radio.md` 참고).
- `test_mode=tdd` 절차: F-02 신규 단언은 회귀 고정 성격이라 새 RED 재현 없이, `pnpm gate:tdd`의
  실제 판정 로직(같은 command의 더 이른 RED만 있으면 통과, 1:1 짝 불필요)을 먼저 확인한 뒤
  기존 pgTAP RED(entries[10])를 재사용하고 오늘 GREEN(entries[16])만
  `docs/execution/runs/P4-T01/tdd.json`에 추가했다. F-01은 RED→GREEN이 아니라 20260818
  원본과의 diff로 검증해 별도 tdd.json 항목을 만들지 않았다 — 사유는 `radio.md`에 남겼다.
  `pnpm gate:tdd` 통과.
- `pnpm db:reset` → `pnpm db:test`: Files=24, Tests=1423, 전 파일 GREEN(21~23번 포함, 기존
  단언 회귀 없음).
- `pnpm verify`를 포그라운드로 완주했다 — 결과는 최종 보고 참고. 유일한 e2e 실패는
  `recruitment-manage.spec.ts:112`(사전 known-flaky)였고 격리 재실행으로 무관성을 재확인했다.
- 전체 스테이징 후 커밋한다(부분 스테이징 없음) — `.gitignore`·`docs/execution/reviews/**`·
  다른 세션 산출물은 제외했다. push는 하지 않는다(ci-finisher 소관).

### 미결 사항

- 없음 — F-01·F-02는 이번 라운드로 해소됐다. F-03~F-10(medium·low 8건)은 계약대로
  `docs/execution/reviews/backlog.md`가 소유하며 이 task의 결정 대상이 아니다(reviews/**는
  읽기 전용, 스테이징하지 않았다).

### 다음 행동

1. 리뷰어가 이번 수정 커밋을 F-01·F-02 원 발견과 대조해 해소를 확인한다.
2. `index.jsonl`의 P4-T01 상태 전환과 backlog 반영은 조정자 몫.

### 증거·산출물 경로

- 마이그레이션(F-01 수정): `supabase/migrations/20260819000000_notifications_foundation.sql`
- pgTAP(F-02 수정, plan 100): `supabase/tests/24-notifications.test.sql`
- 교차 검증 원본: `docs/execution/reviews/P4-T01-review.json`(읽기 전용)
- TDD 증거: `docs/execution/runs/P4-T01/tdd.json`(entries[16], pgTAP GREEN-only)
- RADIO 적용 결과(수정 라운드 상세): `docs/execution/runs/P4-T01/radio.md`
- pgTAP 실행 로그(저장소 밖, 스크래치패드): `pgtap_fix_round.log`, `pgtap_fix_round2.log`

## 2026-08-16 · 검증 종료(조정자)

- 교차 검증(opus·codex, base `0a6ae79` → head `b7e53ab`): total 76
  (`docs/execution/reviews/P4-T01-review.json`). 확정 발견 10건 — high 2건(F-01
  봉인 문면 밖 선언·projection 변경, F-02 신규 테이블 RLS 미검증)은 재봉인 없이
  수정 라운드 커밋 `c007331`로 해소(20260818 대비 알림 블록 밖 본문 문자 단위
  동일 확인, pgTAP plan 80→100). medium 8건(F-03~F-10)은 backlog 342~349행.
- 판단이 갈려 기각된 발견 1건(전원 인정 불성립, 기록 목적):
  - 「notification_outbox에 4요소 멱등성 키 부재」(codex high 주장) — opus 반박:
    notification_id unique+FK와 notifications의 4요소 unique가 이행적으로 같은
    결과를 강제하고, 봉인 RADIO Data model이 outbox 컬럼을 남김없이 열거하며
    4요소 컬럼을 두지 않았으므로 제안 교정이 오히려 봉인 위반. P4-T08 소비자
    설계에서 outbox 자체 키의 필요가 재론되면 그때 다룬다.
- P4-T03 이관 사항: 확정 알림은 이 task가 소유하게 됐고, T03에는 모집 오픈·변경·
  요청 계열과 확정 알림의 푸시 링크 연결 확인만 남는다(기획 기록 참조).
