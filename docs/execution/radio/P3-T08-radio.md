# P3-T08 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-16

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-16 | 최초 작성. 기획 확정 — 공백 메우기 재정의, 범위는 네 묶음 전부(축 단위 공백·backlog 단언 10건·P3 UI 단위 10종·e2e 위생 7건), 제품 결정 4건은 P3-T11 분리. 2026-08-16 사용자 결정. |

- 관련 spec: PRD 4~7절, PRD:INV-STAFF-01~03, PRD:AC-03~05, DOCS:SDD. 기획 정본은 phase 03 P3-T08 절과 2026-08-16 커버리지 조사(기획 인터뷰 기록에 요약 보존).
- 적용 깊이: 얕음 — 테스트 파일과 e2e 지원 코드만 변경. 제품 코드(`src/**` 비테스트)·DB 스키마·문서 계층 무변경.
- 예정 check IDs: verify, assignment-confirmation-e2e

## 전제

- 기획 승인(2026-08-16)이 소유한 결정을 다시 열지 않는다: 네 묶음 범위, 제품 결정 4건의 P3-T11 분리, 부하성 타임아웃(backlog 329)·TDD 증거 정합 계열(298·312·320·326) 제외.
- `test_mode: verification` — RED→GREEN 의무 없음. 증거는 신규·보강 단언 수와 `pnpm verify` GREEN 로그를 `runs/P3-T08/radio.md`에 남긴다.
- 코드 대조로 확인된 사실: e2e `insertSchedule`(assignment-schedule-fixtures.ts)의 status 유니언은 `"OPEN" | "CONFIRMED"` — 상태 전이 트리거는 update만 다루므로 CLOSED·PREPARING 직접 insert 확장이 가능하다는 전제이며, 막히면 정지 조건이다. 감사 actor 단언 관례는 15번 pgTAP(`results_eq`로 `actor_profile_id` 대조)에 있다. UI 단위 관례는 `src/features/approval/ui/__tests__/ApprovalActionButtons.test.tsx`(testing-library render + userEvent 상호작용)가 정본이다. e2e 밴드 다음 빈 구간은 495부터다.

## Requirements

### 범위와 비목표

범위(네 묶음):

