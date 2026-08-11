# P3-T04 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-11
- 개발 설계 승인: user, 2026-08-11

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-11 | 최초 작성. 설계 인터뷰 확정 3건 — 겸직 e2e를 기존 `assignment-eligibility.spec.ts`에 붙이고, 테스트가 드러낸 불일치는 화면·집계 코드까지만 이 task에서 고치며, DB 함수 쪽 불일치는 멈추고 결정 신호로 반환한다. 2026-08-11 사용자 결정. |

- 관련 spec: PRD:INV-STAFF-03, PRD:AC-04, DOMAIN:SCHEDULING, DOCS:SDD(ADMIN-FLOWS 배정 절)
- 적용 깊이: 일반 — 서버 경계·권한·개인정보·금액 계산·DB 스키마가 바뀌지 않는다. 늘어나는 것은 읽기 응답의 스칼라 하나와 화면 한 줄이다.
- test mode: tdd
- 예정 check IDs: multi-position-coverage(겸직 집계 단위), headcount-line(실인원 줄 표시·비표시 단위), multi-position-e2e(겸직 추가·한쪽 제거·마지막 제거·두 번째 자격 검사)

## 전제 정정

기획 인터뷰가 이 task의 전제를 뒤집었다. `03-assignment-and-confirmation.md`의 P3-T04 절 「알려진 사실」이 그 정정을 소유하며 이 문서는 요약만 싣는다.

**복수 포지션은 이미 화면·서버·DB에서 동작한다.** P3-T03이 자기 범위 밖이라고 적어 둔 부분까지 함께 만들었다. 따라서 이 task는 만드는 task가 아니라 **회귀 보호를 씌우고 겸직 때문에 어긋나는 표시 하나를 메우는** task다.

## Requirements

### 범위와 비목표

- 범위: ① 실인원 스칼라를 읽기 응답에 더한다 ② 실인원과 포지션 합계가 다를 때만 줄을 띄우는 판정을 순수 함수로 둔다 ③ 필요 인원 표 위에 그 줄을 그린다 ④ 겸직 시나리오를 e2e로 덮는다 ⑤ 집계·판정을 단위로 덮는다.

- 설계 비목표: 근무자 우선 화면 — 근무자 한 명을 눌러 포지션을 한자리에서 붙였다 뗐다 하는 흐름은 만들지 않는다(기획 인터뷰 결정). 시간대별 포지션 — 데이터가 없다. 확정 스케줄의 배정 변경 — P3-T06 소유. 교육생 — P3-T05 소유. 감사 로그 형식 — P3-T03이 봉인했고 "누가 들어갔나"를 못 되짚는 성질은 후속 제안으로 남긴다. DB 스키마·함수 변경 — 아래 정지 조건이 소유한다.

### 불변 규칙

- **실인원을 새로 조회하지 않는다.** `listScheduleRequirements`가 이미 가져오는 `assignments` 행 배열의 길이가 곧 사람 수다. `assignments`가 `(schedule_id, profile_id)` 유일이라 성립한다. 조회를 늘리면 이 설계의 근거가 사라진다.
- **줄을 띄울지 말지의 판정은 `views/admin-schedule/model/`에 둔다.** 화면 로직은 UI가 아니라 model이 가진다. UI는 판정 결과만 그린다.
- **P3-T03이 봉인한 동작을 바꾸지 않는다.** 후보 묶음, 자격 검사 시점, 감사 기록, 확정 스케줄 거부는 그대로다. 이 task는 그것들이 겸직에서도 성립하는지 확인만 한다.
- **`assignment_positions_replaced` 감사 형식을 건드리지 않는다.**
- **겸직 개수에 상한을 두지 않는다.** 셋 이상도 저장되고 경고도 띄우지 않는다.

### 정지 조건

테스트를 쓰다 실제로 깨지는 곳이 나오면 **어디서 깨졌는지**로 처리가 갈린다.

