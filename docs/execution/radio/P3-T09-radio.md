# P3-T09 RADIO 개발 설계

- 상태: Approved
- revision: 2
- 기획 승인: user, 2026-08-15
- 개발 설계 승인: user, 2026-08-15

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-15 | 최초 작성. 설계 인터뷰 확정 2건 — revision 증가 단위는 화면 저장(RPC 호출) 1회당 +1이고, 취소된 스케줄의 근무자 직접 진입에는 취소 안내 화면을 신설한다(상태 분기 4분기 확장, P3-T07 backlog F-07 처리 포함). 2026-08-15 사용자 결정. |
| 2 | 2026-08-15 | 개발 단계 정지 조건 반환의 해소. revision 1이 기존 「CONFIRMED 거부」 단언 갱신을 pgTAP·features 단위에만 열어 두고, 확정 후 읽기 전용을 단언하는 기존 e2e 3파일(ceremony-edit·schedule-confirmation·assignment-eligibility)을 허용 경로에서 빠뜨렸다 — 확정 후 편집 개방이 본체라 이 단언들은 필연적으로 깨진다. 세 파일을 허용 경로에 추가하고 갱신 용도를 읽기 전용 단언의 새 동작(편집 가능·취소 버튼) 정합으로 한정한다. 2026-08-15 사용자 결정. |

- 관련 spec: PRD 8장(확정 후 변경), PRD:AC-03, PRD:INV-PAY-01(스냅샷 불변), DOMAIN:SCHEDULING, ADR:0003, DOCS:SDD(ADMIN-FLOWS 확정과 확정 후 변경 절, WORKER-FLOWS 확정 스케줄 절)
- 적용 깊이: 깊음 — 금액(추가 스냅샷), 상태 전이 트리거 개정, 배포된 정의자 함수 5종 재정의, 감사·revision·오류 코드가 는다.
- test mode: tdd
- 예정 check IDs: post-confirm-revision(변경 4종의 revision 증가·구조 차단·추가 스냅샷·감사 pgTAP + 칩 숨김·변경 표시 단위), confirmed-cancel(취소 전이·보존·화면 pgTAP·e2e)

## 전제

- 기획 승인(2026-08-15)이 소유한 제품 결정을 다시 열지 않는다: 저장 1회당 revision +1, 구조 깨는 변경 차단(마지막 예식 삭제·예정 시각 해제·시급 미설정자 추가), 추가 시점 즉시 스냅샷, 취소는 확인 다이얼로그만·사유 미입력·데이터 보존·되살리는 전이 없음, 근무자에게 revision 기반 최소 표시만, 교육 칩 숨김 편입.
- 알림은 P4, 근무자발 요청은 P4, 급여 계산은 P6이다.
- 코드 대조 확정 사실: `enforce_schedule_status_transition` 트리거가 CONFIRMED→CANCELLED를 **허용하지 않는다** — 이 전이 추가가 본 task 범위다. 확정 관련 수정 RPC 5종의 최종본 위치 — `replace_schedule_ceremonies`·`set_schedule_planned_times`(20260808020000), `set_position_requirement`·`remove_position_requirement`(20260809000000), `replace_position_assignments`(20260814000000, 교육생 처리 포함). 전부 `target_status in ('CONFIRMED','CANCELLED')`에서 거부한다. `set_schedule_planned_times`는 시그니처가 `time` 인자 둘이고 null 검증은 함수 안 22023이다. 스냅샷 컬럼과 `scheduling_audit_logs`는 P3-T06이 만들었고, 후보 시트의 겸직 정보는 P3-T04부터 조회에 있다. 다음 오류 코드 빈 자리는 LB032.

## Requirements

### 범위와 비목표

범위: 전이 트리거 개정(CONFIRMED→CANCELLED 1쌍 추가), 수정 RPC 5종의 CONFIRMED 경로 개방(revision·감사·구조 보증·추가 스냅샷), 취소 RPC 신설, 오류 코드 3개(LB032~LB034), 관리자 준비 화면 읽기 전용 해제·취소 버튼·교육 칩 숨김, 근무자 상세의 revision 표시·취소 안내 화면(4분기), roster RPC 확장(revision·최종 변경 시각), pgTAP·단위·e2e.

비목표: 알림(P4), 근무자발 취소·교대 요청(P4), 급여 계산(P6), CANCELLED에서 되살리는 전이(없음), `copy_schedule_requirements`의 확정 후 개방(표가 이미 있으므로 거부 유지), P3-T06 backlog F-03(requirement 삭제 포지션 경고 합집합)의 해소.

