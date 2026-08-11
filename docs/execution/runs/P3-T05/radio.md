# P3-T05 RADIO 적용 결과

- RADIO: `docs/execution/radio/P3-T05-radio.md` revision 2, SHA-256
  `9a188845cfa23f41e942f703700de3314d30078a9a5b100f3ea60506c0356aed`
- 적용 세션: 2026-08-11

## revision 1 봉인 결함을 정지 조건으로 잡아 revision 2를 이끌어냈다

revision 1의 Interface 절은 `replace_position_assignments`의 네번째 인자에 "기본값을 두지 않는다"고
지시했고, Architecture 절은 "옛 함수를 남겨 두지 않는다"(과부하 금지)고 지시했으며, 정지 조건은
`19-assignments.test.sql`에서 고칠 것이 "7줄뿐"이라고 못 박았다. 이 셋을 구현으로 확인하니 동시에
성립할 방법이 없었다 — 4-인자 함수를 과부하 없이 단일 시그니처로 만들면, 이 파일의 기존 3-인자
호출부 26곳(문자열로 시그니처를 박은 4줄과는 별개인 실제 호출문)이 전부 깨졌다. pgTAP 95문항 중
40개가 `function replace_position_assignments(uuid, uuid, uuid[]) does not exist`로 실패하는 것을
실행으로 확인한 뒤, `[질문]`으로 멈추고 세 가지 선택지(A: 빈 배열 기본값, B: 26개 호출부 수정, C:
과부하 유지 — 이미 배제됨)를 근거와 함께 반환했다.

조정자가 네번째 길로 revision 2를 재봉인했다 — `trainee_profile_ids uuid[] default null`이고
`null`은 「교육생을 건드리지 않는다」로 읽는다(빈 배열의 "전부 제거"와 반대 의미). 정지 조건의 행
번호도 7줄에서 4줄(76·77·87·92)로 정정됐다 — 봉인 전 조사가 시그니처를 문자열로 박은 줄만 세고
실제 호출부 26곳을 세지 않은 것이 원인이었다. 이 재봉인으로 셋 다 성립한다: 함수는 하나뿐이고
(과부하 금지 충족), `null` ≠ `array[]`라 옛 호출이 조용히 비워지지 않으며(기본값 관련 우려 해소),
26개 호출부는 그대로 두고 4줄만 고치면 된다(정정된 정지 조건 충족).

## 승인된 범위 그대로 구현한 부분

- 마이그레이션 1개(`supabase/migrations/20260811000000_assignment_trainees.sql`)로 `assignment_trainees`
  테이블·RLS 신설, `list_position_assignment_candidates`에 `currently_trainee` 추가, `replace_position_assignments`에
  네번째 인자 추가 — 둘 다 `drop function` 후 재생성.
- 저장은 여전히 RPC 한 번이다. `trainee_touched`(네번째 인자가 `null`이 아닌지)로 교육생 관련 구간만
  조건부로 감싸고, 다른 포지션 교육생과의 교차 검사(Check A)는 무조건 실행되게 남겨 데이터 무결성을
  지켰다 — 이 검사는 "이번 호출이 교육생을 건드리는가"와 무관하게 항상 지켜야 하는 불변식이기 때문이다.
- 거부 사유별로 `LB024`(정식·교육 겸함, 세 갈래 메시지 — 동시 선택·정식→교육 방향·교육→정식 방향)와
  `LB025`(교육생 중복)를 분리했다. TS 계층은 두 코드를 `SCHEDULING_TRAINEE_ALREADY_ASSIGNED`·
  `SCHEDULING_TRAINEE_DUPLICATE`로 각각 매핑하고 클라이언트 메시지도 서로 다르다 — P3-T04 교차 검증
  F-03이 지적한 "한 코드에 여러 사유" 문제를 되풀이하지 않는다.
- `useCandidateSelection`의 선택 상태를 `selectedAssigned`·`selectedTrainee` 두 집합으로 나눴다.
  `toggle(profileId, role)`이 역할을 받고, 한쪽을 고르면 훅 내부에서 다른 쪽을 자동으로 지워 상호
  배타를 강제한다. 저장은 두 집합을 한 번의 `onReplace`로, 되돌리기는 두 집합을 함께, 변경 수는 두
  집합의 대칭차 합이다.
- `groupAssignmentCandidates`의 묶음 구성(신청함·신청 안 함·자격 없음)은 손대지 않았다. 그 옆에
  `canSelectCandidateAsTrainee` 순수 함수를 새로 더해 `GENDER_MISMATCH`만 교육 선택을 막는다 —
  `views/admin-schedule/model/`이 판정을 갖고 시트는 결과만 그린다.
