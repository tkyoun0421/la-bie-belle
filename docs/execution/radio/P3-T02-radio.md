# P3-T02 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-09
- 개발 설계 승인: user, 2026-08-09

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-09 | 최초 작성. 기획 확정(준비 화면 첫 진입 복사·새 포지션 확정 전 강제 반영·확정 스케줄 알림 후 수동·삭제 판정에 필요 인원 포함·기본 포지션 전원 파생·관리자 전용)을 반영. 설계 인터뷰 확정 2건 — 강제 반영은 DB 트리거, 확정 스케줄 안내는 준비 화면 배너까지(추가 시점 모달은 P3-T06). |
| 2 | 2026-08-09 | 착수 스코프 갭 해소 재봉인(사용자 승인, 파일 한정). 범위 ④가 커밋한 admin 허브 진입 링크의 실제 위치가 `src/app/(protected)/admin/page.tsx`(허브 링크 인라인 나열)인데 허용 경로가 이 파일을 커버하지 않았다 — 한 파일을 링크 1개 추가 용도 한정으로 편입하고 Architecture 표기를 실제 위치로 정정. 설계 실질 무변경(P1-T04 rev2·P2-T05 rev3 전례). |

- 관련 spec: PRD 4장(포지션)·7장(필요 인원과 배정), PRD:AC-03·AC-04, DOMAIN:SCHEDULING, ADR:0003
- 적용 깊이: 심화 (권한·DB 스키마·트리거 강제)
- test mode: tdd
- 예정 check IDs: position-migration(스키마·정책·트리거 pgTAP), staffing-snapshot(복사·강제 반영·불변 확인 통합)

## Requirements

### 범위와 비목표

- 범위: ① 마이그레이션 1개 — `schedule_position_requirements` 테이블, admin 전용 RLS, `positions` admin mutation 정책 추가, 복사·수정·삭제 DEFINER 함수와 감사, positions insert 강제 반영 트리거 ② 포지션 관리 화면(`/admin/positions`) — 목록·추가·수정·비활성화·삭제 ③ 준비 화면(`/admin/schedule/[id]`)에 필요 인원 절 추가 — 첫 진입 복사, 표 표시·수정, 미포함 활성 포지션 배너+추가 ④ admin 허브 진입 링크 1개 ⑤ pgTAP·unit·E2E.
- 비목표(기획 그대로): 배정·자격 검사(P3-T03~05), 확정 트랜잭션·revision(P3-T06 — 확정 스케줄 수동 추가 개방과 추가 시점 목록 모달 포함), 근무자 노출(P3-T07), 시간대별 포지션. 설계 비목표: 기본 포지션 파생 구조 변경 없음(P1 소유 — reject_default_position_eligibility 트리거 무수정), P3-T01 산출물 수정은 준비 화면에 필요 인원 절을 붙이는 최소 범위(page 조회 추가 + 절 컴포넌트 배치) 한정, 기존 예식 편집 흐름 무수정.

### 불변 규칙

