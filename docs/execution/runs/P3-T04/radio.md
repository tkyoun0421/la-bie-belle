# P3-T04 RADIO 적용 결과

- RADIO: `docs/execution/radio/P3-T04-radio.md` revision 1, SHA-256
  `12e3f2fa05a2900f18c6d2d82bb825294fffeb9d512c15edd1e24528b01931df`
- 적용 세션: 2026-08-11

## 이 task의 성격 — "이미 돌아간다"는 전제를 실행으로 확인했다

RADIO와 기획 인터뷰는 복수 포지션이 화면·서버·DB에서 이미 동작한다고 판단했지만, 그 판단은 코드를
읽은 것이지 실행한 것이 아니었다. 기술 인수 조건 1~4(겸직 성립·한쪽만 제거·마지막 제거·두 번째
포지션 자격)는 이 task가 처음으로 실행 검증을 받았다. 「정지 조건」 절이 예상한 두 갈래 중 어느 쪽도
발생하지 않았다 — 화면·집계 코드와 DB 함수 어느 쪽에도 실제로 깨진 곳이 없었다.

### 실행으로 확인한 근거

`tests/e2e/assignment-eligibility.spec.ts`의 헤드카운트 줄 구현 4개 파일
(`list-schedule-requirements.ts`·그 unit test, `requirement-section-data.ts`·그 unit test,
`AdminSchedulePrepView.tsx`, `page.tsx`)만 `git stash`로 원상태(RADIO 적용 전 HEAD)로 되돌린 채
신규 e2e test를 실행했다. 이 상태에서:

- 겸직 추가(AC1: 메인+스캔 두 포지션에 같은 사람을 배정하고 각 포지션에서 1명씩 집계)는 **원상태
  코드 그대로 통과했다.** `replace_position_assignments`의 `on conflict (schedule_id, profile_id)
  do nothing` 재사용과 `assignment_positions`의 별도 primary key가 실제로 겸직을 지원한다.
- 헤드카운트 줄("오는 사람 N명 · 포지션 합계 M")만 부재로 실패했다 — 이 task가 실제로 만드는 유일한
  화면 요소가 정확히 여기서 갈렸다.

이 RED 실행 뒤 stash를 복원해 4개 파일 GREEN을 확인했다. 명령·exit code·시각은
`docs/execution/runs/P3-T04/tdd.json`에 남겼다.

같은 e2e test 안에서 AC2(한쪽만 제거해도 사람이 안 사라짐)·AC3(마지막 제거 시에만 사람이 빠짐)를
UI 조작 이후 `assignments` 테이블을 admin(service role) 클라이언트로 직접 조회해 확인했다 — 화면
표시(필요/배정 수)뿐 아니라 DB 행 존재 여부로 이중 확인했다.

## AC4(두 번째 포지션 자격)를 UI가 아니라 인증된 RPC 직접 호출로 검증한 이유

RADIO 위험 기반 테스트 표의 AC4 「권한」 칸은 "테스트함 — 거부가 DB 함수에서 나온다"로 적혀 있다.
구현을 조사하며 이 문구가 왜 "UI에서 테스트함"이 아니라 "DB 함수에서"인지가 드러났다 —
`groupAssignmentCandidates`(`src/views/admin-schedule/model/candidate-buckets.ts`)는
`!eligible && !currentlyAssigned`인 후보를 접힌 "조건에 맞지 않는" 묶음으로 보내고, 이 묶음의
`IneligibleRow`는 선택 버튼을 렌더하지 않는다. 즉 **처음부터 자격이 없는 후보는 UI에서 애초에
선택할 수 없다** — 사용자가 "선택 후 저장 → 거부"를 밟을 화면 경로 자체가 없다.

그래서 이 task의 e2e test는 실제 관리자 인증 세션(비밀번호 로그인으로 얻은 JWT)으로
`replace_position_assignments` RPC를 직접 호출해, 성별 조건이 맞지 않는 두 번째 포지션(드레스,
female 전용)에 남성 근무자를 추가하려는 시도가 `LB023`으로 거부되는지 확인했다. 이는 "UI를 우회한
악의적 클라이언트도 DB 함수가 막는다"는 방어 심층(defense-in-depth) 검증이며, RADIO가 이미 그렇게
읽히도록 위험 렌즈 표를 적어 둔 것으로 판단했다 — 별도 질문 없이 이 해석대로 구현했다.