- **화면·집계 코드의 불일치**(`countAssignedPositions`, view model, UI)는 이 task에서 고친다. 허용 경로 안이다.
- **DB 함수(`replace_position_assignments`·`list_position_assignment_candidates`)나 `features/assignment/api`의 불일치는 고치지 않는다.** 멈추고 결정 신호로 반환한다. 이미 배포된 스키마에 마이그레이션을 새로 올리는 일이라 검증 task 안에서 조용히 지나갈 변경이 아니다. 두 경로는 「변경 허용 경로」에도 없다.
- **문구·정렬·간격 같은 표시 문제**는 어느 쪽이든 고치지 않고 backlog로 보낸다.

### 기술 인수 조건

1. **겸직 성립**: 한 근무자가 같은 스케줄의 두 포지션에 동시에 배정되고, 각 포지션의 `배정 M`에서 1명씩 잡힌다.
2. **한쪽만 제거**: 두 포지션 중 하나에서 빼도 나머지 포지션 배정이 남고, 그 사람은 스케줄에서 사라지지 않는다.
3. **마지막 제거**: 남은 포지션이 없어지는 순간에만 그 사람이 스케줄에서 빠진다.
4. **두 번째 포지션의 자격**: 두 번째 포지션을 붙일 때도 성별 조건과 개인별 가능 포지션을 검사하고, 통과 못 하면 거부한다.
5. **실인원 줄**: 포지션 합계와 실인원이 다를 때만 필요 인원 표 위에 `오는 사람 N명 · 포지션 합계 M`이 뜬다. 두 값이 같은 날은 줄이 DOM에 없다.
6. **상한 없음**: 한 사람이 셋 이상의 포지션을 가질 수 있고 경고가 뜨지 않는다.
7. **회귀**: 기존 단위·e2e가 그대로 통과하고 `pnpm verify`가 GREEN이다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 겸직 성립 | 테스트함 — e2e에서 두 포지션 배정 후 각 행의 배정 수 확인 | 테스트함 — 집계가 한쪽만 잡히면 드러남 | 테스트함 — 단위에서 같은 근무자가 두 `position_id`를 갖는 행 집계 | 해당 없음 — 관리자 경계는 P3-T03이 소유 | 테스트함 — 같은 포지션에 같은 사람을 다시 저장해도 수가 안 늘어남 | 해당 없음 — 순차 저장이다 |
| 2 한쪽만 제거 | 테스트함 — e2e에서 한 시트만 해제 후 다른 포지션 유지 확인 | 테스트함 — 둘 다 사라지면 드러남 | 해당 없음 — 아래 3행이 경계를 소유 | 해당 없음 — 위와 같다 | 테스트함 — 이미 빠진 사람을 다시 해제해도 변화 없음 | 해당 없음 — 순차 저장이다 |
| 3 마지막 제거 | 테스트함 — 두 포지션 모두 해제 후 후보 목록에서 배지가 사라짐 | 테스트함 — 사람이 남아 있으면 드러남 | 테스트함 — 포지션이 하나뿐인 사람의 제거도 같은 경로 | 해당 없음 — 위와 같다 | 해당 없음 — 렌더가 멱등이다 | 해당 없음 — 순차 저장이다 |
| 4 두 번째 자격 | 테스트함 — 자격 있는 두 번째 포지션 저장 성공 | 테스트함 — 성별 조건 불일치 포지션에 두 번째로 넣으면 거부 | 테스트함 — 첫 포지션은 통과하고 두 번째만 막히는 조합 | 테스트함 — 거부가 DB 함수에서 나온다 | 해당 없음 — 거부가 멱등이다 | 해당 없음 — 순차 저장이다 |
| 5 실인원 줄 | 테스트함 — 겸직이 있는 스케줄에서 줄이 뜨고 두 숫자가 맞음 | 테스트함 — 겸직이 없으면 줄이 DOM에 없음 | 테스트함 — 배정이 0명일 때, 겸직자가 여럿일 때 | 해당 없음 — 표시 계층이다 | 해당 없음 — 렌더가 멱등이다 | 해당 없음 — 표시 계층이다 |
| 6 상한 없음 | 테스트함 — 단위에서 한 사람이 세 `position_id`를 갖는 집계 | 테스트함 — 어딘가 상한이 걸리면 드러남 | 테스트함 — 셋째 포지션 | 해당 없음 — 표시 계층이다 | 해당 없음 — 위와 같다 | 해당 없음 — 순차 저장이다 |
| 7 회귀 | 테스트함 — verify GREEN | 테스트함 — 기존 단위·e2e 통과 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 | 해당 없음 — 위 행이 소유 |