### 불변 규칙

- 확정 스케줄의 모든 배정·교육생 행은 항상 시급 스냅샷을 가진다 — 확정 시(P3-T06)든 확정 후 추가 시(이 task)든. 시급 null 대상자의 추가는 LB030으로 거부한다.
- 이미 찍힌 스냅샷은 어떤 변경도 덮어쓰지 않는다. 확정 후 제거→재추가된 행은 재추가 시점의 시급으로 새로 찍는다.
- revision 증가·감사 기록·데이터 변경은 각 RPC의 단일 트랜잭션 안이다. 부분 반영이 남지 않는다.
- CONFIRMED에서 열리는 것은 수정 RPC 5종과 취소뿐이다. CANCELLED는 모든 수정을 계속 거부한다.
- 구조 보증: CONFIRMED에서 예식이 0개가 되는 교체(LB033), 예정 시각 null 입력(기존 22023 검증 유지), 마지막 필요 인원 행 삭제(LB034)를 거부한다.
- 취소는 배정·교육생·스냅샷·감사 행을 삭제하지 않는다.

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- 기존 pgTAP·단위·e2e가 「CONFIRMED에서 수정 RPC 거부」를 인수 조건으로 단언해 이번 개방과 충돌하는 경우 — 단, P3-T06의 「확정 재시도 LB029」와 P3-T07의 「CONFIRMED 아닌 상태 LB031」은 이 task와 무관하며 충돌이 아니다.
- 취소·변경 UI가 `src/shared/ui/**` 변경을 요구하는 경우.
- 후보 시트 조회에 교육 칩 숨김 판단(다른 포지션 정식 배정 여부)에 필요한 데이터가 없어 조회 계약을 넓혀야 하는 경우.

### 기술 인수 조건

