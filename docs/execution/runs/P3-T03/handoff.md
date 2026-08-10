# P3-T03 handoff

## 2026-08-10 · 교차 검증 종료와 done 전환 (조정자)

- 작업 식별자: P3-T03
- 현재 단계: 검증 종료 → `done`
- 기준 커밋: `d4cc999c2b11bb82976e4d00f648793ae13a5c98`(리뷰 대상), 수정 라운드 `44d0669`

### 결과

리뷰어 2자(`opus`·`codex`)가 독립 리뷰 후 서로의 발견을 전부 판정했다. 기각된 발견은 없고 확정
13건(high 3 · medium 8 · low 2)이 나왔다. `critical`이 없어 `blocked` 전환은 없었다.

high 3건은 모두 봉인된 RADIO 27~29행의 같은 불변 규칙("이미 저장된 행은 이후 자격 변화와 무관하게
그대로 둔다")이 세 갈래로 깨진 것이었다 — ① 교체 함수가 유지되는 기존 배정까지 재검사 ② 자격을 잃은
기존 배정자를 화면에서 해제할 경로 부재 ③ 비활성이 된 기존 배정자가 후보에서 빠져 조용히 삭제.

사용자가 수정 범위를 "high 3건 + 구조·테스트 medium 2건"으로 정했고(2026-08-10), 수정 라운드
`44d0669`가 5건을 모두 해소했다. 나머지 medium 6 · low 2는 backlog로 넘겼다.

점수는 `docs/execution/reviews/P3-T03-review.json`이 소유한다(총점 84). 해소된 5건은 결과 파일의
`findings`에서 빠지고 `score_rationale`에 해소 사실로 남았다 — P3-T02 선례와 같은 형식이다.

### 봉인 문서를 고치지 않은 이유

수정 라운드는 `docs/execution/radio/P3-T03-radio.md`의 본문과 해시를 건드리지 않았다. 기술 인수 조건
2·3·6의 문구("각 profile 자격 검사", "활성 근무자 전원", "미달자 접힘")를 같은 문서 27~29행의 불변
규칙 아래에서 읽으면 이번 조치가 그 문구와 충돌하지 않는다고 판단했다 — 불변 규칙이 상위이고, 세
인수 조건은 "이미 배정된 뒤 자격을 잃은 사람"이라는 경우를 애초에 다루지 않았다. 재봉인이 필요하다는
판단이 나오면 P3-T06 설계에서 다시 꺼낸다. 판단 근거의 상세는 `runs/P3-T03/radio.md`가 소유한다.

`ineligible_reason`의 값 집합은 봉인된 두 값(`GENDER_MISMATCH`·`NOT_ELIGIBLE`)을 그대로 두고,
비활성 계정은 설계 인터뷰가 확정한 "이유 없이"에 맞춰 `null`을 반환한다. 새 이유 값을 만들지 않았다.

### 미결 사항

- backlog 8건(medium 6 · low 2)이 `docs/execution/reviews/backlog.md`에 누적됐다. 정비 task로 묶는
  것은 사용자 승인 사항이며 이 task가 결정하지 않는다.
- RADIO 자체의 미결 2건(확정 시점 재검사 여부 → P3-T06, 교육생 연결 형태 → P3-T05)은 그대로 열려 있다.
- 비활성 포지션에서 전원 해제까지 막히는 F-06은 불변 규칙("신규 배정을 거부한다")과 구현의 범위 차이라
  다음에 이 마이그레이션을 여는 task가 함께 본다.

### 다음 행동

1. `ci-finisher`가 미push 커밋 3개(`39fe075`·`d4cc999`·`44d0669`)와 이 done 커밋을 push하고 CI를
   확인한다. 조정자 세션은 push하지 않는다.
2. 다음 후보는 `planned` 큐의 선두다 — P3-T04(배정 화면 다듬기) 또는 다른 세션이 봉인해 둔 P0-T44.

## 2026-08-10 · 교차 검증 수정 라운드

- 작업 식별자: P3-T03
- 현재 단계: 교차 검증 수정 → 재검증
- 기준 커밋: `d4cc999c2b11bb82976e4d00f648793ae13a5c98`(개발 단계 종료 시점 HEAD)

### 처리한 결함(F-01~F-05)

RADIO 27~29행의 불변 규칙("자격은 배정을 만드는 순간에만 판정한다 … 이미 저장된 행은 이후 자격
변화와 무관하게 그대로 둔다")을 실제 구현이 세 갈래로 어긴 결함 5건을 고쳤다. 판단 근거와 각 조치의
상세는 `docs/execution/runs/P3-T03/radio.md`의 "2026-08-10 · 교차 검증 수정 라운드(F-01~F-05)" 절에
남겼다.

- **F-01(high)**: `replace_position_assignments`가 유지되는 기존 배정까지 재검사해 자격을 잃은
  기존 배정자가 남아 있으면 해당 포지션의 배정 변경이 영구 차단되던 결함. `previous_ids` 계산을
  자격 검사 루프보다 앞으로 옮기고 `added_ids`(신규 추가분)만 검사하도록 재배치했다.
- **F-02(high)**: 자격을 잃은 기존 배정자를 화면에서 해제할 UI가 없던 결함.
  `groupAssignmentCandidates`가 `!eligible && currentlyAssigned`인 후보를 일반 묶음(신청함/신청
  안 함)으로 보내고, `CandidateRow`가 `eligible === false`일 때 이름 아래 사유 캡션을 렌더한다.
- **F-03(high)**: 비활성이 된 기존 배정자가 후보 목록에서 빠져 다른 사람만 바꿔 저장하면 그 배정이
  소리 없이 삭제되던 결함. 후보 조회 `where` 절을 활성 근무자 OR 현재 이 스케줄·포지션에 배정된
  사람으로 넓히고, 자격 판정에 활성 상태 검사를 넣어 비활성 배정자는 `eligible=false,
  ineligible_reason=null`로 나오게 했다.
- **F-04(medium)**: 자격 판정 로직이 후보 조회·교체 함수 두 곳에 복제돼 있던 결함(F-01·F-03의
  구조적 원인, `DEV-SSOT-01` 위반). 내부 헬퍼 `assignment_eligibility(target_position_id,
  target_profile_id)`를 신설해 두 함수가 모두 호출하도록 통합했다.
- **F-05(medium)**: 사후 자격 회수 시나리오의 회귀 테스트 부재. `19-assignments.test.sql`에 pgTAP
  23건(72→95), `candidate-buckets.test.ts`에 unit 1건을 추가했다.

### 재현 기록

- pgTAP(F-01·F-03): migration 파일만 수정 전 버전으로 되돌린 상태에서 새 F-05 단언을 실행해 RED
  9건을 확인(2026-08-10T07:46:29Z) → 수정 복원 후 GREEN 95/95, 전체 19파일 1010/1010 확인
  (2026-08-10T07:47:21Z).
- vitest(F-02): `candidate-buckets.ts` 수정 전 버전에서 새 케이스 RED 1건 확인
  (2026-08-10T07:48:09Z) → 수정 후 GREEN 4/4 확인(2026-08-10T07:48:14Z).
- 두 RED 모두 실제 명령 실행(수정 파일을 `git stash`로 일시 원복)에서 얻었다. 상세 명령·exit
  code는 `docs/execution/runs/P3-T03/tdd.json`에 이어 남겼다.
- `pnpm verify` 전체 GREEN 재확인(format·lint·typecheck·unit·harness self-test·check:docs·build·
  gate:bundle·check:app-build·check:client-secret-scan·E2E 49/49·gate:all) — 신규
  `assignment-eligibility.spec.ts`를 포함해 전부 통과했다.

### 미결 사항

- 없음. RADIO의 기존 미결 사항 2건(확정 시점 재검사는 P3-T06, 교육생 연결은 P3-T05)은 이번
  라운드 범위 밖이라 그대로 열어 뒀다.
- `04-rls-default-deny.test.sql`은 `assignment_eligibility` 함수 신설과 무관해 무수정으로 남겼다
  (사유는 `runs/P3-T03/radio.md`에 기록).

### 다음 행동

1. 조정자가 이번 수정 라운드를 재검증하고 `index.jsonl` 상태 전환 여부를 판단한다 — 이 세션은
   status를 바꾸지 않았다.
2. `ci-finisher`가 커밋을 push하고 CI를 확인한다. 이 세션은 push하지 않았다.

## 2026-08-10 · 개발 단계 종료

- 작업 식별자: P3-T03
- 현재 단계: 개발 종료 → 다음 검증(교차 리뷰)
- 기준 시각: 2026-08-10T07:03:44Z

### 확정된 사실

- RADIO(`docs/execution/radio/P3-T03-radio.md` revision 1, SHA-256
  `3a5a54a5430067e0b38ff55eed31960b3e52390149a615d03a10c14aac3e0009`) 범위 그대로 구현했다.
  - 마이그레이션 1개(`supabase/migrations/20260810000000_assignments.sql`): `assignments`·
    `assignment_positions` 테이블, admin select 전용 RLS, `list_position_assignment_candidates`·
    `replace_position_assignments` DEFINER 함수, 감사(`scheduling_audit_logs`).
  - `src/entities/assignment/**`(후보 DTO·이유 라벨·후보 조회), `src/features/assignment/**`(후보 목록·
    교체 Server Action, 선택 상태 훅, 후보 시트 UI), `src/views/admin-schedule/**`(배정 수 표시,
    후보 묶음 분류 순수 함수, 표 행 탭 진입), `src/app/(protected)/admin/schedule/[id]/page.tsx`(후보
    조회·Action 주입).
  - `tests/e2e/assignment-eligibility.spec.ts` 신설(+ `tests/e2e/support/work-date-band.ts`에
    `assignmentEligibility` 구간 추가) — 여성 전용 포지션 미달자 접힘·이유, 신청자 저장·교체, 필요
    인원 초과 배정 허용, 확정 스케줄 시트 미개방을 한 시나리오로 검증한다.
- `pnpm verify` 전체 GREEN: format·lint·typecheck·unit(201 files/1272 tests)·harness self-test·
  check:docs·build·gate:bundle·check:app-build·check:client-secret-scan·**E2E 49/49**(신규 spec
  포함)·gate:all.
- `pnpm db:reset && pnpm db:test` GREEN: 19 files/987 assertions(신규 `19-assignments.test.sql`
  72건 포함 — 스키마·정책·후보 조회·교체·자격 강제 5종 거부·재호출 무변경·감사).
- TDD RED→GREEN 10쌍을 `docs/execution/runs/P3-T03/tdd.json`에 남겼다(unit 9쌍 + pgTAP 1쌍, 명령·
  exit code·실제 시각 전부 이번 세션의 실제 명령 실행에서 얻었다).
- RADIO가 개발 단계에 위임한 두 결정(후보 정렬 기준, PostgREST 1000행 상한 대응)의 근거는
  `docs/execution/runs/P3-T03/radio.md`에 기록했다.

### 미결 사항

이 세션에서 발견·수정한 회귀(조정자 확인·승인)를 아래에 남긴다.

- **발견 경위**: `assignment-eligibility.spec.ts`의 첫 시나리오(새로 만든 OPEN 스케줄 페이지에 리로드
  없이 처음 진입)를 검증하던 중, 자동 복사가 실제로 성공했는데도(`ensureScheduleRequirementsCopied`
  성공 로그) 화면의 필요 인원 표에 방금 복사된 9개 포지션 행이 반영되지 않는 현상을 발견했다.
- **원인**: `page.tsx`가 같은 요청 안에서 `listScheduleRequirements(id)`를 두 번(복사 여부 판정 시
  1회, 복사 뒤 최종 렌더 시 1회) 같은 인자로 호출했다. Next.js는 동일 인자의 `fetch` 호출을 요청
  단위로 자동 메모이제이션하므로(`cache: 'no-store'`와 무관, `node_modules/next/dist/docs/01-app/
  01-getting-started/06-fetching-data.md`) 두 번째 호출이 복사 전(첫 번째 호출 시점)의 빈 결과를
  그대로 재사용했다. 임시 `process.stderr.write` 디버그 로그와, 같은 시점 `curl`로 Next.js를 우회한
  직접 조회가 정상적으로 9행을 반환하는 것을 대조해 DB/PostgREST 계층이 아니라 Next.js 요청 계층의
  문제임을 확인했다.
- **도입 시점**: `git show 5790d71^`으로 대조해, P3-T02의 CI 타임아웃 수선 커밋 `5790d71`(예식 저장
  시마다 반복되던 쓰기 RPC를 없애려고 "조회 먼저 → 조건부 복사"로 순서를 바꾼 커밋)에서 이 패턴이
  시작됐음을 확인했다 — 그 시점에는 `listScheduleRequirements` 호출이 한 곳뿐이라 문제가 없었고,
  이번 task가 배정 수(`assignedCounts`)를 위해 최종 렌더 앞에 조회를 하나 더 두면서 중복 호출이
  생겼다. P3-T03 자체의 신규 결함이 아니라 선행 커밋과 이번 task 변경이 만나 드러난 회귀다.
- **처리**: `[질문]`으로 멈추고 진단·근거·선택지를 보고했다. 조정자가 사용자 확인을 거쳐 "P3-T03
  안에서 지금 고쳐라(선택지 A)"를 지시했다 — 별도 task로 미루지 않았다.
- **수정 범위**: `src/entities/schedule/api/count-schedule-requirements.ts`(신규, `select(count:
  'exact', head:true)`로 행 수만 세는 조회, unit 5건)를 만들어 복사 여부 판정에 쓰고, `page.tsx`를
  `listScheduleRequirements(id)`가 요청당 정확히 1회(복사 분기 이후)만 호출되도록 재구성했다.
  `shouldCopyScheduleRequirements`(P3-T02 순수 함수)와 그 테스트는 판정 로직 무수정, count의
  데이터 출처만 바꿨다. `copy_schedule_requirements` RPC·기존 마이그레이션은 무수정이다. 복사 실패
  시 `ErrorScreen`으로 막는 fail-closed 동작(P3-T02 교차 검증 F-03)도 그대로 유지된다. 더미 파라미터·
  헤더 같은 메모이제이션 회피 트릭은 쓰지 않았다 — 구조적으로 다른 조회(HEAD count-only)로 캐시
  키 충돌 자체를 없앴다.
- **회귀 방어**: `assignment-eligibility.spec.ts`의 첫 시나리오(새 OPEN 스케줄에 `page.reload()` 없이
  최초 진입해 9개 포지션 행이 전부 보이는지 확인)가 이 회귀를 그대로 다시 잡는다 — 리로드를 추가해
  우회하지 않았다.
- **결정 주체**: 사용자(조정자가 확인 후 전달). 이 수정은 AI가 새로 내린 설계 결정이 아니라 조정자
  지시를 그대로 구현한 것이다. 반환할 단계: 없음(이 task 개발 단계 안에서 종결).
- RADIO 자체의 미결 사항 2건(확정 시점 재검사 여부는 P3-T06 설계, 교육생의 `assignment_positions`
  연결 형태는 P3-T05 설계)은 이 task 범위 밖이라 그대로 열어 뒀다.

### 다음 행동

1. 커밋 2개를 분리해 생성한다 — `fix(P3-T03)`(메모이제이션 회귀 수정, 본문에 5790d71 언급)와
   `feat(P3-T03)`(RADIO 본 구현). `docs/execution/phases/index.jsonl`은 둘 중 하나에 포함한다.
2. 조정자가 다음 단계(검증/교차 리뷰) 진행 여부와 index.jsonl 상태 전환을 판단한다 — 이 세션은
   status를 `in_progress`에서 바꾸지 않았다.
3. `ci-finisher`가 두 커밋을 push하고 CI(특히 신규 `assignment-eligibility.spec.ts`와
   `19-assignments.test.sql`)를 확인한다. 이 세션은 push하지 않았다.

### 증거·산출물 경로

- `docs/execution/runs/P3-T03/tdd.json` — RED→GREEN 10쌍(명령·exit code·ISO8601 시각).
- `docs/execution/runs/P3-T03/radio.md` — 위임 결정 2건 + 회귀 요약 포인터.
- `supabase/migrations/20260810000000_assignments.sql`, `supabase/tests/19-assignments.test.sql`.
- `src/entities/assignment/**`, `src/entities/schedule/api/count-schedule-requirements.ts`(+test),
  `src/entities/schedule/api/list-schedule-requirements.ts`(+test 확장).
- `src/features/assignment/**`.
- `src/views/admin-schedule/model/candidate-buckets.ts`(+test),
  `src/views/admin-schedule/model/requirement-section-data.ts`(+test 확장),
  `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`.
- `src/shared/config/error-codes.config.ts`(`SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE` 신설).
- `tests/e2e/assignment-eligibility.spec.ts`, `tests/e2e/support/work-date-band.ts`.
