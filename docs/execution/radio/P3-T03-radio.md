# P3-T03 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-10
- 개발 설계 승인: user, 2026-08-10

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-10 | 최초 작성. 기획 확정(후보 두 묶음·미달자 접기와 이유·자격은 생성 시점만·확정 전 스케줄만·중복 배정 배지·초과와 0명 허용·확정 전부터 감사)을 반영. 설계 인터뷰 확정 5건 — `assignments`+`assignment_positions` 두 층, 후보 판정은 DB 함수 소유, 필요 인원 표 행 탭 → 후보 시트, 마지막 담당 포지션 제거 시 배정 행 동반 삭제, 포지션 단위 batch 저장. |

- 관련 spec: PRD 4장(포지션)·7장(필요 인원과 배정), PRD:AC-04, PRD:INV-STAFF-01, DOMAIN:SCHEDULING, ADR:0002, ADR:0003
- 적용 깊이: 심화 (권한·DB 스키마·자격 강제)
- test mode: tdd
- 예정 check IDs: assignment-eligibility(스키마·정책·자격 거부 pgTAP), assignment-api-authorization(권한·경로 우회 거부 통합)

## Requirements

### 범위와 비목표

- 범위: ① 마이그레이션 1개 — `assignments`·`assignment_positions` 테이블, admin select 전용 RLS, 후보 조회 함수, 포지션 단위 배정 교체 DEFINER 함수, 감사 ② 후보 조회(`list_position_assignment_candidates`)가 신청 여부와 자격 판정을 붙여 반환 ③ 준비 화면 필요 인원 표에 `필요 N / 배정 M` 표시와 행 탭 → 후보 시트(두 묶음·미달자 접힘·배지·batch 저장) ④ pgTAP·unit·E2E.
- 비목표(기획 그대로): 한 사람에게 여러 포지션을 함께 붙이는 흐름과 모바일 흐름 다듬기·검색·정렬(P3-T04), 교육생(P3-T05), 확정 트랜잭션·revision·확정 후 배정 변경(P3-T06), 근무자 노출(P3-T07), 자동 배정·추천(MVP 제외).
- 설계 비목표: `positions`·`worker_position_eligibilities`·`applications`·`schedule_position_requirements` 무수정(P0·P1·P2·P3-T02 소유). P3-T02가 만든 필요 인원 표의 편집 동작은 그대로 두고 표에 배정 수 표시와 행 탭만 얹는다. `profiles` 스키마 무수정.

### 불변 규칙

- **자격은 배정을 만드는 순간에만 판정한다**: 교체 함수가 대상 profile 각각에 대해 활성 상태·성별 조건·가능 포지션을 검사하고 하나라도 어긋나면 거부한다. 이미 저장된 행은 이후 자격 변화와 무관하게 그대로 둔다. 재검사·표시·정리 작업을 만들지 않는다(확정 시점 재검사 여부는 P3-T06 소유).
- **정식 배정 조건은 넷이다**: `profiles.status = 'active'`, 포지션 `gender_requirement`가 `any`이거나 `profiles.gender`와 일치, 포지션이 `is_default`이거나 `worker_position_eligibilities`에 해당 행 존재, 같은 스케줄 같은 포지션에 중복 아님. 비활성 포지션(`is_active = false`)에는 신규 배정을 거부한다.
- **기본 포지션도 성별 조건을 통과해야 한다**: `is_default`는 가능 포지션 조건만 면제하고 성별 조건은 면제하지 않는다. 시드의 `안내`(기본이면서 남성 전용)가 이 규칙이 실제로 겹치는 지점이다.
- **확정 전 스케줄만 대상이다**: `CONFIRMED`·`CANCELLED`를 거부하고 `OPEN`·`CLOSED`·`PREPARING`을 허용한다. P3-T02 복사 함수와 같은 판정이며 같은 errcode(`LB020`)를 쓴다.
- **필요 인원은 상한이 아니다**: `schedule_position_requirements.required_count`와 배정 수를 비교하지 않는다. 표에 그 포지션 행이 없거나 `required_count = 0`이어도 배정을 거부하지 않는다.
- **두 층은 함께 움직인다**: `assignments`는 `(schedule_id, profile_id)` 유니크로 사람 단위 참여를 뜻하고 `assignment_positions`가 담당 포지션을 붙인다. 교체 함수는 필요한 `assignments` 행을 만들고, 마지막 담당 포지션이 사라진 `assignments` 행을 같은 트랜잭션에서 삭제한다 — 담당 포지션이 하나도 없는 배정 행은 남지 않는다.
- **쓰기는 함수만 지난다**: 두 테이블의 RLS는 admin `select`만 연다. insert·update·delete 정책을 두지 않아 직접 DML은 42501(insert) 또는 0건 적용(update·delete)이 되고, 상태 잠금과 자격 검사와 감사를 우회할 경로가 없다(P3-T02 교차 검증 F-01 교훈).
- 권한: 후보 조회와 교체 모두 `is_admin` 이중 검사(RLS + 함수). ui는 api를 import하지 않고 page가 Action을 주입한다(관례).
- 감사: 교체 1회당 `scheduling_audit_logs` 1행(`assignment_positions_replaced`). detail에 포지션과 추가·제거된 profile 수, 변경 전후 배정 수를 담고 이름·연락처 같은 PII는 담지 않는다. 변경이 없으면 감사 0행.