1. CONFIRMED 스케줄에서 수정 RPC 5종이 각각 성공하고, 성공 1회마다 `schedules.revision`이 정확히 1 증가하며 `schedule_revised` 감사(변경자·시각·section·전후 값·새 revision)가 남는다(pgTAP).
2. CONFIRMED에서 예식 전부 교체로 0개가 되는 호출은 LB033, 마지막 필요 인원 행 삭제는 LB034, 시급 null 근무자의 배정·교육생 추가는 LB030으로 거부되고 revision·감사·데이터가 변하지 않는다(pgTAP).
3. 확정 후 추가된 배정자·교육생 행에 추가 시점의 `profiles.hourly_wage`가 스냅샷되고, 기존 행의 스냅샷은 변경·재저장에도 불변이며, 이후 `set_hourly_wage`가 어느 스냅샷도 바꾸지 않는다(pgTAP).
4. `cancel_confirmed_schedule`이 CONFIRMED에서만 CANCELLED로 전이시키고(그 외 상태 LB032), 배정·교육생·스냅샷 행이 그대로 남으며 `schedule_cancelled` 감사가 남는다. CANCELLED에서 수정 RPC 5종·재취소·확정이 전부 거부된다(pgTAP).
5. 비관리자의 수정·취소 호출은 42501로 거부된다(pgTAP — 기존 함수 관례 유지 확인).
6. `get_confirmed_roster`가 revision과 최종 변경 시각을 함께 반환하고, 허용 키 집합 단언이 새 키를 포함해 갱신된다(pgTAP — 22 파일).
7. 관리자 준비 화면이 CONFIRMED에서 편집 가능 상태로 열리고(읽기 전용 해제), 취소 버튼→영향 인원 수 다이얼로그→취소→읽기 전용(취소됨) 전환이 성립한다(e2e).
8. 후보 시트에서 다른 포지션 정식 배정자에게 교육생 선택지가 보이지 않는다(단위 — candidate-buckets 순수 함수).
9. 근무자 상세가 revision>1일 때 변경 표시(최종 변경 시각 포함)를 보여주고 revision 1에서는 보여주지 않는다(단위 + e2e).
10. CANCELLED 스케줄의 근무자 직접 진입이 취소 안내 화면을 그린다 — 상태 분기 closed·open·confirmed·cancelled 4분기(단위 + e2e).
11. 취소 다이얼로그의 영향 인원 수는 화면 보유 데이터로 계산하는 순수 함수다(단위).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 revision·감사 | 테스트함 — 5종 각각 성공 후 revision 정확히 +1과 schedule_revised 전후 값 단언 | 테스트함 — 거부된 호출 뒤 revision·감사 무변화(원자성) | 테스트함 — 연속 저장 3회가 revision 3 증가(누적) | 테스트함 — 5번 행이 소유 | 테스트함 — 같은 내용 재저장도 저장 1회로 revision 증가(멱등 아님이 계약) | 테스트함 — 기존 함수들의 행 잠금 관례 유지 확인 |
| 2 구조 차단 | 해당 없음 — 아래 실패 칸이 본체 | 테스트함 — LB033·LB034·LB030 각각 유도해 코드와 무변화 단언 | 테스트함 — 예식 1개 남기는 교체는 통과, 필요 인원 행 2개 중 1개 삭제는 통과, 시급 있는 추가는 통과 | 해당 없음 — 5번 행이 소유 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 1번 행이 소유 |
| 3 추가 스냅샷 | 테스트함 — 확정 후 추가 정식·교육생의 스냅샷이 추가 당시 시급과 일치(값 단언, P3-T06 F-01 교훈) | 테스트함 — set_hourly_wage 이후 기존·추가 스냅샷 모두 불변 | 테스트함 — 제거→재추가 행이 재추가 시점 시급으로 새 스냅샷, 겸직 포지션 추가는 사람 단위 1행이라 스냅샷 재기록 없음 | 해당 없음 — 쓰기 경로가 RPC뿐 | 해당 없음 — replace 의미상 같은 입력 재저장은 같은 행 유지 | 해당 없음 — 1번 행이 소유 |
| 4 취소 | 테스트함 — CONFIRMED 취소 후 CANCELLED 도달·데이터 보존·감사 단언 | 테스트함 — OPEN·CLOSED·CANCELLED 취소 시도 LB032 | 테스트함 — 취소 후 수정 5종·confirm_schedule(LB029)·재취소 전부 거부 | 테스트함 — 비관리자 42501 | 테스트함 — 재취소가 LB032 | 테스트함 — for update 잠금 후 상태 재검증 |
| 5 권한 | 테스트함 — 관리자 성공 경로가 1·4번 행에 포함 | 테스트함 — 비관리자 42501(수정 5종은 기존 단언 유지 확인, 취소는 신규) | 해당 없음 — 코드 경로 없음 | 테스트함 — 본체 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 상태 검사가 4번 행 소유 |
| 6 roster 확장 | 테스트함 — revision·최종 변경 시각 값 단언(키 존재만이 아니라 값 — P3-T07 F-01 교훈) | 테스트함 — 허용 키 집합 동등 단언 갱신(금지 필드 부재 유지) | 테스트함 — 변경 없는 스케줄은 revision 1과 확정 시각 | 해당 없음 — P3-T07 pgTAP가 소유 | 해당 없음 — 읽기 멱등 | 해당 없음 — 읽기 전용 |
| 7 관리자 UX | 테스트함 — e2e에서 확정 후 편집·저장·취소 흐름 | 테스트함 — 구조 차단 오류가 화면 안내로 표시 | 테스트함 — 취소 후 화면이 읽기 전용(취소됨) | 해당 없음 — 관리자 라우트 가드는 기존 e2e 소유 | 테스트함 — pending 중 재진입 가드(훅 단위, 기존 관례) | 해당 없음 — DB가 4번 행에서 소유 |
| 8 칩 숨김 | 테스트함 — 다른 포지션 정식 배정자 후보의 교육생 선택지 부재(단위) | 테스트함 — 미배정 후보는 선택지 유지 | 테스트함 — 같은 포지션 정식 배정자(전환 대상)는 기존 P3-T05 규칙 유지 | 해당 없음 — 표시 계층이고 DB 차단(LB023 계열)은 기존 pgTAP 소유 | 해당 없음 — 표시 계층 | 해당 없음 — 표시 계층 |
| 9·10 근무자 표시 | 테스트함 — revision>1 변경 표시·CANCELLED 안내 화면(단위+e2e) | 테스트함 — revision 1 무표시, 4분기 각 상태 매핑 단위 | 테스트함 — 취소 직후 진입이 안내 화면 | 테스트함 — e2e를 근무자 계정으로 실행 | 해당 없음 — 읽기 화면 | 해당 없음 — 읽기 화면 |
| 11 인원 계산 | 테스트함 — 정식+교육생 합산 순수 함수 단위 | 테스트함 — 0명 스케줄 취소도 동작 | 테스트함 — 겸직자는 사람 수로 1회만 집계 | 해당 없음 — 계산 계층 | 해당 없음 — 순수 함수 | 해당 없음 — 계산 계층 |