1. **축 단위 공백** — CLOSED·PREPARING 상태의 수정 RPC 허용 단언(pgTAP 18·19·20 픽스처 확장 + e2e `insertSchedule` 유니언 확장), P3 감사 actor 단언 복구(17~23번, 15번 관례)와 배정 전원 해제 감사 단언(19번), 확정→배정표 단일 여정 e2e 신설(`tests/e2e/confirmation-roster-journey.spec.ts`, 전용 밴드 `confirmationJourney { 495, 526 }`), 한 계층뿐인 규칙 6건 보강 — 확정 차단 4종 e2e(기존 schedule-confirmation spec), 교육 칩 숨김 e2e(assignment-trainee spec), 마지막 예식 단독 변경 재추천 단위(useCeremonyEditor·ceremony-times), 전역 기본값 비전파 pgTAP(18번), 필요 0 포지션 정식 배정 pgTAP(19번), 기본 포지션 지정·해제 전이 pgTAP(19번).
2. **backlog 단언 계열 10건 흡수** — 스왑11 4-인자 전환(20번, P3-T05 F-12), 프로덕션 4-인자 경로 AC7 전이(20번, F-13), 픽스처 서술-사실 괴리 정정(20번, F-01), roster 예정 시각·예식 값 단언(22번, P3-T07 F-01), roster 대상 격리 픽스처(22번, F-03), `bump_confirmed_revision` revoke·`cancel_confirmed_schedule` grant 회귀(23번, P3-T09 F-06), AC8 경계값 단위(candidate-buckets.test.ts, F-08), 19번 단언 설명 정정(F-09), 복사 on-conflict 분기 실행(18번 — 선삽입 후 복사 호출로 conflict 경로 실증, P3-T02), 동시 확정(21번, P3-T06 F-04 — 병렬 트랜잭션은 pgTAP 단일 연결 한계로 실증 불가, 재호출 LB029·revision 불변·스냅샷 불변 단언 보강으로 대체 종결하고 사유를 backlog 줄에 남긴다).
3. **P3 UI 단위 10종** — ConfirmScheduleDialog·CancelScheduleDialog(features/confirmation/ui), AssignmentCandidateSheet(features/assignment/ui), MissingPositionsBanner·RequirementTable(features/requirement/ui), CeremonyGenerateForm·CeremonyListEditor·CheckInRuleEditor·PlannedTimesEditor·RecommendationConfirmDialog(features/ceremony/ui) — approval 관례 수준(렌더 + 핵심 상호작용 + 콜백 호출). `AdminSchedulePrepView`는 view 합성층이라 스코프 판단을 구현 중 확정하되 최소 렌더 스모크는 남긴다.
4. **e2e 위생 7건** — 정리 불가 픽스처 정돈(ceremony-edit·position-requirements의 무효 schedules delete 제거, P3-T10 관례), try/finally 부재(assignment-eligibility), 겸직 test의 밴드 나눠쓰기(assignment-eligibility에 `splitBand` 적용), 공용 픽스처 이름 접두 중립화(assignment-schedule-fixtures.ts의 `e2e-assignment-eligibility-*` 이메일 접두를 `e2e-assignment-*`로 — 이메일 문자열이라 동작 무영향 전제), `workDatesInSameMonth` count 가드(work-date-band.ts), 날짜 산출·파싱 사본 통합(schedule·recruitment 2종·tab-navigation spec이 work-date-band 헬퍼를 쓰도록).

비목표: 제품 코드(`src/**` 비테스트 파일)·DB 스키마·시나리오와 단언의 의미 약화·P3-T11 4건·backlog 329(부하성)·298 계열(TDD 증거 정합).

### 불변 규칙

- 기존 단언은 약화 없이 유지된다. 보강·추가·정정(사실과 반대인 설명 문자열)만 한다.
- 신규 e2e는 전용 밴드를 쓰고, spec 내 다중 테스트는 `splitBand` 정적 하위 구간을 쓴다(P3-T10 확립 관례).
- UI 단위 테스트는 컴포넌트 코드를 바꾸지 않고 현재 인터페이스 그대로 검증한다.

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- CLOSED·PREPARING 직접 insert가 제약·트리거에 막히는 경우.
- UI 컴포넌트가 현 구조로 테스트 불가(서버 전용 의존 등)해 제품 코드 변경이 필요한 경우.
- backlog 흡수 항목이 단언 불가로 판명나는 경우(대체 종결 사유가 위 범위 서술에 없는 항목).
- 픽스처 접두 중립화·헬퍼 사본 통합이 다른 spec의 동작·단언에 영향을 주는 경우.

### 기술 인수 조건

