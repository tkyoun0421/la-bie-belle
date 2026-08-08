# P2-T04 handoff

## 2026-08-08 · 개발 종료

- 작업 식별자: P2-T04
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-08T08:30:00+09:00

### 확정된 사실

- 기준 커밋: `b3f300a`(HEAD, `docs(P2-T03): close cross-review after three fix rounds and mark the task done`). RADIO revision 1, SHA-256 `5e53e06651010d7c3cffb1ae6f4ac24042f40adde89539065a9f9aff0f898c0f`(`index.jsonl`의 `development_approval`과 일치 확인 후 착수) 그대로 구현했다. 설계 공백은 없었다. 착수 시 `index.jsonl`의 P2-T04를 `planned → in_progress`로 전환했다(저장소 전체 `in_progress` 1개 확인 — 전환 전 in_progress 없음, P0-T42는 blocked 그대로 유지).
- `supabase/migrations/20260808010000_recruitment_closing.sql`: 함수 3종.
  - `close_due_recruitment_schedules() returns jsonb` SECURITY DEFINER — 대상 선정식 `status='OPEN' and application_deadline < (now() at time zone 'Asia/Seoul')::date`로 `for update` 잠금 후 일괄 CLOSED 전환, 스케줄당 감사 1행(`schedule_closed`, actor null, `detail={"trigger":"cron"}`), `{"closed_count":N}` 반환. `revoke execute ... from public, anon, authenticated, service_role; grant ... to service_role;`로 앱 주체 노출을 차단하고 pg_cron·서비스 롤(운영자 명령)만 호출 가능하게 했다.
  - `extend_recruitment_deadline(target_schedule_id uuid, new_deadline date) returns void` / `reopen_recruitment_schedule(target_schedule_id uuid, new_deadline date) returns void` SECURITY DEFINER — `is_admin`(42501) → 대상 행 `for update` 잠금·존재 확인(22023) → 상태 검증(연장 OPEN·재오픈 CLOSED, 위반 22023) → 안전선(`new_deadline < KST 오늘` 또는 `work_date < KST 오늘`이면 LB021, 마감>근무일은 기존 CHECK 23514 위임) → UPDATE(재오픈은 status·application_deadline 동시) → 감사 insert(`deadline_extended`는 `{"previous_deadline","new_deadline"}`, `schedule_reopened`는 `{"new_deadline"}`). `revoke ... from public, anon, authenticated, service_role; grant ... to authenticated;`(함수 안에서 `is_admin` 이중 강제).
  - `create extension if not exists pg_cron;` + `cron.schedule('close-due-recruitments', '5 15 * * *', $$select close_due_recruitment_schedules()$$)`(15:05 UTC = 00:05 KST). 로컬 도커(`supabase_db_la-bie-belle`)에서 pg_cron 1.6.4가 `shared_preload_libraries`에 이미 포함돼 있음을 사전 확인했다.
  - P2-T01 스키마·전이 트리거, P2-T03 `apply_recruitment_changes` 함수는 무수정.
