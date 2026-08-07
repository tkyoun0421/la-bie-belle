# P1-T05 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07 (revision 2는 사용자 재량 없는 위계 보정 — 아래 개정 이력)

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 기획 확정(기본 포지션 개인 제외 불가·시급 기본값 파생·본인은 휴대폰과 시급만 수정·PRD 80행 개정 동반) 반영. 봉인 전 P1-T04 구현(e55cb7b)과 대조 완료 — DEFINER 쓰기 패턴·/admin 셸·requireAdmin 일치, 감사 이벤트 z.enum 정본은 P1-T03이 신설하므로 이 task는 그 정본을 확장한다. check ID는 index 정본(staff-management-integration·sensitive-response-scan)에 맞췄다. P1-T03 구현 확정과 어긋나는 것이 발견되면 정정 후 재봉인한다. |
| 2 | 2026-08-07 | 구현 전 [질문]으로 발견된 설계 공백 보정: `positions`·`venue_settings`는 P0-T03이 "정책 0개·읽기 0행"으로 봉인했는데 이 task의 상세·내 정보 화면이 두 테이블(포지션 목록·기본 시급)을 사용자 세션으로 읽어야 한다. DEV-SEC 이중 강제와 기존 정본 구조(RLS가 유일 접근 통제, service role은 bootstrap 전용, 우회 읽기 DEFINER 패턴 부재)가 답을 정하므로 두 테이블에 **활성 근무자 SELECT 정책**을 추가하고 P0-T03의 `04-rls-default-deny` 단언을 새 상태로 갱신한다(P1-T04의 05 정책 개수 갱신 전례와 동일 패턴). 허용 범위는 PRD 77행("승인 대기는 프로필 작성·상태 확인만")이 정한다 — 활성부터. 사용자 재량 없는 위계 보정, 렌즈 표 8행 동반 갱신. |

- 관련 spec: PRD:AC-12, DOMAIN:IDENTITY, ADR:0002
- 적용 깊이: 심화 (PII·시급 수정 경로와 positions 참조 무결성의 최초 확립)
- test mode: tdd
- 예정 check IDs: staff-management-integration, sensitive-response-scan (index에 기획 시점 기록 완료)

## Requirements

### 범위와 비목표

- 범위: ① `hourly_wage` 컬럼·`worker_position_eligibilities` 테이블(첫 positions 참조, `ON DELETE RESTRICT`)·수정 SECURITY DEFINER 함수군·감사 이벤트 마이그레이션 + pgTAP ② 관리자 근무자 목록(검색·상태 필터)·상세(개인정보·시급·가능 포지션 조회·수정) 화면 ③ 본인 "내 정보" 화면(휴대폰·시급 수정, 나머지 표시만) ④ 기본 포지션 파생 보호(기본 포지션 eligibility 저장을 DB가 거부) ⑤ P0-T03 이월 포지션 삭제 차단 검증 ⑥ E2E·pgTAP 확장.
- 비목표(기획 승인 그대로): 기본 포지션 개인 제외, 이름·성별·생년월일 본인 수정, 목록 페이지네이션, 교육생(P3), 배정 후보 계산·파생 소비(P3), 예상 급여 계산(P6), 휴면 전이(P1-T06), 탈퇴 vault·내부 근무자 ID(P7-T01). 설계 비목표: P1-T03·T04 산출물 수정(소비만), positions 테이블 스키마 변경.

### 불변 규칙

- 쓰기는 SECURITY DEFINER 함수 경유만 존재한다(P1-T04 확립 패턴). profiles·eligibilities에 update·insert·delete RLS 정책을 만들지 않는다. 각 함수는 권한 확인(관리자 또는 본인)과 감사 기록을 한 트랜잭션에 묶는다.
- 개인 시급은 관리자와 본인이 수정한다(PRD 80행 개정 — 기획 승인, 조정자가 경계 커밋으로 개정). 가능 포지션은 관리자만 수정한다(불변). 이름·성별·생년월일은 관리자만 수정한다.
- 기본 포지션(안내·매니저·축가)의 가능 상태는 저장하지 않는 파생이다(PRD 150행, P1-T03 확립 원칙). `worker_position_eligibilities`는 비기본 포지션의 추가 부여만 저장하며, 기본 포지션 행 저장 시도는 DB 트리거가 거부한다 — 파생 정본의 이중 표현을 구조로 차단한다.
- `worker_position_eligibilities.position_id`는 `ON DELETE RESTRICT`다 — 쓰인 포지션의 삭제가 DB에서 차단되고 비활성화만 가능하다(PRD 148행, ARCHITECTURE 규약 최초 적용, P0-T03 이월 검증 포함).
- 민감 필드(시급·개인정보)는 관리자 조회와 본인 조회에만 나타난다. 일반 근무자용 목록·조회 응답 어디에도 타인의 민감 필드가 포함되지 않는다(PRD 221행) — RLS(`profiles_select_admin` + 본인 select)와 조회 모듈의 select 목록 양쪽에서 강제한다.
- 휴대폰 수정은 P1-T02의 정규화·형식 검증·unique 계약을 그대로 재사용한다(중복 시 `IDENTITY_PHONE_TAKEN`).
- 시급 변경·개인정보 변경·가능 포지션 부여·회수는 전부 `identity_audit_logs`에 이벤트를 남긴다(급여 분쟁 추적 — 기획 확정). detail에 변경 전·후 값을 담되 다른 PII 필드는 담지 않는다.
- Server Action 실패는 `{ ok: false, code, fieldErrors? }`(레지스트리)다. 신설 코드는 검증 계열 재사용을 우선하고 최소로 한다.