이 헬퍼(`createAdminSession`이 이제 `email`·`password`도 함께 반환)는 「변경 허용 경로」가 명시한
"헬퍼가 부족하면 그 파일 안에서 넓힌다" 규칙을 따른 것이다. `tests/e2e/support/**`는 건드리지 않았고
`src/features/assignment/api/**`도 무수정이다 — RPC를 호출만 했을 뿐 그 구현을 바꾸지 않았다.

## 조회 수가 늘지 않았다는 근거

`src/entities/schedule/api/list-schedule-requirements.ts`의 diff는 기존에 `Promise.all`로 이미
가져오던 `assignmentsResult.data` 배열에 `.length`를 적용해 `assignedWorkerCount`를 만드는 것뿐이다
— `supabase.from(...)` 호출문이 늘지 않았다(기존 2개: `schedule_position_requirements`,
`assignments` 그대로). `resolveAssignedHeadcount`(신설)는 이미 응답에 들어 있는 `assignedCounts`와
`assignedWorkerCount`만 받아 계산하는 순수 함수라 네트워크 호출이 전혀 없다. `page.tsx`도 새 함수
호출을 추가했을 뿐 새 `await supabase...` 호출을 추가하지 않았다.

## 정지 조건이 실제로 걸리지 않았다

- 화면·집계 코드 불일치: 없었다. `countAssignedPositions`가 겸직 시 각 포지션에서 정확히 1씩
  집계하는 것을 e2e·unit 양쪽에서 확인했다.
- DB 함수·`features/assignment/api` 불일치: 없었다. `replace_position_assignments`가 유지되는
  배정은 재검사하지 않고(F-01 수정 반영, P3-T03 교차 검증에서 이미 고쳐짐), 신규 추가분만 검사해
  두 번째 포지션 거부가 정확히 작동했다.
- 표시 문제: 없었다. 다만 두 가지를 backlog로 남긴다(아래 「제안」).

## 제안(구현하지 않고 기록만)

- `assignment-eligibility.spec.ts`가 이제 400줄을 훌쩍 넘는다(RADIO가 이미 알고 있던 위험). 헬퍼
  추출은 여전히 기존 test를 건드리므로 이 task에서 하지 않았다 — RADIO 미결 사항 그대로 backlog.
- 겸직자의 이름이 두 자리(메인·스캔)에 각각 나타나는데, 관리자가 "이 사람이 겸직 중"이라는 것을
  한눈에 보려면 후보 시트의 `otherPositionNames` 배지 외에 필요 인원 표 자체에서도 표시가 있으면
  좋겠다는 생각이 들었다 — 그러나 이는 RADIO 비목표("근무자 우선 화면")에 가까운 새 화면 요구라
  이 task 범위가 아니다. 제안으로만 남긴다.

## 수정 라운드 2026-08-11 — 교차 검증 확정 발견 F-01~F-05 처리

교차 검증 확정 5건(high 3·low 2, 종합 92점, critical 없음) 전부 "봉인표가 '테스트함'이라 적은 칸이
실제 단언으로 옮겨지지 않았다" 계열이었다. 재봉인 없이(revision 1, 해시 그대로) 봉인된 「변경 허용
경로」 안에서 전부 메웠다. `docs/execution/reviews/P3-T04-review.json`이 원본이다.

### F-01(high) — AC6 세 포지션 단언 부재

봉인표 AC6 행의 Happy Path·경계값이 각각 "단위에서 한 사람이 세 position_id를 갖는 집계"·"셋째
포지션"을 지정했는데, 기존 단언의 최대치는 두 포지션이었다(`list-schedule-requirements.test.ts:107-135`
가 두 `position_id`, `requirement-section-data.test.ts:114-121`이 "겸직자가 여럿"으로 실제로는
서로 다른 두 사람 조합).

`resolveAssignedHeadcount`(model)는 이미 합산된 `assignedCounts`/`assignedWorkerCount`만 받는
순수 함수라 "한 사람이 몇 포지션을 겸하는가"라는 개념 자체가 없다 — 그 개념을 실제로 갖는 곳은
집계 함수 `countAssignedPositions`(`list-schedule-requirements.ts`)뿐이다. 그래서 F-01의 대상은
`list-schedule-requirements.test.ts`로 좁혔고 `requirement-section-data.test.ts`는 건드리지
않았다.