- `supabase/tests/15-recruitment-closing.test.sql`(pgTAP 58건): 함수 시그니처 3종, 함수 노출(authenticated·anon 권한 부재·직접 호출 42501, service_role 권한 유지, cron.job 등록 확인), 자동 마감 happy path(반환값·상태 전환·감사·actor null·detail)·KST 경계(마감일 당일 제외)·대상 없음 0 반환·재실행 멱등(상태·감사 무변화), 연장 happy path·상태 위반(22023)·존재하지 않는 id(22023)·비관리자/anon(42501)·안전선(과거 마감일 LB021·근무일이 이미 지난 스케줄 LB021·마감>근무일 23514)·경계값 허용(오늘·근무일 당일)·같은 값 재연장(무해), 재오픈 happy path(신청 유지·T03 함수로 재신청 허용 확인)·상태 위반·권한·안전선·경계값·중복 요청(이미 OPEN인 대상 22023 수렴)을 검증한다. 마감 경과·근무일 경과 픽스처는 P2-T02/T03과 같은 insert 후 UPDATE 기법(insert 트리거는 BEFORE INSERT만 걸리므로 UPDATE로 과거 날짜를 만든다)을 재사용했다. `pnpm db:reset && pnpm db:test` 최종 GREEN(15 파일 757 tests, 기존 01~14 무수정 통과).
- `package.json`: `ops:close-recruitments` 스크립트 1줄 추가(`node --env-file-if-exists=.env -e "..."` — `.env`의 `NEXT_PUBLIC_SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`로 PostgREST RPC(`/rest/v1/rpc/close_due_recruitment_schedules`)를 service_role 인증으로 1회 호출). RADIO 변경 허용 경로에 `scripts/**`가 없어 새 파일을 만들지 않고 `package.json` 한 줄로 완결했다(허용 경로가 이 형태를 명시적으로 요구한다고 해석). Cron과 같은 함수를 호출하므로 복구 경로에 별도 로직이 없다. 로컬에서 실행해 정상 동작(`{"closed_count":0}` 반환)을 확인했다.
- `src/shared/config/error-codes.config.ts`: `SCHEDULING_STATUS_CONFLICT`(409, "상태가 이미 바뀌었어요. 새로고침 후 다시 확인해 주세요") 추가.
- `src/entities/schedule/model/recruitment-open.ts`: 기존 private `isValidCalendarDate`를 export로 바꿔(동작 무변화) 신규 파일에서 재사용했다.
- `src/entities/schedule/model/recruitment-manage.ts`(신규): `RecruitmentManageInputSchema`(scheduleId uuid, newDeadline yyyy-MM-dd), `mapRecruitmentManageRpcErrorCode`(42501→COMMON_FORBIDDEN, 22023·LB020→SCHEDULING_STATUS_CONFLICT, LB021·23514→SCHEDULING_VALIDATION, 그 외→COMMON_UNEXPECTED — RADIO AC5 매핑표 그대로).
- `src/features/recruitment/api/extend-recruitment-deadline.ts`·`reopen-recruitment-schedule.ts`(신규 Server Action 2종): `requireAdmin`→Zod→`rpc`→`revalidatePath`(성공·실패 공통)→구조화 stderr 로그→매핑. `open-recruitment-schedules.ts` 관례 그대로.
- `src/features/recruitment/hooks/useRecruitmentManage.ts`(신규): 시트 상태(managed·deadline·statusConflict·pending)와 제출(`open`/`close`/`submit`)을 소유한다. `managed.status`로 연장/재오픈 Action을 분기하고, 성공 시 스낵바(연장 "마감일을 연장했어요"/재오픈 "모집을 다시 열었어요") 후 시트를 자동으로 닫는다. `SCHEDULING_STATUS_CONFLICT` 실패는 `statusConflict`를 채우고 시트를 유지한다.
- `src/features/recruitment/ui/RecruitmentManageSheet.tsx`(신규, ui 세그먼트라 unit 테스트 면제): `shared/ui/bottom-sheet`로 조립, 상태별 제목("마감일 연장"/"모집 재오픈")과 버튼 라벨("저장"/"재오픈"), 상태 충돌 안내 문구, `새 마감일` date input. api import 없음(Action은 page→View→hook으로 주입).
- `src/views/admin-recruitment/model/recruitment-manage-target.ts`(신규): `findManageableRecruitmentSchedule` — 날짜의 스케줄이 OPEN·CLOSED일 때만 반환하고 그 외(PREPARING·CONFIRMED·CANCELLED·없음)는 null(탭 시 관리 시트를 열지 선택 토글할지의 분기 근거).
- `src/views/admin-recruitment/model/recruitment-manage-deadline.ts`(신규): `validateManageDeadline` — 빈 값·오늘 이전·근무일 초과를 클라이언트에서 막는다(서버 안전선과 별개의 방어적 투영).
- `src/views/admin-recruitment/model/recruitment-cell-state.ts`(수정): 기존에는 모든 활성(비CANCELLED) 스케줄을 `open`+`disabled:true`로 뭉뚱그렸으나, OPEN은 `open`(탭 가능), CLOSED는 `closed`(탭 가능, "마감" 배지), PREPARING·CONFIRMED만 기존처럼 `open`+`disabled:true`(관리 범위 밖, P3 소유)로 남겼다. 기존 pgTAP·mock 데이터 구조는 무수정. `calendar.tsx`(shared)는 무수정 — CLOSED 상태의 기본 미비활성화·탭 가능 동작이 이미 존재했다(P2-T02가 남긴 범용 상태값).
- `src/views/admin-recruitment/ui/RecruitmentOpenView.tsx`(수정): `handleSelectDate`가 `findManageableRecruitmentSchedule`로 분기해 관리 대상이면 `useRecruitmentManage.open`을, 아니면 기존 `toggleRecruitmentDate` 선택 토글을 호출한다. `RecruitmentManageSheet`를 조립하고 `onExtend`·`onReopen` prop을 그대로 hook에 전달한다.
- `src/app/(protected)/admin/recruitment/page.tsx`(수정): `extendRecruitmentDeadline`·`reopenRecruitmentSchedule` Action을 View에 주입.
- `tests/e2e/recruitment-manage.spec.ts`(신규 2건): 관리자가 OPEN 날짜를 연장(성공 스낵바 확인 후 시트 재오픈으로 마감일 반영 재확인)하고 CLOSED 날짜를 재오픈(성공 스낵바·달력 상태 전환 확인) → 별도 근무자 세션이 `/schedule`에서 재오픈된 날짜를 "신청 가능"으로 보는 것까지 확인. 비관리자 접근 차단 1건. 픽스처 격리: P2-T03 리뷰 F-04(무작위 날짜의 영구 로컬 DB 충돌 위험)를 반복하지 않도록 `nextMonthAnchor`(recruitment-open, +1개월)·`randomMonthAnchor`(schedule, +6~30개월 랜덤)와 겹치지 않는 결정적 앵커(현재월 +2개월, 일자 12·18)를 썼다.
- `tests/e2e/recruitment-open.spec.ts`(수정, RADIO 허용 예외 "달력 셀 탭 분기 확장"): 활성 모집 날짜가 더 이상 disabled가 아니라 관리 대상으로 탭 가능해진 변경에 맞춰 `toBeDisabled()` 단언 2곳을 `not.toBeDisabled()`로 교정하고 테스트 제목을 사실에 맞게 고쳤다. 이 외 시나리오·픽스처는 무수정.
- 검증 결과: `pnpm format:check`(자동 정리 후)·`pnpm lint:ci`·`pnpm typecheck` GREEN. `pnpm vitest run`(전체) 160 파일 969 tests GREEN. `pnpm build` 성공(`/admin/recruitment` 라우트 유지 확인). `pnpm db:reset && pnpm db:test` GREEN(15 파일 757 tests). `pnpm exec playwright test`(전체 34개 spec) 34/34 GREEN. `pnpm verify` 전체(format → lint:ci → typecheck → vitest 969 → harness:typecheck → harness:self-test → check:docs → build → check:app-build → check:client-secret-scan → test:e2e 34/34 → gate:all) 최종 실행 시작 2026-08-07T23:24:38Z, 종료 2026-08-07T23:26:00Z, 종료 코드 0(당시 index.jsonl은 아직 `planned`였던 첫 실행이었고, `in_progress` 전환 후 `pnpm db:test`·e2e·vitest는 이 handoff 작성 시점까지 개별적으로 재확인해 모두 GREEN을 유지했다).
- TDD 증거는 `docs/execution/runs/P2-T04/tdd.json`에 실제 실행 시각·exit code로 기록했다 — entities/features/views의 신규 unit 파일 6건은 개별 RED(모듈 없음)→GREEN, `recruitment-cell-state.test.ts`는 기존 파일의 단언을 새 기대값으로 먼저 고쳐 기존 구현 대비 RED를 확보한 뒤 구현을 맞춰 GREEN을 얻었다(수정형 TDD), E2E는 `RecruitmentOpenView.tsx`의 탭 분기와 `recruitment-cell-state.ts`의 상태 분기를 임시로 되돌려 두 spec 파일(`recruitment-open.spec.ts`·`recruitment-manage.spec.ts`) 동시 RED를 재현한 뒤 복원해 GREEN을 얻었다, DB는 마이그레이션 파일을 임시로 옮겨 `pnpm db:reset && pnpm db:test` RED(함수 없음)를 재현한 뒤 복원해 GREEN을 얻었다.

