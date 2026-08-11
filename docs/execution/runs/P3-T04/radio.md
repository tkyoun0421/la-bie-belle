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