**단언 위치**: `list-schedule-requirements.test.ts`에 "AC6: 한 사람이 세 포지션을 겸해도 상한 없이
모두 집계된다" 케이스를 추가(메인·스캔·드레스 세 `position_id`를 가진 배정 행 1개 → `assignedCounts`
셋 다 1, `assignedWorkerCount` 1).

**회귀를 잡는지 확인한 방법**: `list-schedule-requirements.ts`를 이 task 이전 커밋(83456b8,
`assignedWorkerCount` 자체가 없던 버전)으로 임시로 되돌리고 실행 → 신규 케이스를 포함해 5/8 실패
(RED, 2026-08-11T09:54:25Z). 원본으로 복원 후 재실행 → 8/8 통과(GREEN, 09:54:33Z). 구현 파일은
결과적으로 무수정이라 `git diff --stat`로 diff 없음을 확인했다.

`handoff.md`가 AC6을 "충족"으로 적으며 두 포지션짜리 케이스를 근거로 든 문장도 세 포지션 케이스를
가리키도록 고쳤다.

### F-02(high) — 겸직 배지에 단언이 하나도 없다

봉인표 AC3 Happy Path는 "두 포지션 모두 해제 후 후보 목록에서 배지가 사라짐"을 관찰 지점으로 뒀는데,
구현은 `assignments` 행 부재(더 강한 검증)로 대체하고 배지 자체는 어디서도 단언하지 않았다.
`otherPositionNames` 배지를 렌더하는 `AssignmentCandidateSheet.tsx`는 `src/features/assignment/ui/**`
— 이 task의 「변경 허용 경로」 밖이라(정지 조건이 명시적으로 부른 것은 `features/assignment/api`
뿐이지만, 허용 경로 목록 자체가 `features/assignment/**` 전체를 포함하지 않는다) 구현을 되돌려
RED를 만들 수 없었다. 대신 `tests/e2e/assignment-eligibility.spec.ts` 안에서 단언 자체를 반대로
걸어 진짜로 실패하는지 확인하는 방식을 썼다.

**단언 위치**: 두 곳, 둘 다 `tests/e2e/assignment-eligibility.spec.ts`의 "복수 포지션 배정" test 안.
- 겸직 상태(coWorker가 메인+스캔 모두 배정된 직후)에서 메인 시트를 다시 열어 coWorker 행에 "스캔"
  배지가 보이는지 확인(spec:381-386, `mainSheetForRemoval` 해제 전).
- 메인만 해제한 뒤 스캔 시트를 열어 coWorker 행에서 "메인" 배지가 사라졌는지 확인(spec:411-416,
  `scanSheetAfterOneRemoved` 해제 전).

**회귀를 잡는지 확인한 방법**: 각 단언을 독립적으로 반대로 걸어 실행했다.
- 배지 존재 단언을 처음엔 `toHaveCount(0)`(있으면 안 된다)으로 반전했더니 **공허하게 통과**했다
  — 시트가 열리고 데이터가 로딩되기 전엔 `li` 자체가 0개라 `toHaveCount(0)`이 그 순간을 우연히
  잡아 버린다. 실제 배지 유무와 무관하게 통과할 수 있다는 뜻이라 이 반전 방식은 폐기했다. 대신
  `toBeVisible()`로 존재할 수 없는 "드레스" 배지를 기대하도록 바꾸자 진짜로 element not found로
  실패했다(RED, 2026-08-11T09:49:43Z, spec:386). 이 발견 자체는 코드 결함이 아니라 내 테스트
  기법의 결함이었고, 되돌림 비용 없이 바로 더 견고한 형태로 바꿨다.
- 배지 소멸 단언은 반대로 `toBeVisible()`을 걸어(있으면 안 되는데 있길 기대) 실행 → element not
  found로 진짜 실패했다(RED, 2026-08-11T09:55:49Z, spec:416).
- 두 단언 모두 원래 값으로 되돌린 뒤 재실행해 통과를 확인했다(GREEN, 2026-08-11T09:56:56Z).

### F-03(high) — 두 번째 포지션의 NOT_ELIGIBLE 분기가 행사되지 않는다

