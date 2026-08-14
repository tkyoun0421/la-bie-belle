# P3-T05 handoff

## 2026-08-14 · 검증 단계(교차 검증 재실행) 종료

- 현재 단계: 검증(교차 리뷰 재실행) 종료 → 다음: F-11 처리 결정(사용자) 후 리팩토링 또는 2차 수정 라운드
- 대상: b0bfa0c..a7712b5(수정 라운드), 리뷰어 2자(opus 서브 에이전트·codex CLI) 독립 리뷰 + 교차 확인.
  결과는 `docs/execution/reviews/P3-T05-review.json`(2026-08-14 갱신, total 86)이 정본이다.
- 이전 확정 발견의 해소: F-01(critical)·F-02·F-03·F-05는 리뷰어 2자가 해소로 판정. F-04는 CI
  실행 31778905489로 해소. F-06·F-07은 revision 3 재봉인의 봉인문 사실 정정으로 backlog에서 종결.
- 이번 라운드 확정: **F-11(high)** 비활성 기존 교육생 UI 제거 불가(F-02 수정이 만든 회귀, 수정에
  봉인문 보강 필요), F-12(medium) 4-인자 스왑 무단언, F-13·F-14·F-15(low). medium·low는 backlog 누적.
- 기각 2건(판단이 갈린 기록): ① 수정 라운드 verify GREEN의 기계 증거 부재 주장(opus 발견, codex
  초기 high) — 대상 커밋 a7712b5의 CI 실행
  <https://github.com/tkyoun0421/la-bie-belle/actions/runs/31781868468> 완료(db-verify 3m01s·
  app-verify 9m13s 성공, e2e 71건 재시도 없이 통과)가 전달되자 codex가 전제 소멸로 최종 반박, 기각.
  ② 다른 포지션 정식 배정 후보의 결코 성공하지 않는 [교육] 칩(opus 발견) — codex가 "봉인된 e2e가
  의도적으로 고정한 승인 동작이며 RADIO 재결정이 필요한 UX 항목"이라는 근거로 반박, 기각. 두 번째
  건은 결함이 아니라 제품 결정 후보로, 필요 시 기획·설계 인터뷰에서 다룬다.

- 현재 단계: 개발(수정 라운드) 종료 → 다음 검증(교차 리뷰 재실행)
- 기준 커밋: `b0bfa0c`(RADIO revision 3 재봉인, SHA-256
  `441e90e424209fd8d9899a39db4fec6177b2a936391a9ca4ef3d8421fa8ea864`, index.jsonl과 일치 확인 후 시작)
- RADIO(`docs/execution/radio/P3-T05-radio.md` revision 3) 개정 이력 row 3과 본문의 "revision 3" 표기
  4건(F-01·F-02·F-03·F-05)만 범위로 삼았다. F-04(CI 전체 스위트 GREEN)는 이미 해소되어 이번 라운드
  범위 밖이었다.

### F-01(critical) — 3-인자 호출의 같은 포지션 겸직 구멍을 닫았다

- 새 마이그레이션 `supabase/migrations/20260814000000_trainee_conflict_guard.sql`에서
  `replace_position_assignments`만 `drop` 후 재생성했다. 이미 push된
  `20260811000000_assignment_trainees.sql`은 그대로 두고 소급 수정하지 않았다.
- 정식 배정 추가 시의 교육생 교차 검사(원본 273~282행에 해당)를 「대상 포지션 제외」에서
  「이번 호출의 `removed_trainee_ids`에 든 사람만 제외」로 좁혔다 —
  `not (trainee_touched and at.profile_id = any(removed_trainee_ids))`. `trainee_touched`가 거짓인
  3-인자 호출은 이 조건이 항상 참(제외 없음)으로 평가되어 교차 검사가 무조건 실행된다. 거부 메시지는
  "이미 다른 포지션의 교육생이라 정식 배정할 수 없습니다"에서 "이미 교육생으로 등록되어 있어 정식
  배정할 수 없습니다"로 포지션 불특정 문구로 바꾸고, 코드는 `LB024` 그대로 뒀다.
