# P3-T05 handoff

## 2026-08-11 · 개발 단계 종료

- 작업 식별자: P3-T05 (교육생 배정)
- 현재 단계: 개발(TDD) 종료 → 다음 검증(교차 리뷰)
- 기준 시각: 2026-08-11T13:59:48Z

### 확정된 사실

- RADIO(`docs/execution/radio/P3-T05-radio.md` **revision 2**, SHA-256
  `9a188845cfa23f41e942f703700de3314d30078a9a5b100f3ea60506c0356aed`) 범위대로 구현했다. revision 1은
  네번째 인자 기본값·과부하 금지·정지 조건(7줄)이 서로 모순됐고, 구현 중 `[질문]`으로 반환해 조정자가
  revision 2(네번째 인자 `default null`, "교육생을 건드리지 않는다")로 재봉인했다. 상세 경위는
  `docs/execution/runs/P3-T05/radio.md`.
- 핵심 규칙 네 가지를 모두 지켰다: 교육생은 포지션에 속하고 담당자 컬럼이 없다(멘토 흐름 미신설),
  한 사람은 한 스케줄에서 한 자리만 가진다(정식·교육 양방향 배타 + 교육생 중복 거부), 저장은 RPC
  한 번의 단일 트랜잭션이다, 교육생은 `INV-STAFF-02`대로 필요 인원 집계에서 빠진다.
- 만든 것(DB→TS→UI→e2e 순):
  - `supabase/migrations/20260811000000_assignment_trainees.sql`: `assignment_trainees` 테이블·RLS
    신설, `list_position_assignment_candidates`에 `currently_trainee` 추가, `replace_position_assignments`에
    `trainee_profile_ids uuid[] default null` 추가 — 둘 다 `drop function` 후 재생성, 과부하 없음.
  - `supabase/tests/20-assignment-trainees.test.sql`(신규, 45문항): 스키마·RLS·AC1~AC4·상한 없음·
    감사·delete restrict·AC8(3-인자 호출이 기존 교육생 행을 그대로 두는지) 회귀.
  - `supabase/tests/19-assignments.test.sql`: 정정된 정지 조건대로 4줄(76·77·87·92)만 새 시그니처로
    고쳤다. 3-인자 호출부 26곳은 무수정.
  - `src/entities/assignment/types/candidate.ts` / `list-position-assignment-candidates.ts`:
    `currentlyTrainee: boolean` 추가.
  - `src/entities/schedule/api/list-schedule-requirements.ts`: `traineeCounts: Record<string, number>`
    추가(별도 fail-closed 처리, 기존 조회 필터·권한 무수정).
  - `src/views/admin-schedule/model/candidate-buckets.ts`: `canSelectCandidateAsTrainee` 신설
    (`GENDER_MISMATCH`만 불가). 묶음 구성(`groupAssignmentCandidates`)은 무수정.
  - `src/views/admin-schedule/model/requirement-section-data.ts`: `resolveTraineeCountLabel`·
    `shouldShowNoManagerNotice` 신설, `traineeCounts`를 결과 타입에 실어 통과.
  - `src/features/assignment/hooks/useCandidateSelection.ts`: 선택 상태를 `selectedAssigned`·
    `selectedTrainee` 두 집합으로 분리, `toggle(profileId, role)`이 상호 배타를 강제, 저장·되돌리기·
    변경 수 모두 두 집합을 함께 다룬다. 기존 단언 8건을 지우지 않고 두 집합 구조로 옮겼다.
  - `src/features/assignment/api/replace-position-assignments.ts`: `traineeProfileIds`(필수) 추가,
    RPC 호출에 `trainee_profile_ids` 포함, `LB024`→`SCHEDULING_TRAINEE_ALREADY_ASSIGNED`·
    `LB025`→`SCHEDULING_TRAINEE_DUPLICATE` 매핑 추가.
  - `src/shared/config/error-codes.config.ts`: 위 두 코드 추가(기존 코드 문구·http 무수정).
  - `src/features/assignment/ui/AssignmentCandidateSheet.tsx`: 후보 행에 "교육"/"교육됨" 칩을
    "선택"/"선택됨" 옆에 추가(교육 불가 후보에는 그리지 않음). `자격 없음` 묶음의 `IneligibleRow`에도
    같은 판정으로 조건부 교육 칩을 추가했다 — 묶음 구성 자체는 그대로다.
  - `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx` / `page.tsx`: `traineeCounts`와 판정
    결과를 prop으로 받아 `· 교육 K`·`담당자 없음`을 그린다. 계산은 이 파일들에서 하지 않는다.
  - `tests/e2e/support/assignment-schedule-fixtures.ts`·`assignment-candidate-sheet.ts`(신규):
    `assignment-eligibility.spec.ts`의 시딩 헬퍼 10개 추출.
  - `tests/e2e/support/work-date-band.ts`: `assignmentTrainee` 밴드(297~328개월) 추가.
  - `tests/e2e/assignment-trainee.spec.ts`(신규, test 2개): AC1·AC5·AC6·AC7을 한 test로, AC2·AC3·AC4를
    다른 test로 실DB 검증.
  - `tests/e2e/assignment-eligibility.spec.ts`: 헬퍼 import로 교체. 기존 test 본문은 import 줄 외
    무수정(`git diff` 확인 완료, `docs/execution/runs/P3-T05/radio.md` 참조).