### 미결 사항

- 없음(설계 공백·범위 밖 요구 없음). RADIO의 두 미결 사항(선행 task 재봉인 시 재점검, 관리자 달력 라벨 정리)은 이번 구현에서 재봉인이 발생하지 않았고 라벨은 정리할 필요가 없었다(OPEN="신청 가능", CLOSED="마감" 기존 라벨 재사용).
- 감사 detail의 `close_due_recruitment_schedules` `{"trigger":"cron"}`은 Cron 실행과 운영자 수동 복구 명령이 완전히 같은 함수·같은 로직을 타므로 호출 경로를 구분하지 못한다(RADIO가 "복구 경로에 별도 로직이 없다"로 명시한 설계 그대로). 필요하면 후속 task에서 detail에 호출 맥락을 추가하는 결정을 할 수 있다. 결정 주체: 사용자(필요 판단 시), 반환할 단계: 없음(현재 범위 밖 개선 제안).

### 다음 행동

1. 검증 단계로 진행한다 — `check_ids`(`recruitment-kst-boundary`, `recruitment-cron-idempotency`) 등록 확인과 교차 검증(REVIEW.md)을 실행한다.
2. 검증 통과 시 `index.jsonl`의 P2-T04를 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `docs/execution/runs/P2-T04/tdd.json`
- `supabase/migrations/20260808010000_recruitment_closing.sql`, `supabase/tests/15-recruitment-closing.test.sql`
- `package.json`(`ops:close-recruitments`)
- `src/shared/config/error-codes.config.ts`
- `src/entities/schedule/model/recruitment-open.ts`, `src/entities/schedule/model/recruitment-manage.ts`
- `src/features/recruitment/api/extend-recruitment-deadline.ts`, `src/features/recruitment/api/reopen-recruitment-schedule.ts`
- `src/features/recruitment/hooks/useRecruitmentManage.ts`, `src/features/recruitment/ui/RecruitmentManageSheet.tsx`
- `src/views/admin-recruitment/model/recruitment-manage-target.ts`, `src/views/admin-recruitment/model/recruitment-manage-deadline.ts`, `src/views/admin-recruitment/model/recruitment-cell-state.ts`
- `src/views/admin-recruitment/ui/RecruitmentOpenView.tsx`
- `src/app/(protected)/admin/recruitment/page.tsx`
- `tests/e2e/recruitment-manage.spec.ts`, `tests/e2e/recruitment-open.spec.ts`

