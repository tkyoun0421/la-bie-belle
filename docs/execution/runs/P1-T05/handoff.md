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
