# P1-T05 handoff

## 2026-08-07 · 개발 착수 직후 [질문]→revision 2 재봉인 경위

- 작업 식별자: P1-T05
- 현재 단계: 개발(설계 공백 보정) → 개발 계속
- 기준 시각: 2026-08-07

### 확정된 사실

- RADIO(revision 1, SHA-256 `8592d600681d45be7e53ec5a062724e3e9b7c1826c41d0253a635040a790182e`)를 구현 시작 전 재확인하고 코드를 쓰기 전 아키텍처 대조를 하던 중 설계 공백을 발견했다 — `/admin/workers/[id]`(가능 포지션 전체 열거)와 `/my-profile`·상세(기본 시급 파생 표기)가 `positions`·`venue_settings`를 사용자 세션(authenticated)으로 읽어야 하는데, 두 테이블은 P0-T03이 "정책 0개·읽기 0행"으로 봉인하고 `04-rls-default-deny.test.sql`이 그 상태를 직접 단언한다. RADIO revision 1은 이 전제 충돌을 다루지 않았다.
- `[질문]`으로 상황·근거·선택지 3가지(① 활성 근무자 SELECT 정책 추가 + 04 테스트 갱신, ② 우회 읽기 SECURITY DEFINER 함수 신설, ③ service role 재사용)를 제시했고, 조정자가 ①을 "DEV-SEC 이중 강제와 기존 정본 구조가 답을 정하는 위계 보정"으로 채택했다. 읽기 허용 범위는 PRD 77행 기준 "활성 근무자부터"로 지정됐다.
- RADIO가 revision 2(SHA-256 `0dab78312c1e88384a4d092a55e8ae7da08a3231852fdcb883356f629c657814`)로 재봉인됐고 `index.jsonl`의 `development_approval.radio_revision`도 2로 갱신됐다(조정자 수행, gate:index·gate:radio 통과 확인). 이 지점부터 개발을 재개했다.

### 미결 사항

- 없음 — 이 절의 공백은 재봉인으로 해소됐다.

### 다음 행동

1. revision 2 RADIO를 그대로 구현한다(아래 "개발 종료" 절).

### 증거·산출물 경로

- `docs/execution/radio/P1-T05-radio.md`(revision 2로 재봉인).
- `docs/execution/phases/index.jsonl`의 P1-T05 `development_approval.radio_revision: 2`.

## 2026-08-07 · 개발 종료

