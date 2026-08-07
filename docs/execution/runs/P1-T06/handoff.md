# P1-T06 handoff

## 2026-08-07 · 개발 종료

- 작업 식별자: P1-T06
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- RADIO(revision 1, SHA-256 `988685d1241f4d15dd7845680f0ee2b9f43aeff957c8bff18ffa64aad5274703`)를 구현 시작 전 `index.jsonl`의 `development_approval`과 대조해 일치를 확인했다. 의존 task P1-T03은 done, test mode는 tdd다.
- `supabase/migrations/20260807030000_identity_dormancy.sql`(신규): `profiles.inactivity_anchor_at timestamptz` 추가 + 기존 active 계정을 마이그레이션 시각으로 backfill + 방어 CHECK(`status not in ('active','dormant') or inactivity_anchor_at is not null`). `approve_signup`을 `create or replace`로 재정의(기존 마이그레이션 파일은 무수정, 기존 로직 불변 + active 전환 시 `inactivity_anchor_at = now()` 추가). 전이 함수 3종을 신설했다 — `deactivate_worker(target)`(관리자, active→dormant, anchor 불변, 부적합 대상 `LB010`), `reactivate_worker(target)`(관리자, dormant→active, anchor=now(), 부적합 대상 `LB011`), `reactivate_own_profile()`(무인자, `auth.uid()` 본인, dormant→active, anchor=now(), 부적합 대상 `LB011` 공유 — 대상이 다르지 않고 부적합 조건이 동일해 코드를 나누지 않았다). 셋 다 `for update` 행 잠금 → 상태 검증 → 전이 + `identity_audit_logs` 원자 기록 패턴이고, `revoke execute ... from public, anon, authenticated, service_role; grant execute ... to authenticated`로 실행 권한을 명시 통제한다(P1-T05 F-12 교훈을 이 task에서 선반영).
- **범위 안에서 발견해 그 자리에서 고친 결함(설계 변경 아님)**: 마이그레이션 적용 직후 `pnpm db:reset && pnpm db:test`가 `07-roles.test.sql`에서 `profiles_inactivity_anchor_required` CHECK 위반으로 실패했다. 원인은 `bootstrap_super_admin`(P1-T04 산출물)이 `approve_signup`과 별개로 pending→active 승격을 수행하는 두 번째 구현체였는데, RADIO의 "인정 활동 시각 갱신 사건은 DOMAIN이 정한 세 가지뿐"이라는 불변 규칙 중 "최초 활성 승인"에 해당하면서도 원래 계획이 다루지 않았다. RADIO가 이미 같은 사건(최초 활성 승인)의 다른 구현체인 `approve_signup`에 대해 명시한 기법(새 마이그레이션에서 `create or replace`, 기존 로직 불변 + anchor 세팅만 추가)을 `bootstrap_super_admin`에도 동일 적용했다 — 새 판단이 아니라 이미 승인된 불변 규칙을 그 실제 구현체 전부에 적용한 것으로 판단해 `[질문]`으로 멈추지 않고 진행했다. 반대 방향(구현을 우회해 CHECK을 느슨하게 만드는 것)은 선택하지 않았다 — RADIO가 CHECK을 명시적으로 요구했기 때문이다. 수정 전/후로 `pnpm db:reset && pnpm db:test`를 실제로 두 번 실행해 진짜 RED(위 실패)와 GREEN을 재현했다(tdd.json에 기록).
- `supabase/tests/10-dormancy.test.sql`(신규, `plan(57)`): 기술 인수 조건 1~4·6을 anon 주체 포함해 단언한다 — anchor 도입(backfill·승인 시 기록), `deactivate_worker`/`reactivate_worker`/`reactivate_own_profile`의 happy path·권한 거부(42501, anon 포함)·상태 부적합 거부(LB010/LB011)·중복 요청의 멱등 수렴, `for update` 사용을 함수 정의 텍스트로 직접 단언(병렬 커넥션 인프라가 없다는 P1-T05 선례와 동일한 제약 — 실제 동시 접속 테스트는 이번에도 하지 않았다, 아래 미결 사항 참고), dormant 주체(admin 역할을 유지한 주체 포함)가 `set_hourly_wage`·`update_own_phone`·`approve_signup`·`grant_position_eligibility`를 호출해도 거부됨을 단언(effective_roles가 이미 구조로 막는다는 사실의 확인이지 새 차단 계층이 아니다).
- CHECK 도입 파급 픽스처 보정(의미 보존, 단언 무변경): `supabase/tests/04-rls-default-deny.test.sql`·`07-roles.test.sql`·`08-signup-approval.test.sql`·`09-worker-management.test.sql`의 active·dormant 서비스 롤 insert에 `inactivity_anchor_at` 값을 추가했다. `06-profiles-signup.test.sql`의 42501 단언(RLS with-check가 테이블 제약보다 먼저 평가됨)은 RADIO가 명시한 대로 무수정이다. `pnpm db:reset && pnpm db:test` 최종 GREEN(10 파일, 402 tests).
- `src/entities/identity/model/dormancy.ts`(신규): `resolveAutoDepartureDate(anchor)` — KST 달력 기준 anchor+1년을 순수 함수로 계산해 `"YYYY년 M월 D일"` 문자열을 반환한다(`Intl.DateTimeFormat` + `formatToParts` 사용, `.format()` 문자열 분할이 아님 — TS strict 모드에서 배열 구조분해 원소가 `possibly undefined`로 잡히는 문제를 피했다). `mapDormancyRpcErrorCode(pgCode)` — 42501→`COMMON_FORBIDDEN`, LB010/LB011→`IDENTITY_STATUS_CONFLICT`(신설 오류 코드 1종), 그 외→`COMMON_UNEXPECTED`. 단위 테스트 12건(기본 KST 오프셋, Date 인스턴스 입력, 실행 환경 TZ 무관성, 연말 경계, 윤년 정규화, 오류 코드 매핑).
- `src/entities/identity/model/profile-gate.ts`: `resolveProfileGate`에 dormant→`/dormant`·departed→`/departed` 판정을 추가하고, active 사용자가 `/dormant`·`/departed`에 있으면 홈으로 돌려보내는 분기도 추가했다(기존 onboarding·pending·rejected 판정은 불변). `src/entities/identity/model/audit-event.ts`: `AUDIT_EVENT_VALUES`에 `profile_dormanted`·`profile_reactivated` 추가(10→12종, 기존 값 불변).
- `src/entities/identity/api/find-own-dormancy.ts`(신규): `findOwnDormancyProfile()` — `status`·`inactivity_anchor_at` 단일 쿼리 조회. RADIO의 "신규 조회 추가 없음" 최적화 요구를 지키기 위해 기존에 널리 쓰이는 `find-own-profile.ts`는 건드리지 않고, `/dormant` 페이지의 게이트 판정과 화면 표시를 같은 쿼리 하나로 함께 처리하는 전용 조회를 새로 만들었다.
- `src/features/reactivation/`(신규 슬라이스): `api/reactivate-own.ts`(Server Action — 세션 확인 → `reactivate_own_profile` RPC → `revalidatePath` → 성공 시 `redirect(HOME_PATH)`, 실패만 typed Result로 반환 — `submit-signup.ts` 선례와 동일한 형태), `hooks/useReactivateOwn.ts`(`useActionState` 기반), `ui/ReactivateButton.tsx`(client leaf, `<form action={formAction}>`).
- `src/features/worker-management/` 확장: `api/deactivate-worker.ts`·`reactivate-worker.ts`(`requireAdmin()` → UUID Zod 검증 → RPC → `revalidatePath`(오류 분기 이전) → 매핑된 오류 반환 — `grant-position.ts` 선례와 동일 형태), `hooks/useWorkerStatusAction.ts`(다이얼로그 열림 상태 + `useTransition` + 실패 시 스낵바), `ui/WorkerStatusAction.tsx`(active면 "수동 휴면" 버튼+확인 다이얼로그(확인 라벨 "휴면 처리"), dormant면 "재활성화" 버튼+확인 다이얼로그(확인 라벨 "재활성화하기" — 트리거 라벨과 의도적으로 다르게 해 다이얼로그가 열렸을 때 접근성 이름 중복을 피했다)).
- `src/views/admin/ui/WorkerDetailView.tsx`: 이름 옆에 상태 뱃지(active면 success 톤)와 `WorkerStatusAction`을 추가했다(`onDeactivate`·`onReactivate` prop 신설, 기존 개인정보·시급·포지션 3섹션은 불변). `src/views/dormant/ui/DormantView.tsx`(신규): 상태 안내 + "자동 탈퇴 예정일: …" + `ReactivateButton` + 문의 문구. `src/views/departed/ui/DepartedView.tsx`(신규): 정적 안내 + 문의 문구, 행동 버튼 없음.
- `src/app/dormant/page.tsx`·`src/app/departed/page.tsx`(신규, onboarding·pending 페이지와 동일한 배치 패턴). `src/app/(protected)/admin/workers/[id]/page.tsx`: `deactivateWorker`·`reactivateWorker`를 `WorkerDetailView`에 배선.
- `src/shared/config/auth-routes.config.ts`: `DORMANT_PATH`("/dormant")·`DEPARTED_PATH`("/departed") 추가. `src/shared/config/error-codes.config.ts`: `IDENTITY_STATUS_CONFLICT`(409, "상태가 이미 바뀌었어요. 새로고침 후 다시 확인해 주세요") 신설 1종.
- `tests/e2e/dormancy.spec.ts`(신규 3건): 관리자 수동 휴면 → 대상 다음 요청부터 즉시 `/dormant` 차단 → 본인 재활성화 완주(홈 복귀 후 재접근 허용까지), 관리자가 dormant 근무자를 재활성화 → 대상 즉시 접근 재개, departed 픽스처가 `/departed` 정적 안내만 보고 버튼이 없으며 `/dormant` 접근도 `/departed`로 재귀환됨을 확인. CHECK 파급으로 `tests/e2e/global-setup.ts`·`approval.spec.ts`·`auth.spec.ts`·`roles.spec.ts`·`signup.spec.ts`·`worker-management.spec.ts`의 서비스 롤 active insert 10곳에 `inactivity_anchor_at` 값을 추가했다(단언 무변경).
- TDD 증거(`docs/execution/runs/P1-T06/tdd.json`): DB 계층 1쌍(`pnpm db:reset && pnpm db:test`, bootstrap_super_admin 결함의 실제 RED→GREEN — bootstrap_super_admin 수정 전/후) + TS 단위·컴포넌트 계층 11쌍(`dormancy.test.ts`·`audit-event.test.ts`·`profile-gate.test.ts`·`find-own-dormancy.test.ts`·`reactivate-own.test.ts`·`useReactivateOwn.test.ts`·`deactivate-worker.test.ts`+`reactivate-worker.test.ts`·`useWorkerStatusAction.test.ts`·`DormantView.test.tsx`+`DepartedView.test.tsx`·`WorkerStatusAction.test.tsx`·`WorkerDetailView.test.tsx`) + E2E 1쌍(`npx playwright test dormancy.spec.ts --reporter=list`). 이미 구현이 끝난 뒤 로그 시각을 재구성하는 대신, 파일을 임시로 이동·git HEAD로 되돌려 실제로 RED를 재현한 뒤 원복해 GREEN을 재확인하는 방식으로 전부 실제 명령 실행에서만 기록했다(작업 트리는 개입 전후로 `git status`가 완전히 동일함을 확인).
- 검증 결과: `pnpm vitest run`(전체) 832 tests GREEN(145 파일). `pnpm exec tsc --noEmit`·`pnpm lint`·`pnpm format` GREEN. `pnpm build` 성공(`/dormant`·`/departed` 동적 라우트 생성 확인). `pnpm db:reset && pnpm db:test` GREEN(10 파일, 402 tests). `pnpm test:e2e`(전체 30건, 기존 auth·home·schedule·signup·roles·approval·worker-management 포함) GREEN — 회귀 없음.
- `pnpm verify` 전체를 통으로 실행해 최종 확인했다. 첫 실행은 로컬에서 이번 세션 중 반복한 e2e 실행이 누적시킨 테스트 사용자 때문에 `global-setup.ts`의 고정 계정 조회가 페이지 범위를 벗어나 실패했다(P1-T05 handoff가 이미 남긴 동일 결함, 이 task 범위 밖) — `pnpm db:reset`으로 근본 원인을 제거한 뒤 재실행해 exit 0을 확인했다(gate:all 포함 전 구간 통과, e2e 30/30).