## 2026-08-08 · 수정 라운드 1 (교차 검증 F-01)

- 기준: `docs/execution/reviews/P2-T04-review.json`(리뷰어 2자 전원 인정 14건, 승인 범위는 high 1건 F-01만). base_commit `b3f300a` 이후 개발 종료 커밋 `1ebd5f6` 위에서 진행했다.
- F-01(high, architecture) — `findManageableRecruitmentSchedule`이 `schedules.find(workDate 일치)`로 첫 행을 집어 상태만 보는 반면, 셀 판정 정본 `toRecruitmentCellStates`는 CANCELLED를 먼저 걸러 Map을 구성한다. 부분 유니크 제약상 한 날짜에 CANCELLED 행과 활성 행이 공존할 수 있고 조회는 work_date만 정렬해 같은 날짜 안 순서를 보장하지 않으므로, CANCELLED 행이 배열에서 먼저 오면 셀은 open/closed로 그려지는데 탭은 관리 시트 대신 날짜 선택 토글로 빠지는 불일치가 있었다.
  - 수정: `src/views/admin-recruitment/model/recruitment-manage-target.ts` — `findManageableRecruitmentSchedule`을 `toRecruitmentCellStates`와 동일하게 `status !== "CANCELLED"`로 먼저 거른 뒤 `Map`을 구성해 조회하도록 바꿨다(정본과 필터·순서 규칙 동일화). 부분 유니크 제약상 CANCELLED를 제외하면 같은 work_date에 활성 행이 최대 1개이므로 배열 순서에 무관하게 동일한 결과를 보장한다.
  - TDD: `src/views/admin-recruitment/model/__tests__/recruitment-manage-target.test.ts`에 같은 근무일에 CANCELLED 행이 배열 앞에 오는 조합 3건을 추가했다 — CANCELLED+OPEN(연장 대상으로 OPEN 반환)·CANCELLED+CLOSED(재오픈 대상으로 CLOSED 반환)·CANCELLED만 있고 활성 행 없음(관리 대상 아님, null). 수정 전 RED(2 failed / 5 passed, exit 1) 확인 후 구현을 고쳐 GREEN(7 passed, exit 0) 확인. 근거는 `docs/execution/runs/P2-T04/tdd.json` 마지막 두 항목.
  - 이 함수의 유일한 소비처인 `src/views/admin-recruitment/ui/RecruitmentOpenView.tsx`는 시그니처·반환 계약이 그대로라 무수정.
  - medium 이하(F-02~F-14)는 이번 라운드 범위 밖이라 손대지 않았다.