### 기술 인수 조건

1. 마이그레이션: `assignments`(id, schedule_id FK, profile_id FK, unique(schedule_id, profile_id)), `assignment_positions`(assignment_id FK on delete cascade, position_id FK restrict, PK(assignment_id, position_id)), 두 테이블 admin select 전용 RLS — pgTAP으로 admin select 허용·직접 DML 거부·근무자와 anon 전 종류 거부·정책 수 단언.
2. `list_position_assignment_candidates(target_schedule_id, target_position_id)` — is_admin(42501) → 활성 근무자 전원에 대해 이름·신청 여부·현재 이 포지션 배정 여부·다른 포지션 배정 목록·자격 판정(`eligible` boolean, `ineligible_reason` 중 `GENDER_MISMATCH`·`NOT_ELIGIBLE`)을 붙여 반환 — pgTAP.
3. `replace_position_assignments(target_schedule_id, target_position_id, profile_ids uuid[])` — is_admin → 스케줄 `for update` → `CONFIRMED`·`CANCELLED` 거부(`LB020`) → 비활성 포지션 거부 → 각 profile 자격 검사 실패 시 전체 거부(`LB023`) → 대상 포지션의 배정을 인자 집합으로 교체 → 담당 포지션이 빈 `assignments` 행 삭제 → 감사 1행. 같은 집합 재호출은 무변경·감사 0행 — pgTAP.
4. 자격 거부의 경로 무관성: 성별 불일치·가능 포지션 없음·비활성 계정·비활성 포지션·확정 스케줄 각각이 함수 호출과 직접 DML 양쪽에서 거부된다 — pgTAP.
5. 필요 인원 표: 각 행에 `필요 N / 배정 M`을 표시하고 행을 탭하면 후보 시트가 열린다. 배정 수는 표 조회와 함께 1회 조회로 얻는다 — model unit, 조립 E2E.
6. 후보 시트: `신청함`·`신청 안 함` 두 묶음, 미달자 접힘과 펼침 시 이유 표시, 다른 포지션 배정 배지, 다중 선택과 `N개 변경` 표시, 저장 1회 호출, 되돌리기 — model·hooks unit, 조립 E2E.
7. E2E(assignment-api-authorization): 여성 전용 포지션 시트에서 남성이 미달 묶음에 이유와 함께 접혀 있음 확인 → 신청자 2명을 골라 저장 후 표의 배정 수 증가 확인 → 기존 1명 해제와 신규 1명 추가를 한 번에 저장 확인 → 필요 인원을 넘겨 배정 가능 확인 → 확정 스케줄에서 시트가 열리지 않음 확인. 픽스처는 `tests/e2e/support/work-date-band.ts`에서 새 구간을 받고 try/finally로 정리한다.
8. `pnpm verify`·`pnpm db:reset && pnpm db:test` 전체 통과. 기존 마이그레이션 무수정. `04-rls-default-deny.test.sql`은 `positions`·`venue_settings`·`check_in_rules`를 이름으로 지목해 단언하므로 이 task에서 갱신 대상이 아니다 — 손대게 되면 그 사유를 `runs/P3-T03/radio.md`에 기록한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 스키마 | 테스트함 — 생성·정책·유니크 | 테스트함 — 근무자·anon 전 종류 거부 | 테스트함 — 같은 스케줄 같은 사람 중복 거부 | 테스트함 — admin select만 통과 | 해당 없음 — 유니크 소유 | 해당 없음 — DDL이다 |
| 2 후보 조회 | 테스트함 — 신청·배정·자격 판정 동반 | 테스트함 — 비관리자 42501 | 테스트함 — 활성 근무자 0명이면 빈 목록 | 테스트함 — admin만 통과 | 해당 없음 — 읽기다 | 해당 없음 — 읽기다 |
| 3 교체 | 테스트함 — 추가·제거 동시 반영·감사 | 테스트함 — CONFIRMED·비활성 포지션 거부 | 테스트함 — 빈 배열로 전원 해제·필요 인원 초과·0명 표 허용 | 테스트함 — 비관리자 42501 | 테스트함 — 같은 집합 재호출 무변경 | 테스트함 — 스케줄 for update 직렬화 |
| 4 자격 강제 | 테스트함 — 조건 통과 시 저장 | 테스트함 — 5종 거부 각각 | 테스트함 — 기본 포지션 + 성별 불일치 거부 | 테스트함 — 직접 DML 경로 거부 | 해당 없음 — 3행 소유 | 해당 없음 — 3행 소유 |
| 5 표 확장 | 테스트함 — 배정 수 표시 unit | 테스트함 — 조회 실패 fail-closed | 테스트함 — 배정 0명·초과 표시 | 해당 없음 — 라우팅 인증 소유 | 해당 없음 — 읽기다 | 해당 없음 — 읽기다 |
| 6 후보 시트 | 테스트함 — 두 묶음·선택·저장 unit | 테스트함 — 저장 실패 시 선택 보존 | 테스트함 — 미달자 0명이면 접힘 영역 없음 | 해당 없음 — 라우팅 인증 소유 | 해당 없음 — hooks 단일화 | 해당 없음 — 단일 편집이다 |
| 7 E2E | 테스트함 — 인수 조건 7 전 구간 | 테스트함 — 확정 스케줄 시트 미개방 | 테스트함 — 필요 인원 초과 배정 | 테스트함 — admin 세션 픽스처 | 해당 없음 — 세부는 2~4행 소유 | 해당 없음 — 단일 세션이다 |
| 8 회귀 | 테스트함 — verify·db:test GREEN | 테스트함 — 기존 산출물 무수정 확인 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 | 해당 없음 — 위 행 소유 |