- 보충 위험: **단위 테스트는 Supabase를 전부 mock한다.** `replace-position-assignments.test.ts`가 `rpc`를 `vi.fn()`으로 갈아끼우므로 인수 조건 1~4의 실제 동작은 실DB e2e로만 검증된다. 단위로 덮이는 것은 순수 계산(집계·판정)뿐이며, 단위가 GREEN이어도 DB 동작을 보증하지 않는다. **"이미 돌아간다"는 코드를 읽은 판단이지 실행해 본 것이 아니다.** 인수 조건 1~4가 이 task에서 처음으로 실행 검증을 받는다. **겸직 시딩이 두 포지션의 자격을 모두 통과해야 한다** — 한 근무자에게 두 포지션의 `worker_position_eligibilities`와 성별 조건을 함께 맞춰야 하고, 기존 헬퍼가 못 받으면 그 spec 안에서 헬퍼를 넓힌다(파일 밖으로 빼지 않는다). **`assignment-eligibility.spec.ts`가 400줄을 넘긴다** — 테스트 1개짜리 파일에 하나가 더 붙는 형태다. 지금 가르지 않는 이유는 헬퍼 추출이 멀쩡한 기존 테스트를 건드리기 때문이며 backlog에 남긴다.

### DEV-* 적용 상태

- `DEV-SSOT-01`: 기본 적용 — 실인원의 출처는 `listScheduleRequirements` 하나다. 화면이 따로 세지 않는다.
- `DEV-ARCH`: 기본 적용 — 값은 `entities/schedule/api`, 판정은 `views/admin-schedule/model`, 표시는 `views/admin-schedule/ui`. 의존 방향은 그대로다.
- `DEV-TEST-01`: 기본 적용 — tdd, RED→GREEN 증거를 `runs/P3-T04`에 남긴다.
- `DEV-CODE-07`: 기본 적용 — 설명 주석 금지.
- `DEV-OPT`: 기본 적용 — 조회를 늘리지 않는다. 실인원은 이미 가져온 배열의 길이다.
- `DEV-SEC`·`DEV-DATA`·`DEV-TIME`·`DEV-CACHE`·`DEV-OFFLINE`: 해당 없음 — 서버 경계·스키마·시간 계산·캐시 정책·오프라인 처리가 바뀌지 않는다. 관리자 경계와 RLS는 P3-T03이 세운 그대로다.

## Architecture

계층 배치는 `config/fsd.json`의 세그먼트 규칙을 따른다. `api`는 `requireServerOnly`이자 단위 테스트 필수, `model`은 `react` import 금지에 단위 테스트 필수, `ui`는 단위 면제이며 `**/api/**` import 금지다.