1. 18·19·20번 pgTAP에 CLOSED·PREPARING 픽스처가 추가되고 수정 RPC 허용이 상태별로 단언된다. e2e `insertSchedule`이 4상태 유니언을 받고 최소 1개 e2e가 CLOSED 또는 PREPARING 경로를 지난다.
2. 17~23번 각각에 감사 actor 단언이 1건 이상 있고, 19번에 전원 해제(빈 배열) 감사 단언이 있다.
3. `confirmation-roster-journey.spec.ts`가 관리자 확정(confirm_schedule 경유)부터 근무자 배정표 열람까지 한 여정으로 GREEN이다.
4. 한 계층뿐 규칙 6건이 각 지정 계층에 단언된다(위 범위 1 참조).
5. backlog 단언 10건이 흡수되고 해당 줄이 완료 체크된다(동시 확정은 대체 종결 사유 병기).
6. UI 단위 10종이 approval 관례 수준으로 존재하고 GREEN이다.
7. e2e 위생 7건이 적용되고 해당 backlog 줄이 완료 체크된다.
8. `pnpm verify` 전체 GREEN + db reset 없는 e2e 전체 연속 2회 GREEN.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 상태 축 | 테스트함 — CLOSED·PREPARING에서 수정 RPC 성공 단언 | 테스트함 — CANCELLED 거부는 기존 단언 유지 확인 | 테스트함 — 4상태 각각의 허용·거부 표가 전이 트리거 계약과 일치 | 해당 없음 — 권한 단언은 기존 42501이 소유 | 해당 없음 — 픽스처 확장 | 해당 없음 — 단일 연결 pgTAP |
| 2 감사 actor | 테스트함 — 15번 관례로 호출 관리자 대조 | 테스트함 — 전원 해제 감사 부재가 실패로 드러나는 단언 | 해당 없음 — actor는 값 대조뿐 | 테스트함 — actor가 호출자와 일치(위조 불가 경로) | 해당 없음 — 읽기 단언 | 해당 없음 — 단일 연결 |
| 3 여정 e2e | 테스트함 — 본체(확정→열람 GREEN) | 테스트함 — 여정 중간 실패 시 spec이 RED로 드러남 | 테스트함 — 전용 밴드 495~526, 다중 테스트면 splitBand | 테스트함 — 근무자 계정으로 열람 구간 실행 | 해당 없음 — 시나리오 1회 | 해당 없음 — 날짜 격리 |
| 4 한 계층 규칙 | 테스트함 — 6건 각각 지정 계층 단언 | 테스트함 — 확정 차단 4종 e2e가 각 오류 안내를 단언 | 테스트함 — 필요 0+정식 배정, 마지막 예식 단독 변경 | 해당 없음 — 기존 계층이 소유 | 해당 없음 — 단언 추가 | 해당 없음 — 단언 추가 |
| 5 backlog 흡수 | 테스트함 — 10건 각각 목표 파일에 단언 | 테스트함 — revoke·grant 회귀가 privilege 단언으로 고정 | 테스트함 — AC8 경계값(currentlyAssigned true·other 없음) | 테스트함 — revoke 단언이 본체 | 해당 없음 — 단언 추가 | 테스트함 — on-conflict 분기 실증, 동시 확정은 대체 종결 사유 병기 |
| 6 UI 단위 | 테스트함 — 렌더+상호작용+콜백 10종 | 테스트함 — 오류 안내 표시 케이스 포함(다이얼로그류) | 해당 없음 — 깊이는 approval 관례 수준 | 해당 없음 — UI 계층 | 해당 없음 — UI 계층 | 해당 없음 — UI 계층 |
| 7 e2e 위생 | 테스트함 — 적용 후 전체 e2e GREEN | 테스트함 — db reset 없는 연속 2회 GREEN | 테스트함 — count 가드가 27 이상에서 명시 오류 | 해당 없음 — 테스트 코드 | 해당 없음 — 테스트 코드 | 테스트함 — 밴드 나눠쓰기 해소가 splitBand 정적 구간 |

- 보충 위험: **UI 10종 중 서버 의존 컴포넌트** — 테스트 불가 구조 발견 시 제품 코드를 고치지 않고 정지 조건으로 반환한다. **픽스처 접두 중립화**는 이메일 문자열 치환이라 동작 무영향이 전제 — 스펙 파일 안에 같은 접두를 검사하는 단언이 있으면 정지 조건이다. **날짜 헬퍼 사본 통합**은 대상 spec 3종(schedule·tab-navigation·recruitment 2종)의 단언 의미를 바꾸지 않는 순수 치환만 허용.

### DEV-* 적용 상태

