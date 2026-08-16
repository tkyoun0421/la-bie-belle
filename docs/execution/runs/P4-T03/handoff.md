# P4-T03 handoff

## 2026-08-16 · 개발 종료

- 작업 식별자: P4-T03
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-16T15:32:55Z

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P4-T03-radio.md` **revision 1**, SHA-256
  `26cbf12e316941d1224f8fea4927c55dd2f004d0d1dd784ba522c0e505d744b2`(index.jsonl
  `development_approval`과 대조 완료, 일치). 재봉인 없음.
- 기준 커밋: `063bdde`("docs(P4-T03): seal RADIO revision 1 and queue the task as planned",
  조정자). 구현 커밋: 이 handoff 문서를 포함하는 본 커밋 — 최종 보고에서 SHA를 확인할 수
  있다.
- `docs/execution/phases/index.jsonl`의 P4-T03 상태는 착수 시 `planned` → `in_progress`로
  이미 전환돼 있었다(세션 시작 시점부터). **`done`으로는 올리지 않는다** — 조정자 몫이다.
- RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 상세 적용 내역,
  구현 중 확정한 세부 5건, 정지 조건 점검, 위험 매트릭스 대비 실증 근거는
  `docs/execution/runs/P4-T03/radio.md`에 전부 남겼다.
- 정지 조건 반환·재봉인 없이 개발을 완주했다 — RADIO의 정지 조건 3개는 전부 발동하지
  않았다(근거는 `radio.md`의 "정지 조건 점검").
- `test_mode=tdd` 준수: RED→GREEN **4쌍**(pgTAP 1쌍, `notification-path` 단위 1쌍,
  `list-notifications` 단위 1쌍, `push-service-worker` 단위 1쌍) 전부 실제 명령 실행 결과로
  `docs/execution/runs/P4-T03/tdd.json`에 기록했다(8 entries). `push-service-worker`의 RED는
  구현을 `git stash`로 원본(schedule 분기 없음) 상태로 되돌려 재현하고, GREEN은
  `git stash pop`으로 복원한 뒤 같은 명령으로 재실행해 얻었다. `pnpm gate:tdd` 통과.
- e2e(`recruitment-notifications.spec.ts`)는 별도 RED 캡처 없이 구현 완료 후 GREEN만
  확인했다 — 이 spec은 이미 구현된 마이그레이션·model·SW에 전적으로 의존하는 여정
  테스트라, 단위·pgTAP 레이어에서 이미 RED→GREEN을 거친 로직을 다시 e2e 레이어에서 RED로
  재현할 대상이 없다(선례: P4-T01·P4-T02의 tdd.json도 e2e 항목은 구현 완료 후 실행 1쌍만
  기록했고, 이번에도 같은 방식을 따랐다). `pnpm gate:tdd`가 이를 위반으로 판정하지 않음을
  확인했다.
- `pnpm verify`를 한 번의 연속 명령으로 돌리면 병렬 세션(들)의 미완성/미커밋 변경(디자인
  리스타일 ~25개 뷰 파일, `.claude/agents/**` 신규 서브에이전트, `harness/gates/retro.ts`·
  `docs.ts` 등 신규 게이트, `docs/execution/radio/P0-T46·P0-T47-radio.md`,
  `docs/execution/retrospective/**`) 때문에 이 task와 무관한 지점에서 멈춘다. 조정자 지시대로
  "내 변경 아닌 파일 실패는 고치지 않는다"를 지키면서 각 하위 단계를 개별 실행해 내 범위의
  실제 상태를 확인했다 — 결과는 아래 "verify 결과 요약" 참고.
- pre-commit 훅(gate 4종 + lint-staged + 증분 typecheck + 단위 테스트) 통과 후 커밋한다.
  커밋에는 이 task의 관련 파일만 전체 스테이징한다(부분 스테이징 없음) — 병렬 세션의 대규모
  무관 변경, `docs/execution/reviews/**`(리뷰어 소관), `docs/workflow/**`·`.claude/**`(조정자
  소유)는 전부 제외했다.
- push는 하지 않는다(ci-finisher 소관).

### verify 결과 요약(포그라운드, 개별 단계로 재구성)

| 단계 | 결과 | 비고 |
| --- | --- | --- |
| format:check(내 범위) | GREEN | `prettier --check`를 관련 10개 파일로 스코프 실행 — 전부 Prettier 스타일 |
| lint:ci(내 범위) | GREEN | `eslint -c eslint.config.ci.mjs src/entities/notification src/views/notifications/ui/NotificationsPageClient.tsx src/features/push/lib` — 0 errors |
| typecheck(전체) | GREEN | `next typegen && tsc --noEmit` 전체 실행 — 이번엔 병렬 세션 변경도 타입 오류 없이 통과 |
| test(vitest, 전체) | GREEN | `pnpm test` — **244/244 파일, 1602/1602 테스트** 통과(구조화 로그의 `*_failed` 라인은 오류 경로를 검증하는 기존 테스트의 의도된 출력) |
| pgTAP(전체) | GREEN | `supabase db reset` → `supabase test db` — **26 files, 1512 tests, PASS**(기존 25개 파일 회귀 없음, 신규 26번 45/45) |
| build | GREEN | `pnpm build` — `/notifications` 등 24개 라우트 정상 컴파일 |
| test:e2e(내 spec) | GREEN | `recruitment-notifications.spec.ts` **2/2 passed** |
| test:e2e(인접 회귀) | GREEN | `notifications.spec.ts` + `push-subscription.spec.ts` 나란히 실행 — **4/4 passed**(밴드 594~625가 528~592와 충돌하지 않음을 확인) |
| gate:index | GREEN | 무출력 |
| gate:radio | GREEN | 무출력 |
| gate:tdd | GREEN | 무출력 |
| gate:handoff | 이 문서 작성 후 재확인 예정 | 작성 전 실행은 handoff 부재로만 실패 |
| gate:scope | 스테이징 후 재확인 예정 | |

전체 `pnpm verify` 단일 실행은 위 사유로 시도하지 않고 각 단계를 개별 실행해 대체했다(P4-T02
handoff의 선례를 따름).

### 미결 사항

- 없음 — RADIO 범위 안에서 결정이 필요한 항목은 남지 않았다. outbox 소비·대량 발송 배치는
  P4-T08 몫, 확정 취소 알림은 P4-T04 기획 몫으로 RADIO가 이미 명시적으로 이월한 항목이다.

### 다음 행동

1. 검증 단계 진입: `docs/execution/radio/P4-T03-radio.md`(revision 1)와
   `docs/execution/runs/P4-T03/radio.md`(적용 결과) 대조, 위험 매트릭스 7행 각각의 실증 근거
   (`docs/execution/runs/P4-T03/tdd.json`, pgTAP 26번, 단위 3파일, e2e 신규 spec) 확인.
2. `index.jsonl`의 P4-T03 상태를 `in_progress` → 검증 단계에 맞는 다음 상태로 전환하는 것은
   조정자 몫.

### 증거·산출물 경로

- 마이그레이션: `supabase/migrations/20260821000000_recruitment_change_notifications.sql`
- pgTAP: `supabase/tests/26-recruitment-change-notifications.test.sql`(plan 45)
- 딥링크: `src/entities/notification/model/notification-item.ts`(타입 확장),
  `src/entities/notification/model/notification-path.ts`(신설) +
  `__tests__/notification-path.test.ts`(5문항),
  `src/entities/notification/api/list-notifications.ts`(파서 확장) +
  `__tests__/list-notifications.test.ts`(신규 2문항),
  `src/views/notifications/ui/NotificationsPageClient.tsx`(model 함수 대체),
  `public/push-service-worker.js`(schedule 분기) +
  `src/features/push/lib/__tests__/push-service-worker.test.ts`(신규 2문항)
- e2e: `tests/e2e/recruitment-notifications.spec.ts`(신설, 2 test),
  `tests/e2e/support/work-date-band.ts`(`recruitmentNotifications` 밴드 594~625 추가)
- TDD 증거: `docs/execution/runs/P4-T03/tdd.json`(RED→GREEN 4쌍, 8 entries)
- RADIO 적용 결과: `docs/execution/runs/P4-T03/radio.md`
- 구현 커밋: 이 문서를 포함하는 본 커밋

## 2026-08-16 · 교차 검증 수정 라운드(F-01·F-02·F-03)

- 작업 식별자: P4-T03
- 현재 단계: 개발 종료 상태 유지, 교차 검증(`docs/execution/reviews/P4-T03-review.json`) 확정
  발견 high 3건 수정 라운드 → 다음 검증(리뷰어 재확인)
- 기준 시각: 2026-08-16T16:11:47Z

### 확정된 사실

- 기준 RADIO가 revision 1(SHA-256
  `26cbf12e316941d1224f8fea4927c55dd2f004d0d1dd784ba522c0e505d744b2`) → **revision 2**(SHA-256
  `f93880f68de6465c922d2cc5b4a0d2453db8c8baee28e877155e996beb1edaf1`, 재봉인 커밋 `8a97b6c`,
  사용자 승인)로 바뀌었다. `index.jsonl`의 `development_approval`도 revision 2로 갱신됐다(조정자).
- F-01(high, 재현 확정)·F-02(high)·F-03(high, 사용자 결정) 셋 다
  `docs/execution/runs/P4-T03/radio.md`의 "교차 검증 수정 라운드(F-01·F-02·F-03)" 절에 상세
  기록했다. 요약:
  1. F-03: `replace_position_assignments`의 변경 알림 수신자를 포지션 한정 전후 합집합에서
     **스케줄 전체 전후 로스터 합집합**으로 넓혔다(사용자 결정). 마이그레이션은 기존
     `20260821000000` 파일을 재작성했다(아직 push 전이라 로컬 DB 재적용으로 반영, 새 파일
     아님).
  2. F-01: e2e `tests/e2e/support/worker-session.ts`의 `deleteWorkerSessions`가 프로필 삭제
     전에 그 프로필 수신 notifications·notification_outbox를 먼저 지우도록 고쳤다(알림 팬아웃이
     profiles를 cascade 없이 참조해 FK 위반이 나던 문제, 조정자가 재현 확정).
  3. F-02: `tests/e2e/notifications.spec.ts`의 전역 미읽음 배지 0 단언을 자기 스케줄 한정 DB
     조회로 바꾸고, `tests/e2e/recruitment-notifications.spec.ts`의 모집 오픈 알림 로케이터에
     밴드 날짜 `.filter({ hasText })`를 추가해 병렬 spec의 모집 오픈 팬아웃에 오염되지 않게
     했다.
- 허용 경로 revision 2(`tests/e2e/post-confirmation-changes.spec.ts`·`tests/e2e/notifications.spec.ts`
  용도 한정 추가) 밖으로 나간 파일은 없다.
- `test_mode=tdd` 절차: F-03은 pgTAP에 RED를 먼저 추가했다(`supabase test db
  supabase/tests/26-recruitment-change-notifications.test.sql`, RED 2026-08-16T16:03:08Z exit 1
  → GREEN 2026-08-16T16:03:58Z exit 0). F-01은 조정자가 지목한 재현 명령을 그대로 써서
  RED(`pnpm exec playwright test tests/e2e/post-confirmation-changes.spec.ts`,
  2026-08-16T16:05:00Z exit 1, `worker-session.ts:62`에서 정확히 재현) → GREEN
  (2026-08-16T16:05:55Z exit 0)을 확보했다. F-02는 레이스 컨디션 성격이라 결정적 RED를 만들
  수 없어 별도 쌍을 남기지 않았다(근거는 radio.md). `docs/execution/runs/P4-T03/tdd.json`에 새
  RED→GREEN 2쌍 추가(총 6쌍, 12 entries). `pnpm gate:tdd` 통과.
- 수정 후 검증(포그라운드, 이번 라운드 범위로 스코프):
  - pgTAP 전체: `supabase db reset` → `supabase test db` — 26 files, **1514 tests, PASS**.
  - `pnpm typecheck`: 전체 GREEN.
  - `pnpm test`: 전체 **244/244 파일, 1602/1602 테스트** GREEN(이번 라운드는 vitest 대상 파일을
    건드리지 않아 회귀 없음).
  - `pnpm exec prettier --check`: 수정 5개 파일 전부 스타일 통과. e2e는 `lint:ci`(`eslint src`)
    범위 밖이라 대상 아님(프로젝트 관례).
  - e2e 4 spec 동시 실행(조정자 지정): `pnpm exec playwright test
    tests/e2e/post-confirmation-changes.spec.ts tests/e2e/notifications.spec.ts
    tests/e2e/recruitment-notifications.spec.ts tests/e2e/push-subscription.spec.ts` —
    `supabase db reset` 후 **연속 3회 실행, 매번 8/8 통과**.
  - 전체 verify(format/lint/build/gate:bundle 등)는 이번 라운드에서 다시 돌리지 않았다 — 수정
    범위가 마이그레이션 1개·pgTAP 1개·e2e support 1개·e2e spec 2개(부분)로 좁고, 개발 종료
    시점 handoff의 verify 결과(build·gate:index/radio/tdd/handoff/scope/all GREEN)가 이
    범위에서 재확인 필요한 항목을 포함하지 않는다고 판단했다. 필요하면 검증 단계에서 리뷰어가
    전체 재실행한다.
- 전체 스테이징 후 커밋한다(부분 스테이징 없음) — 수정 대상 5개 파일(마이그레이션 1·pgTAP
  1·e2e support 1·e2e spec 2)과 `docs/execution/runs/P4-T03/{tdd.json,radio.md,handoff.md}`만
  스테이징했다. 병렬 세션(들)의 무관 변경은 이번 라운드에서도 손대지도 스테이징하지도 않았다.
  push는 하지 않는다(ci-finisher 소관).

### 미결 사항

- 없음 — F-01·F-02·F-03은 이번 라운드로 해소됐다. medium·low(F-04~F-07)는 backlog가 소유하며
  이 task의 결정 대상이 아니다(이번 라운드에서 고치지 않았다).

### 다음 행동

1. 리뷰어가 이번 수정 커밋을 F-01·F-02·F-03 원 발견과 대조해 해소를 확인한다.
2. `index.jsonl`의 P4-T03 상태 전환은 조정자 몫.

### 증거·산출물 경로

- 수정 파일: `supabase/migrations/20260821000000_recruitment_change_notifications.sql`(F-03),
  `supabase/tests/26-recruitment-change-notifications.test.sql`(F-03, plan 45→47),
  `tests/e2e/support/worker-session.ts`(F-01), `tests/e2e/notifications.spec.ts`(F-02),
  `tests/e2e/recruitment-notifications.spec.ts`(F-02)
- 교차 검증 원본: `docs/execution/reviews/P4-T03-review.json`(읽기 전용)
- TDD 증거: `docs/execution/runs/P4-T03/tdd.json`(새 RED→GREEN 2쌍, 총 12 entries)
- RADIO 적용 결과(수정 라운드 상세): `docs/execution/runs/P4-T03/radio.md`
- 수정 커밋: 이 절을 포함하는 본 커밋