- `requirement-section-data.ts`에 `resolveTraineeCountLabel`(0명이면 null)과
  `shouldShowNoManagerNotice`(정식 0명이면서 교육생 1명 이상일 때만 true)를 추가했다. `AdminSchedulePrepView`는
  이 판정 결과를 받아 그리기만 한다 — 계산을 화면 파일에서 하지 않는다.
- e2e 시딩 헬퍼 10개(`randomPhone`·`waitForDrawerOpenTransitionToSettle`·`createAdminSession`·
  `createWorkerProfile`·`insertSchedule`·`positionButton`·`positionRow`·`openPositionSheet`·`closeSheet`·
  `toggleCandidateAndSave`)를 `tests/e2e/support/assignment-schedule-fixtures.ts`·
  `tests/e2e/support/assignment-candidate-sheet.ts` 두 파일로 옮겼다. `assignment-eligibility.spec.ts`의
  기존 test 본문은 import 줄 외에 바뀌지 않았다(diff로 확인, 아래 절 참조). `WORK_DATE_BANDS`에
  `assignmentTrainee`(297~328개월) 밴드를 새로 더해 기존 밴드와 겹치지 않게 했다.

## 구현 중 확정한 세부(설계 재해석이 아니라 RADIO 문구 안에서의 선택)

1. **`toggleCandidateAndSave`의 `fromLabel` 유니언을 `"선택" | "선택됨"`에서 `"선택" | "선택됨" | "교육" | "교육됨"`으로
   넓혔다.** RADIO는 헬퍼를 옮기라고만 했지 시그니처를 못 박지 않았다. 새 e2e spec이 교육 칩도 눌러야
   해서, 기존 두 값을 그대로 포함하는 상위 집합으로 넓혀 `assignment-eligibility.spec.ts`의 기존 호출은
   그대로 통과하게 했다.
2. **`AssignmentCandidateSheet`에 `canSelectAsTrainee: (candidate) => boolean` 콜백 prop을 새로 뒀다.**
   판정 함수(`canSelectCandidateAsTrainee`)는 `views/admin-schedule/model/`에 있고 이 컴포넌트는
   `features/assignment/ui`라 계층상 직접 import할 수 없다(위→아래 단방향, features는 views를 모른다).
   `AdminSchedulePrepView`가 판정 함수를 그대로 prop으로 내려보내는 방식을 택했다 — 계산은 여전히
   model이 하고 UI는 호출만 한다.
3. **필요 인원 행의 마크업을 두 겹 `<span>`으로 나눴다** — 바깥 `flex gap-1`은 "필요 N / 배정 M · 교육
   K" 텍스트와 "담당자 없음" 배지 사이 간격만 담당하고, 안쪽 `<span>`이 숫자 텍스트 전체를 하나의
   문자열로 담는다. 세 조각(`필요 N / 배정 M`, `· 교육 K`, `담당자 없음`)을 형제 텍스트 노드로 나열하면
   `flex`의 익명 박스 병합 규칙 때문에 시각적 간격이 보장되지 않을 수 있어, 텍스트 부분은 템플릿
   리터럴로 미리 합쳐 하나의 노드로 만들었다. 기존 `assignment-eligibility.spec.ts`의
   `positionRow(...).getByText("필요 1 / 배정 1")` 같은 부분 일치 단언이 안쪽 leaf span에서 그대로
   맞는지 e2e 재실행으로 확인했다.
4. **`ERROR_CODES`의 두 신규 코드 메시지는 세 가지(동시 선택·정식→교육·교육→정식) 중 하나를
   특정하지 않는 일반 문구로 썼다** — `SCHEDULING_TRAINEE_ALREADY_ASSIGNED`: "이미 다른 포지션에 정식
   배정되었거나 교육생으로 등록된 사람이 있어요", `SCHEDULING_TRAINEE_DUPLICATE`: "이미 다른 포지션의
   교육생으로 등록된 사람이 있어요". 기존 `SCHEDULING_ASSIGNMENT_NOT_ELIGIBLE`가 `LB023`의 세 하위
   사유(성별·미등록·비활성)를 하나의 일반 문구로 묶는 기존 관례와 같은 결이다 — pgTAP은 세 원문
   메시지를 각각 단언하고, 클라이언트 메시지는 코드당 하나로 단순화했다.