### 기술 인수 조건

1. 관리자가 `/admin/workers`에서 근무자 목록(이름 검색·상태 필터, 기본 active)을 보고 상세로 진입한다. 비관리자는 목록·상세 접근이 서버·DB 양쪽에서 거부된다.
2. 관리자가 상세에서 개인정보(이름·성별·생년월일·휴대폰)와 시급을 수정할 수 있고, 각 수정은 감사 이벤트(처리자·대상·전후 값)를 남긴다. 휴대폰 중복은 전용 코드로 거부된다.
3. 본인이 "내 정보"에서 자신의 휴대폰과 시급을 수정할 수 있고(감사 동반), 이름·성별·생년월일은 표시만 된다. 타인 프로필에 대한 같은 호출은 거부된다.
4. 일반 근무자의 어떤 조회 경로에도 타인의 시급·개인정보가 포함되지 않는다(RLS pgTAP + 응답 형태 단위 테스트).
5. 관리자가 비기본 포지션을 부여·회수할 수 있고(감사 동반), 기본 포지션의 eligibility 저장 시도는 DB 트리거가 거부하며, 부여·회수는 즉시 상세 화면에 반영된다.
6. eligibility에 쓰인 포지션의 delete가 DB에서 차단되고(RESTRICT) 비활성화만 가능하다 — P0-T03 이월 검증을 pgTAP으로 수행한다.
7. 시급 미설정 근무자의 표시가 기본 시급(venue_settings) 파생임을 관리자 상세·내 정보 화면이 구분해 보여준다(파생 표기 — 저장값 아님).
8. `pnpm verify` 전체와 `pnpm db:reset && pnpm db:test` 통과. 기존 E2E·pgTAP이 계속 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 목록·상세 | 테스트함 — admin 목록·검색·필터·상세 진입 E2E | 테스트함 — 비관리자 접근이 홈 리다이렉트·조회 RLS 빈 결과 | 테스트함 — 검색 결과 0명·필터별 렌더 | 테스트함 — 목록 조회가 admin 정책 하에서만 성립 pgTAP | 해당 없음 — 조회는 상태를 만들지 않는다 | 해당 없음 — 요청별 독립 조회다 |
| 2 관리자 수정 | 테스트함 — 각 필드 수정→저장→감사 행 pgTAP·E2E | 테스트함 — 휴대폰 중복이 전용 코드로 거부·상태 무변화 | 테스트함 — 시급 0·음수 거부, 형식 위반 fieldErrors | 테스트함 — 일반 근무자의 함수 직접 호출 예외 pgTAP | 테스트함 — 같은 값 재수정이 멱등(감사 중복 없음) | 테스트함 — 동시 수정은 후행 값이 유효하고 감사가 순서를 보존 pgTAP |
| 3 본인 수정 | 테스트함 — 본인 휴대폰·시급 수정 완주 E2E | 테스트함 — 타인 대상 호출이 거부 | 테스트함 — 이름·성별·생년월일 수정 경로 부재(함수 시그니처가 소유) | 테스트함 — 본인 판정이 auth.uid() 기준임을 pgTAP으로 | 테스트함 — 중복 휴대폰 재제출 일관 거부 | 해당 없음 — 본인 단건 수정은 2행 동시성 규칙과 같다 |
| 4 민감 필드 차단 | 테스트함 — 일반 근무자 조회 응답에 타인 필드 부재 단위 테스트 | 테스트함 — 타인 행 select가 RLS로 빈 결과 pgTAP | 테스트함 — 관리자·본인·타인 3주체 응답 형태 대조 | 테스트함 — service role 없이 사용자 경로로 검증 | 해당 없음 — 조회는 상태를 만들지 않는다 | 해당 없음 — 요청별 독립 판정이다 |
| 5 포지션 부여·회수 | 테스트함 — 비기본 부여→상세 반영→회수 E2E·pgTAP | 테스트함 — 기본 포지션 저장 시도를 트리거가 거부 pgTAP | 테스트함 — 비활성 포지션 부여 거부, 이미 부여된 행 재부여 멱등 | 테스트함 — 일반 근무자 부여 시도 예외 pgTAP | 테스트함 — 회수 재호출 무변화 수렴 | 테스트함 — 동시 부여가 PK로 단일 행 수렴 pgTAP |
| 6 삭제 차단 | 테스트함 — 쓰인 포지션 delete가 RESTRICT로 실패 pgTAP | 테스트함 — 실패 후 행·참조 무변화 단언 | 테스트함 — 안 쓰인 포지션 delete는 허용(시스템 포지션 보호 트리거 제외) | 해당 없음 — DB 무결성 규약이라 주체 분기가 없다 | 해당 없음 — 제약 위반은 상태를 바꾸지 않는다 | 해당 없음 — FK 제약이 원자적으로 강제한다 |
| 7 시급 파생 표기 | 테스트함 — 미설정자 화면이 기본 시급 파생 표기 단위 테스트 | 테스트함 — 설정자에게 저장값 표기(파생 표기 부재) | 테스트함 — 기본 시급 자체는 venue_settings 단일 행 조회 | 테스트함 — 파생 표기가 본인·관리자 화면에만 존재 | 해당 없음 — 표시 계층 판정이다 | 해당 없음 — 표시 계층 판정이다 |
| 8 회귀 | 테스트함 — verify 전체·db:test 통과 | 테스트함 — 기존 E2E(가입·게이트·역할·승인) 통과 | 테스트함 — 04 rls-default-deny 단언을 새 정책 상태로 갱신(pending·익명 0행 유지 단언 포함)하고 그 외 기존 pgTAP 무갱신 통과 | 해당 없음 — 시나리오별 권한은 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — E2E는 격리 세션을 쓴다 |