- **기술 인수 조건 1~8 모두 충족**(근거는 `docs/execution/runs/P3-T05/radio.md`의 「위험 기반 테스트
  매트릭스 반영」).
- TDD RED→GREEN **6쌍(entries 12개)**을 `docs/execution/runs/P3-T05/tdd.json`에 남겼다 — pgTAP 1쌍,
  unit 4쌍(entities/api 2파일 묶음 1쌍·views/model 1쌍·features/hooks 1쌍·features/api 1쌍), e2e
  1쌍. 명령·exit code·ISO 8601 시각은 전부 이번 세션의 실제 명령 실행에서 얻었다 — 압축 이전에
  손댄 4개 파일(pgTAP·`list-position-assignment-candidates`·`list-schedule-requirements`·
  `candidate-buckets`)도 정확한 근거를 남기려고 이번 세션에서 RED→GREEN을 다시 실행했다(구현을
  HEAD로 되돌렸다 복원하는 방식). e2e RED는 `canSelectCandidateAsTrainee`를 일시적으로 `false`
  고정한 빌드로 얻었다(마이그레이션을 건드리지 않고 UI 계층만 되돌리는 방식 — pgTAP RED와 역할을
  분리했다).
- `pnpm verify`가 **e2e 단계를 제외하고 전부 GREEN**이다 — format·lint·typecheck·unit(209 files /
  1364 tests)·harness self-test(321/321)·check:docs·build·gate:bundle·check:app-build·
  check:client-secret-scan이 통과했다. e2e는 아래 미결 사항 참조.

### 미결 사항

- **`pnpm verify`가 한 번의 끊기지 않은 실행으로 끝까지 GREEN을 찍지 못했다** — `test:e2e` 단계에서
  이 diff와 무관한 두 spec(`recruitment-manage.spec.ts:114`, `recruitment-open.spec.ts:80`)이
  `schedules_work_date_active_unique` 충돌로 간헐 실패했다. 두 파일 모두 `git diff`로 무수정임을
  확인했고 `WORK_DATE_BANDS`를 전혀 쓰지 않는다(날짜를 밴드 없이 생성). 전체 스위트를 3회 실행한 결과
  매번 이 두 파일에서만, 서로 다른 날짜(`2026-10-12`, `2026-09-10`)로 실패했고, 두 파일만 독립
  실행하면 4/4 통과했다 — P3-T04 handoff가 이미 `recruitment-manage.spec.ts:114`를 "부하에 따른
  타이밍 플레이키니스"로 기록한 것과 같은 계열이며, `recruitment-open.spec.ts:80`도 같은 원인(밴드
  미적용)으로 추가 확인됐다. `tests/e2e/recruitment-manage.spec.ts`·`recruitment-open.spec.ts`·
  `playwright.config.ts` 모두 이 task의 변경 허용 경로 밖이라 고치지 않았다 — 결정 주체: 후속 task
  (두 spec을 `WORK_DATE_BANDS`로 옮기거나 `playwright.config.ts`에 재시도를 추가하는 안), 반환할
  단계: 설계.
  - 대신 (1) `test:e2e`(전체 70건)를 두 번 돌려 두 번 다 이 두 파일 외에는 전부 통과함을 확인했고,
    (2) 이 두 파일만 독립 실행해 4/4 통과를 확인했고, (3) `gate:motion-render-budget`와
    `gate:tdd`를 별도로 실행해 GREEN을 확인했다 — `gate:all`은 커밋 전 pre-commit hook이 스테이징된
    최종 상태로 다시 검증한다.