`assignment_eligibility`는 성별 검사를 먼저 하고 불일치면 `GENDER_MISMATCH`로 즉시 반환하며
(`20260810000000_assignments.sql:60-67`), 가능 포지션 검사(68-78행)는 그 아래라 성별부터 걸리면
도달하지 않는다. 기존 e2e의 거부 fixture(coWorker2, 남성 + 여성 전용 드레스)는 성별 분기에서
끝나 NOT_ELIGIBLE 분기가 이 task의 어떤 테스트에서도 행사되지 않았다. 게다가
`replace_position_assignments`가 두 사유를 같은 errcode(`LB023`)로 올려(249-255행) errcode만으로는
어느 분기가 막았는지 구분되지 않았다.

**단언 위치**: `tests/e2e/assignment-eligibility.spec.ts`에 드레스 가능 포지션이 없는 여성 근무자
`dressNotEligibleWorker`를 추가로 세우고(성별은 통과, `worker_position_eligibilities`에 드레스
행 없음) 같은 `replace_position_assignments` RPC를 호출해 NOT_ELIGIBLE 분기를 열었다(spec:456-467).
errcode 대신 메시지로 분기를 구분했다 — GENDER_MISMATCH는 "포지션 성별 조건에 맞지 않습니다"
(spec:454), NOT_ELIGIBLE은 "가능 포지션으로 등록되지 않았습니다"(spec:466)이고, 두 메시지가 서로
다름을 `.not.toBe()`로도 고정했다(spec:467).

**회귀를 잡는지 확인한 방법**: 두 메시지 단언을 각각 독립적으로 상대 메시지로 바꿔 걸었다.
- coWorker2(GENDER_MISMATCH) 쪽에 NOT_ELIGIBLE 메시지를 기대하도록 바꿔 실행 → Expected/Received
  불일치로 진짜 실패했다(RED, 2026-08-11T09:50:54Z, spec:454). 실제 값이 "포지션 성별 조건에 맞지
  않습니다"임을 확인했다.
- dressNotEligibleWorker(NOT_ELIGIBLE) 쪽에 GENDER_MISMATCH 메시지를 기대하도록 바꿔 실행 →
  Expected/Received 불일치로 진짜 실패했다(RED, 2026-08-11T09:51:59Z, spec:466). 실제 값이 "가능
  포지션으로 등록되지 않았습니다"임을 확인했다 — 두 메시지가 실제로 다른 값임이 실행으로 증명됐다.
- 둘 다 원래 값으로 되돌린 뒤 재실행해 통과를 확인했다(GREEN, 09:56:56Z).

DB 검증도 더했다 — `dressNotEligibleWorker`가 드레스에 실제로 배정되지 않았음을 admin 클라이언트로
직접 조회해 확인했다(spec 469행대, coWorker2 쪽과 대칭).

### F-05(low) — 증거 문서 개수 불일치

`handoff.md`가 "TDD RED→GREEN 4쌍"으로 적어 `tdd.json`의 실제 3쌍(entries 6개, 이 수정 라운드 전
기준)과 어긋났다. 두 곳(개발 단계 종료 절의 서술, 증거·산출물 경로의 참조)을 "3쌍"으로 고쳤다.
수정 라운드로 entries가 6개에서 13개로 늘었으므로 새 절에는 정확한 새 개수를 적었다.

### F-04(low) — 건드리지 않음

지시대로 손대지 않았다. `assignment-eligibility.spec.ts`의 기존 test(2일 소비)와 신규 test(1일
소비)가 같은 `assignmentEligibility` 밴드를 나눠 써 유일 인덱스 충돌 확률(약 2/864)이 있다는 지적은
맞지만, 밴드를 추가하려면 `tests/e2e/support/**`가 필요하고 이는 「변경 허용 경로」 밖이다. backlog로
남는다.

### 조회 수 — 이번 라운드에서도 변화 없음

F-01~F-05 전부 test 파일과 문서만 바꿨다. `src/entities/schedule/api/list-schedule-requirements.ts`
는 F-01 확인 과정에서 임시로 되돌렸다가 그대로 복원했을 뿐 diff가 없다(위 F-01 절). 프로덕션 코드는
이번 라운드에서 한 줄도 바뀌지 않았다.