- 보충 위험: **기존 단언과의 충돌 목록을 선확인한다** — 20~23 pgTAP, features 단위, 그리고 기존 e2e 3파일(ceremony-edit·schedule-confirmation·assignment-eligibility) 중 「CONFIRMED 거부·읽기 전용」을 고정한 단언은 이 task의 알려진 범위 내 갱신이다(정지 조건의 예외 명시 참조, revision 2). **e2e work_date 밴드** — 새 spec은 전용 밴드 + `workDatesInBand` 일괄 배분으로 spec 내 무작위 충돌을 만들지 않는다(P3-T07 F-02 교훈). **replace_position_assignments의 CONFIRMED 개방**은 P3-T05 교육생 규칙(겸직 금지·중복 금지·성별)을 그대로 통과해야 한다 — 기존 검증 블록 무수정.

### DEV-* 적용 상태

- DEV-SEC: 기본 적용 — 기존 정의자 함수 재정의 시 search_path 고정·revoke/grant를 그대로 보존, 신설 취소 RPC도 동일 관례. 권한 검사는 함수 안.
- DEV-DATA·DEV-SSOT: 기본 적용 — revision 정본은 `schedules.revision`, 변경 이력 정본은 감사 로그. 전용 이력 테이블 없음.
- DEV-CACHE: 기본 적용 — 저장·취소 성공 후 재조회(기존 흐름). 새 캐시 계층 없음.
- DEV-TIME: 해당 없음 — 시각은 저장값 기록·표시뿐, 경계 계산 없음.
- DEV-CODE-07·주석 금지·barrel 금지·server-only: 기본 적용.

## Architecture

- DB 경계: 개방·보증·revision·감사·스냅샷 전부 정의자 함수 안. 클라이언트는 상태에 따른 UI 잠금만 담당한다.
- `src/features/confirmation/` 확장: `api/cancel-schedule.ts`(server action, 단위 필수) + `hooks/useCancelSchedule.ts` + `ui/CancelScheduleDialog.tsx`(표시는 prop, 계산 없음). 영향 인원 수 계산은 `views/admin-schedule/model`의 순수 함수(단위 필수).
- 교육 칩 숨김: `views/admin-schedule/model/candidate-buckets.ts`의 분류 규칙 확장(단위 필수). 조회 계약 무변경 — 겸직 정보는 이미 후보 조회에 있다.
- 읽기 전용 해제: `AdminSchedulePrepView`의 확정 후 잠금 분기를 편집 허용 + 취소 버튼으로 바꾼다. 각 저장 흐름(기존 훅)은 무수정 재사용.
- 근무자 상세: `schedule-detail-variant.ts`를 4분기로 확장, `ScheduleDetailCancelledView`(ui, 테스트 면제) 신설, `page.tsx`의 CANCELLED 사전 필터를 분기로 대체. 변경 표시는 `ScheduleDetailView`에 revision·최종 변경 시각 prop 추가.
- `entities/schedule/api/get-confirmed-roster.ts` 응답 매핑에 revision·revisedAt 추가(단위 갱신).
- 기존 수정 server action 5종은 시그니처·매핑 무수정(새 오류 코드 매핑만 해당 action에 추가).

## Data model

- 새 마이그레이션 `supabase/migrations/20260817000000_post_confirmation_changes.sql` 하나. 기존 마이그레이션 소급 수정 없음(함수는 `create or replace`로 재정의).
  - `enforce_schedule_status_transition` 재정의 — 허용 목록에 `CONFIRMED→CANCELLED` 1쌍 추가. 다른 전이는 무수정.
  - 내부 헬퍼 `bump_confirmed_revision(target_schedule_id uuid, section text, before_detail jsonb, after_detail jsonb) returns integer` — revision +1 update, `schedule_revised` 감사 insert(actor·section·before·after·revision). revoke all(실행 grant 없음, 정의자 함수 내부 호출 전용).
  - 수정 RPC 5종 재정의: 상태 검사를 `CANCELLED(및 각자의 기존 모집 상태 규칙)` 거부로 좁히고, CONFIRMED 경로에 구조 보증(위 불변 규칙)·추가 행 스냅샷(`replace_position_assignments`)·`bump_confirmed_revision` 호출을 더한다. 기존 검증(자격·성별·교육생 규칙·22023)과 CLOSED·PREPARING 경로 동작은 무수정.
  - `cancel_confirmed_schedule(target_schedule_id uuid) returns jsonb` — 관리자 검사(42501), `for update` 잠금, CONFIRMED 외 LB032, status→CANCELLED, `schedule_cancelled` 감사(actor·당시 revision·배정·교육생 수), `jsonb_build_object('revision', …)` 반환. 데이터 삭제 없음.
  - `get_confirmed_roster` 재정의 — 반환 jsonb에 `revision`, `revised_at`(마지막 `schedule_revised` 감사 시각, 없으면 `schedule_confirmed` 시각) 키 추가.
