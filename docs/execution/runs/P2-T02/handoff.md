# P2-T02 handoff

## 2026-08-07 · 개발 종료

- 작업 식별자: P2-T02
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07T19:40:00+09:00

### 확정된 사실

- 기준 커밋: `0c30a12`(HEAD). RADIO revision 1, SHA-256 `88bbe83b71ceafa677e69cef57ca4f1f25469b611cbca34a00d38723833e45cd`(`index.jsonl`의 `development_approval`과 일치 확인 후 착수) 그대로 구현했다. 설계 공백은 없었다.
- `supabase/migrations/20260807050000_recruitment_batch_open.sql`: `open_recruitment_schedules(work_dates date[], application_deadline date) returns jsonb` SECURITY DEFINER 함수. `is_admin` 검사(42501) → 빈 배열·null 원소(22023) → `distinct` 정리 → 활성 모집(`status <> 'CANCELLED'`) 충돌 집계 → 충돌 시 `{"created_count":0,"conflict_dates":[...]}` 즉시 반환·미생성 → 없으면 `with inserted as (insert ... returning id) insert into scheduling_audit_logs ...`로 일괄 생성과 스케줄당 감사 1행을 한 문장에서 처리 → `{"created_count":N,"conflict_dates":[]}` 반환. 날짜 규칙(과거 LB021, 마감>근무일 23514)은 기존 CHECK·트리거가 그대로 강제하며 함수는 재구현하지 않았다. 신규 테이블·정책·SQLSTATE 없음.
- `supabase/tests/13-recruitment-batch-open.test.sql`(pgTAP 32건): happy path 2건 생성·반환값·행 존재, 입력 중복 제거, CANCELLED뿐인 날짜 재오픈 허용, 충돌 1건 포함 시 전체 미생성(다른 유효 날짜도 함께 거부)과 충돌 목록 반환, 동일 요청 재실행이 전부 충돌로 수렴, 비관리자(active 근무자·pending)·anon 42501과 재시도 동일 코드 수렴, 빈 배열·null 원소 22023, 과거 근무일 LB021·마감>근무일 23514 위반 시 배치 전체 롤백(스케줄·감사 0행), 감사 행이 스케줄당 1개·`actor_profile_id`·`detail={"batch_size":N}` 정확히 담김을 단언한다. `pnpm db:reset && pnpm db:test` 최종 GREEN(13 파일 659 tests, 기존 01~12 무수정 통과).
- `src/shared/config/error-codes.config.ts`: `SCHEDULING_DATE_CONFLICT`(409)·`SCHEDULING_VALIDATION`(422) 추가. `src/shared/config/auth-routes.config.ts`: `ADMIN_RECRUITMENT_PATH = "/admin/recruitment"` 추가.
- `src/shared/ui/calendar.tsx`: `CalendarDateState`에 선택적 `disabled` 필드 추가(미지정 시 기존 `state === "none"` 규칙 그대로 — 하위 호환), 셀 상태 `selectable`(라벨 "선택 가능") 추가. `disabled`가 참이면 상태와 무관하게 `none`과 같은 흐림 처리(`bg-disabled-surface text-disabled`)를 적용해 관리자 화면에서 "이미 모집 중" 셀도 시각적으로 비활성 표현이 되게 했다(RADIO가 위임한 시각 표현 재량). 기존 `calendar.test.tsx` 11건 전부 무수정 통과 + 신규 4건(총 15건) 통과.
- `src/entities/schedule/model/recruitment-schedule.ts`(DB 행 DTO·매핑, status는 Zod enum으로 검증), `model/recruitment-open.ts`(Zod 입력 스키마 — yyyy-MM-dd·1개 이상·중복 제거 후 상한 366, `mapRecruitmentRpcErrorCode`: 42501→COMMON_FORBIDDEN·23505→SCHEDULING_DATE_CONFLICT·LB021/23514/22023→SCHEDULING_VALIDATION·그 외→COMMON_UNEXPECTED, `worker-update.ts` 관례 그대로), `api/list-recruitment-schedules.ts`(server-only, 월 범위 `gte`/`lte` 조회). 기존 `work-schedule.ts`(P0 목업)는 무수정.
- `src/features/recruitment/api/open-recruitment-schedules.ts`(Server Action — `requireAdmin`→Zod→`rpc`→`revalidatePath`(성공·실패 공통 재검증)→구조화 stderr 로그→매핑, `grant-position.ts`/`set-hourly-wage.ts` 관례 그대로. rpc 반환값의 `conflict_dates`가 채워지면 예외가 아니라 정상 반환값으로 처리해 `SCHEDULING_DATE_CONFLICT`로 매핑한다), `hooks/useOpenRecruitment.ts`(useTransition, 성공 시 "모집 N건을 열었어요" 스낵바 + `onSuccess` 콜백으로 선택 상태 초기화, 충돌 시 `conflictDates` 상태 노출, 그 외 실패는 레지스트리 문구 스낵바), `ui/RecruitmentSubmitPanel.tsx`(선택 수 요약·마감일 입력·충돌 안내·제출 버튼, 순수 프레젠테이션 — api import 없음, 로직은 상위에서 prop으로 주입).
- `src/views/admin-recruitment/model/`: `recruitment-cell-state.ts`(스케줄 행+선택 Set+오늘 문자열 → 달력 셀 상태. 선택된 날짜는 `selected`, `CANCELLED` 제외 활성 스케줄이 있는 날짜는 `open`+`disabled:true`, 오늘 이전은 `none`, 그 외 빈 미래 날짜는 `selectable`), `recruitment-selection.ts`(토글·최이른 날짜), `recruitment-deadline.ts`(마감일 ≤ 최이른 선택 날짜, 오늘 이후 클라이언트 검증, 둘 다 경계 포함). 셋 다 unit 테스트 통과(8+6+7건). `ui/RecruitmentOpenView.tsx`(Calendar+제출 패널 조립, 월 이동은 `onMonthChange`→`router.push(?month=yyyy-MM)`로 서버 리렌더, 선택 상태는 client state로 유지 — 페이지 컴포넌트 위치가 바뀌지 않아 월 이동 후에도 보존된다).
- `src/app/(protected)/admin/recruitment/page.tsx`: `month` searchParam(기본 KST 이번 달, `Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul"})`로 서버 계산) 파싱, 월 범위 조회 후 View에 데이터·Action(`openRecruitmentSchedules`) 주입. `admin/page.tsx`: "모집 오픈" 링크 추가(admin 전용 레이아웃이 이미 `requireAdmin` 게이트를 강제).
- `tests/e2e/recruitment-open.spec.ts`(신규 2건): 관리자 완주(실행 시점 기준 "다음 달" 1일을 앵커로 잡아 10일에 기존 활성 스케줄을 서비스 롤로 직접 시딩 → `/admin/recruitment?month=...` 진입 → 기존 날짜 disabled 확인 → 빈 날짜 2·3일 선택 → 마감일 입력 → 제출 → "모집 2건을 열었어요" 확인 → 두 날짜 모두 disabled 전환 확인), 비관리자 차단(홈 리다이렉트). `createAdminSession`은 `worker-management.spec.ts`의 관례를 그대로 재사용했다(전용 서비스 롤 사용자 생성 + 쿠키 주입).
- 검증 결과: `pnpm typecheck`·`pnpm lint`·`pnpm format:check`(자동 정리 후) GREEN. `pnpm test`(vitest 전체) 153 파일 888 tests GREEN. `pnpm build` 성공(`/admin/recruitment` 라우트 생성 확인). `pnpm db:reset && pnpm db:test` GREEN(13 파일 659 tests). `pnpm exec playwright test recruitment-open.spec.ts` GREEN(2/2, 기존 spec 무수정).
- TDD 증거는 `docs/execution/runs/P2-T02/tdd.json`에 실제 실행 시각·exit code로 기록했다 — DB 함수(마이그레이션을 실제로 치웠다 복원하는 방식으로 자연 RED 확보), unit 테스트 8건 전부 개별 RED→GREEN, calendar.tsx 확장은 기존 11건을 건드리지 않고 신규 4건만 RED→GREEN, E2E는 `page.tsx`를 임시로 치워 실패를 재현한 뒤 복원해 GREEN을 얻었다.

