# P1-T03 handoff

## 2026-08-07 · 개발 종료

- 작업 식별자: P1-T03
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- RADIO(revision 1, SHA-256 `dbad4998bd0609e3875103629b6ac835693d273d613a036cb855a15c3d8e63f2`)를 구현 시작 전 재확인했고 구현 중 봉인 이후 변경은 없었다. P1-T04 구현(e55cb7b)과 대조한 RADIO의 미결 사항("함수·테이블·/admin 셸 구조가 P1-T04와 다르게 확정되면 재봉인")은 실제로 발생하지 않았다 — `requireAdmin`·`is_admin`·`identity_audit_logs`·`(protected)/admin` 셸이 RADIO가 전제한 그대로였다.
- `supabase/migrations/20260807010000_identity_signup_approval.sql`: `approve_signup(target uuid)`·`reject_signup(target uuid, reason text default null)`(둘 다 SECURITY DEFINER) — 내부 `is_admin(auth.uid())` 확인(거부 시 `42501`) → `select status … for update`로 대상 행 잠금 → pending 아니면 `22023`("이미 처리된 신청입니다")로 예외 → 승인은 status를 active로, 거절은 rejected로 전환 → `identity_audit_logs`에 `signup_approved`/`signup_rejected` insert(거절 detail은 앞뒤 공백을 자른 사유가 있을 때만 `{"reason": ...}`, 없으면 빈 객체). 신규 테이블·enum 없음, `profiles` update RLS 정책 신설 없음(RADIO 불변 규칙 그대로). 두 함수 모두 `grant_admin_role`/`revoke_admin_role` 전례처럼 execute 권한을 별도로 제한하지 않고 내부 검사로만 막는다(authenticated·anon 모두 호출은 가능하되 내부에서 거부).
- `supabase/tests/08-signup-approval.test.sql`(pgTAP 46건): 함수 존재·잠금 존재(`pg_get_functiondef` 정규식으로 `for update` 포함 확인) · 비관리자·anon 권한 거부(서버 경계와 별개로 DB 경계 단독 검증) · 승인 happy path(status 전환·다른 프로필 필드 불변·`profile_roles` 무증가로 기본 포지션 부여 기록 부재 단언·감사 이벤트/처리자/detail) · 재승인·뒤늦은 거절 모두 `22023` 거부 및 상태·감사 무변화 · 거절 happy path(사유 trim 저장) · 재거절·뒤늦은 승인 모두 `22023` 거부 · 사유 생략·공백만 사유 모두 감사 detail에 `reason` 키 없음 · 무프로필(존재하지 않는 uuid) 처리 거부 및 감사 무생성 · `profiles_select_admin` 정책이 상태 무관하게 admin에게 pending 행도 보여주고 비관리자에게는 안 보여줌. 동시성(두 세션 동시 호출)은 별도 커넥션을 여는 인프라가 이 저장소 pgTAP 스위트에 없어(dblink 등 미도입) 순차 재호출로 시뮬레이션했다 — RADIO 문구("후행 트랜잭션이 잠금 해제 후 pending 아님을 보고 거부") 자체가 이 순차 검증으로 충분히 서술돼 있다고 판단했고, 별도 질문 없이 기존 07-roles.test.sql의 재임명·재해제 검증 방식(순차 재호출)을 그대로 따랐다. `pnpm db:reset && pnpm db:test` GREEN(8 파일 256 tests).
- `src/entities/identity/model/audit-event.ts`(신규): `AUDIT_EVENT_VALUES`(기존 3종 + 신규 2종) + `AuditEventSchema`(z.enum) — P1-T04 교차 검증 F-09(감사 이벤트 앱 정본 부재) 해소를 겸한다. 이 task에서 소비처는 자신의 테스트뿐이다(감사 insert는 SQL 함수가 수행하므로 앱 코드가 이 스키마로 값을 검증하는 지점이 아직 없다 — 향후 감사 뷰어가 생기면 소비).
- `src/entities/identity/model/approval.ts`(신규): `RejectReasonSchema`(trim + `max(200)`, `REJECT_REASON_MAX_LENGTH=200`로 RADIO 미결 사항을 확정) · `mapApprovalRpcErrorCode`(pg `22023`→`IDENTITY_ALREADY_PROCESSED`, `42501`→`COMMON_FORBIDDEN`, 그 외→`COMMON_UNEXPECTED`).
- `src/entities/identity/model/signup.ts`: `GenderValueSchema`(`z.enum(GENDER_VALUES)`) 추가 — 기존 `find-own-profile.ts`의 `ProfileStatusSchema.parse` 전례를 좇아 pending 목록 조회에서 DB gender 값을 검증한다.
- `src/entities/identity/model/profile-gate.ts`: `resolveProfileGate`에 rejected 분기 신설(rejected×`/rejected`→통과, 그 외 모든 경로→`/rejected`) — 기존 무프로필·pending 분기는 그대로 두고, active 분기에는 `REJECTED_PATH`를 대칭적으로 추가해 active 사용자가 `/rejected`에 들어오면 홈으로 보낸다(이 경로는 이전에 존재하지 않았으므로 "기존 판정 불변" 위반이 아니라 새 경로에 대한 신규 결정). 기존 pending 분기(`else`)가 자연히 dormant·departed도 그대로 pending 대기 화면으로 보내는 동작은 손대지 않았다(P1-T06 소유, 비목표 그대로).
- `src/entities/identity/model/__tests__/profile-gate.test.ts`: RADIO가 명시한 유일한 의미 갱신 지점 — "rejected 사용자는 pending과 같은 대기 화면으로 보낸다(임시)" 테스트를 rejected 전용 화면 도달·이탈 테스트 5건으로 교체했다. 그 외 기존 단언(무프로필·pending·active)은 손대지 않았다.
- `src/entities/identity/api/list-pending-profiles.ts`: `profiles_select_admin` 정책 하에 pending 프로필의 `id, name, gender, birth_date, phone, created_at`을 신청 시각 오름차순으로 조회, DTO(`PendingProfile`, `src/entities/identity/types/pending-profile.ts`)로 매핑. 조회 실패는 개인정보 없이 postgres 오류 코드만 stderr에 기록.
- `src/features/approval/api/approve-signup.ts`·`reject-signup.ts`(Server Action): `requireAdmin()` 선통과 후 RPC 호출, 실패는 `mapApprovalRpcErrorCode`로 좁혀 반환, 성공 시 `revalidatePath(ADMIN_APPROVALS_PATH)`. `reject-signup.ts`는 RPC 호출 전에 `RejectReasonSchema`로 사유를 검증(최대 길이 초과 시 RPC 호출 없이 `IDENTITY_VALIDATION` 반환)하고 빈 문자열은 `null`로 정규화해 RPC에 전달한다.
- `src/features/approval/hooks/useApprovalActions.ts`: `useRoleActions.ts`의 `useActionState`/`<form>` 패턴 대신 `useTransition` 기반으로 설계했다 — 거절은 다이얼로그에서 사유를 입력받은 뒤 확정 콜백으로 호출되는 흐름이라 네이티브 form 제출과 맞지 않아, 승인·거절 모두 `run*()` 직접 호출 + `useTransition` pending 상태로 통일했다(RADIO가 구현 세부로 위임한 "오케스트레이션" 안의 기술적 선택, 새 설계 결정 아님). `ui/ApprovalActionButtons.tsx`(client leaf, 배선만)·`ui/RejectReasonDialog.tsx`(client leaf, `shared/ui` `Dialog`+`Input` 재사용 — `shared/ui`는 RADIO 허용 경로 밖이라 기존 컴포넌트를 그대로 소비만 하고 수정하지 않았다).
- `src/views/admin/model/gender-label.ts`(신규): 성별 표시 문구 순수 함수 — P1-T04가 `role-label.ts`를 `ui`에서 `model`로 옮긴 자체 교정 전례(`DEV-CODE-09`)를 좇아 처음부터 `model`에 뒀다.
- `src/views/admin/ui/ApprovalListView.tsx`(서버 컴포넌트): pending 목록(4필드+신청 시각, `formatDateTimeInSeoul` 신규 `shared/lib` 헬퍼로 `YYYY.MM.DD HH:mm` 표시) + 빈 목록 안내 + 행별 `ApprovalActionButtons` 조립.
- `src/views/rejected/ui/RejectedView.tsx`: 거절 안내 문구 + `PendingView.tsx`의 정적 문의 문구를 그대로 재사용, 거절 사유는 렌더하지 않는다.
- `src/app/(protected)/admin/approvals/page.tsx`: P1-T04 `(protected)/admin/layout.tsx`의 `requireAdmin()` 셸 아래 배치 — 이 페이지 자체는 `admin/page.tsx`(관리자 홈) 전례처럼 추가 권한 재확인을 하지 않는다(레이아웃과 같은 등급의 권한이라 `admin/roles/page.tsx`식 추가 `requireSuperAdmin()` 재확인 패턴은 적용 대상이 아니다). `src/app/rejected/page.tsx`: `pending/page.tsx`·`onboarding/page.tsx`와 같은 배치 패턴(`resolveProfileAccess` 직접 호출). `src/app/(protected)/admin/page.tsx`: "가입 승인" 진입 링크를 "역할 관리"보다 앞에 추가.
- `src/shared/config/auth-routes.config.ts`: `REJECTED_PATH`("/rejected")·`ADMIN_APPROVALS_PATH`("/admin/approvals") 추가. `error-codes.config.ts`: `IDENTITY_ALREADY_PROCESSED`(409, "이미 처리된 신청이에요") 신설 — 이번 task의 유일한 신규 오류 코드다.
- E2E `tests/e2e/approval.spec.ts`(신규 3건): 승인 완주(관리자 처리 → 목록에서 행 소멸 → 대상 세션이 다음 요청부터 홈 진입) · 거절 완주(사유 입력 → 처리 → 대상이 `/rejected`로 이동 → 화면에 사유 미노출) · 비관리자의 `/admin/approvals` 접근 차단(홈 리다이렉트). `roles.spec.ts`의 super admin 픽스처(`resolveSuperAdminFixtureEmail`)는 파일 간 병렬 실행 시 부트스트랩 순서 경합 위험이 있어 재사용하지 않고, `createActiveWorker` 패턴만 재사용해 이 파일 전용의 격리된 admin 계정(active 프로필 + `profile_roles` admin insert를 서비스 롤로 직접 생성)을 세션마다 새로 만들었다 — RADIO가 요구한 "격리 세션 패턴 재사용"은 이 기법 재사용으로 충족했다고 판단했다.
- 검증 결과: `pnpm vitest run`(전체) 657 tests GREEN. `pnpm typecheck`·`pnpm lint` GREEN. `pnpm build` 성공(`/admin/approvals`·`/rejected` 동적 라우트 생성 확인). `pnpm db:reset && pnpm db:test` GREEN(8 파일 256 tests). `pnpm exec playwright test approval.spec.ts` 3/3 GREEN(첫 실행, 이미 구현이 끝난 상태에서 작성한 통합 계층이라 자연 RED가 나오지 않았다 — P1-T04 handoff의 선례와 같은 판단으로 tdd.json에는 REDGREEN 쌍을 강제하지 않고 이 절에 실행 확인만 남긴다). `pnpm test:e2e`(전체 24건) GREEN — 기존 auth·home·schedule·signup·roles.spec.ts 전부 회귀 없음. `pnpm gate:index`·`gate:radio`·`gate:scope`·`gate:tdd` 개별 GREEN.

