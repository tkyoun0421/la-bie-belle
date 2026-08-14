# P3-T06 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-14
- 개발 설계 승인: user, 2026-08-14

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-14 | 최초 작성. 설계 인터뷰 확정 5건 — 시급 스냅샷은 `assignments`·`assignment_trainees`에 컬럼으로 담고, 확정 거부는 사유별 개별 오류 코드(LB026~LB030)로 나누며, 확인 다이얼로그의 경고 프리뷰는 화면이 이미 가진 데이터로 클라이언트 model 계층에서 계산하고, 시급 미설정 근무자의 배정·교육생 잔존은 구조 오류로 차단하며(기획 보강), 확정 함수는 자격을 재검사하지 않는다(ADMIN-FLOWS 잔재 문구 삭제). 2026-08-14 사용자 결정. |

- 관련 spec: PRD:INV-STAFF-01, PRD:INV-STAFF-02, PRD:AC-03, PRD:AC-04, DOMAIN:SCHEDULING, ADR:0003, DOCS:SDD(ADMIN-FLOWS 확정과 확정 후 변경 절)
- 적용 깊이: 깊음 — 금액(시급 스냅샷), DB 함수·트랜잭션, 배포된 테이블 두 개의 컬럼 추가, 감사 기록과 오류 코드가 는다.
- test mode: tdd
- 예정 check IDs: confirmation-transaction(확정 트랜잭션·구조 차단·스냅샷·원자성 pgTAP), understaffing-warning(미달·담당자 없음 경고 계산 단위 + 확정 흐름 e2e)

## 전제

- 기획 승인(2026-08-14)이 소유한 제품 결정을 다시 열지 않는다: 확정 경로(CLOSED→PREPARING→CONFIRMED 한 트랜잭션 통과), OPEN 확정 시 마감 동반, 구조 오류 4종 차단, 담당자 없음은 경고, 항상 확인 다이얼로그 하나, 경고는 감사 저장+화면 재계산, 정식·교육생 모두 스냅샷.
- 확정 후 변경·revision 증가·확정 후 취소는 P3-T09, 알림은 P4, 급여 계산은 P6, 배정표는 P3-T07 몫이다.
- 코드 대조 확정 사실: `schedules.revision` default 1과 상태 전이 트리거 존재(UPDATE에만 발화, 단계별 전이는 한 트랜잭션 안에서 순차 update로 통과 가능). `ceremonies.starts_at`, `schedules.planned_checkin`·`planned_checkout`(nullable 쌍), `position_requirements` 존재. `profiles.hourly_wage`는 nullable. `scheduling_audit_logs`(event·actor·schedule·detail jsonb) 존재. 다음 오류 코드 빈 자리는 LB026.

## Requirements

### 범위와 비목표

범위: 확정 RPC 하나, 스냅샷 컬럼 2개, 오류 코드 5개(LB026~LB030), 확정 버튼·확인 다이얼로그, 경고 프리뷰 순수 계산, 확정 감사 로그, pgTAP·단위·e2e.

비목표: 확정 후 변경 4종·revision 증가·CONFIRMED→CANCELLED(P3-T09), 알림(P4), 교육 칩 숨김 구현(P3-T09 기획에서 편입 판단), 배정표(P3-T07), 상태 전이 트리거 수정(없음).

### 불변 규칙

- 부분 확정 데이터가 남지 않는다 — 검증·경고·스냅샷·상태 전환·감사는 RPC 한 번의 단일 트랜잭션이다.
- 확정은 자격을 재검사하지 않는다(PRD 「자격은 배정을 만드는 순간에만 검사한다」).
- 스냅샷 컬럼의 쓰기 경로는 이 task 범위에서 `confirm_schedule` 하나뿐이다. `set_hourly_wage`는 스냅샷을 건드리지 않는다.
- 미달 판정은 정식 배정만 센다(INV-STAFF-02·03). 교육생은 집계 밖이다.
- 상태 전이 규칙(트리거)은 한 글자도 바꾸지 않는다.

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- 상태 전이 트리거가 한 트랜잭션 안의 순차 update(OPEN→CLOSED→PREPARING→CONFIRMED)를 거부하는 경우.
- 기존 pgTAP·단위·e2e 단언이 이 설계와 충돌하는 경우(특히 CONFIRMED 픽스처를 직접 insert하는 기존 테스트).
- 확정 다이얼로그에 필요한 데이터가 준비 화면 조회에 없어 조회 계약을 넓혀야 하는 경우.

### 기술 인수 조건