- 로컬 Supabase CLI 드리프트: Homebrew로 설치된 전역 `supabase` CLI가 2.113.0으로 자동 갱신돼 있어
  `npx supabase`가 이 버전을 잡으면 로컬 pgTAP이 권한 오류로 전부 깨진다(테이블 grant 문제, 이
  diff와 무관). CI는 `supabase/setup-cli@v1`을 2.75.0으로 고정해 두어 CI에는 영향이 없다 — 이번
  세션은 `npx -y supabase@2.75.0`으로 CI와 버전을 맞춰 모든 supabase CLI 호출을 실행했다. 저장소
  조치는 필요 없다(조정자 확인).
- RADIO 자체의 미결 사항 5건(교육생 예상 급여 산정 방식은 P6, 교육생 출퇴근 여부는 P5, 담당자 없는
  포지션의 확정 직전 차단은 P3-T06, 근무자 본인 화면의 교육생 구분 표시는 P3-T07,
  `assignment_trainees_replaced` 감사 로그의 상세 수준은 후속 제안)은 그대로 열려 있다 — 이번 task
  범위가 아니다.

### 다음 행동

1. 조정자가 검증(교차 리뷰) 진행 여부와 `index.jsonl` 상태 전환을 판단한다 — 이 세션은 status를
   `in_progress`에서 바꾸지 않았다.
2. `ci-finisher`가 이 커밋을 push하고 CI(특히 신규 e2e spec과 pgTAP)를 확인한다. 이 세션은 push하지
   않았다. CI에서 `recruitment-manage.spec.ts:114`·`recruitment-open.spec.ts:80`이 간헐 실패해도
   위 미결 사항에 적은 사전 존재 원인이니 이 task 탓으로 재조사하지 않아도 된다.
3. 위 work_date 밴드 미적용 spec 2개를 정리할 후속 task를 설계 단계에서 고려한다.

### 증거·산출물 경로

- `docs/execution/runs/P3-T05/tdd.json` — RED→GREEN 6쌍(entries 12개, 명령·exit code·ISO8601 시각).
- `docs/execution/runs/P3-T05/radio.md` — revision 1→2 정지 조건 경위, 구현 중 확정한 세부 4건,
  위험 기반 테스트 매트릭스별 실증 근거.
- `supabase/migrations/20260811000000_assignment_trainees.sql`,
  `supabase/tests/20-assignment-trainees.test.sql`(신규), `supabase/tests/19-assignments.test.sql`(4줄).
- `src/entities/assignment/types/candidate.ts`, `src/entities/assignment/api/list-position-assignment-candidates.ts`(+test).
- `src/entities/schedule/api/list-schedule-requirements.ts`(+test).
- `src/views/admin-schedule/model/candidate-buckets.ts`(+test), `requirement-section-data.ts`(+test).
- `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`.
- `src/features/assignment/hooks/useCandidateSelection.ts`(+test).
- `src/features/assignment/api/replace-position-assignments.ts`(+test).
- `src/features/assignment/ui/AssignmentCandidateSheet.tsx`.
- `src/shared/config/error-codes.config.ts`.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`.
- `tests/e2e/assignment-trainee.spec.ts`(신규), `tests/e2e/assignment-eligibility.spec.ts`(헬퍼
  import 교체), `tests/e2e/support/assignment-schedule-fixtures.ts`(신규),
  `tests/e2e/support/assignment-candidate-sheet.ts`(신규), `tests/e2e/support/work-date-band.ts`
  (밴드 1개 추가).
- `docs/execution/phases/index.jsonl`(P3-T05만 `in_progress`, `development_approval`이 조정자가
  갱신한 revision 2 + 새 해시).
- `docs/execution/radio/P3-T05-radio.md`(조정자가 revision 2로 재봉인, 본문·해시 무수정).