### 미결 사항

- `pnpm verify` 전체 1회 통과 확인은 이 handoff 다음 행동에서 수행한다 — 개별 단계는 모두 GREEN을 확인했지만 전체 파이프라인을 통으로 돌린 최종 확인이 아직 없다. 결정 주체: 없음(실행만 남음).
- 관리자 승인 화면의 전용 디자인 정본 부재는 P1-T04 미결 사항과 동일하게 이어진다 — 기존 토큰·`shared/ui`(Button·Dialog·Input)로 최소 구성했다. 결정 주체: 사용자(검증 단계에서 확인).
- pgTAP 동시성 검증은 실제 두 커넥션 병렬 호출이 아니라 순차 재호출 시뮬레이션이다(위 "확정된 사실" 참고) — 저장소에 실제 병렬 커넥션을 여는 pgTAP 인프라(dblink 등)가 아직 없어서다. 실제 병렬 커넥션 검증이 필요하다고 판단되면 별도 인프라 도입은 새 기술 결정이라 설계 단계로 반환한다. 결정 주체: 사용자(우선순위 판단 필요 시).

### 다음 행동

1. `pnpm verify` 전체를 한 번 더 통으로 실행해 최종 확인한다.
2. 통과 후 변경분 전체를 스테이징해 P1-T03 커밋을 만든다.
3. 교차 검증(opus·codex)을 진행하고 `docs/execution/reviews/P1-T03-review.json`을 남긴다.
4. 검증 통과 후 `index.jsonl`을 `done`으로 전환하고 push·CI 감시는 `ci-finisher`에게 오프로드한다.