- `supabase/tests/20-assignment-trainees.test.sql`: 정지 조건대로 AC3 방향1의 고정 메시지 1줄만
  갱신했다. 새 단언 2개(준비 1 + 검증 1)를 추가해 "같은 포지션(드레스) 교육생을 3-인자 호출로 정식
  배정 → LB024" 거부를 확인했다 — 대상자는 드레스 가능 포지션을 미리 등록해 둔 신규 프로필(F14)을
  썼다. F1(기존 픽스처)을 재사용하면 드레스 가능 포지션이 없어 `assignment_eligibility`의
  `NOT_ELIGIBLE`(LB023)이 먼저 걸려 F-01이 노리는 겸직 검사(LB024)를 검증할 수 없었기 때문이다 —
  자격 검사가 트레이니 충돌 검사보다 함수 안에서 먼저 실행되는 구조를 실행으로 확인하고 대상자를
  바꿔 대응했다(RADIO 문구 안에서의 선택, 설계 재해석 아님).

### F-03(high) — AC7 전이를 pgTAP으로 처음 단언했다

- `docs/execution/runs/P3-T05/radio.md`에 2026-08-14 날짜의 정정 절을 append했다(기존 내용은
  고치지 않음) — "위험 기반 테스트 매트릭스 반영"의 "7 담당자 없음" 절이 "e2e로 확인했다"고 적은
  것은 실제로는 제거 호출 이후의 최종 화면 상태만 본 것이었고, 제거 호출 자체가 교육생 행을 건드리지
  않는다는 전이는 검증한 적이 없었다는 사실을 남겼다.
- `20-assignment-trainees.test.sql`에 새 섹션을 추가했다: 스캔에 신규 프로필(F12, 스캔 가능 포지션
  사전 등록)을 정식 배정하고 신규 프로필(F13)을 같은 포지션 교육생으로 추가한 뒤, F12를 3-인자
  호출(네번째 인자 없음)로 전원 제거하고, F12의 정식 배정이 실제로 사라졌는지와 F13의 교육생 행이
  그대로 남는지를 각각 단언했다.

### F-02(high) — 교육 가능 판정이 `eligible` 축을 함께 보게 좁혔다

- `src/views/admin-schedule/model/candidate-buckets.ts`의 `canSelectCandidateAsTrainee`를
  `ineligibleReason !== "GENDER_MISMATCH"`에서 `eligible === true || ineligibleReason === "NOT_ELIGIBLE"`로
  고쳤다. 옛 구현은 `eligible: false`·사유 `null`(비활성 근무자 — DB가 애초에 "활성 근무자만"으로
  거부하는 조합)을 `GENDER_MISMATCH`가 아니라는 이유만으로 통과시켜, 절대 성공할 수 없는 `[교육]`
  버튼을 그리는 구멍이었다.
- 단위 테스트에 `eligible:false`·사유 `null` 조합 케이스를 추가했다.

### F-05(high) — `listScheduleRequirements`의 세 조회를 fail-closed로 좁혔다

- `src/entities/schedule/api/list-schedule-requirements.ts`: 요구·배정·교육생 세 조회 모두 반환
  행 수가 `LIST_REQUIREMENTS_LIMIT`(1000)에 도달하면 성공 갈래로 넘어가지 않고 기존 조회 실패와
  같은 `{ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED }`로 반환하도록 검사 3개를 추가했다(각각
  전용 `_truncated` 로그 이벤트). 999행은 상한 미도달이라 성공 처리됨을 경계값으로 확인했다.
- 단위 테스트 4건(요구·배정·교육생 각 상한 도달 + 999행 경계값) 추가.

### 검증