### DEV-* 적용 상태

- `DEV-DATA-04`: 자격·상태·중복을 DB 함수와 제약이 최종 강제(기본 적용 — 이 task의 핵심).
- `DEV-SEC-01`: UI 숨김은 경계가 아니다 — 미달자를 접어 보여주는 것과 별개로 함수가 거부한다(기본 적용).
- `DEV-SSOT-01`: 자격 판정 규칙의 정본은 DB 함수 한 곳이다. 화면은 함수가 붙여준 판정을 그리기만 하고 같은 규칙을 다시 계산하지 않는다(추가 결정 — 설계 인터뷰 확정).
- `DEV-TEST-01`: tdd — RED→GREEN 증거를 runs에 남긴다(기본 적용).
- `DEV-CODE-07`: 설명 주석 금지(기본 적용).
- `DEV-TIME`: 해당 없음 — 시간 계산이 없다.

## Architecture

- `supabase/migrations/<ts>_assignments.sql`: 테이블 2개·정책·함수 2종·감사·실행 권한 관례. 기존 테이블·트리거 무수정.
- `supabase/tests/19-assignments.test.sql`(pgTAP): 인수 조건 1~4. 픽스처·주체 시뮬은 13~18번 관례.
- `src/shared/config/error-codes.config.ts`: `SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE` 1개 신설(LB023 매핑), `SCHEDULING_STATUS_CONFLICT`(LB020) 재사용.
- `src/entities/assignment/`: 배정 DTO·후보 DTO·후보 조회(`server-only`, admin) — 신설 슬라이스.
- `src/entities/schedule/api/list-schedule-requirements.ts`: 배정 수를 함께 얻도록 조회 확장. P3-T01 `get-schedule-prep.ts`는 무수정.
- `src/features/assignment/`: `api/replace-position-assignments.ts`(Server Action — requireAdmin→Zod→rpc→매핑→revalidatePath), `hooks/useCandidateSelection.ts`(선택·변경 수·되돌리기 — unit), `ui/`(후보 시트·묶음·미달 접힘 — Action prop 주입).
- `src/views/admin-schedule/`: 필요 인원 표 행에 배정 수와 탭 진입 추가, 후보 시트 배치. `model/`에 배정 수 표시와 후보 묶음 분류 순수 함수.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`: 후보 조회와 Action 주입 추가. P3-T02가 세운 호출 순서(조회 후 조건부 복사)를 유지하고 렌더 중 쓰기를 추가하지 않는다.
- `tests/e2e/assignment-eligibility.spec.ts`(신규): 인수 조건 7. `tests/e2e/support/work-date-band.ts`에 이 spec 전용 구간을 추가한다 — 기존 구간과 겹치지 않는 개월 범위를 표에 넣는다.
- 세그먼트 테스트 의무(`config/fsd.json`): `api`·`hooks`·`model`은 unit 테스트가 필수이며 `__tests__/` 형제 디렉터리에 둔다. 신설되는 `entities/assignment/api/*`·`features/assignment/api/*`·`features/assignment/hooks/*`·`views/admin-schedule/model/*`가 모두 해당한다. `ui`는 unit 면제이고 component·e2e가 검증하며 `**/api/**`를 import하지 않는다.

## Data model

- 정본: `assignments`(사람 단위 참여), `assignment_positions`(담당 포지션). 이름·성별·포지션 조건은 저장하지 않는다 — FK 참조가 현재값을 보여준다.
- 확정 시점 시급 스냅샷과 탈퇴자 `change_required`는 `assignments`에 붙을 자리이며 이번 범위가 아니다(P3-T06·P1 연쇄 소유).
- 교육생은 `assignment_positions`에 담당자 연결을 더하는 형태가 유력하나 P3-T05가 결정한다 — 이번에는 열을 미리 만들지 않는다.
- 두 테이블 모두 append-only가 아니다. 교체 함수가 제거를 수행하고 감사가 전후 수를 남긴다. 확정 시점 고정은 P3-T06 소유(ADR-0003).
- 트랜잭션: 함수 1회 = 1트랜잭션. 스케줄 행 `for update`로 상태 판정과 교체를 직렬화한다.

## Interface

- 준비 화면 필요 인원 절: 각 행이 `포지션명 · 필요 N / 배정 M`이며 행 탭으로 후보 시트를 연다. 확정·취소 스케줄에서는 기존과 같이 읽기 전용이라 시트를 열지 않는다.
- 후보 시트: 상단에 포지션명과 `필요 N / 배정 M`, 본문에 `신청함`·`신청 안 함` 두 묶음, 각 행은 이름과 다른 포지션 배정 배지, 하단에 `조건에 맞지 않는 N명 보기` 접힘 영역(펼치면 이름과 이유). 선택 변경 시 `N개 변경` 표시와 저장·되돌리기 — 근무자 달력 다중 신청(P2-T03)과 같은 모양.
- Server Action Result 관례: 42501→`IDENTITY_NOT_ACTIVE`, LB020→`SCHEDULING_STATUS_CONFLICT`, LB023→`SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE`, 22023→`SCHEDULING_VALIDATION`, 그 외→`COMMON_UNEXPECTED`.
- 실행: `pnpm verify`, `pnpm db:reset && pnpm db:test`, `pnpm test:e2e`.

## Optimizations

- 조회는 준비 진입 시 1회(표 + 배정 수), 시트 열 때 1회(후보 목록). 클라이언트 캐시 없음, 저장 후 `revalidatePath`(관례).
- 후보 목록은 활성 근무자 수에 비례한다. PostgREST 기본 1000행 절단을 넘지 않는지 확인하고, 넘으면 함수에 명시 상한과 정렬을 둔다.
- 저장은 포지션 단위 1회 호출이라 선택 인원 수와 무관하게 왕복 1회다 — 렌더마다 쓰기가 일어나 재검증이 겹치던 P3-T02 회귀를 되풀이하지 않는다.
- 새 dependency 없음. 되돌림은 화면·함수 제거로 가능(테이블 잔존 허용, 정본 규칙에 따라 삭제하지 않음).

## 변경 허용 경로

```
supabase/migrations/**
supabase/tests/**
src/app/(protected)/admin/schedule/**
src/entities/assignment/**
src/entities/schedule/**
src/features/assignment/**
src/views/admin-schedule/**
src/shared/config/**
tests/e2e/**
docs/execution/radio/P3-T03-radio.md
docs/execution/runs/P3-T03/**
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/app/(protected)/admin/schedule/**`·`src/views/admin-schedule/**`은 필요 인원 표에 배정 수·행 탭을 얹고 후보 시트를 배치하는 범위로 한정하며, P3-T01 예식 편집 흐름과 P3-T02 표 편집 동작을 수정하지 않는다. `tests/e2e/**`는 신규 spec 추가와 `support/work-date-band.ts`에 구간 1개 추가로 한정한다.

## 미결 사항

- 확정 시점에 자격을 다시 검사할지는 P3-T06 설계가 다룬다. 결정 주체: 사용자, 반환할 단계: P3-T06 기획·설계.
- 교육생이 `assignment_positions`에 붙는 형태는 P3-T05 설계가 다룬다. 결정 주체: P3-T05 인터뷰.
- 후보 목록 정렬 기준(이름순 고정 여부)과 1000행 상한 대응은 개발 단계에서 실측 후 확정하고 `runs/P3-T03/radio.md`에 기록한다. 결정 주체: AI.