- **표의 정본 이원화(승인 설계)**: 포지션 구조(이름·성별 조건·활성·기본 여부)의 정본은 `positions`이고 표는 FK로 참조만 한다. 인원값(`required_count`)의 정본은 스케줄별 표다 — 전역 기본 인원수 변경은 이미 복사된 스케줄에 전파하지 않는다.
- **복사는 멱등이다**: 준비 진입 시 표가 없으면 그 시점 활성 포지션의 기본 인원수로 생성하고, 있으면 아무것도 하지 않는다. 동시 진입은 `on conflict do nothing`으로 한 번만 생성된다.
- **새 포지션 강제 반영은 DB 트리거가 소유한다**: `positions` insert 시 트리거가 확정 전(CONFIRMED·CANCELLED 제외) 스케줄 중 표가 이미 있는 스케줄에 새 행을 기본 인원수로 추가한다. 실패는 포지션 추가 전체를 롤백한다. 활성(is_active) 포지션만 반영한다.
- **수정 함수는 확정·취소를 거부한다**: `CONFIRMED`·`CANCELLED` 스케줄의 표 변경은 함수가 거부한다(`SCHEDULING_STATUS_CONFLICT` 매핑). 확정 스케줄 개방은 P3-T06 revision 소유다. 비활성 포지션은 신규 행 추가만 거부하고 기존 행 수정·삭제는 허용한다. `required_count >= 0`(0 = 그날 미운영).
- **삭제 판정은 FK가 최종 강제한다**: `schedule_position_requirements.position_id`는 `on delete restrict`다. 삭제 시도의 FK 위반은 화면에서 "사용 중 — 비활성화 안내"로 매핑한다. 시스템 포지션(팀장) 보호는 P0-T03 트리거가 소유한다.
- 권한: 포지션 mutation과 표의 select·mutation은 admin 전용이다(RLS + 함수 `is_admin` 이중). `positions`의 근무자 select 정책(P1)은 그대로 둔다. ui는 api를 import하지 않고 page가 Action을 주입한다(관례).
- 감사: 복사(`requirements_copied`)·행 변경(`requirement_set`·`requirement_removed`)·트리거 반영(`requirement_position_added`)은 `scheduling_audit_logs`에 스케줄당 1행(PII 없는 detail, 변경 전후 값 병기 — P3-T01 F-05 교훈). 같은 값 재저장은 무변경·감사 0행. 포지션 자체 CRUD는 전역 설정으로 감사 대상이 아니다(check_in_rules 선례).

### 기술 인수 조건

1. 마이그레이션: `schedule_position_requirements`(schedule_id FK, position_id FK restrict, required_count int ≥0, unique(schedule_id, position_id)), admin 전용 RLS(select 포함), `positions` admin mutation 정책(insert·update·delete) — pgTAP.
2. `copy_schedule_requirements(target_schedule_id)` — is_admin(42501) → 대상 존재·CANCELLED 거부 → 표 존재 시 무변경 → 활성 포지션 기본값 일괄 생성 → 감사 1행. 재호출 무변경·감사 0행 — pgTAP.
3. `set_position_requirement(schedule, position, count)`·`remove_position_requirement(schedule, position)` — is_admin → `for update` → CONFIRMED·CANCELLED 거부 → 비활성 포지션 신규 추가 거부 → count ≥0 검증 → 멱등·감사(전후 값) — pgTAP.
4. positions insert 트리거: 표 보유·확정 전 스케줄에 자동 추가 + 스케줄당 감사 1행, CONFIRMED 스케줄 제외, 비활성 insert 미반영 — pgTAP.
5. 포지션 관리 화면: 활성·비활성 구분 목록, 추가·수정(이름·기본 인원·성별·기본 여부), 비활성화, 삭제(사용 중이면 `SCHEDULING_POSITION_IN_USE` 안내), 시스템 포지션은 보호 표시 — model·hooks unit, 조립 E2E.
6. 준비 화면 필요 인원 절: 첫 진입 복사 → 표 표시 → 인원 수정·행 삭제·0명 입력 → 표에 없는 활성 포지션 배너+추가 버튼 — model·hooks unit, 조립 E2E.
7. E2E(staffing-snapshot): 포지션 추가 → 표가 있는 열린 스케줄에 자동 반영 확인 → 전역 기본 인원수 변경이 기존 표를 바꾸지 않음 확인 → 비활성화 시 새 선택지 제외 확인. 픽스처는 try/finally로 정리하고 재실행 내성을 가진다(P3-T01 F-04 교훈).
8. `pnpm verify`·`pnpm db:reset && pnpm db:test` 전체 통과. 기존 마이그레이션 무수정. `04-rls-default-deny.test.sql`의 정책 수 단언 갱신은 새 정책 추가로 불가피하면 허용하되 `runs/P3-T02/radio.md`에 기록한다(P3-T01 F-08 교훈).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 스키마 | 테스트함 — 생성·정책 | 테스트함 — 근무자 select·mutation 거부 | 테스트함 — count 음수 거부·0 허용 | 테스트함 — admin만 통과 | 해당 없음 — 유니크 소유 | 해당 없음 — DDL이다 |
| 2 복사 | 테스트함 — 활성 포지션 전부 생성 | 테스트함 — CANCELLED·미존재 거부 | 테스트함 — 활성 0개면 빈 표 | 테스트함 — 비관리자 42501 | 테스트함 — 재호출 무변경 | 테스트함 — on conflict 단일 생성 |
| 3 수정 | 테스트함 — 수정·삭제·감사 전후 값 | 테스트함 — CONFIRMED 거부·비활성 신규 거부 | 테스트함 — 0명 허용·음수 거부 | 테스트함 — 비관리자 42501 | 테스트함 — 같은 값 무변경 | 테스트함 — for update 직렬화 |
| 4 트리거 | 테스트함 — 표 보유 열린 스케줄 반영 | 테스트함 — CONFIRMED 제외 | 테스트함 — 표 없는 스케줄 미반영·비활성 미반영 | 해당 없음 — DB 내부 실행 | 해당 없음 — insert 1회당 1실행 | 해당 없음 — 같은 트랜잭션이다 |
| 5 관리 화면 | 테스트함 — CRUD 상태 전이 unit | 테스트함 — 삭제 차단 안내·시스템 보호 | 테스트함 — 빈 이름 거부 | 해당 없음 — 라우팅 인증 소유 | 해당 없음 — 제출 상태 hooks 단일화 | 해당 없음 — 단일 편집이다 |
| 6 준비 절 | 테스트함 — 복사·표시·수정 unit | 테스트함 — 저장 실패 로컬 보존 | 테스트함 — 미포함 배너 0·N개 | 해당 없음 — 라우팅 인증 소유 | 해당 없음 — hooks 단일화 | 해당 없음 — 단일 편집이다 |
| 7 E2E | 테스트함 — 인수 조건 7 전 구간 | 테스트함 — 픽스처 정리 실패 내성 | 테스트함 — 기본값 변경 불변 확인 | 테스트함 — admin 세션 픽스처 | 해당 없음 — 세부는 2~4행 소유 | 해당 없음 — 단일 세션이다 |
| 8 회귀 | 테스트함 — verify·db:test GREEN | 테스트함 — 기존 산출물 무수정 확인 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 |

