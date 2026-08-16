# P3-T11 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-16

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-16 | 최초 작성. 기획 결정 3건(경고 사후 조회는 화면 재계산으로 충족, 담당자 없음 경고의 표 밖 포지션 포함, 비활성 포지션 축소만 허용)의 구현 설계. |

- 관련 spec: PRD:INV-STAFF-01, PRD 필요 인원과 배정 절, PRD 포지션 절(148행 비활성), DOMAIN:SCHEDULING, DOCS:SDD(ADMIN-FLOWS 배정 절)
- 적용 깊이: 중간 — 배포된 정의자 함수 2종 재정의(경고 계산·비활성 검사), 화면 경고 모델 확장. 스키마·오류 코드·상태 전이 무변경.
- test mode: tdd
- 예정 check IDs: confirmation-warning-surface(표 밖 포지션 경고 합집합 pgTAP·단위 + 비활성 축소 허용 pgTAP)

## 전제

- 기획 승인(2026-08-16)이 소유한 제품 결정을 다시 열지 않는다: 경고 사후 조회는 준비 화면 실시간 재계산으로 충족(확정 응답 경고를 버리는 클라이언트는 결함 아님 — 코드 무변경), 담당자 없음 경고는 표에서 지워진 포지션이라도 정식 배정 없이 교육생만 남으면 포함(기존 규칙 「정식 0 + 교육생 ≥1」의 계산 범위 확장, DB·화면 동일 규칙), 비활성 포지션은 축소만 허용(제거·전원 해제 통과, 새 사람 추가만 거부).
- 코드 대조 확정 사실: `confirm_schedule` 최종본은 20260815000000 — 경고 CTE `position_counts`가 `schedule_position_requirements`만 소스로 써 표 밖 포지션이 계산에서 빠진다. `replace_position_assignments` 최종본은 20260817000000:424 — 비활성 검사(486행)가 added diff 계산(517~548행) **앞**에서 무조건 22023으로 거부한다. `assignment_eligibility`는 포지션 활성 여부를 검사하지 않으므로 비활성 검사를 diff 계산 뒤로 옮겨도 다른 오류가 선점하지 않는다. `remove_position_requirement`는 배정·교육생 잔존 행의 삭제를 막지 않는다(LB034 마지막 행 보증만) — 표 밖 교육생 잔존은 정상 RPC 경로로 만들 수 있는 상태다. `computeConfirmationWarnings`는 `requirementRows`만 순회하고, `listScheduleRequirements`의 교육생 쿼리는 `position_id`만 선택해 표 밖 포지션의 이름이 화면에 없다. 19번 pgTAP의 기존 비활성 단언(404행)은 신규 추가 케이스라 완화 후에도 유지되고, 21번의 무경고 케이스(337행)는 빈 배열 동등 단언이라 합집합 확장과 충돌하지 않는다.

## Requirements

### 범위와 비목표

범위: 마이그레이션 1개(`confirm_schedule` 경고 합집합 + `replace_position_assignments` 비활성 완화 재정의), `listScheduleRequirements` 교육생 포지션 이름 반환, `computeConfirmationWarnings` 합집합 확장, 준비 화면 prop 전달, pgTAP 19·21·23 단언, 단위 2파일 갱신, backlog 277·305·306 종결.

비목표: 확정 당시 경고 스냅샷 조회 UI(감사 기록으로 충분 — 기획), `confirm-schedule.ts` feature 변경(경고 폐기는 확정 동작 — 기획), 경고 상세 확장(P3-T07 F-07 — backlog 유지), 신규 e2e(표시 경로 무변경 — 아래 인수 조건 6), 오류 코드 신설, 알림(P4).

### 불변 규칙

- 담당자 없음 규칙은 「정식 배정 0명 + 교육생 ≥1」 그대로다 — 이번 변경은 계산 대상 포지션의 합집합 확장뿐이다. 표 밖 포지션에 정식 배정만 남은 경우는 어떤 경고도 만들지 않는다(필요 인원 0으로 취급되어 미달도 아니다).
- DB(`confirm_schedule`)와 화면(`computeConfirmationWarnings`)의 경고 규칙은 동일하다. 어느 한쪽만 고치지 않는다.
- 비활성 거부의 문구·errcode(`'비활성 포지션에는 배정할 수 없습니다'`, 22023)는 유지한다 — 기존 단위 매핑·pgTAP 문구 단언 무변경. 거부 조건만 「추가 인원(정식·교육생) 존재」로 좁힌다.
- `replace_position_assignments`의 기존 검증 블록(자격·성별·교육생 겸직·시급·revision)은 무수정이다. 비활성 검사의 위치와 조건만 바뀐다.
- `confirm_schedule`의 차단 4종·상태 전이·스냅샷·감사 형태는 무수정이다. warnings jsonb의 키·항목 구조도 그대로다(항목이 늘 뿐).

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- 기존 pgTAP·단위·e2e가 「비활성 포지션의 축소·전원 해제 거부」를 인수 조건으로 단언한 경우(19번 404행의 신규 추가 거부는 충돌 아님 — 유지된다).
- 화면 경고 확장이 `src/shared/ui/**` 변경을 요구하는 경우.
- 교육생 쿼리의 positions 임베드가 RLS·조회 계약 문제로 이름을 읽지 못해 조회 계약을 넓혀야 하는 경우.