- `pnpm typecheck`·`pnpm lint` 개별 통과 확인 후 `pnpm vitest run` 전체(209 files / 1369 tests,
  기존 1364 + 이번 라운드 5건) 통과.
- `npx -y supabase@2.75.0 db reset` 후 `npx -y supabase@2.75.0 test db` — Files=20, Tests=1062,
  Result: PASS.
- `pnpm verify` 전체(format·lint·typecheck·unit·harness self-test·check:docs·build·gate:bundle·
  check:app-build·check:client-secret-scan·test:e2e 70/70·gate:motion-render-budget·gate:all)를
  **한 번의 끊기지 않은 실행으로 GREEN** 확인(exit 0). 이번 실행에서는 알려진 플레이크 두 spec
  (`recruitment-manage.spec.ts:114`, `recruitment-open.spec.ts:80`)도 발생하지 않았다.
- TDD RED→GREEN 3쌍(entries 6개)을 `docs/execution/runs/P3-T05/tdd.json`에 append했다(기존
  entries 12개 유지) — pgTAP 1쌍(F-01·F-03을 한 db reset 사이클에 함께 담음, 새 마이그레이션 없이
  RED·있이 GREEN), unit 2쌍(candidate-buckets 1쌍, list-schedule-requirements 1쌍). 명령·exit
  code·ISO 8601 시각은 전부 이번 세션의 실제 명령 실행에서 얻었다.

### 이번 라운드에서 건드리지 않은 것

- 기존 마이그레이션 `20260811000000_assignment_trainees.sql`은 한 글자도 고치지 않았다.
- `supabase/tests/19-assignments.test.sql`은 이번 라운드 범위가 아니라 건드리지 않았다.
- `tests/e2e/assignment-trainee.spec.ts`·`assignment-eligibility.spec.ts`도 이번 라운드 범위 밖 —
  RADIO revision 3의 F-01·F-02·F-03·F-05 어느 것도 e2e 수정을 요구하지 않았다.

### 미결 사항

- `index.jsonl`의 P3-T05 status는 이 세션이 `in_progress`로 전환했고, 커밋 후에도 그대로 뒀다 —
  `done` 전환은 조정자 몫이다.
- RADIO 자체의 미결 사항 5건(교육생 예상 급여·출퇴근 여부·확정 직전 담당자 없음 차단·근무자 화면
  교육생 표시·감사 로그 상세 수준)은 그대로 열려 있다.

## 2026-08-14 · 재봉인(revision 3)과 수정 라운드 재투입

- 현재 단계: 설계(재봉인) 종료 → 다음 개발(수정 라운드)
- 교차 검증 critical F-01(3-인자 호출의 같은 포지션 겸직 구멍)로 blocked였던 task를 설계 단계에서
  해소했다. 사용자가 F-01 해법(교차 검사 제외 조건 좁히기)과 F-05 포함을 선택하고 revision 3
  재봉인을 승인했다(2026-08-14). 수정 라운드 범위는 계약 기본값대로 critical·high — F-01·F-02·
  F-03·F-05이며, 상세는 RADIO revision 3 개정 이력이 소유한다.
- **F-04는 해소됐다** — ci-finisher가 개발·리뷰 커밋 4개(`d34023d`~`60a6d62`)를 push했고 CI가
  e2e를 포함한 전체 스위트를 끊기지 않은 한 번의 실행으로 GREEN 처리했다:
  <https://github.com/tkyoun0421/la-bie-belle/actions/runs/31778905489> (db-verify 2m51s,
  app-verify 9m10s). 알려진 플레이크 두 spec은 이번 실행에서 발생하지 않았다.
- `index.jsonl`: `blocked` → `planned`, `development_approval`을 revision 3 + 새 SHA-256으로 갱신.
- 다음 행동: implementer 서브 에이전트가 수정 라운드를 TDD로 구현 → 검증 단계에서 교차 검증 재실행.

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
