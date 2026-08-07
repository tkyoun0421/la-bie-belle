# P1-T06 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-07-24
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 기획 승인(2026-07-24) 이후 확립된 기반(P1-T03 전이 함수 패턴·P1-T04 effective_roles 판정 정본·P1-T05 근무자 상세 화면)과 정합화하고, 설계 인터뷰 확정(departed 최소 안내 화면 편입 — 2026-08-07)을 반영. `inactivity_anchor_at` 신설과 `approve_signup` 재정의(새 마이그레이션)로 DOMAIN의 인정 활동 시각 계약을 처음 구현한다. 봉인 전 기계 대조로 방어 CHECK의 기존 픽스처 파급 범위(pgTAP 04·07·08·09, E2E 시딩)를 명시했다. |

- 관련 spec: PRD:AC-12, PRD:AC-13, PRD:ACCT-DORMANT-01, PRD:ACCT-CLEANUP-01(예정일 표시), DOMAIN:IDENTITY, ADR:0002, ADR:0010
- 적용 깊이: 심화 (상태 전이 정본의 확립 — 이후 P7 자동 처리가 이 위에 선다)
- test mode: tdd
- 예정 check IDs: account-state-integration, dormant-reactivation-e2e, account-status-audit (index에 기획 시점 기록 완료)

## Requirements

### 범위와 비목표

- 범위: ① `profiles.inactivity_anchor_at` 신설·backfill·`approve_signup` 재정의 마이그레이션 + 전이 함수 3종(관리자 수동 휴면·관리자 재활성화·본인 재활성화) + pgTAP ② 상태 전이 표의 정본 선언(P1-T02가 예약한 소유권 이행) ③ `/dormant` 화면(상태·자동 탈퇴 예정일·본인 재활성화)과 `/departed` 정적 안내 화면 + 게이트 분기 추가 ④ 관리자 근무자 상세(P1-T05)에 수동 휴면·재활성화 액션 편입 ⑤ E2E·pgTAP 확장.
- 비목표(기획 승인 그대로): 3개월·1년 예약 배치와 자동 전이 실행(P7-T01), 탈퇴 연쇄 처리·vault(P7-T01), 신청·배정 차단 조건 세부(스케줄 도메인 부재 — 구조적 차단은 effective_roles가 이미 소유), 체크아웃 예외(출퇴근 결정), 일시 정지 상태 신설(dormant 사용). 설계 비목표: P1-T03~T05 산출물의 의미 변경(approve_signup 재정의는 anchor 세팅 추가만 — 기존 로직 불변).

### 불변 규칙

- **상태 전이의 정본은 이 RADIO의 전이 표다**(Data model 절). 전이 실행은 SECURITY DEFINER 함수만 소유하고(P1-T03 확립 패턴: `is_admin`/본인 검사 → `for update` 잠금 → 상태 검증(부적합은 전용 SQLSTATE) → 전이 + 감사 원자 기록), profiles에 update RLS 정책을 만들지 않는다.
- **인정 활동 시각(`inactivity_anchor_at`)의 갱신 사건은 DOMAIN이 정한 세 가지뿐이다**: 정상 저장된 출근 신청(P5 소유), 최초 활성 승인(`approve_signup` 재정의로 이번에 구현), 재활성화(본인·관리자). 관리자의 수동 휴면과 로그인은 갱신하지 않는다. backfill은 PRD 유예 규칙대로 기존 active 계정에 마이그레이션 적용 시각을 넣는다.
- 재활성화·수동 휴면은 사유를 요구하지 않고 변경 전후 상태·행위자·시각을 `identity_audit_logs`에 남긴다(이벤트 z.enum 정본 확장 2종). 동시 요청은 행 잠금으로 직렬화되고 상태 부적합(이미 active인 대상 재활성화 등)은 전용 SQLSTATE로 거부되어 멱등하게 수렴한다.
- 비활성 사용자의 업무 mutation 차단은 `effective_roles()`(활성 아니면 빈 배열)가 이미 구조로 보장한다 — 이 task는 그 사실을 dormant 주체 pgTAP으로 단언하고(anon 주체 포함 — P1-T05 교훈), 새 차단 계층을 발명하지 않는다.
- 게이트 확장: dormant × 보호 경로 → `/dormant` · departed × 보호 경로 → `/departed`. 기존 무프로필·pending·rejected·active 판정은 불변. 함수 실행 권한은 본인용만 authenticated 허용, 나머지는 내부 검사 + anon 거부 pgTAP(P1-T05 교훈).
- 자동 탈퇴 예정일 = `inactivity_anchor_at` + 1년(한국 시간 달력 기준, PRD ACCT-CLEANUP-01)의 **표시 전용 파생**이다 — 저장하지 않고 순수 함수가 계산하며, 실제 자동 처리는 P7-T01 소유. KST 달력 계산은 순수 함수 + 경계 단위 테스트(연말·윤년)로 고정한다.
- Server Action 실패는 typed Result + 기존 레지스트리 재사용 우선(전이 부적합의 사용자 문구가 기존 코드로 부족하면 1종만 신설).
- 기존 E2E·pgTAP 의미 불변. dormant·departed 픽스처 추가로 기존 단언이 갱신될 수 있는 곳(게이트 분기 수 등)은 의미 보존 갱신만 허용. 방어 CHECK 도입으로 기존 service role 픽스처의 active·dormant insert(pgTAP 04·07·08·09, E2E 시딩·global-setup)에 `inactivity_anchor_at` 값 추가가 필요하다 — 단언 무변경의 의미 보존 갱신이다. 06-profiles-signup의 42501 단언(본인 active insert 거부)은 RLS with-check가 테이블 제약보다 먼저 평가되므로 불변이다.

