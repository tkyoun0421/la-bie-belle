# P1-T03 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 기획 확정(4필드 전부 표시·거절 사유 기록만·기본 포지션 파생·rejected 화면 분리·감사 재사용) 반영. 봉인 전 P1-T04 구현(e55cb7b)과 대조 완료 — 함수·테이블·/admin 셸 구조 일치 확인. 대조에서 확인된 사실 하나를 반영: 감사 이벤트의 앱 z.enum 정본이 P1-T04에서 미구현(교차 검증 F-09)이라 이 task가 정본을 신설해 기존 3종과 신규 2종을 함께 선언한다. |

- 관련 spec: PRD:AC-12, DOMAIN:IDENTITY, ADR:0002
- 적용 깊이: 심화 (상태 전이 최초 실행 — 승인·거절이 권한과 계정 생애를 바꾼다)
- test mode: tdd
- 예정 check IDs: approval-rls, approval-e2e (index에 기획 시점 기록 완료)

## Requirements

### 범위와 비목표

- 범위: ① 승인·거절 SECURITY DEFINER 함수(계정 잠금 트랜잭션·감사 원자 기록) 마이그레이션 + pgTAP ② `/admin/approvals` pending 목록·처리 화면(4필드 전부 표시) ③ 승인·거절 Server Action(`requireAdmin` 소비) ④ rejected 게이트 분리(`/rejected` 화면 신설, 임시 pending 합류 제거) ⑤ E2E(승인→홈 진입, 거절→rejected 화면, 비관리자 차단) ⑥ phase 문서의 "기본 포지션 부여" 문구를 PRD 150행(자동 적용·파생)에 정합화.
- 비목표(기획 승인 그대로): 승인·거절 취소, 재신청, 알림(P4), 가능 포지션 예외 관리·eligibilities 테이블(P1-T05), 3개월 삭제 배치·감사 익명화(P7-T01), 거절 사유의 화면 노출, dormant·departed 전이(P1-T06). 설계 비목표: P1-T04 산출물(함수·테이블·셸) 수정 — 소비만 한다.

### 불변 규칙

- 상태 전환 쓰기는 SECURITY DEFINER 함수 경유만 존재한다(P1-T04 확립 패턴). profiles에 update RLS 정책을 만들지 않는다 — 직접 update는 계속 기본 거부다.
- 함수 내부에서 대상 행을 잠근다(`select … for update`). PRD 103행: 동시 발생 시 먼저 완료된 작업만 유효하고, 나중 요청은 "이미 처리됨" 거부 경로로 간다.
- 권한 판정은 P1-T04 정본을 소비한다: 함수 내부 `is_admin(auth.uid())`, 서버 경계 `requireAdmin`. 이 task는 판정 규칙을 새로 만들지 않는다.
- 승인은 `profiles.status` 전환과 감사 기록 외에 어떤 쓰기도 만들지 않는다 — 기본 포지션(안내·매니저·축가)은 PRD 150행에 따라 활성 근무자에게 자동 적용되는 파생이다(positions.is_default가 정본, worker 파생과 동일 원칙).
- 거절 사유는 감사 기록 detail에만 저장하고 rejected 화면에 노출하지 않는다. 사유는 선택 입력이며 서버 Zod 검증(최대 길이)을 거친다. 감사 detail의 PII 금지 원칙은 유지된다(사유는 관리자 판정 텍스트로 허용, 신청자 개인정보 필드는 미포함).
- 게이트 규칙 확장: rejected × 모든 보호 경로 → `/rejected`(전용 화면). 기존 무프로필·pending·active 판정은 불변이고, rejected를 pending 화면에 합류시키던 임시 처리(P1-T02 미결)만 제거한다.
- Server Action 실패는 `{ ok: false, code }`(레지스트리)다. "이미 처리된 신청" 전용 코드 1종을 신설하고 그 외 신설은 없다.
- 기존 E2E·pgTAP의 의미는 불변이다. rejected 임시 합류를 단언하던 테스트가 있으면 전용 화면 단언으로 갱신한다(의미 갱신은 이 항목 하나뿐).

### 기술 인수 조건