- 작업 식별자: P1-T05
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- `supabase/migrations/20260807020000_identity_worker_management.sql`: `profiles.hourly_wage integer null check (> 0)` 추가. `worker_position_eligibilities(profile_id fk→profiles on delete cascade, position_id fk→positions **on delete restrict**, granted_at, granted_by, primary key(profile_id, position_id))` + RLS(select: admin 정책 + 본인 행 정책, 쓰기 정책 없음). 트리거 `reject_default_position_eligibility`(BEFORE INSERT, `is_default` 포지션 거부, 기본 SQLSTATE `P0001` — `positions`의 `reject_system_position_change` 선례와 동일한 "앱을 통해서는 도달하지 않아야 하는 구조 방어" 패턴). `is_active_worker(uuid)` 함수(`effective_roles()` 소비, STABLE SECURITY DEFINER) + `positions`·`venue_settings`에 `using ((select is_active_worker(auth.uid())))` 형태의 SELECT 정책 추가 — 스칼라 서브쿼리로 감싸 InitPlan 1회 평가로 만들었다(P1-T04 교차 검증 F-04의 행별 재평가 지적을 이 신규 정책에 선반영). 5개 SECURITY DEFINER 쓰기 함수: `update_worker_info`(관리자, 이름·성별·생년월일·휴대폰을 한 번에 갱신하고 실제 변경된 필드만 `{field: {before, after}}`로 감사), `set_hourly_wage`(관리자 또는 본인, 시급 1~100000원 경계를 함수 내부에서도 재검사 — Zod 계약을 DEFINER 함수 내부에서도 방어하라는 선행 task 교훈 반영), `update_own_phone`(본인, target 인자 없음 — auth.uid() 기준), `grant_position_eligibility`(관리자, 비활성 포지션 거부), `revoke_position_eligibility`(관리자, 멱등). 전부 실변경 시에만 `identity_audit_logs`에 5종 신규 이벤트(`worker_info_updated`·`hourly_wage_updated`·`phone_updated`·`position_granted`·`position_revoked`) 기록.
- 상태 충돌·범위 위반 예외는 함수마다 의미가 겹치지 않는 전용 SQLSTATE를 새로 썼다(P1-T03·P1-T04 교차 검증이 지적한 "범용 22023 재사용으로 오류 계약이 취약해진다" F-XX를 이 task에서 선반영) — `LB001`(시급 범위 위반, `set_hourly_wage`) · `LB002`(비활성 포지션 부여, `grant_position_eligibility`). 권한 거부는 표준 `42501`, 휴대폰 중복은 표준 `23505`(`profiles_phone_key`)를 그대로 재사용해 의미가 겹치지 않는 경우까지 새 코드를 만들지 않았다.
- `supabase/tests/09-worker-management.test.sql`(pgTAP 75건): 함수 시그니처 5종(본인 경로가 phone 인자 하나뿐임을 시그니처로 증명) · AC2(개인정보·시급 수정 happy path·휴대폰 중복 23505·시급 0/음수/상한초과 LB001·비관리자 직접 호출 42501·동일 값 재수정 멱등·순차 2회 수정의 후행 값 유효성과 감사 순서 보존) · AC3(본인 시급·휴대폰 수정, 타인 대상 호출 42501, auth.uid() 기준 처리자 확인, 중복 휴대폰 재제출 일관 거부) · AC4(관리자·본인·타인 3주체의 hourly_wage·개인정보 select 대조, 전부 authenticated 세션, service role 미사용) · AC5(비기본 포지션 부여·회수, eligibilities RLS 3주체 대조, 기본 포지션 직접 insert와 `grant_position_eligibility` 양쪽에서 트리거 P0001 거부, 비활성 포지션 LB002, 재부여·재회수 멱등, 순차 2회 부여의 PK 수렴) · AC6(쓰인 포지션 delete가 23503으로 차단 — P0-T03 이월 검증, 안 쓰인 포지션 delete는 허용). `supabase/tests/04-rls-default-deny.test.sql` 갱신(37건): `positions`·`venue_settings` 정책 개수 단언을 0→1로 갱신하고 활성 근무자 세션에서 실제로 읽히는지(전체 카운트·기본 시급 값)와 pending 근무자·익명은 여전히 0행임을 추가 단언, 활성 근무자도 쓰기는 여전히 필터됨을 추가 검증. `pnpm db:reset && pnpm db:test` GREEN(9 파일 338 tests, 최초 실행부터 통과 — 이 조합은 마이그레이션과 pgTAP을 함께 설계해 자연 RED가 없었다. P1-T03 handoff의 선례와 같은 판단으로 tdd.json에는 실행 확인만 남긴다).
- `src/entities/identity/model/worker-update.ts`: `createWorkerPersonalInfoSchema`(P1-T02 `createSignupSchema`와 동일한 검증 규칙을 관리자 수정 폼에 맞게 새로 선언 — P1-T02 파일 수정 없이 재사용), `HourlyWageSchema`(`shared/config/wage.config.ts`의 `HOURLY_WAGE_MIN`·`MAX` 소비), `OwnPhoneSchema`, `mapWorkerRpcErrorCode`(42501→COMMON_FORBIDDEN, LB001/LB002→IDENTITY_VALIDATION, 그 외→COMMON_UNEXPECTED — 신설 앱 오류 코드 없음). `src/entities/identity/model/wage.ts`: `resolveEffectiveWage(hourlyWage, defaultHourlyWage)` 순수 함수, `WorkerDetailView`·`MyProfileView` 양쪽이 실제로 소비해 `isDerived`를 `HourlyWageForm`/`OwnWageForm`에 내려준다(선언만 되고 소비되지 않는 패턴을 피했다 — P1-T03 교차 검증 F-03 audit-event.ts 사례 재발 방지). `src/entities/identity/model/audit-event.ts`: `AUDIT_EVENT_VALUES`를 5종에서 10종으로 확장(기존 5종 불변, 신규 5종 추가) — 이 task가 P1-T03이 신설한 정본을 확장한다는 RADIO 계획대로다.
- `src/entities/identity/api/find-default-hourly-wage.ts`(신규, `venue_settings` 단일 행 조회 — `find-worker-detail.ts`·`find-own-worker-info.ts` 양쪽이 공유 소비), `list-workers.ts`(이름 `ilike`·상태 `eq` 필터, 기본 active), `find-worker-detail.ts`(admin 조회 — profiles·positions(`is_active=true`만)·eligibilities 3개 쿼리 + 기본 시급을 `Promise.all`로 병렬 조회, 기본 포지션은 `granted:true` 고정), `find-own-worker-info.ts`(본인 조회, `Promise.all`로 프로필+기본시급 병렬 조회). `src/entities/identity/types/worker.ts`(신규 `types` 세그먼트 파일): `WorkerListItem`·`WorkerPosition`·`WorkerDetail`·`OwnWorkerInfo` DTO.
- `src/features/worker-management/`: `api/`(update-worker-info·set-hourly-wage·grant-position·revoke-position, 전부 `requireAdmin()` 첫 줄 + 대상 ID `z.string().uuid()` 검증 — 선행 task 교훈대로 UUID 미검증 문제를 처음부터 피했다), `hooks/`(useWorkerInfoForm·useHourlyWageForm·usePositionAction, 전부 실패이면서 fieldErrors 없을 때만 스낵바 — 기존 useSignupForm·useRoleActions 패턴 그대로), `ui/`(WorkerInfoForm·HourlyWageForm·PositionToggleList·PositionToggleButton, client leaf). `src/features/my-profile/`: `api/`(update-own-phone·set-own-wage, 전부 `requireActiveProfile()` 첫 줄 — `set-own-wage`는 대상이 항상 본인이라 별도로 `supabase.auth.getUser()`를 호출해 자신의 id를 얻는다, P1-T02의 `find-own-profile.ts`/`profile-gate.ts`를 수정하지 않기 위한 선택이다), `hooks/`(useOwnPhoneForm·useOwnWageForm), `ui/`(OwnPhoneForm·OwnWageForm).
- 모든 쓰기 Server Action은 RPC 호출 직후, 성공·실패 분기 이전에 `revalidatePath`를 호출한다 — "처리 실패 분기에서도 revalidatePath로 stale 화면을 정리한다"는 선행 task 교훈(P1-T03 교차 검증 F-XX, "이미 처리된 신청 오류에서 목록을 재검증하지 않아 stale 행이 남는다")을 이 task 전체 Server Action에 일괄 적용했다. RPC를 아예 호출하지 않는 사전 검증 실패(requireAdmin/requireActiveProfile 실패, UUID·Zod 검증 실패)는 서버 상태가 바뀔 수 없으므로 재검증하지 않는다.
- `src/app/(protected)/admin/workers/page.tsx`(searchParams로 `q`·`status` 읽기, 기본 active), `workers/[id]/page.tsx`(params로 id, 대상 없으면 `NotFoundScreen`), `src/app/(protected)/my-profile/page.tsx`((protected) 레이아웃이 이미 active 게이트를 강제하므로 페이지 자체는 추가 재확인 없음 — `admin/approvals/page.tsx` 선례와 동일 패턴). `admin/page.tsx`: "근무자 관리" 진입 링크 추가.
- `src/views/admin/ui/WorkerListView.tsx`(검색은 native GET form, 상태 필터는 `<Link>` 기반 쿼리 네비게이션 — 서버 컴포넌트 유지), `WorkerDetailView.tsx`(개인정보·시급·가능 포지션 3섹션 조립, `resolveEffectiveWage` 소비), `src/views/admin/model/profile-status-label.ts`(신규). `src/views/my-profile/ui/MyProfileView.tsx`(이름·성별·생년월일 표시 전용, 휴대폰·시급만 편집 폼), `src/views/my-profile/model/gender-label.ts`(신규 — `views/admin/model/gender-label.ts`와 값은 같지만 view 슬라이스 간 교차 임포트를 피하려고 별도 파일로 뒀다, 이 저장소의 hooks 중복 전례(useRoleActions·useApprovalActions)와 같은 판단). `src/views/more/ui/MoreView.tsx`: "내 정보" 링크를 역할과 무관하게(모든 활성 사용자) 노출 — 기존 "역할 없으면 링크 1개" 테스트를 "링크 2개(예상 급여·내 정보)"로 갱신했다.
- ui 세그먼트가 `**/api/**`를 import할 수 없다는 `project/segment-imports` 린트를 실제로 만났다(`WorkerDetailView.tsx`·`MyProfileView.tsx`가 Server Action의 Result 타입을 직접 import하려 했다) — P1-T04 교차 검증이 남긴 동일 패턴(`ActiveProfileWithRoles`를 `types`로 분리한 선례)을 따르되, 이번엔 별도 `types` 파일을 새로 만들지 않고 이미 존재하는 hooks의 Outcome 타입(`WorkerInfoOutcome`·`HourlyWageOutcome`·`PositionActionOutcome`·`OwnPhoneOutcome`·`OwnWageOutcome`)을 재사용했다 — hooks 세그먼트는 `**/api/**` 임포트를 막지 않고, view가 실제로 자식 leaf에 넘기는 타입도 정확히 이 hooks 타입이라 더 정확한 표현이다.
- `src/shared/config/wage.config.ts`(신규): `HOURLY_WAGE_MIN = 1`, `HOURLY_WAGE_MAX = 100_000`(RADIO 미결 사항 — 구현이 제안한 값, 결정 주체는 사용자, 검증 단계에서 확인 필요). `src/shared/config/auth-routes.config.ts`: `ADMIN_WORKERS_PATH`("/admin/workers")·`MY_PROFILE_PATH`("/my-profile") 추가.
- `tests/e2e/worker-management.spec.ts`(신규 3건): 관리자 완주(목록 검색 진입 → 이름·시급 수정 → 비기본 포지션 부여 → 새로고침으로 세 값 모두 영속 확인) · 본인 완주(휴대폰·시급 수정 → 새로고침으로 영속 확인, 이름 입력 필드 부재로 표시 전용 검증) · 비관리자 차단(목록·상세 양쪽 홈 리다이렉트, 리다이렉트된 화면에 타인 휴대폰 미노출). `pnpm exec playwright test worker-management.spec.ts` 최초 실행에서 `toHaveValue`에 숫자를 넘겨 2건 실패(RED, 09:46:22)한 뒤 문자열로 고쳐 재실행해 3건 통과(GREEN, 09:47:06) — 실제 재현한 RED다. `pnpm test:e2e`(전체 27건) GREEN — 기존 auth·home·schedule·signup·roles·approval.spec.ts 전부 회귀 없음.
- 검증 결과: `pnpm vitest run`(전체) 768 tests GREEN(134 파일). `pnpm exec tsc --noEmit`·`pnpm lint`·`pnpm format` GREEN. `pnpm build` 성공(`/admin/workers`·`/admin/workers/[id]`·`/my-profile` 동적 라우트 생성 확인). `pnpm test:e2e`(전체 27건) GREEN(개별 실행).
- `pnpm verify` 전체를 통으로 실행해 최종 확인했다 — 첫 실행(2026-08-07T09:51:58 시작)은 `test:e2e`의 `global-setup.ts`가 `auth.admin.listUsers()`를 페이지네이션 없이 호출하는 기존 결함(P1-T01 산출물, 이 task 범위 밖)이 로컬에서 반복 실행으로 쌓인 테스트 사용자 수 때문에 처음으로 드러나 exit 1로 실패했다 — `pnpm db:reset`으로 근본 원인(누적된 테스트 사용자)을 제거한 뒤 재실행해 exit 0을 확인했다(2026-08-07T09:53:45 시작 → 09:54:57 종료, gate:all 포함 전 구간 통과). handoff 문구를 다듬은 뒤 `pnpm db:reset`으로 한 번 더 초기화하고 `pnpm verify`를 최종 재실행해 exit 0을 재확인했다(2026-08-07T09:57:13 시작 → 09:58:25 종료, e2e 27/27 포함). `pnpm db:reset && pnpm db:test`도 별도로 실행해 GREEN(9 파일 338 tests)을 확인했다.