- `src/entities/schedule/api/list-schedule-requirements.ts`: 성공 반환에 `assignedWorkerCount: number`를 더한다. 값은 이미 조회한 `assignments` 행 배열의 길이다 — `(schedule_id, profile_id)` 유일이라 행 하나가 사람 하나다. 쿼리를 추가하지 않는다. 파일 첫 줄의 `import "server-only"`는 그대로 둔다.
- `src/views/admin-schedule/model/requirement-section-data.ts`: 순수 함수 `resolveAssignedHeadcount`를 더한다. `assignedCounts`와 `assignedWorkerCount`를 받아 포지션 합계를 구하고, 합계가 사람 수와 같으면 `null`을, 다르면 `{ workerCount, positionTotal }`을 돌려준다. `null`이 곧 "줄을 띄우지 않는다"이다. `resolveRequirementSectionData`는 `assignedWorkerCount`를 받아 그대로 통과시킨다. `react`를 import하지 않는다.
- `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`: 판정 결과를 prop으로 받아 「필요 인원」 제목 위에 한 줄을 그린다. `null`이면 아무것도 렌더하지 않는다 — 빈 요소나 숨김 요소를 남기지 않는다. 계산을 이 파일에서 하지 않는다.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`: 새 값을 view model에 넘기고 판정 결과를 화면에 전달한다. 얇은 어댑터 역할을 넘지 않는다.
- `tests/e2e/assignment-eligibility.spec.ts`: 겸직 시나리오를 test로 더한다. 기존 test와 시딩 헬퍼·`assignmentEligibility` 밴드를 그대로 쓰고 기존 test 본문을 고치지 않는다.
- `src/entities/schedule/api/__tests__/list-schedule-requirements.test.ts`, `src/views/admin-schedule/model/__tests__/requirement-section-data.test.ts`: 집계와 판정의 단위 단언을 더한다.

## Data model

- 해당 없음 — 테이블·함수·RLS·마이그레이션 변경이 없다. `assignments`와 `assignment_positions`의 기존 구조를 그대로 읽는다.

## Interface

- `ListScheduleRequirementsResult`의 성공 갈래가 `{ ok: true; data; assignedCounts; assignedWorkerCount }`가 된다. 실패 갈래는 그대로다.
- `resolveAssignedHeadcount(input: { assignedCounts: Record<string, number>; assignedWorkerCount: number }): { workerCount: number; positionTotal: number } | null`.
- `AdminSchedulePrepView`의 props에 판정 결과 하나가 는다. 기존 props는 그대로라 호출부가 깨지지 않는다.

## Optimizations

- 조회가 늘지 않는다. 실인원은 이미 손에 있는 배열의 길이다.
- 포지션 합계는 `assignedCounts`의 값을 더한 것이라 스케줄 하나당 포지션 수만큼의 덧셈이다.
- 되돌림은 스칼라 제거, 순수 함수 제거, 줄 제거로 끝난다. DB·의존성·서버 경계 변경이 없어 되돌림 비용이 낮다.

## 변경 허용 경로

```
src/entities/schedule/api/**
src/views/admin-schedule/**
src/app/(protected)/admin/schedule/[id]/page.tsx
tests/e2e/assignment-eligibility.spec.ts
docs/execution/radio/P3-T04-radio.md
docs/execution/runs/P3-T04/**
docs/execution/phases/03-assignment-and-confirmation.md
docs/execution/phases/index.jsonl
```

- 용도 한정: `src/entities/schedule/api/**`는 실인원 스칼라를 더하는 데만 쓰고 쿼리·필터·권한을 바꾸지 않는다. `src/views/admin-schedule/**`는 판정 함수 신설과 줄 렌더에만 쓰고 필요 인원 편집·후보 시트 동작을 바꾸지 않는다. `page.tsx`는 새 값을 전달하는 데만 쓰고 인증 흐름·데이터 조회를 바꾸지 않는다. `tests/e2e/assignment-eligibility.spec.ts`는 test를 더하는 데만 쓰고 기존 test 본문을 고치지 않으며, 헬퍼가 부족하면 그 파일 안에서 넓힌다.
- **`supabase/migrations/**`와 `src/features/assignment/api/**`는 의도적으로 빠져 있다.** DB 함수나 서버 액션 쪽 불일치가 드러나면 고치지 말고 정지 조건대로 멈춰 반환한다. 경로로 막아 둔 것이 그 판단을 강제한다.
- `tests/e2e/support/**`도 빠져 있다. 시딩 헬퍼를 공용으로 빼는 일은 기존 spec을 건드리므로 이 task에서 하지 않는다.

## 미결 사항

- 겸직자의 급여를 한 번 세는가 두 번 세는가. 한 사람이 하루에 두 포지션을 겸해도 근무는 한 번인데 지금 데이터는 어느 쪽으로도 계산된다. 결정 주체: P6(예상급여).
- 겸직자의 출퇴근 기록이 하나인가 둘인가. 결정 주체: P5(출퇴근).
- `assignment_positions_replaced` 감사 로그가 포지션별 추가·제거 개수만 남겨 "누가 스캔에 들어갔나"를 되짚을 수 없다. 복수 포지션만의 문제가 아니라 P3-T03이 봉인한 형식 전체의 성질이다. 결정 주체: 후속 제안.
- `assignment-eligibility.spec.ts`를 언제 가를지. 헬퍼를 `tests/e2e/support/`로 빼는 시점의 별도 제안.