- 보충: 수정 경합은 행 잠금 없이 "후행 값 유효 + 감사 순서 보존"으로 정의한다(계정 생애를 바꾸는 전이가 아니라 필드 값 갱신이므로 PRD 103행의 잠금 계약 대상이 아니다). 잠금이 필요한 전이는 P1-T03·T06이 소유한다.

### DEV-* 적용 상태

- `DEV-SEC`·AC-12: 수정 권한(관리자·본인)은 서버(require 헬퍼)와 DB(함수 내부 검사 + 정책 부재) 이중 강제. 민감 필드는 RLS와 select 목록 양쪽 차단.
- `DEV-SSOT-01`: 가능 포지션의 실효 집합 = 기본 파생 + 저장 부여 — 파생 정본은 positions.is_default, 저장 정본은 eligibilities. 두 정본의 겹침을 트리거가 구조로 차단한다.
- `DEV-ERR-01`·`DEV-ERR-08`: 검증·중복 코드는 기존 레지스트리(IDENTITY_VALIDATION·IDENTITY_PHONE_TAKEN·COMMON_FORBIDDEN) 재사용 우선.
- `DEV-CODE-08`·`DEV-CODE-09`·`DEV-ARCH-06`: 목록·상세는 서버 컴포넌트, 편집 폼·버튼만 client leaf. 검증은 entities model(Zod), 시급 상한 등 업무 상수는 shared/config.
- `DEV-TEST-01`: 위 렌즈 표. tdd.json은 실제 실행 시각만.

## Architecture

- `supabase/migrations/<ts>_identity_worker_management.sql`:
  - `profiles`에 `hourly_wage integer null check (hourly_wage > 0)` 추가.
  - `worker_position_eligibilities(profile_id fk→profiles on delete cascade, position_id fk→positions **on delete restrict**, granted_at, granted_by fk→profiles, primary key(profile_id, position_id))`, RLS enable — select: admin 정책 + 본인 행 정책, 쓰기 정책 없음.
  - `positions`·`venue_settings`에 활성 근무자 SELECT 정책 추가(revision 2 — `effective_roles()` 소비, 행별 재평가를 피하는 형태는 구현 판단). 쓰기 정책은 계속 없음. `supabase/tests/04-rls-default-deny.test.sql`의 정책 0개·0행 단언을 새 상태(활성 근무자 읽기 허용·pending과 익명 0행 유지)로 갱신한다.
  - 트리거 `reject_default_position_eligibility`: insert 대상 position이 `is_default`면 예외.
  - SECURITY DEFINER 함수군(authenticated 실행 허용, 내부 검사가 거부): `update_worker_info(target, …)`(관리자) · `set_hourly_wage(target, wage)`(관리자 또는 본인) · `update_own_phone(phone)`(본인) · `grant_position_eligibility(target, position)`·`revoke_position_eligibility(target, position)`(관리자, 비활성 포지션 거부). 각 함수는 실변경 시 감사 이벤트(`worker_info_updated`·`hourly_wage_updated`·`phone_updated`·`position_granted`·`position_revoked`, 전후 값 detail) insert.