### 미결 사항

- 시급 상한 `HOURLY_WAGE_MAX = 100,000원`은 구현이 제안한 값이다 — 결정 주체: 사용자(검증 단계에서 확인). 값을 바꾸려면 `src/shared/config/wage.config.ts`와 `supabase/migrations/20260807020000_identity_worker_management.sql`의 `set_hourly_wage` 함수 내부 리터럴(100000) 두 곳을 함께 고쳐야 한다 — SQL이 TS 상수를 직접 참조할 수 없어 값이 두 곳에 존재한다는 점을 검증 단계에서 확인해야 한다.
- 관리자 목록 검색 기준(이름 단일)은 RADIO가 위임한 대로 이름 단일로 시작했다 — 필요하면 후속 task가 확장한다. 결정 주체: 없음(계획대로).
- 관리자 화면(근무자 목록·상세)의 전용 디자인 정본 부재는 P1-T03·T04 미결 사항과 동일하게 이어진다 — 기존 토큰·`shared/ui`(Input·Button·SelectField·Badge)로 최소 구성했다. 결정 주체: 사용자(검증 단계에서 확인).
- `positions`·`venue_settings`의 활성 근무자 SELECT 정책(revision 2 보정)이 향후 P2(포지션 요구사항 노출)·P6(기본 시급 소비)에 재사용될 것으로 예상되나, 그 task들의 실제 소비 방식은 이 task의 범위가 아니다.
- `tests/e2e/global-setup.ts`의 `ensureTestUser`·`ensureSuperAdminFixtureUser`가 `auth.admin.listUsers()`를 페이지네이션 없이 호출해 로컬에서 테스트 사용자가 누적되면(약 50명 초과) 기존 사용자를 못 찾고 중복 생성을 시도해 실패한다 — 이번 검증 중 실제로 재현했다(위 "검증 결과" 참고). P1-T01 산출물이라 이 task 범위 밖이고 `db:reset`으로 우회했다. CI는 매번 새 DB라 영향이 없지만, 로컬 반복 실행이 잦아지면 재발할 수 있다 — 결정 주체: 사용자(별도 정비 task 필요 여부 판단).