1. admin 이상이 `/admin/approvals`에서 pending 목록(이름·성별·생년월일·휴대폰·신청 시각)을 보고, 행별로 승인 또는 거절(사유 선택 입력)을 실행할 수 있다. 비관리자는 목록 조회와 처리 호출이 서버·DB 양쪽에서 거부된다.
2. 승인 시 대상이 pending→active로 전환되고 감사 이벤트(`signup_approved`, 처리자·대상·시각)가 같은 트랜잭션에 기록되며, 승인된 사용자는 다음 요청부터 근무자 홈에 진입한다(worker 파생 자동 — 별도 부여 쓰기 없음).
3. 거절 시 pending→rejected로 전환되고 감사 이벤트(`signup_rejected`, 사유 포함)가 기록되며, rejected 사용자는 모든 보호 경로에서 `/rejected`로 보내지고 그 화면은 거절 안내와 정적 문의 문구만 렌더한다(사유 미표시).
4. pending이 아닌 대상(이미 승인·거절된 사람, 무프로필)의 처리는 전용 코드("이미 처리된 신청")로 거부되고 상태·감사에 아무 변화도 만들지 않는다.
5. 동시 처리: 같은 대상에 대한 두 처리 요청 중 먼저 완료된 것만 유효하고, 나중 요청은 4의 거부 경로로 간다(행 잠금 pgTAP 검증).
6. 승인 함수의 쓰기가 profiles.status와 감사 행뿐임이 pgTAP으로 단언된다(기본 포지션 부여 기록 부재 — PRD 150행 정합).
7. 기존 임시 처리 제거: rejected 사용자가 더는 pending 대기 화면으로 가지 않는다(게이트 단위 테스트·E2E 갱신).
8. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과. 기존 E2E(가입·게이트·역할)가 계속 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 목록·처리 진입 | 테스트함 — admin 픽스처의 목록 렌더·4필드 표시 E2E | 테스트함 — 비관리자 Server Action 호출이 COMMON_FORBIDDEN | 테스트함 — pending 0명일 때 빈 목록 안내 렌더 | 테스트함 — 비관리자 목록 조회가 RLS로 빈 결과·화면 접근은 홈 리다이렉트 | 해당 없음 — 조회는 상태를 만들지 않는다 | 해당 없음 — 목록은 요청별 독립 조회다 |
| 2 승인 | 테스트함 — 승인→active·감사·홈 진입 E2E | 테스트함 — 함수 실패 시 상태·감사 모두 원복(원자성) pgTAP | 테스트함 — 승인 직후 effective_roles가 {worker} 반환 pgTAP | 테스트함 — 일반 admin 승인 허용·비관리자 함수 직접 호출 예외 pgTAP | 테스트함 — 같은 대상 재승인이 이미 처리됨 코드로 거부 | 테스트함 — 동시 승인·거절 중 후행이 거부됨(행 잠금) pgTAP |
| 3 거절 | 테스트함 — 거절→rejected·감사(사유 포함)·/rejected 도달 E2E | 테스트함 — 사유 길이 초과가 검증 코드로 거부 | 테스트함 — 사유 생략(빈 값) 거절 허용·감사 detail에 사유 부재 표기 | 테스트함 — rejected 화면에 사유가 렌더되지 않음 단위 테스트 | 테스트함 — 재거절이 이미 처리됨 코드로 거부 | 해당 없음 — 2행 동시성이 승인·거절 경합을 소유한다 |
| 4 재처리 거부 | 테스트함 — active·rejected 대상 처리가 전용 코드 반환 | 테스트함 — 무프로필 대상 처리 거부 | 테스트함 — 거부 경로가 상태·감사 무변화임을 pgTAP으로 | 해당 없음 — 권한 판정은 1행이 소유한다 | 테스트함 — 거부 응답이 반복 호출에 일관 | 해당 없음 — 5행이 소유한다 |
| 5 동시 처리 | 테스트함 — 순차 처리의 정상 경합 없음 | 테스트함 — 후행 트랜잭션이 잠금 해제 후 pending 아님을 보고 거부 pgTAP | 해당 없음 — 잠금 경계는 함수 하나라 추가 경계 입력이 없다 | 해당 없음 — 권한은 1행이 소유한다 | 해당 없음 — 4행이 소유한다 | 테스트함 — 두 세션 동시 호출 시 먼저 완료만 유효 pgTAP |
| 6 파생 정합 | 테스트함 — 승인 쓰기가 status·감사뿐임을 pgTAP으로 | 해당 없음 — 부재 단언이라 실패 경로가 없다 | 해당 없음 — 파생 적용 자체는 P3 배정 로직이 소비할 때 검증한다 | 해당 없음 — 권한과 무관한 스키마 사실이다 | 해당 없음 — 쓰기 부재 단언이다 | 해당 없음 — 쓰기 부재 단언이다 |
| 7 게이트 분리 | 테스트함 — rejected 픽스처가 /rejected로 가는 게이트 단위 테스트·E2E | 테스트함 — rejected의 보호 탭·온보딩·pending 접근이 전부 /rejected | 테스트함 — active·pending 판정 불변 회귀(기존 테스트 유지) | 테스트함 — 차단이 서버 경계임을 E2E로 | 해당 없음 — 리다이렉트는 멱등 GET이다 | 해당 없음 — 요청별 독립 판정이다 |
| 8 회귀 | 테스트함 — verify 전체·db:test 통과 | 테스트함 — 기존 E2E(가입·게이트·역할) 통과 | 테스트함 — rejected 임시 합류 단언의 전용 화면 갱신 | 해당 없음 — 시나리오별 권한은 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — E2E는 격리 세션을 쓴다 |