1. `confirm_schedule`이 단일 트랜잭션으로 구조 검증→경고 계산→시급 스냅샷→상태 전환→감사 기록을 수행하고, 어느 단계가 실패해도 아무 변경이 남지 않는다(pgTAP).
2. 구조 오류가 개별 코드로 거부된다 — LB026 예식 0개, LB027 예정 출퇴근 시각 미설정, LB028 필요 인원 표 미복사, LB030 시급 미설정 근무자(정식·교육생) 잔존. 상태 오류(CONFIRMED·CANCELLED)는 LB029다(pgTAP).
3. OPEN 스케줄 확정이 CLOSED를 경유하며 `schedule_closed` 감사 이벤트를 함께 남긴다(pgTAP).
4. 확정 시점에 `assignments`·`assignment_trainees` 전 행의 스냅샷이 당시 `profiles.hourly_wage`로 채워지고, 이후 `set_hourly_wage` 변경이 스냅샷을 바꾸지 않는다(pgTAP).
5. `schedule_confirmed` 감사 detail에 revision과 경고 목록(미달: 필요>정식 배정 수, 담당자 없음: 정식 0·교육생≥1 — 필요 인원 무관)이 기록된다(pgTAP).
6. 관리자가 아니면 42501로 거부되고, 이미 확정된 스케줄의 재시도는 LB029로 거부된다(pgTAP).
7. 준비 화면의 확정 버튼이 상태와 무관하게 확인 다이얼로그를 열고, 다이얼로그가 미달 목록·담당자 없음·OPEN이면 마감 안내를 보여주며, 확정 성공 후 화면이 확정 상태(읽기 전용 안내 포함)로 갱신된다(e2e).
8. 경고 프리뷰 계산이 model 계층 순수 함수이고 미달·담당자 없음·필요 0 경계를 단위로 단언한다(unit).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 단일 트랜잭션 | 테스트함 — pgTAP에서 확정 성공 후 상태·스냅샷·감사 세 가지를 함께 단언 | 테스트함 — 구조 오류로 거부된 호출 뒤 스냅샷·상태·감사가 전부 없음(원자성) | 테스트함 — 배정 0명·필요 전부 0 스케줄이 경고 0건으로 확정 | 테스트함 — 비관리자 호출이 42501로 거부 | 테스트함 — 성공 직후 재호출이 LB029 | 테스트함 — 행 잠금(for update) 후 상태 재검증으로 후발 호출이 LB029 |
| 2 구조 오류 개별 코드 | 해당 없음 — 아래 실패 칸이 본체 | 테스트함 — 예식 0개 LB026·예정 시각 null LB027·필요 인원 표 0건 LB028·시급 null 배정자 LB030을 각각 유도해 코드 단언 | 테스트함 — 예식 1개·필요 인원 행 1개는 통과, 시급 null 교육생만 있어도 LB030 | 해당 없음 — 1번 행이 소유 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 1번 행이 소유 |
| 3 OPEN 확정·마감 동반 | 테스트함 — pgTAP에서 OPEN 스케줄 확정 후 CONFIRMED 도달과 `schedule_closed`·`schedule_confirmed` 감사 두 건 단언 | 테스트함 — 전이 트리거 거부 시 예외가 그대로 드러남(정지 조건) | 테스트함 — CLOSED 스케줄 확정은 `schedule_closed` 없이 `schedule_confirmed`만 | 해당 없음 — 1번 행이 소유 | 해당 없음 — 위와 같다 | 해당 없음 — 1번 행이 소유 |
| 4 시급 스냅샷 | 테스트함 — pgTAP에서 정식·교육생 전 행의 스냅샷이 당시 시급과 일치 | 테스트함 — 확정 후 `set_hourly_wage` 변경이 스냅샷을 안 바꿈 | 테스트함 — 겸직자(두 포지션)는 사람 단위 1행이라 스냅샷도 1개 | 해당 없음 — 쓰기 경로가 확정 함수뿐 | 해당 없음 — 재확정이 LB029라 재기록 없음 | 해당 없음 — 1번 행이 소유 |
| 5 경고 감사 기록 | 테스트함 — pgTAP에서 미달·담당자 없음이 있는 스케줄의 감사 detail에 경고 목록·revision 단언 | 테스트함 — 경고 없는 스케줄의 detail에 빈 경고 목록 | 테스트함 — 필요 0·정식 0·교육생 1 포지션이 미달 아님·담당자 없음으로 기록 | 해당 없음 — 1번 행이 소유 | 해당 없음 — 위와 같다 | 해당 없음 — 1번 행이 소유 |
| 6 상태 오류 거부 | 해당 없음 — 아래 실패 칸이 본체 | 테스트함 — CONFIRMED·CANCELLED 스케줄 확정 시도가 LB029 | 테스트함 — 직접 insert된 CONFIRMED 픽스처(기존 테스트 방식)도 같은 거부 | 해당 없음 — 1번 행이 소유 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 1번 행이 소유 |
| 7 확정 UX | 테스트함 — e2e에서 버튼→다이얼로그(경고 목록·마감 안내)→확정→읽기 전용 화면 전환 | 테스트함 — 구조 오류 시 다이얼로그 오류 안내가 뜨고 화면이 준비 상태 유지 | 테스트함 — 경고 없는 스케줄도 다이얼로그를 거침 | 해당 없음 — 관리자 라우트 가드는 기존 e2e 소유 | 테스트함 — pending 중 버튼 비활성(훅 단위) | 해당 없음 — DB가 1번 행에서 소유 |
| 8 경고 프리뷰 계산 | 테스트함 — 단위에서 미달·담당자 없음 목록 산출 | 테스트함 — 교육생이 미달 계산에 섞이면 수가 어긋나 드러남 | 테스트함 — 필요 0 교육생만·전부 충족·전부 0 세 경계 | 해당 없음 — 계산 계층이다 | 해당 없음 — 순수 함수다 | 해당 없음 — 계산 계층이다 |

