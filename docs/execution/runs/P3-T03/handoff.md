# P3-T03 handoff

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