- 보충: 승인·거절의 원자성(상태+감사)은 SECURITY DEFINER 함수가 단일 트랜잭션임을 근거로 하고, 경합은 행 잠금이 직렬화한다. 3개월 삭제·감사 익명화는 P7-T01 소유라 이 표에 없다.

### DEV-* 적용 상태

- `DEV-SEC`·AC-12: 처리 권한은 서버(requireAdmin)와 DB(함수 내부 is_admin + 정책 부재) 이중 강제.
- `DEV-SSOT-01`: 상태 전이 실행은 함수 2개가 소유하되 전이 규칙·의미의 정본은 P1-T06이 유지한다(이 task는 pending→active·rejected 두 전이만 실행). 게이트 판정은 기존 `resolveProfileGate`·`resolveProfileAccess` 확장 한 곳.
- `DEV-ERR-01`·`DEV-ERR-08`: 전용 코드 1종 신설(`IDENTITY_ALREADY_PROCESSED`, 409), 나머지는 기존 레지스트리 소비.
- `DEV-CODE-08`·`DEV-CODE-09`·`DEV-ARCH-06`: 목록 화면은 서버 컴포넌트, 처리 버튼·사유 다이얼로그만 client leaf. 사유 검증은 entities model(Zod).
- `DEV-TEST-01`: 위 렌즈 표. tdd.json은 실제 실행 시각만.

## Architecture

- `supabase/migrations/<ts>_identity_signup_approval.sql`:
  - `approve_signup(target uuid)`·`reject_signup(target uuid, reason text)`(SECURITY DEFINER): `is_admin(auth.uid())` 확인 → `select … for update`로 대상 잠금 → pending 확인(아니면 예외 — 전용 SQLSTATE) → status 전환 → `identity_audit_logs`에 `signup_approved`/`signup_rejected` insert(사유는 detail). authenticated 실행 허용(내부 검사가 거부).
  - 신규 테이블·enum 없음. profiles update 정책 신설 없음.