## 위험 기반 테스트 매트릭스 반영

RADIO 위험 기반 테스트 표의 "테스트함" 선언은 다음으로 실증했다. 명령·exit code·시각은
`docs/execution/runs/P3-T05/tdd.json`을 참조한다.

- **1 교육생 추가**: happy path·상한 없음(교육생 4명 상한 없이 저장)·중복 저장 멱등·권한(비관리자
  42501)을 `supabase/tests/20-assignment-trainees.test.sql`(pgTAP)로, 실제 UI 흐름은
  `tests/e2e/assignment-trainee.spec.ts`의 AC1 test로 덮었다.
- **2 성별 거부**: `GENDER_MISMATCH` 후보는 시트에 교육 버튼 자체가 그려지지 않아 UI 경로가 없다 —
  P3-T04의 F-04 선례와 같은 이유로, 인증된 RPC 직접 호출로 pgTAP과 e2e 양쪽에서 거부를 확인했다.
  `any` 포지션(성별 조건 통과) 경계값은 pgTAP AC2에서 별도로 확인했다.
- **3 정식과 겸함 거부**: 두 방향(이미 교육생 → 정식 시도, 이미 정식 → 교육 시도)을 pgTAP과 e2e 양쪽에서
  각각 확인했다. e2e는 실제 시트에서 "선택"·"교육" 버튼을 눌러 저장 실패 스낵바를 확인한 뒤 DB로
  이중 확인했다. 같은 요청 안에서 정식·교육을 동시에 고르는 경계값은 훅이 상호 배타를 강제해 UI로
  재현할 수 없으므로 pgTAP AC3에서만 확인했다(설계상 UI 경로 부재).
- **4 교육생 중복 거부**: 두 번째 포지션 교육생 등록이 `LB024`가 아니라 `LB025`로, 서로 다른 메시지로
  거부됨을 pgTAP과 e2e 양쪽에서 확인했다. 첫 포지션을 풀고 두 번째로 옮기는 경계값은 pgTAP AC4에서
  확인했다.
- **5 필요 인원 제외**: `listScheduleRequirements`의 `traineeCounts`가 `assignedCounts`·`assignedWorkerCount`와
  분리 집계됨을 단위 테스트로, 정식 0명·교육생만 있는 경계값을 단위와 e2e 양쪽으로 확인했다.
- **6 교육 수 표시**: `resolveTraineeCountLabel`의 0명→null·양수→`· 교육 K` 판정을 단위로, 화면에
  실제로 뜨는지를 e2e로 확인했다.
- **7 담당자 없음**: `shouldShowNoManagerNotice`의 판정(정식 0·교육 0 → false, 정식 0·교육 1 이상 →
  true, 정식 1 이상 → 항상 false)을 단위로, 정식을 모두 뺀 뒤에도 교육생이 남아 화면에 뜨는 실제
  흐름을 e2e로 확인했다.
- **8 회귀**: `pnpm verify`의 format·lint·typecheck·unit(1364건)·harness self-test·build·gate:bundle·
  check:app-build·check:client-secret-scan·gate:motion-render-budget이 모두 GREEN이다. e2e는 전체
  스위트 70건 중 `recruitment-manage.spec.ts:114`·`recruitment-open.spec.ts:80` 두 건이 이 diff와
  무관한 사전 존재 결함(`schedules_work_date_active_unique` 경합, 둘 다 `WORK_DATE_BANDS`를 쓰지
  않음)으로 병렬 실행에서 간헐 실패했고 독립 실행에서는 통과했다 — 자세한 내용은 handoff.md의 미결
  사항을 참조한다. 새 pgTAP AC8 회귀 단언(3-인자 호출이 기존 교육생 행을 그대로 두는지)도 GREEN이다.

## 정지 조건이 실제로 걸린 지점

- **네번째 인자 기본값/과부하/정지 조건 3중 모순**: 위 절에서 다뤘다. `[질문]`으로 반환해 revision 2로
  해소됐다.
- 나머지 정지 조건(e2e 헬퍼 추출로 기존 test가 깨짐, 기존 배정 데이터 백필 필요, `assignments`·
  `assignment_positions` 구조 변경 필요)은 걸리지 않았다. 헬퍼 추출 후 diff로 기존 test 본문이 import
  줄 외에 그대로임을 확인했고(위 절), 교육생 테이블은 빈 상태로 시작해 백필이 필요 없었으며, 기존
  배정 테이블 구조는 한 줄도 바뀌지 않았다.