- 보충 위험: **단위 테스트는 Supabase를 mock한다** — 인수 조건 1~6의 실제 거부·원자성은 pgTAP로만 검증되고, 단위는 순수 계산(경고 프리뷰)과 훅 상태만 덮는다. **e2e 픽스처의 work_date 밴드** — 새 spec은 `work-date-band.ts`에 전용 밴드를 추가해 기존 spec과 겹치지 않게 한다(23505 재발 방지). **전이 트리거의 트랜잭션 내 다단 update**가 이 설계의 유일한 미실증 가정이라 pgTAP 첫 쌍(RED→GREEN)을 여기에 배정한다.

### DEV-* 적용 상태

- DEV-SEC: 기본 적용 — security definer, `set search_path = public, pg_temp` 고정(P3-T03 backlog의 pg_temp 미고정 지적을 반복하지 않는다), revoke 후 관리자 실행 grant, 권한 검사는 함수 안.
- DEV-DATA·DEV-SSOT: 기본 적용 — 스냅샷 정본은 두 테이블 컬럼, 경고 정본은 감사 로그.
- DEV-CACHE: 기본 적용 — 확정 성공 후 준비 화면 데이터 재조회(기존 저장 흐름과 같은 패턴).
- DEV-TIME: 해당 없음 — 시간 경계 계산 없음(마감 시각 파생은 기존 함수 소유).
- DEV-CODE-07·주석 금지·barrel 금지·server-only: 기본 적용.

## Architecture

- `src/features/confirmation/` 슬라이스 신설:
  - `api/confirm-schedule.ts` — server-only server action. Zod 입력(scheduleId uuid), RPC 호출, 오류 코드 매핑. 단위 테스트 필수(fsd.json api 세그먼트).
  - `hooks/useConfirmSchedule.ts` — pending·오류·성공 상태와 성공 후 재조회. 단위 테스트 필수.
  - `ui/ConfirmScheduleDialog.tsx` — 표시는 prop으로 받은 경고 목록·안내뿐, 계산 없음. `src/shared/ui/dialog` 재사용.
- 경고 프리뷰 계산은 `src/views/admin-schedule/model/confirmation-warnings.ts` 신설 — 준비 화면이 이미 가진 포지션별 필요·배정·교육 수를 입력으로 받는 순수 함수. UI에 로직을 두지 않는다.
- `AdminSchedulePrepView.tsx`가 버튼·다이얼로그를 배선한다(계산·상태 관리 없음). import 방향은 views→features로 기존과 같다.
- DB 경계: 쓰기는 `confirm_schedule` 정의자 함수 하나. 새 RLS 정책 없음(기존 select 정책 유지, 쓰기는 RPC 전용 — P3-T05 revision 3 정정과 같은 결).

## Data model