- `supabase/tests/08-signup-approval.test.sql`(pgTAP): 인수 조건 2~6 단언(원자성·잠금 경합·쓰기 범위·권한).
- `src/entities/identity/model/approval.ts`: 거절 사유 Zod 스키마(선택·최대 길이)·처리 결과 코드 매핑 — 단위 테스트. `model/profile-gate.ts`: rejected → `/rejected` 판정 추가(기존 판정 불변).
- `src/entities/identity/api/list-pending-profiles.ts`(server-only): P1-T04의 admin 조회 정책(`profiles_select_admin`) 하에 pending 프로필 4필드+신청 시각 조회.
- `src/features/approval/api/approve-signup.ts`·`reject-signup.ts`(Server Action, server-only): `requireAdmin` → RPC → typed Result·revalidate. `hooks/useApprovalActions.ts`: 오케스트레이션(사유 다이얼로그 상태 포함). `ui/ApprovalActionButtons.tsx`·`ui/RejectReasonDialog.tsx`: client leaf(배선만, `shared/ui` dialog 재사용).
- `src/app/(protected)/admin/approvals/page.tsx`: 목록 페이지(P1-T04 `/admin` 셸·역할 가드 아래 — admin 이상 접근). `admin/page.tsx`: 가입 승인 진입 링크 추가. `src/app/rejected/page.tsx`: rejected 전용 화면(onboarding·pending 배치 패턴).
- `src/views/admin/ui/ApprovalListView.tsx`(서버 컴포넌트): 목록+행 액션 조립. `src/views/rejected/ui/RejectedView.tsx`: 거절 안내 + 정적 문의 문구(P1-T02 문구 재사용, 사유 미표시).
- `src/shared/config/auth-routes.config.ts`: `/rejected`·`/admin/approvals` 상수 추가. `error-codes.config.ts`: `IDENTITY_ALREADY_PROCESSED`(409, "이미 처리된 신청이에요") 신설.
- 게이트 소비처(`(protected)/layout`·onboarding·pending 페이지)의 rejected 분기가 `/rejected`로 향하도록 판정 함수 확장을 소비(소비처 코드는 판정 결과만 따른다).
- `tests/e2e/approval.spec.ts`: 승인 완주(관리자 처리→대상 세션 홈 진입)·거절 완주(→/rejected, 사유 미노출)·비관리자 차단. 픽스처는 P1-T04 super admin·기존 randomPhone 패턴 재사용.
- phase 문서 `01-identity-and-staff.md`: P1-T03 절의 "기본 가능 포지션을 부여한다"를 PRD 150행 파생 원칙으로 정합화(기획 승인 반영).

## Data model

- 이 task는 스키마를 늘리지 않는다 — 전이 실행 함수 2개와 감사 이벤트 값 2종(`signup_approved`·`signup_rejected`)만 더한다. 감사 이벤트의 앱 z.enum 정본은 아직 없으므로(P1-T04 교차 검증 F-09) 이 task가 `entities/identity/model`에 정본을 신설해 기존 3종(`super_admin_bootstrap`·`admin_role_granted`·`admin_role_revoked`)과 신규 2종을 함께 선언한다 — F-09 backlog 해소를 겸한다.
- 감사 detail: `{ reason?: string }`(거절), 승인은 빈 객체. 신청자 PII 필드는 담지 않는다.
- 기본 포지션 가능 상태는 어디에도 저장되지 않는다 — `positions.is_default` + `status='active'`의 파생이며, 실제 소비(배정 후보 계산)는 P3 소유다.

## Interface

- `/admin/approvals` UX: pending 행(이름·성별·생년월일·휴대폰·신청 시각) + 승인/거절 버튼, 거절은 사유 입력 다이얼로그(선택 입력) 후 확정. 처리 결과 스낵바(레지스트리 문구), 빈 목록 안내. 관리자 화면 디자인 정본 부재 — 기존 토큰·`shared/ui` 최소 구성(P1-T04 미결과 동일).
- `/rejected` UX: 거절 안내 문구 + 정적 문의 문구(P1-T02 재사용). 사유·재신청 UI 없음.
- 리다이렉트 규칙 확장: rejected × 보호 경로 전부 → `/rejected` · rejected × `/rejected` → 유지. 기존 규칙 불변.
- 오류 표시: 이미 처리됨·검증 실패·권한 거부 전부 레지스트리 문구, 원문 미노출.

## Optimizations

- pending 목록은 status 조건 단일 조회다. 페이지네이션은 pending 규모(수십 명 이하)상 도입하지 않고, 필요해지면 P1-T05 근무자 관리와 함께 판단한다.

## 변경 허용 경로

```
src/app/**
src/views/admin/**
src/views/rejected/**
src/features/approval/**
src/entities/identity/**
src/shared/lib/**
src/shared/config/**
supabase/migrations/**
supabase/tests/**
tests/**
docs/execution/radio/P1-T03-radio.md
docs/execution/runs/P1-T03/**
docs/execution/phases/index.jsonl
docs/execution/phases/01-identity-and-staff.md
```

## 미결 사항

- P1-T04 구현이 봉인 계약(함수·테이블 이름, /admin 셸 구조)과 다르게 확정되면 이 RADIO를 정정 후 재봉인한다 — 봉인 시점에 P1-T04 handoff와 대조한다. 결정 주체: 조정자(위계 보정) 또는 사용자(재량 있는 변경).
- 거절 사유 최대 길이(기본 200자 제안)는 구현이 확정하고 handoff에 기록한다.