### 다음 행동

1. 교차 검증(opus·codex)을 진행하고 `docs/execution/reviews/P1-T05-review.json`을 남긴다.
2. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로

- `docs/execution/runs/P1-T05/tdd.json` — 실제 명령 실행의 RED→GREEN 쌍(단위/컴포넌트 계층 전부 + `pnpm exec playwright test worker-management.spec.ts` RED→GREEN 1쌍). `pnpm db:reset && pnpm db:test`는 마이그레이션과 pgTAP을 함께 설계해 자연 RED가 없었으므로(P1-T03 선례와 동일 판단) tdd.json에 넣지 않고 이 handoff의 "확정된 사실"·"검증 결과"에만 실행 확인을 남긴다.
- 신규 마이그레이션: `supabase/migrations/20260807020000_identity_worker_management.sql`. 신규 pgTAP: `supabase/tests/09-worker-management.test.sql`. 갱신: `supabase/tests/04-rls-default-deny.test.sql`.
- 구현 파일: 위 "확정된 사실" 각 경로 전체(`src/entities/identity/**`, `src/features/worker-management/**`, `src/features/my-profile/**`, `src/views/admin/**`, `src/views/my-profile/**`, `src/views/more/**`, `src/app/(protected)/admin/workers/**`, `src/app/(protected)/admin/page.tsx`, `src/app/(protected)/my-profile/**`, `src/shared/config/wage.config.ts`, `src/shared/config/auth-routes.config.ts`).
- E2E: `tests/e2e/worker-management.spec.ts`.
- RADIO: `docs/execution/radio/P1-T05-radio.md`(revision 2로 재봉인, SHA-256 `0dab78312c1e88384a4d092a55e8ae7da08a3231852fdcb883356f629c657814`).