- DEV-TEST: 본체 — 단언 보강·관례 복구가 task의 전부다.
- DEV-SEC: 해당 없음(단언 추가 관점만) — revoke·grant 회귀 단언은 5번 행이 소유.
- DEV-TIME·DEV-DATA·DEV-CACHE·DEV-OFFLINE: 해당 없음 — 제품 코드 무변경.

## Architecture

- 테스트 계층만 변경. pgTAP 17~23번 보강, `src/**/__tests__/**` 신설 10종(+AdminSchedulePrepView 스모크 선택), e2e spec 6종 보강 + 여정 spec 1종 신설, support 2파일(work-date-band.ts 밴드 1개·가드, assignment-schedule-fixtures.ts 유니언 확장·접두 중립화).
- 밴드 등록: `confirmationJourney { minMonthsAhead: 495, maxMonthsAhead: 526 }` — 기존 최댓값 493 뒤 비겹침.
- UI 단위 파일 위치는 각 컴포넌트 형제 `__tests__/` — fsd.json 세그먼트 규칙이 요구하는 자리 그대로다.

## Data model

해당 없음 — DB 변경 없음.

## Interface

해당 없음 — 신설 공개 인터페이스 없음. `insertSchedule` status 유니언 확장(`"OPEN" | "CLOSED" | "PREPARING" | "CONFIRMED"`)과 `workDatesInSameMonth` count 가드(26 초과 시 명시 오류 throw)는 테스트 지원 코드 내부 계약이다.

## Optimizations

해당 없음 — 실행 시간에 유의미한 영향 없는 단언·테스트 추가다.

## 변경 허용 경로

```
supabase/tests/17-ceremony-schema.test.sql
supabase/tests/18-position-requirements.test.sql
supabase/tests/19-assignments.test.sql
supabase/tests/20-assignment-trainees.test.sql
supabase/tests/21-schedule-confirmation.test.sql
supabase/tests/22-confirmed-roster.test.sql
supabase/tests/23-post-confirmation-changes.test.sql
src/features/confirmation/ui/__tests__/**
src/features/assignment/ui/__tests__/**
src/features/requirement/ui/__tests__/**
src/features/ceremony/ui/__tests__/**
src/views/admin-schedule/ui/__tests__/**
src/views/admin-schedule/model/__tests__/candidate-buckets.test.ts
src/features/ceremony/hooks/__tests__/useCeremonyEditor.test.ts
src/entities/schedule/model/__tests__/ceremony-times.test.ts
tests/e2e/confirmation-roster-journey.spec.ts
tests/e2e/schedule-confirmation.spec.ts
tests/e2e/assignment-trainee.spec.ts
tests/e2e/assignment-eligibility.spec.ts
tests/e2e/ceremony-edit.spec.ts
tests/e2e/position-requirements.spec.ts
tests/e2e/schedule.spec.ts
tests/e2e/tab-navigation.spec.ts
tests/e2e/recruitment-manage.spec.ts
tests/e2e/recruitment-open.spec.ts
tests/e2e/support/work-date-band.ts
tests/e2e/support/assignment-schedule-fixtures.ts
docs/execution/runs/P3-T08/**
docs/execution/reviews/backlog.md
docs/execution/phases/index.jsonl
docs/execution/radio/P3-T08-radio.md
```

- 용도 한정: pgTAP 7파일과 기존 e2e 9파일은 단언 보강·정정·위생 적용에만 쓴다 — 기존 단언 약화 금지. `schedule.spec.ts`·`tab-navigation.spec.ts`·`recruitment-manage.spec.ts`·`recruitment-open.spec.ts`는 날짜 헬퍼 사본 통합의 순수 치환에만 쓴다. `src/**/__tests__/**`는 신설 테스트 파일 추가에만 쓴다(형제 제품 코드 무수정). `backlog.md`는 흡수 항목 완료 체크(+동시 확정 대체 종결 사유 병기)에만 쓴다. `index.jsonl`은 상태 전환에만 쓴다.

## 미결 사항

- 없음.
