# P3-T08 handoff

## 2026-08-16 · 교차 검증 수정 라운드(F-01)

- 현재 단계: 개발 단계 내 수정 라운드 종료 → 다음 검증(재개).
- 기준 시각: 2026-08-16(아래 `pnpm verify` 2차 통과 실행 기준).

### 확정된 사실

- 교차 검증 결과: 확정 11건 중 high 1건(F-01)만 이 라운드에서 수정. medium·low 10건은
  조정자가 이미 `docs/execution/reviews/backlog.md`에 누적 완료했고(330·331행 부분
  해소 정정 포함) 이번 라운드는 손대지 않았다.
- F-01(high, tests): 봉인 RADIO 기술 인수 조건 1("e2e `insertSchedule`이 4상태
  유니언을 받고 최소 1개 e2e가 CLOSED 또는 PREPARING 경로를 지난다")이 최초 완료
  시점에는 미이행이었다 — `insertSchedule` 유니언은 4상태로 넓혔지만 CLOSED·PREPARING
  상태로 만든 스케줄에서 관리자 준비 화면의 수정 RPC 경로(편집→저장)를 실제로 통과
  시키는 e2e가 0건이었다. `tab-navigation.spec.ts`의 직접 CLOSED insert는 근무자
  라우트 렌더 확인용이라 이 조건을 충족하지 않는다는 리뷰어 2자 전원 지적을 인정.
- 고침: `tests/e2e/position-requirements.spec.ts`에
  `"필요 인원 저장은 PREPARING 스케줄의 준비 화면에서도 성공한다(P3-T08 F-01)"` 1건
  신설. PREPARING 스케줄(+예식 1건)을 직접 insert하고 `/admin/schedule/[id]` 화면에서
  매니저 포지션 필요 인원을 3으로 입력→저장→`schedule_position_requirements`에 실제
  반영 및 스케줄 상태가 여전히 `PREPARING`임을 단언한다. 기존 테스트와 밴드를 공유하지
  않도록 `WORK_DATE_BANDS.positionRequirements`를 `splitBand(..., 2)`로 나눴다
  (assignment-trainee F-03류 밴드 공유 실수 반복 방지).
- 완료 절차 전부 GREEN: `db reset` → `position-requirements.spec.ts` 단독(2 passed) →
  `pnpm verify` 포그라운드(1차 시도 `recruitment-manage.spec.ts:112` — backlog 329
  기존 무관 flake, 단독 재실행 `2 passed`로 확인 → 2차 시도 전 단계 통과, e2e 82
  passed, 종료 코드 0).
- RADIO revision 1 봉인 그대로, 허용 경로(`tests/e2e/position-requirements.spec.ts`)
  안에서만 수정했다. `.gitignore` 워킹트리 수정은 이번에도 스테이징하지 않았다.
- push는 하지 않았다(ci-finisher 소관).

### 미결 사항

- 없음 — 이 라운드에서 결정이 필요한 항목은 남지 않았다.

### 다음 행동

1. 검증 단계에서 F-01 수정 결과를 리뷰어가 대조·재확인.
2. medium·low 10건은 이미 backlog.md 누적 완료 상태이므로 이 task에서는 추가
   조치 없음.

### 증거·산출물 경로

- `tests/e2e/position-requirements.spec.ts`(신설 테스트 1건 + `splitBand` 밴드 분리)
- `docs/execution/runs/P3-T08/radio.md`(수정 라운드 절 추가)
- 검증 로그: `pnpm verify` 2회 실행(스크래치패드, 저장소 밖)

## 2026-08-16 · 개발 종료

- 작업 식별자: P3-T08
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-16(위 `pnpm verify` 2차 통과 실행 기준)

### 확정된 사실

- 기준 RADIO: `docs/execution/radio/P3-T08-radio.md` revision 1, SHA-256
  `feebb61484ca40ee8b12d35cf029778f317e38e18fe9235686bb0d83cdd88b4b`(index.jsonl
  `development_approval`과 일치, 봉인 커밋 `c345f30`).
- test_mode: `verification` — RED/GREEN 증거 대신 번들별 결과와 전체 검증 GREEN을
  `docs/execution/runs/P3-T08/radio.md`에 남겼다.
- 4개 번들 전부 적용: 축 단위 공백(번들 1), backlog 단언 10건 흡수(번들 2), UI 단위
  10종+스모크 1건(번들 3), e2e 위생 7건(번들 4). 상세 파일별 내역과 단언 수는
  `docs/execution/runs/P3-T08/radio.md` 참조.
- 제품 코드(`src/**` 비테스트 파일)·DB 스키마는 무수정. 변경은 전부 RADIO 코드펜스
  안(pgTAP 7파일, 신규 UI 단위 11파일, 모델 단위 3파일, e2e 12파일 — 1개 신설·11개
  보강/위생, `work-date-band.ts`·`assignment-schedule-fixtures.ts`,
  `backlog.md`·`index.jsonl`)에서만 이뤄졌다.
- 검증 중 발견해 그 자리에서 고친 테스트 픽스처 버그 2건(제품 코드 무관, 순수 테스트
  정합성 수정): `18-position-requirements.test.sql`의 신설 복사 단언 기대값(9→10, 직전
  AC4 섹션이 활성 포지션을 하나 더 추가해 둔 상태를 반영), `19-assignments.test.sql`의
  PREPARING 배정 대상 프로필(F2→F1, F2는 파일 앞부분에서 이미 비활성화됨). 두 건 모두
  기존 단언을 약화하지 않았고, 픽스처의 사실 오류만 정정했다.
- 검증 중 발견해 고친 신설 e2e 테스트 자체의 결함 2건(내가 이번 세션에서 작성한 테스트의
  버그, product code나 기존 테스트는 무관):
  1. `schedule-confirmation.spec.ts`의 LB028(필요 인원 미작성) 테스트 — `/admin/schedule/[id]`
     페이지 로드가 `ensureScheduleRequirementsCopied`로 활성 포지션을 자동 복사하기
     때문에, 페이지 이동만으로는 `requirement_count = 0` 상태를 재현할 수 없었다.
     고침: 페이지 로드(자동 복사 발생) 후 admin 클라이언트로 `schedule_position_requirements`
     행을 삭제해 `confirm_schedule` 호출 시점에 실제로 0행이 되도록 픽스처를 조정했다
     (confirm_schedule은 클릭 시점에 매번 새로 DB를 읽으므로 유효).
  2. `confirmation-roster-journey.spec.ts` — `confirmTrigger.toHaveCount(0)`만으로는
     확정 성공을 신뢰성 있게 확인하지 못해(다이얼로그 pending 상태에서 우연히 일치할
     수 있음) 병렬 워커 부하 아래서 레이스가 발생했다. 고침: AC7 테스트와 동일하게
     `"스케줄 취소"` 버튼 가시성 대기를 먼저 넣어 확정 완료를 명시적으로 기다리게 했다.
- 검증 순서(RADIO 지시대로) 전부 GREEN:
  1. `npx -y supabase@2.75.0 db reset` — 성공.
  2. `npx -y supabase@2.75.0 test db` — `Files=23, Tests=1297, Result: PASS`.
  3. `pnpm test` — `Test Files 232 passed (232)`, `Tests 1516 passed (1516)`.
  4. `pnpm test:e2e` 연속 2회(리셋 없이) — 1회차 `81 passed`, 2회차는 1차 시도에서
     `recruitment-manage.spec.ts:112`(마감일 연장 `toHaveValue` 5초 타임아웃, backlog
     329에 이미 기록된 무관 flake) 발생 → 단독 재실행으로 flake 확인(`2 passed`) →
     전체 재실행 `81 passed`로 GREEN 확보.
  5. `pnpm verify` 포그라운드 — 1차 시도에서 `test:e2e` 단계 중 같은
     `recruitment-manage.spec.ts:112` flake로 체인 전체 재실행, 2차 시도에서 전 단계
     (format·lint·typecheck·`pnpm test`·harness·`check:docs`·`build`·`gate:bundle`·
     `check:app-build`·`check:client-secret-scan`·`test:e2e` 81 passed·
     `gate:motion-render-budget`·`gate:all`) 통과, 종료 코드 0.
- `docs/execution/phases/index.jsonl`의 P3-T08 상태를 `planned` → `in_progress`로
  전환했다(이번 커밋에 포함). **`done`으로는 올리지 않았다** — 조정자 몫이다.
- `docs/execution/reviews/backlog.md`는 흡수 10건 + 위생 7건 총 17줄만 체크 완료로
  바꿨고, F-04(동시 확정) 줄에는 대체 종결 사유를 병기했다.
- 이 세션 시작 전부터 있던 `.gitignore` 워킹트리 수정(로컬 스킬 도구 설정, RADIO
  허용 경로 밖)은 스테이징하지 않았다.
- push는 하지 않았다(ci-finisher 소관).

### 미결 사항

- 없음 — RADIO 범위 안에서 결정이 필요한 항목은 남지 않았다.

### 다음 행동

1. 검증 단계 진입: 이번 커밋을 기준으로 리뷰어가
   `docs/execution/radio/P3-T08-radio.md`와
   `docs/execution/runs/P3-T08/radio.md`(적용 결과) 대조.
2. `index.jsonl`의 P3-T08 상태를 `in_progress` → 검증 단계에 맞는 다음 상태로
   전환하는 것은 조정자 몫.
3. ci-finisher가 push 후 CI 감시.

### 증거·산출물 경로

- pgTAP: `supabase/tests/17-ceremony-schema.test.sql`(plan 68),
  `supabase/tests/18-position-requirements.test.sql`(plan 108),
  `supabase/tests/19-assignments.test.sql`(plan 106),
  `supabase/tests/20-assignment-trainees.test.sql`(plan 64),
  `supabase/tests/21-schedule-confirmation.test.sql`(plan 48),
  `supabase/tests/22-confirmed-roster.test.sql`(plan 52),
  `supabase/tests/23-post-confirmation-changes.test.sql`(plan 86)
- 신규 UI 단위(11파일 58 tests): `src/features/confirmation/ui/__tests__/`,
  `src/features/assignment/ui/__tests__/`, `src/features/requirement/ui/__tests__/`,
  `src/features/ceremony/ui/__tests__/`, `src/views/admin-schedule/ui/__tests__/`
- 보강한 모델 단위: `src/entities/schedule/model/__tests__/ceremony-times.test.ts`,
  `src/features/ceremony/hooks/__tests__/useCeremonyEditor.test.ts`,
  `src/views/admin-schedule/model/__tests__/candidate-buckets.test.ts`
- e2e 신설: `tests/e2e/confirmation-roster-journey.spec.ts`
- e2e 보강·위생: `tests/e2e/schedule-confirmation.spec.ts`,
  `tests/e2e/assignment-trainee.spec.ts`, `tests/e2e/assignment-eligibility.spec.ts`,
  `tests/e2e/ceremony-edit.spec.ts`, `tests/e2e/position-requirements.spec.ts`,
  `tests/e2e/schedule.spec.ts`, `tests/e2e/tab-navigation.spec.ts`,
  `tests/e2e/support/work-date-band.ts`, `tests/e2e/support/assignment-schedule-fixtures.ts`
- RADIO 적용 결과: `docs/execution/runs/P3-T08/radio.md`
- backlog 갱신: `docs/execution/reviews/backlog.md`
