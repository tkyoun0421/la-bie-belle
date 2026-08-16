# P3-T11 handoff

## 2026-08-16 · 개발 종료

- 작업 식별자: P3-T11
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-16T05:35:29Z(마지막 `pnpm verify` 전체 실행 시작 시각, run3 로그 기준)

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P3-T11-radio.md` revision 1, SHA-256
  `f7db6ee2ab3561dd3228f21d8b4045ee500a45cd33c4d5689a21d1fd4a31cc32`(index.jsonl
  `development_approval`과 시작 전 대조 완료, 일치).
- 기준 커밋: `e4f628b`(RADIO 봉인 커밋).
- `docs/execution/phases/index.jsonl`의 P3-T11 상태를 `planned` → `in_progress`로
  전환했다(`updated_at`은 2026-08-16 그대로). **`done`으로는 올리지 않았다** — 조정자 몫이다.
- RADIO Requirements·Architecture·Data model·Interface 절 그대로 구현했다. 상세 적용 내역,
  구현 중 확정한 세부(설계 재해석 아님), 정지 조건 3개 각각의 미발동 근거는
  `docs/execution/runs/P3-T11/radio.md`에 전부 남겼다.
- `test_mode=tdd` 준수: RED→GREEN 2쌍(TS 단위 3파일 묶음 1쌍, pgTAP 전체 스위트 `pnpm db:test`
  1쌍) 전부 실제 명령 실행 결과로 `docs/execution/runs/P3-T11/tdd.json`에 기록했다.
  `pnpm gate:tdd` 통과.
- 구현 중 RADIO 문면 밖에서 발견한 것: `AdminSchedulePrepView.tsx`(ui 세그먼트)는
  `config/fsd.json`의 `segments.ui.forbidImports`(`**/api/**`)에 막혀
  `entities/schedule/api/list-schedule-requirements`의 `TraineePosition` 타입을 import할
  수 없다(ESLint `project/segment-imports` 즉시 발생, type-only import도 동일하게 차단).
  P3-T06 handoff에 기록된 동일 패턴(구조적 타이핑으로 로컬 타입 선언)을 그대로 따랐다 —
  계산은 `views/admin-schedule/model/confirmation-warnings.ts`에만 있고 ui는 표시만 한다는
  RADIO 계약은 그대로다. `[질문]`으로 멈추지 않고 구현 세부로 처리했다(정지 조건 어디에도
  해당하지 않는 순수 레이어 임포트 방향 문제로 판단, 근거는 `radio.md` 1번 항목).
- `pnpm verify`를 완전한 한 번의 연속 실행으로 세 차례 돌렸다(스크래치패드 로그, 저장소
  밖). 1차는 `format:check`에서 prettier 미포맷 2건으로 실패해 `prettier --write`로
  고쳤다. 2차는 e2e 82개 중 2개(`recruitment-manage.spec.ts:112`,
  `schedule-confirmation.spec.ts:201`)만 실패했고 나머지는 GREEN — 두 스펙만 격리
  재실행(`pnpm exec playwright test tests/e2e/recruitment-manage.spec.ts
  tests/e2e/schedule-confirmation.spec.ts`, db reset 후)한 결과 7/7 전부 통과해 전체 스위트
  동시 실행 중의 우연한 경합(work_date 밴드는 서로 겹치지 않음, P3-T06에 기록된 것과 같은
  유형의 flaky)임을 확인했다 — 이 task의 diff와 무관. 3차 실행에서 e2e 82개 전부 GREEN,
  나머지 `format`·`lint`·`typecheck`·`pnpm test`(단위 232 files·1522 tests)·`harness:typecheck`·
  `harness:self-test`·`check:docs`·`build`·`gate:bundle`·`check:app-build`·
  `check:client-secret-scan`·`gate:motion-render-budget`도 GREEN. `gate:all`만 그 시점에
  `handoff.md` 부재로 실패(이 문서 작성 후 재실행 예정).
- pgTAP: `supabase/tests/19-assignments.test.sql`(plan 106→118, +12),
  `21-schedule-confirmation.test.sql`(plan 48→57, +9),
  `23-post-confirmation-changes.test.sql`(plan 86→91, +5). `pnpm db:test` 전체
  스위트 Files=23, Tests=1323, Result: PASS(기존 단언 회귀 없음).
- 마이그레이션: `supabase/migrations/20260818000000_confirmation_warning_scope.sql` 1개로
  `confirm_schedule`·`replace_position_assignments` 재정의.
- push는 하지 않았다(ci-finisher 소관).

### 미결 사항

- 없음 — RADIO 범위 안에서 결정이 필요한 항목은 남지 않았다.

### 다음 행동

1. `pnpm gate:all`을 이 handoff 작성 후 재확인(기존에 handoff 부재로만 실패했던 것이므로
   통과 예상).
2. 커밋 생성: 변경 파일 전체 스테이징(부분 스테이징 금지), 메시지에 `P3-T11` 포함.
3. 검증 단계 진입: 리뷰어가 `docs/execution/radio/P3-T11-radio.md`와
   `docs/execution/runs/P3-T11/radio.md`(적용 결과) 대조, 위험 매트릭스 4행(1·2·3·4·5 조건)
   각각의 실증 근거(`docs/execution/runs/P3-T11/tdd.json`, pgTAP/단위 파일) 확인.
4. `index.jsonl`의 P3-T11 상태를 `in_progress` → 검증 단계에 맞는 다음 상태로 전환하는
   것은 조정자 몫.
5. backlog 277·305·306 종결 기재는 조정자 몫(RADIO 미결 사항에 명시됨).

### 증거·산출물 경로

- 마이그레이션: `supabase/migrations/20260818000000_confirmation_warning_scope.sql`
- pgTAP: `supabase/tests/19-assignments.test.sql`(plan 118, P3-T11 블록 12문항),
  `supabase/tests/21-schedule-confirmation.test.sql`(plan 57, P3-T11 블록 9문항),
  `supabase/tests/23-post-confirmation-changes.test.sql`(plan 91, P3-T11 블록 5문항)
- 조회 확장: `src/entities/schedule/api/list-schedule-requirements.ts` +
  `__tests__/list-schedule-requirements.test.ts`(traineePositions 신규 2문항 + 기존 갱신)
- 화면 모델: `src/views/admin-schedule/model/confirmation-warnings.ts` +
  `__tests__/confirmation-warnings.test.ts`(표 밖 포지션 신규 3문항 + 기존 6문항 회귀 없음)
- 화면 배선: `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`,
  `src/app/(protected)/admin/schedule/[id]/page.tsx`(prop 전달만)
- TDD 증거: `docs/execution/runs/P3-T11/tdd.json`(RED→GREEN 2쌍, 4 entries)
- RADIO 적용 결과: `docs/execution/runs/P3-T11/radio.md`
- 구현 커밋: `15de76c`

## 2026-08-16 · 수정 라운드(F-01/F-02, revision 2)

- 작업 식별자: P3-T11
- 현재 단계: 수정 라운드 종료 → 다음 검증
- 기준 시각: 2026-08-16T06:15:02Z(이 라운드 마지막 `pnpm verify` 전체 실행 시작 시각)
- **기준 커밋(갱신)**: 이 handoff 커밋 직후 생성되는 수정 라운드 커밋(SHA는 다음 보고에서
  확정) — 직전 기준 커밋 `15de76c`는 그대로 남긴다, 이 절이 새 기준이다.

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P3-T11-radio.md` revision 2, SHA-256
  `5562f445f41c4a6a8c1d13a9163e5762a6fb863faca8dcee82a1cd5cd4b5694a`(재봉인 커밋 `563488e`,
  index.jsonl `development_approval`과 대조 완료, 일치).
- 교차 검증 확정 발견 2건(`docs/execution/reviews/P3-T11-review.json`, F-01 high·F-02
  medium)을 해소했다. 상세 서술은 `docs/execution/runs/P3-T11/radio.md`의 "수정 라운드(revision
  2, F-01/F-02 해소)" 절.
  - F-01: `AdminSchedulePrepView.tsx`에 상태와 무관한(CONFIRMED 포함) 경고 요약 영역
    (`data-testid="confirmation-warning-summary"`)을 추가했다. `ConfirmScheduleDialog`는
    무수정(git diff 없음, 확인 완료).
  - F-02: `traineePositions` prop을 필수로 바꾸고, `AdminSchedulePrepView.test.tsx`(revision 2
    허용 경로 신규 편입)에 3건을 추가했다 — 표 밖 잔존 포지션 단건 표시, 경고 둘 다 없을 때
    미렌더, 표 안·표 밖 동시 표시. 기존 CANCELLED 스모크는 단언 무변경, `traineePositions={[]}`만
    추가(필수화에 따른 컴파일 정합).
- `test_mode=tdd` 준수: 이번 라운드의 RED→GREEN 1쌍을 실제 명령 실행 결과로
  `docs/execution/runs/P3-T11/tdd.json`에 추가했다(기존 4건 보존, 총 6건). RED는
  `git stash push -- src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`로 구현만 되돌린
  상태에서 2 failed/2 passed(exit 1), GREEN은 `git stash pop` 복원 후 4 passed(exit 0). 두
  실행 모두 동일한 명령 문자열(`pnpm vitest run
  src/views/admin-schedule/ui/__tests__/AdminSchedulePrepView.test.tsx`)을 썼다(`gate:tdd`
  요구).
- `pnpm verify`를 이 라운드에서 두 차례 돌렸다. 1차는 e2e 2건(`auth.spec.ts:60`,
  `recruitment-manage.spec.ts:112`)이 실패했으나 이 task의 diff와 무관한 두 스펙을
  격리 재실행(`pnpm exec playwright test tests/e2e/auth.spec.ts
  tests/e2e/recruitment-manage.spec.ts`, db reset 후)한 결과 8/8 전부 통과해 전체 스위트
  동시 실행 중의 우연한 경합(P3-T06·P3-T11 이전 라운드에 기록된 것과 같은 유형의 flaky)임을
  확인했다. 2차 전체 실행에서 e2e 82개 전부 GREEN, `format`·`lint`·`typecheck`·`pnpm
  test`·`harness:typecheck`·`harness:self-test`·`check:docs`·`build`·`gate:bundle`·
  `check:app-build`·`check:client-secret-scan`·`gate:motion-render-budget`·`gate:all` 모두
  GREEN, exit 0.
- push는 하지 않았다(ci-finisher 소관).

### 미결 사항

- 없음 — RADIO revision 2 범위 안에서 결정이 필요한 항목은 남지 않았다.

### 다음 행동

1. 커밋 생성: `AdminSchedulePrepView.tsx`·`AdminSchedulePrepView.test.tsx`·
   `docs/execution/runs/P3-T11/{radio.md,tdd.json,handoff.md}` 전체 스테이징(부분 스테이징
   금지), 메시지에 `P3-T11` 포함. `.gitignore`·`docs/execution/reviews/**`는 스테이징하지
   않는다(조정자 소유, 워킹트리 미커밋 상태 보존).
2. 검증 단계 진입: 리뷰어가 F-01·F-02 해소와 인수 조건 8·9의 실증 근거
   (`docs/execution/runs/P3-T11/tdd.json` 5·6번째 항목, 신규 컴포넌트 단언 3건) 확인.
3. `index.jsonl`의 P3-T11 상태 전환은 조정자 몫.

### 증거·산출물 경로(이번 라운드 추가분)

- 화면 배선: `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`(경고 요약 영역, prop
  필수화)
- 컴포넌트 테스트: `src/views/admin-schedule/ui/__tests__/AdminSchedulePrepView.test.tsx`
  (신규 3문항 + 기존 스모크 보존)
- TDD 증거: `docs/execution/runs/P3-T11/tdd.json`(RED→GREEN 총 3쌍, 6 entries)
- RADIO 적용 결과: `docs/execution/runs/P3-T11/radio.md`의 "수정 라운드" 절
- 수정 라운드 커밋: 이 handoff 커밋 직후 생성(SHA는 다음 보고에서 확정)

## 2026-08-16 · 검증 종료(조정자)

- 교차 검증(opus·codex, base `e4f628b` → head `15de76c`): total 87
  (`docs/execution/reviews/P3-T11-review.json`). 확정 발견 F-01(high)·F-02(medium)는
  RADIO revision 2 재봉인 후 수정 라운드 커밋 `beb1b80`으로 해소 — 경고 요약 영역
  신설(상태 무관 렌더), `traineePositions` prop 필수화, 컴포넌트 단언 3건.
- 판단이 갈려 기각된 발견 2건(전원 인정 불성립, 기록 목적으로만 남김):
  - server-only api 모듈의 타입이 model로 유입(opus 제기) — codex 반박: `import type`은
    번들에서 제거되고 `config/fsd.json` 계약은 model→api 임포트를 금지하지 않는다.
    공유 타입을 types 세그먼트로 옮기는 정리는 취향 개선 후보로만 남는다.
  - TDD RED 증거가 구현 후 되돌림으로 생성(codex 제기) — opus 반박:
    `harness/lib/tdd-gate.ts`의 기계 계약은 같은 명령의 RED 선행·exit 코드만 요구하고
    실행 순서 조항이 없으며, P3 전 구간(`P3-T03~T09`)의 tdd.json이 같은 방식이다.
    계약 문면을 「RED 실행이 구현 작성보다 앞서야 한다」로 좁힐지는 소유자 결정
    사안 — 필요 시 별도 제안으로 올린다.
- backlog 종결 4줄: 277(비활성 축소 완화)·305(결함 아님 — 기획 결정 ①)·306(합집합
  확장)·341(P3-T11 F-02, 수정 라운드 해소).