## 2026-08-07 · 교차 검증 수정 라운드(critical 2·high 5)

- 작업 식별자: P1-T05
- 현재 단계: 검증(교차 검증 확정 발견 수정) → 다음 검증 재확인
- 기준 시각: 2026-08-07

### 확정된 사실

- 조정자 지시대로 확정 14건 중 critical 2건·high 5건만 이 라운드에서 해소했다. medium 6건·low 1건은 손대지 않고 backlog로 남겼다(교차 검증 리뷰 파일이 이 turn 이후 별도로 갱신될 예정). 재봉인은 하지 않았다 — 전부 revision 2 허용 경로 안이고 RADIO가 이미 요구한 계약("본인 또는 관리자"·"감사 순서 보존"·"성별 조건 필터"·"파생 표기")의 이행 수정이다.
- **F-01(critical, 비활성 계정 DB측 본인 수정 미강제) + F-03(critical→실제로는 high 수준 NULL 3치 fail-open, 같은 함수라 함께 고쳤다)**: `set_hourly_wage`의 본인 분기를 `actor_id = target_profile_id`에서 `actor_id = target_profile_id and is_active_worker(actor_id)`로 좁히고, 함수 맨 앞에 `actor_id is null` 명시 거부를 추가해 `is_admin(actor) or actor = target` 형태의 3치 논리 결함을 제거했다(anon이 actor=null일 때 `not(false or null)`이 plpgsql IF에서 false로 취급돼 조용히 통과하던 결함 — 실제로 anon이 타인의 시급을 55555원으로 바꿀 수 있음을 `docker exec ... psql`로 직접 재현해 확인했다). `update_own_phone`에도 `is_active_worker(actor_id)` 확인을 추가했다. 두 함수 모두 pending 본인의 직접 호출을 42501로 거부하도록 pgTAP을 추가해 검증했다.
- **F-02(critical, 감사 before·순서 왜곡)**: `update_worker_info`·`set_hourly_wage`·`update_own_phone`의 대상 SELECT에 `for update`를 추가했다(approve_signup 패턴). 감사 순서 정본 문제는 `identity_audit_logs`에 `seq bigint generated always as identity` 컬럼을 추가해 해소했다 — `created_at`은 pgTAP이 하나의 트랜잭션(`begin;...rollback;`) 안에서 실행되므로 `now()`가 트랜잭션 시작 시각으로 고정돼 모든 행이 동률이 되는 것을 직접 확인했다(이 컬럼이 없었다면 순서 단언 자체가 애초에 무의미했다). 09 테스트의 순서 단언을 `order by created_at`에서 `order by seq`로 교체했다.
- **F-04(high, anon 주체 pgTAP 전무)**: 신규 DEFINER 함수 5종 전부에 `set local role anon` 거부 단언을 추가했다. 이 과정에서 내가 처음 작성한 anon 블록 자체의 결함을 발견했다 — `select set_config('request.jwt.claim.sub', ..., true)`는 `reset role`로 되돌아가지 않고 트랜잭션 끝까지 남는 GUC라서, 이전 블록(일반 근무자 세션)의 claim이 그대로 남은 채 `set local role anon`만 전환하면 `auth.uid()`가 여전히 그 근무자의 uuid를 반환해 "진짜 anon"을 검증하지 못한다(직접 `docker exec ... psql`로 재현·확인). 모든 anon 블록 앞에 `select set_config('request.jwt.claim.sub', '', true); select set_config('request.jwt.claims', '', true);`를 추가해 고쳤다. 이 수정 전/후로 `pnpm db:reset && pnpm db:test`를 두 번 실행해 진짜 RED(anon의 set_hourly_wage 호출이 거부되지 않음, pending 본인의 두 호출이 거부되지 않음, 이로 인한 감사 카운트 연쇄 오염)를 실제로 재현한 뒤 F-01·F-03 수정으로 GREEN을 만들었다 — tdd.json에 그 RED→GREEN 쌍이 있다.
- **F-05(high, 성별 조건 미적용)**: `src/entities/identity/model/position-eligibility.ts`(신규): `matchesGenderRequirement(requirement, workerGender)` 순수 함수 + 단위 테스트(성별×조건 조합 3케이스). `find-worker-detail.ts`가 `positions.gender_requirement`를 함께 조회해 기본 포지션 중 근무자 성별과 맞지 않는 것을 목록에서 제외하도록 고쳤다(비기본 포지션은 그대로 전부 노출 — RADIO Data model이 "성별 조건 필터"를 명시한 대상은 `is_default` 파생 집합뿐이다). 단위 테스트에 여성 근무자가 남성 전용 기본 포지션('안내')을 보지 못하고, 여성 전용 기본 포지션은 보는 케이스를 추가했다.
- **F-06(high, 파생 기본 시급 금액 미표시)**: `HourlyWageForm`·`OwnWageForm`의 prop을 `initialHourlyWage: number | null`에서 `initialAmount: number`(+ `isDerived: boolean`는 그대로)로 바꿔, 미설정자에게도 입력 필드가 비어 있지 않고 `resolveEffectiveWage`가 계산한 실제 기본 시급 금액을 보여주도록 고쳤다. `WorkerDetailView`·`MyProfileView`는 이미 계산해 둔 `effectiveWage.amount`를 그대로 내려준다. 저장 버튼을 눌러 이 파생값을 그대로 제출하면 그 값이 명시 저장값이 되는 것은 RADIO Data model("저장은 명시 설정만")이 이미 승인한 동작이라 별도 방지 로직을 넣지 않았다.
- **F-07(high, 동시성 false-confidence 단언)**: 정렬 단언은 F-02 수정으로 함께 해소됐다(`seq` 기준). "동시성"이라 이름 붙였지만 실제로는 순차 호출인 두 블록의 이름을 고쳤다 — AC2의 순서 보존 블록은 "순차 수정(진짜 동시성 아님)"으로, AC5의 재부여 수렴 블록은 "멱등성(순차 재호출, 진짜 동시성 아님)"으로 정정했다(전자는 값이 매번 달라 멱등성이 아니라 순서 보존이 핵심이라 "멱등성"으로 뭉뚱그리지 않고 그대로 "순차 수정"을 썼다). 진짜 병렬 커넥션 검증은 여전히 하지 않았다 — 아래 미결 사항에 남긴다.
- pgTAP `09-worker-management.test.sql`: 75건 → 82건(anon 거부 5건 + pending 본인 거부 2건 추가, 기존 단언 무갱신 유지). `pnpm db:reset && pnpm db:test` 최종 GREEN(9파일 345 tests).
- `src/entities/identity/api/__tests__/find-worker-detail.test.ts`: 기존 happy-path 테스트에 `gender_requirement` 필드를 채워 넣고(회귀 아님 — 필드 추가일 뿐 값은 그대로 통과하도록 구성), F-05 케이스 테스트 1건을 추가했다.
- 검증 결과: `pnpm exec tsc --noEmit`·`pnpm lint`·`pnpm format` GREEN. `pnpm vitest run`(전체) 775 tests GREEN(135 파일). `pnpm db:reset && pnpm test:e2e`(전체 27건) GREEN — worker-management.spec.ts 3건 포함, 회귀 없음.
- `pnpm verify` 전체를 통으로 실행해 exit 0을 확인했다(2026-08-07T10:39:17 시작 → 10:40:26 종료, e2e 27/27·gate:all 포함). 이어서 `pnpm db:reset && pnpm db:test`를 별도로 재실행해 GREEN(9파일 345 tests)을 최종 확인했다.