- `supabase/tests/09-worker-management.test.sql`(pgTAP): 인수 조건 2~6 단언(P0-T03 이월 RESTRICT 검증 포함).
- `src/entities/identity/model/worker-update.ts`: 휴대폰(기존 normalizePhone 재사용)·시급(양수·상한 상수)·개인정보 Zod 스키마 — 단위 테스트. `model/wage.ts`: 기본 시급 파생 표기 판정 순수 함수.
- `src/entities/identity/api/list-workers.ts`·`find-worker-detail.ts`(server-only, admin 정책 하 조회 — 검색·필터 파라미터), `find-own-worker-info.ts`(본인 내 정보 조회 — 시급·기본 시급 포함).
- `src/features/worker-management/`(관리자): `api/`(update-worker-info·set-hourly-wage·grant-position·revoke-position — `requireAdmin` 첫 줄), `hooks/`, `ui/`(편집 폼·포지션 토글 client leaf).
- `src/features/my-profile/`(본인): `api/`(update-own-phone·set-own-wage — `requireActiveProfile` 첫 줄), `hooks/`, `ui/`(내 정보 편집 leaf).
- `src/app/(protected)/admin/workers/page.tsx`·`workers/[id]/page.tsx`(P1-T04 셸 아래). `src/app/(protected)/my-profile/page.tsx`. `admin/page.tsx`: 근무자 관리 진입 링크 추가.
- `src/views/admin/ui/WorkerListView.tsx`·`WorkerDetailView.tsx`, `src/views/my-profile/ui/MyProfileView.tsx`(서버 컴포넌트 + leaf 조립). `src/views/more/ui/MoreView.tsx`: 내 정보 진입 링크.
- `src/shared/config/auth-routes.config.ts`: `/admin/workers`·`/my-profile` 상수. `src/shared/config/wage.config.ts`: 시급 상한 상수(전역 업무 상수 — DEV-CODE-08).
- `tests/e2e/worker-management.spec.ts`: 관리자 수정 완주·본인 수정 완주·비관리자 차단·민감 필드 부재.

## Data model

- 실효 가능 포지션 = `positions.is_default`(성별 조건 필터) ∪ `worker_position_eligibilities` — 겹침 없음(트리거 보장). 소비(배정 후보)는 P3 소유, 이 task는 저장·표시만.
- 시급 표시값 = `hourly_wage ?? venue_settings.default_hourly_wage`(파생 표기 동반). 저장은 명시 설정만.
- 감사 detail은 `{ field, before, after }` 형태로 변경 사실만 담는다 — 변경 대상 외 PII는 담지 않는다.
- 앱 감사 이벤트 z.enum에 5종 추가(P1-T03이 신설하는 정본의 확장).

## Interface

- `/admin/workers`: 검색(이름)·상태 필터 칩(기본 active)·행 진입. 상세: 개인정보·시급(파생 표기)·가능 포지션(기본 3종은 "기본 적용" 뱃지, 비기본은 토글). 처리 결과 스낵바.
- `/my-profile`: 이름·성별·생년월일 표시, 휴대폰·시급 편집(저장 시 검증 오류 인라인). 시급 미설정이면 "기본 시급 적용 중" 표기.
- 관리자 화면 디자인 정본 부재 — 기존 토큰·`shared/ui` 최소 구성(P1-T04·T03 미결과 동일).
- 오류 표시: 전부 레지스트리 문구, 원문 미노출.

## Optimizations

- 목록은 status 필터 단일 조회, 상세는 단건 + eligibilities 조인 1회다. 페이지네이션·캐시는 규모 근거가 생길 때까지 도입하지 않는다.

## 변경 허용 경로

```
src/app/**
src/views/admin/**
src/views/my-profile/**
src/views/more/**
src/features/worker-management/**
src/features/my-profile/**
src/entities/identity/**
src/shared/lib/**
src/shared/config/**
supabase/migrations/**
supabase/tests/**
tests/**
docs/execution/radio/P1-T05-radio.md
docs/execution/runs/P1-T05/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- P1-T03·T04 구현이 봉인 계약과 다르게 확정되면 정정 후 재봉인한다 — 봉인 시점에 두 task의 handoff와 대조한다.
- 시급 상한 상수의 값(예: 100,000원)은 구현이 제안하고 사용자가 검증 단계에서 확인한다. 결정 주체: 사용자.
- 관리자 목록 검색 기준(이름 단일 vs 이름+휴대폰)은 구현이 이름 단일로 시작하고 필요하면 후속 task가 확장한다.