- 보충 위험: 준비 화면 확장이 P3-T01 예식 E2E를 깨뜨릴 수 있다 — 필요 인원 절은 별도 컴포넌트로 붙이고 기존 예식 흐름·셀렉터를 수정하지 않는다. 트리거 반영량은 확정 전·표 보유 스케줄 수(수십 건 규모)에 비례해 부담 없다.

### DEV-* 적용 상태

- `DEV-DATA-04`: FK restrict·CHECK·트리거로 DB 최종 강제(기본 적용 — 이 task의 핵심).
- `DEV-SSOT-01`: 구조 정본 positions·인원값 정본 표의 이원화는 승인 설계다(추가 결정 — 위 불변 규칙에 기록).
- `DEV-SEC`: admin 전용 RLS·함수 이중, 감사 전후 값 병기(기본 적용).
- `DEV-TEST-01`: tdd — RED→GREEN 증거를 runs에 남긴다(기본 적용).
- `DEV-CODE-07`: 설명 주석 금지(기본 적용).
- `DEV-TIME`: 해당 없음 — 시간 계산이 없다.

## Architecture

- `supabase/migrations/<ts>_position_requirements.sql`: 테이블·정책·함수 3종·트리거·감사·실행 권한 관례. `positions`·기존 트리거 무수정.
- `supabase/tests/18-position-requirements.test.sql`(pgTAP): 인수 조건 1~4. 픽스처·주체 시뮬은 13~17번 관례.
- `src/shared/config/error-codes.config.ts`: `SCHEDULING_POSITION_IN_USE` 1개 신설, 나머지 재사용.
- `src/entities/position/`: 포지션 DTO·admin 목록 조회(`server-only`) — 신설 슬라이스.
- `src/entities/schedule/api/list-schedule-requirements.ts`(`server-only`, admin): 표 조회. P3-T01 `get-schedule-prep.ts`는 무수정.
- `src/features/position/`: `api/`(포지션 CRUD Server Action — requireAdmin→Zod→DML/rpc→매핑→revalidatePath), `hooks/`(편집 상태 — unit), `ui/`(목록·편집 시트·삭제 차단 안내 — Action prop 주입).
- `src/features/requirement/`: `api/`(copy·set·remove Action), `hooks/useRequirementEditor.ts`(표 편집·배너 상태 — unit), `ui/`(표 편집기·미포함 배너).
- `src/views/admin-positions/` + `src/app/(protected)/admin/positions/page.tsx` 신설. 진입 링크 1개는 admin 허브 `src/app/(protected)/admin/page.tsx`에 추가한다(기존 4개 링크와 같은 인라인 나열, revision 2 정정).
- `src/views/admin-schedule/`: 준비 화면에 필요 인원 절 컴포넌트 추가, `src/app/(protected)/admin/schedule/[id]/page.tsx`에 조회·Action 주입 추가(기존 예식 흐름 무수정).
- `tests/e2e/position-requirements.spec.ts`(신규): 인수 조건 7.