- 스키마(테이블·컬럼) 변경 없음.

## Interface

- `error-codes.config.ts`에 3개 추가(기존 문구·http 무수정):
  - LB032 `SCHEDULING_CANCEL_INVALID_STATUS` { http: 409, "취소할 수 없는 상태예요" }
  - LB033 `SCHEDULING_REVISION_NO_CEREMONY` { http: 409, "확정된 스케줄에는 예식이 하나 이상 필요해요" }
  - LB034 `SCHEDULING_REVISION_LAST_REQUIREMENT` { http: 409, "확정된 스케줄에는 필요 인원 표가 필요해요" }
- 새 코드 매핑은 해당 server action(ceremony·requirement·assignment·취소)에 추가하고 22023·42501 매핑 관례 유지, 각 단위 테스트(P3-T06 F-07 교훈).
- 취소 응답은 `{ ok, data: { revision } } | { ok: false, code }` 관례.
- 멱등: 같은 내용 재저장도 revision을 올린다(저장 1회 = revision 1 계약). 재취소는 LB032 거부.

## Optimizations

- 변경 저장은 기존 RPC 왕복 그대로(추가 왕복 없음 — revision·감사가 같은 트랜잭션). 취소 왕복 1회. 영향 인원 수 프리뷰 왕복 0회(화면 보유 데이터).
- 실패 로그 이벤트는 기존 관례(`confirmation_cancel_schedule_failed` 등).
- 되돌림: 함수 재정의·트리거 재정의는 이전 정의 재적용으로 되돌릴 수 있다. 스키마 변경이 없어 데이터 마이그레이션 되돌림도 없다.

## 변경 허용 경로

```
supabase/migrations/20260817000000_post_confirmation_changes.sql
supabase/tests/**
src/features/confirmation/**
src/features/assignment/**
src/features/ceremony/**
src/features/requirement/**
src/entities/schedule/api/get-confirmed-roster.ts
src/entities/schedule/api/__tests__/get-confirmed-roster.test.ts
src/entities/schedule/model/**
src/views/admin-schedule/**
src/views/schedule-detail/**
src/app/(protected)/schedule/[id]/page.tsx
src/app/(protected)/admin/schedule/[id]/page.tsx
src/shared/config/error-codes.config.ts
tests/e2e/post-confirmation-changes.spec.ts
tests/e2e/ceremony-edit.spec.ts
tests/e2e/schedule-confirmation.spec.ts
tests/e2e/assignment-eligibility.spec.ts
tests/e2e/support/**
docs/execution/radio/P3-T09-radio.md
docs/execution/runs/P3-T09/**
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/features/{assignment,ceremony,requirement}/**`는 새 오류 코드 매핑과 그 단위 테스트에만 쓰고 기존 입력·응답 계약을 바꾸지 않는다. `error-codes.config.ts`는 코드 3개 추가뿐이다. `supabase/tests/**`는 새 파일(23), roster 확장 키 단언 갱신(22), 그리고 기존 파일(08~21)의 「CONFIRMED 거부」 단언을 이번 개방에 맞춰 갱신하는 데만 쓴다 — 갱신 목록은 runs/radio.md에 남긴다. 그 밖의 기존 단언 약화는 금지다. 기존 e2e 3파일(ceremony-edit·schedule-confirmation·assignment-eligibility)은 확정 후 읽기 전용 단언을 새 동작(편집 가능·취소 버튼)에 맞춰 갱신하는 데만 쓴다(revision 2) — 다른 시나리오·단언은 건드리지 않는다. `tests/e2e/support/**`는 밴드 1개 추가와 기존 헬퍼 재사용에만 쓴다.
- `docs/product/**`는 의도적으로 빠져 있다. 정합화는 기획·설계 승인 시점에 조정자가 끝냈다.
- 위 밖의 파일이 필요해지면 멈추고 반환한다.

## 미결 사항

- P4 알림 — 변경·취소 묶음당 1건 발송과 diff 본문(감사 detail 재사용)은 P4 설계 몫.
- P3-T06 backlog F-03(requirement 삭제 포지션의 경고 합집합)은 이 task의 remove 보증(LB034)과 별개로 남는다 — 정비 task 몫.
- 확정 후 변경의 미달 재경고 UX 고도화(현재는 화면 재계산 표시뿐) — 필요 시 새 기획.