### 미결 사항

- `/dormant`·`/departed` 화면 문구는 구현이 초안을 작성했다(RADIO가 이미 예정한 대로) — 사용자가 검증 단계에서 확인해야 한다. 결정 주체: 사용자.
- KST 달력 1년 계산(`resolveAutoDepartureDate`)이 DEV-TIME 계열 공통 규칙 후보라는 RADIO의 미결 사항이 그대로 이어진다 — P2 스케줄·P4 알림 설계 때 규칙 승격을 재론한다. 결정 주체: 사용자(해당 설계 시점).
- 진짜 동시성(병렬 커넥션) 검증은 이번에도 하지 않았다 — pgTAP 스위트에 병렬 커넥션 인프라(dblink 등)가 없다는 P1-T03·P1-T05의 동일 제약이 이어진다. `for update` 잠금이 실제로 두 번째 트랜잭션을 대기시키는지는 병렬 커넥션으로만 증명 가능하다. 결정 주체: 사용자(인프라 도입 우선순위 판단 시 별도 task).
- `tests/e2e/global-setup.ts`의 `listUsers()` 페이지네이션 미고려 결함(P1-T01 산출물)은 이 task 범위 밖이며 이번에도 `db:reset`으로 우회했다 — P1-T05 handoff가 이미 남긴 것과 동일한 미결 사항이다.