## Data model

- 정본: `positions`(구조 — P0-T03 소유 재사용), `schedule_position_requirements`(스케줄별 인원값). 이름·성별 조건은 저장하지 않는다 — FK 참조가 현재값을 보여준다.
- 표 행은 append-only가 아니다 — 수정·삭제를 허용하고 감사가 전후 값을 남긴다. 확정 시점 스냅샷은 P3-T06 소유(ADR-0003).
- RLS: 표는 admin 전용(select·mutation). 근무자 노출은 P3-T07이 연다. positions 근무자 select는 P1 그대로.
- 트랜잭션: 함수 1회 = 1트랜잭션, `for update` 잠금 관례. 트리거는 포지션 insert와 같은 트랜잭션에서 원자 실행된다.

## Interface

- 포지션 관리(`/admin/positions`): 활성 목록·비활성 접힘 목록, 행 탭 → 편집 시트(이름·기본 인원·성별 조건·기본 여부·비활성화·삭제). 시스템 포지션은 보호 배지와 삭제·비활성화 비활성 버튼.
- 준비 화면 필요 인원 절: 진입 시 복사 후 표 렌더(포지션명·필요 인원 입력·행 삭제), 상단에 미포함 활성 포지션 배너("표에 없는 포지션 N개 — 추가").
- Server Action Result 관례: 42501→`IDENTITY_NOT_ACTIVE`, 상태 충돌→`SCHEDULING_STATUS_CONFLICT`, 22023→`SCHEDULING_VALIDATION`, FK 삭제 차단(23503)→`SCHEDULING_POSITION_IN_USE`, 그 외→`COMMON_UNEXPECTED`.
- 실행: `pnpm verify`, `pnpm db:reset && pnpm db:test`, `pnpm test:e2e`.

## Optimizations

- 조회는 준비 진입 시 1회(표)·관리 화면 진입 시 1회(포지션 목록). 클라이언트 캐시 없음, 저장 후 `revalidatePath`(관례).
- 새 dependency 없음. 트리거 반영은 대상 스케줄 수 선형 — 성능 고려 불필요.
- 되돌림은 화면·함수·트리거 제거로 가능(테이블 잔존 허용, 정본 규칙에 따라 삭제하지 않음).

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/**
src/app/(protected)/admin/page.tsx
src/app/(protected)/admin/positions/**
src/app/(protected)/admin/schedule/**
src/entities/position/**
src/entities/schedule/**
src/features/position/**
src/features/requirement/**
src/views/admin-positions/**
src/views/admin-schedule/**
src/views/admin/**
src/shared/config/**
tests/e2e/**
docs/execution/radio/P3-T02-radio.md
docs/execution/runs/P3-T02/**
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/app/(protected)/admin/schedule/**`·`src/views/admin-schedule/**`은 필요 인원 절 추가에 한정하며 기존 예식 편집 흐름·셀렉터를 수정하지 않는다. `src/app/(protected)/admin/page.tsx`·`src/views/admin/**`은 포지션 관리 진입 링크 1개 추가에 한정한다.

## 미결 사항

- 확정 스케줄 수동 추가 개방(함수의 CONFIRMED 거부 해제 + revision 연동)과 포지션 추가 시점 목록 모달은 P3-T06 설계가 다룬다. 결정 주체: P3-T06 인터뷰.