### 미결 사항

- 관리자 달력에서 "이미 활성 모집이 있는 날짜"는 기존 `open`(라벨 "신청 가능")을 재사용하고 `disabled:true`로 흐리게 표시했다 — RADIO가 "배지 문구·시각 표현 상세는 구현 재량"으로 명시 위임한 범위 안의 선택이지만, 스크린리더 사용자에게는 "신청 가능"이라는 라벨이 disabled 속성과 함께 announce되어 다소 부정확하게 들릴 수 있다. 전용 라벨(예: "모집 중")이 필요하면 `shared/ui/calendar.tsx`에 상태를 하나 더 추가하는 후속 조정이 필요하다. 결정 주체: 사용자(필요 판단 시), 반환할 단계: 없음(현재 구현은 RADIO 범위를 벗어나지 않는다 — 개선 제안일 뿐).
- `RecruitmentOpenView`의 `month`/`today` 값은 서버가 KST 문자열로 계산하되 `Calendar` prop으로 넘길 때는 `Date` 객체로 변환한다(react-day-picker 기존 계약). 이 앱의 실사용자는 전부 KST이므로 문제가 없지만, 서버 프로세스 TZ가 UTC인 배포 환경(Vercel 기본값)에서 KST보다 뒤처진 타임존의 브라우저가 접속하면 월 경계가 하루 어긋날 이론적 여지가 있다 — 과거 disabled 판정 자체는 문자열 비교라 안전하고, 이 건은 달력 그리드 경계에만 영향을 준다. 기존 메모(타임존 경계 이월 위험, DEV-TIME-03 후보)에 이어 P2 스케줄 후속 task 설계 시 재검토 대상으로 남긴다. 결정 주체: 사용자, 반환할 단계: 설계(P2-T03~T05 중 관련 화면 다룰 때).
- 신청 조회 성능 인덱스는 RADIO Optimizations 절이 이미 P2-T03·T05로 이월했다 — 이 task에서 추가 결정 없음.

### 다음 행동

1. 검증 단계로 진행한다 — `check_ids`(`recruitment-batch-create`, `admin-recruitment-e2e`) 등록 확인과 교차 검증(REVIEW.md)을 실행한다.
2. 위 미결 사항 중 라벨 정확도 건은 검증/리팩토링 단계에서 사용자 판단이 필요하면 그때 다룬다(현재는 차단 요소 아님).

### 증거·산출물 경로

- `docs/execution/runs/P2-T02/tdd.json`
- `supabase/tests/13-recruitment-batch-open.test.sql`, `supabase/migrations/20260807050000_recruitment_batch_open.sql`
- `src/entities/schedule/**`, `src/features/recruitment/**`, `src/views/admin-recruitment/**`
- `src/shared/ui/calendar.tsx`, `src/shared/ui/__tests__/calendar.test.tsx`
- `src/shared/config/error-codes.config.ts`, `src/shared/config/auth-routes.config.ts`
- `src/app/(protected)/admin/recruitment/page.tsx`, `src/app/(protected)/admin/page.tsx`
- `tests/e2e/recruitment-open.spec.ts`