### 증거·산출물 경로

- `docs/execution/runs/P1-T03/tdd.json` — 실제 명령 실행의 RED→GREEN 14쌍(단위/컴포넌트 13쌍 + `pnpm db:test` 1쌍).
- 신규 마이그레이션: `supabase/migrations/20260807010000_identity_signup_approval.sql`. 신규 pgTAP: `supabase/tests/08-signup-approval.test.sql`.
- 구현 파일: 위 "확정된 사실" 각 경로 전체(`src/entities/identity/**`, `src/features/approval/**`, `src/views/admin/**`, `src/views/rejected/**`, `src/app/(protected)/admin/approvals/**`, `src/app/rejected/**`, `src/app/(protected)/admin/page.tsx`, `src/shared/config/auth-routes.config.ts`, `src/shared/config/error-codes.config.ts`, `src/shared/lib/format-date-time-seoul.ts`).
- E2E: `tests/e2e/approval.spec.ts`.
- 로컬 확인: `pnpm vitest run`·`pnpm typecheck`·`pnpm lint`·`pnpm build`·`pnpm db:reset && pnpm db:test`·`pnpm exec playwright test approval.spec.ts`·`pnpm test:e2e`(전체) 개별 실행 전부 GREEN. `pnpm gate:index`·`gate:radio`·`gate:scope`·`gate:tdd` 개별 실행 GREEN. `pnpm verify` 전체는 다음 행동에서 재확인한다.