### 기술 인수 조건

1. 필요 인원 행을 지운 포지션에 교육생만 남은 스케줄을 확정하면, 반환 jsonb와 `schedule_confirmed` 감사 detail 양쪽의 `warnings.no_manager`에 그 포지션이 이름·trainee_count 값으로 들어간다(pgTAP 21).
2. 표 밖 포지션에 정식 배정만 남은 경우 `understaffed`·`no_manager` 어느 쪽에도 나타나지 않는다(pgTAP 21 경계).
3. 비활성 포지션에서 부분 축소·전원 해제가 성공하고(OPEN 경로 19번, CONFIRMED 경로 23번 — revision +1·감사 동반), 정식·교육생 새 인원 추가는 기존 문구 22023으로 거부되며 거부 후 데이터 무변화다(pgTAP).
4. `computeConfirmationWarnings`가 표 밖 교육생 잔존 포지션을 noManager로 산출하고, 표 밖 정식 잔존은 무경고이며, 표 안 규칙은 기존 단언 그대로다(단위 — RED 먼저).
5. `listScheduleRequirements`가 교육생 포지션의 이름·정렬 정보를 반환한다(단위).
6. 준비 화면 경고 배너·확정 다이얼로그는 확장된 계산 결과를 기존 렌더링으로 그린다 — 신규 e2e 없음, 기존 e2e 전체 GREEN 유지가 증거다.
7. backlog 277·306은 이 구현으로 해소, 305는 결함 아님(기획 결정)으로 종결한다 — 종결 기재는 조정자 몫.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1·2 DB 경고 합집합 | 테스트함 — 행 삭제 후 확정, 반환·감사 no_manager 값 단언 | 테스트함 — 표 밖 정식 잔존 무경고 | 테스트함 — 표 안 포지션 기존 경고 단언 유지(무경고 동등 단언 337행 포함) | 해당 없음 — 기존 42501 단언 소유 | 해당 없음 — 확정 재시도는 LB029 기존 소유 | 해당 없음 — 확정 잠금은 P3-T06 소유 |
| 3 비활성 축소 | 테스트함 — 부분 축소·전원 해제 lives_ok, CONFIRMED는 revision·감사 동반 | 테스트함 — 정식 추가·교육생 추가 각각 22023 거부, 거부 후 행수 무변화 | 테스트함 — 축소와 동시에 추가가 섞인 호출은 거부(added 존재) | 해당 없음 — 기존 42501 단언 소유 | 테스트함 — 같은 축소 재호출은 changed=false 기존 경로 | 해당 없음 — for update 기존 소유 |
| 4 화면 규칙 동일성 | 테스트함 — 표 밖 교육생 잔존 noManager 산출(RED 먼저) | 테스트함 — 표 밖 정식 잔존 무경고 | 테스트함 — 표 안 기존 케이스 회귀 없음, 표 밖 항목의 정렬 위치 | 해당 없음 — 순수 함수 | 해당 없음 — 순수 함수 | 해당 없음 — 순수 함수 |
| 5 조회 확장 | 테스트함 — 교육생 포지션 이름·정렬 반환 | 테스트함 — 실패 매핑 기존 단언 유지 | 테스트함 — 교육생 0명이면 빈 배열 | 해당 없음 — 기존 42501 매핑 소유 | 해당 없음 — 읽기 멱등 | 해당 없음 — 읽기 전용 |

- 보충 위험: **기존 단언 대조를 선확인한다** — `ComputeConfirmationWarningsInput` 필드 추가로 기존 단위 테스트 입력 리터럴이 컴파일 실패한다. 갱신은 허용 경로 내 알려진 범위(입력 확장 정합)이며 기존 단언 약화는 금지다. e2e 픽스처는 필요 인원 행을 지우지 않으므로 기존 e2e 경고 단언과 충돌하지 않는다. 밴드 변경 없음(신규 e2e 없음).

### DEV-* 적용 상태

- DEV-SEC: 기본 적용 — 두 함수 재정의 시 security definer·search_path·revoke/grant 관례를 그대로 보존한다. 권한 검사 무변경.
- DEV-DATA·DEV-SSOT: 기본 적용 — 경고 규칙의 정본은 DB 함수이고 화면은 같은 규칙의 재계산이다. 전용 경고 저장소를 만들지 않는다(기획).
- DEV-CACHE: 기본 적용 — 조회·저장 흐름 무변경, 새 캐시 없음.
- DEV-TIME: 해당 없음 — 시각 계산 없음.
- DEV-CODE-07·주석 금지·barrel 금지·server-only: 기본 적용.