### 기술 인수 조건

1. `inactivity_anchor_at`이 신설되고, 기존 active 계정은 마이그레이션 시각으로 backfill되며, 승인(`approve_signup`) 시각이 새 계정의 anchor로 기록된다(pgTAP).
2. 관리자가 근무자 상세에서 active 근무자를 수동 휴면(dormant)할 수 있고, anchor는 변하지 않으며, 감사 이벤트(행위자·대상·전후 상태·시각)가 남는다. 대상 사용자는 다음 요청부터 모든 보호 경로에서 `/dormant`로 보내지고 업무 mutation이 서버·DB 양쪽에서 거부된다.
3. dormant 본인이 `/dormant`에서 상태와 자동 탈퇴 예정일(anchor+1년, KST 달력)을 보고 재활성화할 수 있으며, 재활성화 시 anchor가 서버 시각으로 갱신되고 감사가 남고 홈으로 복귀한다. 관리자 재활성화도 같은 효과다.
4. 상태 부적합 전이(이미 active인 재활성화, dormant가 아닌 수동 휴면 등)는 전용 SQLSTATE로 거부되어 상태·감사 무변화이며, 동시 요청은 행 잠금으로 먼저 완료된 것만 유효하다.
5. departed 사용자는 모든 보호 경로에서 `/departed` 정적 안내 화면으로 보내진다(재활성화 버튼 없음, 문의 문구 재사용).
6. 전이 함수의 anon·비관리자·본인 아님 호출이 pgTAP으로 거부 단언되고(anon 주체 필수), dormant 주체의 기존 업무 함수(시급·포지션·승인 류) 호출 거부도 단언된다.
7. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과. 기존 E2E가 계속 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 anchor 도입 | 테스트함 — backfill 값·승인 시 기록 pgTAP | 테스트함 — 비활성 상태의 anchor null 허용(CHECK 투영) | 테스트함 — 정책 유예 규칙(기존 active = 적용 시각) 단언 | 해당 없음 — 컬럼 도입은 주체 분기가 없다 | 해당 없음 — backfill은 1회 멱등 마이그레이션이다 | 해당 없음 — 마이그레이션은 단일 트랜잭션이다 |
| 2 수동 휴면 | 테스트함 — 휴면→차단·감사·anchor 불변 pgTAP·E2E | 테스트함 — active 아닌 대상 거부(전용 SQLSTATE) | 테스트함 — anchor 불변을 값 비교로 단언 | 테스트함 — 비관리자·anon 호출 거부 pgTAP | 테스트함 — 재호출이 상태 부적합 거부로 수렴 | 테스트함 — 동시 휴면·재활성화 중 선행만 유효(행 잠금) pgTAP |
| 3 재활성화 | 테스트함 — 본인·관리자 재활성화→active·anchor 갱신·감사·홈 복귀 E2E | 테스트함 — RPC 실패 시 dormant 유지·화면 오류 안내 | 테스트함 — anchor 갱신이 서버 시각임을 전후 비교로 | 테스트함 — 타인 본인용 함수 호출 거부·anon 거부 pgTAP | 테스트함 — 재호출이 부적합 거부로 멱등 수렴 | 해당 없음 — 2행 동시성이 휴면·재활성화 경합을 소유한다 |
| 4 부적합 전이 | 테스트함 — 각 부적합 조합의 전용 SQLSTATE 거부 pgTAP | 테스트함 — 거부 경로의 상태·감사 무변화 단언 | 테스트함 — 전이 표 밖 조합(pending 재활성화 등) 전부 거부 | 해당 없음 — 권한은 2·3행이 소유한다 | 테스트함 — 거부 응답의 반복 일관성 | 해당 없음 — 2행이 소유한다 |
| 5 departed 화면 | 테스트함 — departed 픽스처의 /departed 렌더·게이트 단위 테스트 | 테스트함 — 보호 경로 전부에서 /departed 리다이렉트 | 테스트함 — 재활성화 경로 부재(버튼·함수 허용 없음) | 테스트함 — 차단이 서버 경계임을 E2E로 | 해당 없음 — 리다이렉트는 멱등 GET이다 | 해당 없음 — 요청별 독립 판정이다 |
| 6 구조적 차단 | 테스트함 — dormant 주체의 업무 함수·조회 거부 pgTAP | 테스트함 — effective_roles(dormant)=빈 배열 단언(기존 07 확장) | 테스트함 — 예정일 KST 달력 계산의 연말·윤년 경계 단위 테스트 | 테스트함 — anon 주체 전이 함수 거부 pgTAP | 해당 없음 — 판정은 상태를 만들지 않는다 | 해당 없음 — 요청별 독립 판정이다 |
| 7 회귀 | 테스트함 — verify 전체·db:test 통과 | 테스트함 — 기존 E2E(가입·승인·역할·근무자 관리) 통과 | 테스트함 — 게이트 분기 확장 후 기존 상태 판정 불변 단언 | 해당 없음 — 시나리오별 권한은 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — E2E는 격리 세션을 쓴다 |