### 다음 행동

1. 교차 검증(opus·codex)을 진행하고 `docs/execution/reviews/P1-T06-review.json`을 남긴다.
2. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로

- `docs/execution/runs/P1-T06/tdd.json` — 실제 명령 실행의 RED→GREEN 기록(DB 1쌍 + TS 11쌍 + E2E 1쌍).
- 신규 마이그레이션: `supabase/migrations/20260807030000_identity_dormancy.sql`. 신규 pgTAP: `supabase/tests/10-dormancy.test.sql`. 갱신(의미 보존): `supabase/tests/04-rls-default-deny.test.sql`·`07-roles.test.sql`·`08-signup-approval.test.sql`·`09-worker-management.test.sql`.
- 구현 파일: 위 "확정된 사실" 각 경로 전체(`src/entities/identity/**`, `src/features/reactivation/**`, `src/features/worker-management/**`, `src/views/dormant/**`, `src/views/departed/**`, `src/views/admin/ui/WorkerDetailView.tsx`, `src/app/dormant/**`, `src/app/departed/**`, `src/app/(protected)/admin/workers/[id]/page.tsx`, `src/shared/config/auth-routes.config.ts`, `src/shared/config/error-codes.config.ts`).
- E2E: `tests/e2e/dormancy.spec.ts` + 픽스처 보정 6개 파일(`global-setup.ts`·`approval.spec.ts`·`auth.spec.ts`·`roles.spec.ts`·`signup.spec.ts`·`worker-management.spec.ts`).
- RADIO: `docs/execution/radio/P1-T06-radio.md`(revision 1, SHA-256 `988685d1241f4d15dd7845680f0ee2b9f43aeff957c8bff18ffa64aad5274703`, 무수정).