## Architecture

- DB 경계가 정본: 경고 합집합·비활성 완화 모두 정의자 함수 안이다. 클라이언트는 표시만 한다.
- `entities/schedule/api/list-schedule-requirements.ts` — 교육생 쿼리를 `position_id, positions(name, sort_order)` 임베드로 확장하고, 결과에 교육생 포지션 메타(`traineePositions: { positionId, positionName, sortOrder }[]`, 중복 제거)를 추가한다. 기존 필드·정렬·절단 가드 무수정.
- `views/admin-schedule/model/confirmation-warnings.ts` — 입력에 `traineePositions` 추가. 표 행 순회는 기존 그대로, 그 뒤 표 밖 교육생 포지션(assigned 0 + trainee ≥1)을 sortOrder·이름순으로 noManager에 덧붙인다.
- `AdminSchedulePrepView`·`page.tsx` — prop 전달만. 경고 배너·다이얼로그 렌더링 무수정.
- `features/confirmation/api/confirm-schedule.ts` — 무수정(기획 결정 ①).

## Data model

- 새 마이그레이션 `supabase/migrations/20260818000000_confirmation_warning_scope.sql` 하나. 기존 마이그레이션 소급 수정 없음.
  - `confirm_schedule` 재정의 — `position_counts` CTE의 소스를 「필요 인원 행 ∪ 교육생 잔존 포지션」 합집합으로 바꾸고 표 밖 포지션의 `required_count`는 0으로 둔다. 필터(`required_count > assigned_count`, `assigned_count = 0 and trainee_count >= 1`)·정렬·본문 나머지는 무수정.
  - `replace_position_assignments` 재정의 — 486행의 무조건 비활성 거부를 제거하고, added diff 계산 직후·자격 루프 앞에 「`position_active`가 false이고 added_ids 또는 added_trainee_ids가 비어 있지 않으면」 같은 문구·errcode로 거부하는 검사를 둔다. 본문 나머지는 무수정.
- 스키마(테이블·컬럼)·오류 코드·상태 전이 변경 없음.

## Interface

- `ListScheduleRequirementsResult`에 `traineePositions` 추가 — 기존 필드·호출부 계약 무변경.
- `ComputeConfirmationWarningsInput`에 `traineePositions` 추가(필수 필드). 산출 타입 `ConfirmationWarnings` 무변경.
- RPC 시그니처·반환 형태·오류 코드·server action 매핑 전부 무변경.

## Optimizations

- 조회 왕복 수 무변경(교육생 쿼리에 임베드 컬럼만 추가). 확정 왕복 무변경.
- 되돌림: 두 함수 재정의는 이전 정의 재적용으로 되돌릴 수 있다. 스키마 변경이 없어 데이터 되돌림도 없다.

## 변경 허용 경로

```
supabase/migrations/20260818000000_confirmation_warning_scope.sql
supabase/tests/19-assignments.test.sql
supabase/tests/21-schedule-confirmation.test.sql
supabase/tests/23-post-confirmation-changes.test.sql
src/entities/schedule/api/list-schedule-requirements.ts
src/entities/schedule/api/__tests__/list-schedule-requirements.test.ts
src/views/admin-schedule/model/confirmation-warnings.ts
src/views/admin-schedule/model/__tests__/confirmation-warnings.test.ts
src/views/admin-schedule/ui/AdminSchedulePrepView.tsx
src/app/(protected)/admin/schedule/[id]/page.tsx
docs/execution/radio/P3-T11-radio.md
docs/execution/runs/P3-T11/**
docs/execution/phases/index.jsonl
```

- 용도 한정: pgTAP 3파일은 신규 단언 추가와 plan 수 조정에만 쓴다 — 기존 단언 약화·삭제는 금지이고, 비활성 전면 거부를 고정한 기존 단언을 발견하면 고치지 말고 멈춰 반환한다(정지 조건 1). `AdminSchedulePrepView.tsx`·`page.tsx`는 prop 전달에만 쓴다. 단위 2파일의 기존 단언 갱신은 입력 확장 정합에 한정한다.
- `docs/product/**`·`docs/execution/reviews/**`는 의도적으로 빠져 있다. 정합화·backlog 종결은 조정자 몫이다.
- 위 밖의 파일이 필요해지면 멈추고 반환한다.

## 미결 사항

- 경고 상세 확장(미배정 근무자 목록 등, P3-T07 F-07)은 backlog 유지 — 필요 시 새 기획.
- 표 밖 경고 여정 e2e는 이번에 만들지 않는다 — 후속 위생 task 후보.