- 보충: 자동 전이(1년 경과)의 실행·판정은 P7-T01 소유라 이 표에 없다. 예정일 표시는 파생 계산의 정확성만 이 task가 검증한다.

### DEV-* 적용 상태

- `DEV-SEC`·AC-12: 전이 권한은 서버(require 헬퍼)와 DB(DEFINER 내부 검사 + 정책 부재) 이중 강제, anon 경계 pgTAP 필수(P1-T05 교훈).
- `DEV-SSOT-01`: 전이 표는 이 RADIO Data model이 정본. anchor 갱신 사건 집합은 DOMAIN이 정본이고 구현은 투영. 예정일 계산은 순수 함수 한 곳.
- `DEV-ERR-01`·`DEV-ERR-08`: typed Result + 레지스트리 재사용 우선, 전용 SQLSTATE(P1-T05 확립 LB 대역 연장).
- `DEV-CODE-08`·`DEV-CODE-09`·`DEV-ARCH-06`: 화면은 서버 컴포넌트 + 액션 배선 leaf, KST 계산·전이 판정은 model.
- `DEV-TEST-01`: 위 렌즈 표. tdd.json 실제 시각(gate:tdd 기계 검사 가동 중).

## Architecture

- `supabase/migrations/<ts>_identity_dormancy.sql`:
  - `profiles`에 `inactivity_anchor_at timestamptz null` + 방어 CHECK(`status in ('active','dormant')이면 not null`) + backfill(`status='active'`에 마이그레이션 시각).
  - `approve_signup` 재정의(create or replace — P1-T03 마이그레이션 파일 무수정): 기존 로직 불변 + active 전환 시 `inactivity_anchor_at = now()` 추가.
  - 전이 함수 3종(SECURITY DEFINER, `for update`, 전용 SQLSTATE `LB01x` 대역, 실변경 시 감사): `deactivate_worker(target)`(관리자, active→dormant, anchor 불변) · `reactivate_worker(target)`(관리자, dormant→active, anchor=now()) · `reactivate_own_profile()`(무인자, auth.uid() 본인, dormant→active, anchor=now()). 본인용만 authenticated 실행 허용, 관리자용은 내부 검사 + 실행 권한 통제, 전부 anon 거부(P1-T05 F-03·F-12 교훈 — 3치 논리 금지, null actor 명시 거부).