- 새 마이그레이션 `supabase/migrations/20260815000000_schedule_confirmation.sql` 하나. 기존 마이그레이션 소급 수정 없음.
  - `alter table assignments add column hourly_wage_snapshot integer` + `check (hourly_wage_snapshot > 0)`.
  - `alter table assignment_trainees add column hourly_wage_snapshot integer` + 같은 check. 두 컬럼 다 nullable — null은 「아직 미확정」을 뜻한다.
  - `create function confirm_schedule(target_schedule_id uuid) returns jsonb`:
    1. 관리자 검사(42501) → `schedules` 행 `for update` 잠금 → 상태 검사(CONFIRMED·CANCELLED면 LB029).
    2. 구조 검증: `ceremonies` 0건 LB026, `planned_checkin is null` LB027, `position_requirements` 0건 LB028, 시급 null 배정자·교육생 존재 LB030.
    3. 경고 계산(미달·담당자 없음)을 SQL로 집계.
    4. 스냅샷: 두 테이블의 이 스케줄 전 행에 당시 `profiles.hourly_wage` 기록.
    5. 상태 순차 update — OPEN이면 CLOSED로 먼저(+`schedule_closed` 감사, detail `{"trigger": "confirmation"}`), 이어 PREPARING, CONFIRMED.
    6. `schedule_confirmed` 감사 insert — detail에 revision(확정 시 1)과 경고 목록.
    7. `jsonb_build_object('revision', …, 'warnings', …)` 반환.
- 전이 트리거는 UPDATE마다 단계 검증하므로 순차 update가 규칙을 그대로 통과한다. 트리거 무수정.

## Interface

- server action 응답은 기존 `{ ok } | { ok: false, code }` 계약을 따른다. `error-codes.config.ts`에 5개 추가:
  - LB026 `SCHEDULING_CONFIRM_NO_CEREMONY` "예식을 먼저 만들어 주세요"
  - LB027 `SCHEDULING_CONFIRM_NO_PLANNED_TIME` "예정 출퇴근 시각을 먼저 설정해 주세요"
  - LB028 `SCHEDULING_CONFIRM_NO_REQUIREMENTS` "필요 인원 표를 먼저 열어 주세요"
  - LB029 `SCHEDULING_CONFIRM_INVALID_STATUS` "확정할 수 없는 상태예요"
  - LB030 `SCHEDULING_CONFIRM_MISSING_WAGE` "시급이 설정되지 않은 근무자가 있어요"
  - 기존 코드의 문구·http는 무수정.
- 멱등: 재시도·동시 확정 모두 LB029 거부가 계약이다. 성공 응답의 경고 목록은 다이얼로그 프리뷰가 아니라 확정 확정본(감사와 동일)이다.
- 오프라인·재시도 정책: 기존 mutation 흐름과 동일(추가 결정 없음).

## Optimizations

- 확정은 RPC 왕복 1회. 프리뷰는 왕복 0회(화면 보유 데이터).
- 실패 로그 이벤트는 기존 features api 로깅 패턴을 따른다(`confirm_schedule_failed`).
- 되돌림: 마이그레이션은 컬럼 추가·함수 신설뿐이라 drop으로 되돌릴 수 있고, 확정된 데이터의 되돌림 경로는 만들지 않는다(P3-T09 소유).

## 변경 허용 경로

```
supabase/migrations/20260815000000_schedule_confirmation.sql
supabase/tests/21-schedule-confirmation.test.sql
src/features/confirmation/**
src/views/admin-schedule/**
src/app/(protected)/admin/schedule/[id]/page.tsx
src/shared/config/error-codes.config.ts
tests/e2e/schedule-confirmation.spec.ts
tests/e2e/support/**
docs/execution/radio/P3-T06-radio.md
docs/execution/runs/P3-T06/**
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/views/admin-schedule/**`는 경고 프리뷰 함수 신설과 버튼·다이얼로그 배선에만 쓰고 필요 인원·배정 동작을 바꾸지 않는다. `error-codes.config.ts`는 코드 5개를 더하는 데만 쓰고 기존 코드의 문구·http를 바꾸지 않는다. `tests/e2e/support/**`는 밴드 1개 추가와 기존 헬퍼 재사용에만 쓴다.
- `docs/product/**`는 의도적으로 빠져 있다. PRD·ADMIN-FLOWS·DECISIONS 수정은 기획·설계 승인 시점에 조정자가 이미 끝냈다.
- 위 밖의 파일이 필요해지면 멈추고 반환한다.

## 미결 사항

- 확정 후 추가 배정자·교육생의 스냅샷 시점 — P3-T09 기획.
- 교육 칩 숨김 구현 편입 — P3-T09 기획.
- 탈퇴자 배정의 미달 계산 제외(PRD 125) — 탈퇴 흐름 task.
- P4 phase 의존성에 P3-T09 편입 여부 — P4 기획.