- 검증: `pnpm db:reset` 후 `pnpm verify` 전체(format → lint:ci → typecheck → vitest 972 → harness:typecheck → harness:self-test → check:docs → build → check:app-build → check:client-secret-scan → test:e2e 34/34 → gate:all) 재실행, 종료 코드 0. `pnpm gate:all` 단독 재확인도 exit 0.
- 다음 행동: 조정자가 수정 라운드 커밋을 확인하고 재검증(리뷰) 여부를 판단한다. index.jsonl은 `in_progress` 그대로 두었다(단계 전환은 조정자 소유).

## 2026-08-08 · 검증 종료 · done 전환 (조정자 기록)

- 교차 검증(opus·codex) 확정 발견 15건: 1라운드 확정 14건 + 수정 재확인 라운드 1건(파생 규칙 복제, low). 기각 2건(최종 트리 verify 증거 공백 — 조정자 실측 exit 0·86초로 반박, isReopen ui 분기 — DEV-CODE-09 표현용 조건부 렌더 예외).
- 수정 라운드 1회(`30024b5`)로 high 1건(관리 대상 선택 CANCELLED 불일치) 해소 — 리뷰어 전원 재확인, 판별력 있는 회귀 테스트 3건이 test-first 순서로 추가됨.
- 미해결 14건(medium 6·low 8)은 `docs/execution/reviews/P2-T04-review.json`(최종 점수 84) 정본, 전부 backlog 누적.
- **사용자 결정 대기 medium 3건**: cron 실행 관측 기록(DEV-OBS-04, 설계 결정 필요) · 운영자 복구 명령 형태(scripts/** 재봉인 여부) · 수동 복구 감사 trigger 구분(봉인 설계 "복구 경로에 별도 로직 없음"과 얽힘). backlog와 이 절이 추적 지점이다.
- 리팩토링 단계: 수정 라운드가 정본 정렬을 수행했고 추가 정리는 backlog로 이관(파생 규칙 공유 함수화 등). 최종 트리 verify 조정자 실측 통과(exit 0, 2026-08-07T23:50:17Z~23:51:43Z).
- index: P2-T04 `in_progress → done`(2026-08-08).