### 미결 사항(수정 라운드에서 새로 확인된 것 포함)

- 이전 절의 미결 사항(시급 상한 값 확인, 관리자 화면 디자인, positions/venue_settings 정책 재사용 방향, global-setup.ts 페이지네이션 결함)은 모두 그대로 유효하다.
- 진짜 동시성(병렬 커넥션) 검증은 이번 라운드에서도 하지 않았다 — pgTAP 스위트에 병렬 커넥션 인프라(dblink 등)가 없다는 P1-T03의 동일 제약이 이어진다. F-02의 `for update` 잠금이 실제로 두 번째 트랜잭션을 대기시키는지는 병렬 커넥션으로만 증명 가능하다. 결정 주체: 사용자(인프라 도입 우선순위 판단 시 별도 task).
- medium 6건·low 1건은 이번 라운드에서 의도적으로 손대지 않았다 — 조정자 지시대로 backlog로 남는다.

### 다음 행동

1. 이 수정 라운드를 조정자에게 보고하고, 남은 medium·low backlog 처리 여부를 확인받는다.
2. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로(수정 라운드)

- `docs/execution/runs/P1-T05/tdd.json`에 이 라운드의 RED→GREEN이 이어서 기록돼 있다 — `pnpm db:reset && pnpm db:test`(진짜 RED, F-01·F-03·F-04 결합 재현) 1쌍 + TS 계층(model·api·ui) 6쌍.
- 갱신: `supabase/migrations/20260807020000_identity_worker_management.sql`(F-01·F-02·F-03 함수 수정 + `seq` 컬럼), `supabase/tests/09-worker-management.test.sql`(F-02·F-04·F-07), `src/entities/identity/api/find-worker-detail.ts`·그 테스트(F-05), `src/features/worker-management/ui/HourlyWageForm.tsx`·그 테스트, `src/features/my-profile/ui/OwnWageForm.tsx`·그 테스트, `src/views/admin/ui/WorkerDetailView.tsx`·그 테스트, `src/views/my-profile/ui/MyProfileView.tsx`·그 테스트(F-06).
- 신규: `src/entities/identity/model/position-eligibility.ts`·그 테스트(F-05).