- `supabase/tests/10-dormancy.test.sql`(pgTAP): 인수 조건 1~4·6 단언(anon 주체 포함). `07-roles.test.sql`: dormant 사례 확장이 필요하면 의미 보존 갱신. CHECK 파급 픽스처 보정: `04`·`07`·`08`·`09`의 active·dormant insert와 `tests/e2e/` 시딩(admin insert·global-setup upsert)에 anchor 값 추가 — 단언은 건드리지 않는다.
- `src/entities/identity/model/profile-gate.ts`: dormant→`/dormant`·departed→`/departed` 판정 추가. `model/dormancy.ts`(신규): 자동 탈퇴 예정일 KST 달력 계산 순수 함수 + 전이 부적합 코드 매핑 — 단위 테스트.
- `src/entities/identity/model/audit-event.ts`: `profile_dormanted`·`profile_reactivated` 추가(10→12종).
- `src/features/reactivation/`: `api/reactivate-own.ts`(Server Action — 세션 확인 후 본인 RPC), `hooks/`, `ui/ReactivateButton.tsx`(leaf).
- `src/features/worker-management/`: `api/deactivate-worker.ts`·`reactivate-worker.ts`(requireAdmin + UUID Zod 검증 + RPC + revalidate — 실패 분기 포함, P1-T03 F-06 교훈), `ui/` 상태 액션 leaf. `src/views/admin/ui/WorkerDetailView.tsx`: 상태 표시·수동 휴면/재활성화 액션 편입.
- `src/views/dormant/ui/DormantView.tsx`: 상태 안내 + 자동 탈퇴 예정일(파생) + ReactivateButton. `src/views/departed/ui/DepartedView.tsx`: 정적 안내(문의 문구 재사용, 버튼 없음). `src/app/dormant/page.tsx`·`departed/page.tsx`(onboarding·pending 배치 패턴).
- `src/shared/config/auth-routes.config.ts`: `/dormant`·`/departed` 상수.
- `tests/e2e/dormancy.spec.ts`: 수동 휴면→대상 즉시 차단·본인 재활성화 완주·departed 안내·관리자 재활성화.

## Data model

- **상태 전이 표(정본)**: `pending→active`(승인, P1-T03) · `pending→rejected`(거절, P1-T03) · `active→dormant`(관리자 수동 휴면[이 task]·1년 자동[P7-T01]) · `dormant→active`(본인·관리자 재활성화[이 task]) · `active|dormant→departed`(탈퇴·자동 정리, P7-T01) · `pending|rejected→(삭제)`(3개월 완전 삭제, P7-T01). 그 외 조합은 존재하지 않으며 함수가 거부한다.
- `inactivity_anchor_at`은 자동 처리(P7)의 기준 시각 저장이고, 자동 탈퇴 예정일은 저장하지 않는 표시 파생이다.
- 감사 detail은 `{ before, after }` 상태만 — PII 없음, 사유 없음(기획 확정).

## Interface

- `/dormant`: 휴면 안내 + "자동 탈퇴 예정일: YYYY년 M월 D일"(KST) + `다시 활동하기` 버튼 + 문의 문구. 재활성화 성공 시 홈으로.
- `/departed`: 탈퇴 안내 + 문의 문구. 행동 없음.
- 관리자 근무자 상세: 상태 뱃지 옆 수동 휴면(active일 때)·재활성화(dormant일 때) 액션, 확인 다이얼로그 1단계, 결과 스낵바.
- 오류 표시: 전부 레지스트리 문구, 원문 미노출.

## Optimizations

- 전이는 단건 RPC 1회, 예정일은 이미 조회한 anchor의 클라이언트 무관 서버 계산이다. 신규 조회 추가 없음.

## 변경 허용 경로

```
src/app/**
src/views/dormant/**
src/views/departed/**
src/views/admin/**
src/features/reactivation/**
src/features/worker-management/**
src/entities/identity/**
src/shared/lib/**
src/shared/config/**
supabase/migrations/**
supabase/tests/**
tests/**
docs/execution/radio/P1-T06-radio.md
docs/execution/runs/P1-T06/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- `/dormant`·`/departed` 화면 문구는 구현이 초안을 작성하고 사용자가 검증 단계에서 확인한다(관리자 화면 디자인 정본 부재 이월과 동일). 결정 주체: 사용자.
- KST 달력 1년 계산이 DEV-TIME 계열 공통 규칙 후보다(메모리 pending-timezone-boundaries — P2 스케줄·P4 알림 설계 때 규칙 승격 재론).
