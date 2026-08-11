# P3-T04 handoff

## 2026-08-11 · 개발 단계 종료

- 작업 식별자: P3-T04 (수동 배정과 복수 포지션)
- 현재 단계: 개발(TDD) 종료 → 다음 검증(교차 리뷰)
- 기준 시각: 2026-08-11T08:54:24Z

### 확정된 사실

- RADIO(`docs/execution/radio/P3-T04-radio.md` revision 1, SHA-256
  `12e3f2fa05a2900f18c6d2d82bb825294fffeb9d512c15edd1e24528b01931df`) 범위 그대로 구현했다. 두 승인·
  해시·의존성(`P3-T03` done)을 시작 전에 확인했다.
- 이 task의 전제("복수 포지션은 이미 화면·서버·DB에서 동작한다")를 **실행으로 확인했다** — 만드는
  것은 화면 한 줄(헤드카운트 표시)뿐이고 나머지는 회귀 보호 테스트였다.
  - 헤드카운트 줄 구현 4개 파일만 `git stash`로 원상태(RADIO 적용 전)로 되돌린 채 신규 e2e test를
    실행한 결과, 겸직 추가(기술 인수 조건 1)는 **원상태 코드 그대로 통과했다**. 헤드카운트 줄만
    부재로 실패했다(RED). 상세 근거는 `docs/execution/runs/P3-T04/radio.md`.
  - 정지 조건(화면·집계 코드 불일치는 이 task가 고치고, DB 함수·`features/assignment/api` 불일치는
    멈추고 반환한다)이 실제로 걸린 곳은 없었다 — 어느 쪽도 깨지지 않았다.
- 만든 것:
  - `src/entities/schedule/api/list-schedule-requirements.ts`: 성공 반환에 `assignedWorkerCount`
    추가(이미 조회한 `assignments` 행 배열의 길이, **신규 조회 없음** — `supabase.from(...)` 호출
    문 2개는 기존과 동일).
  - `src/views/admin-schedule/model/requirement-section-data.ts`: 순수 함수
    `resolveAssignedHeadcount` 신설(포지션 합계와 실인원이 같으면 `null`, 다르면
    `{ workerCount, positionTotal }`). `resolveRequirementSectionData`가 `assignedWorkerCount`를
    받아 그대로 통과시키도록 확장.
  - `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`: 「필요 인원」 제목 위에 판정 결과가
    `null`이 아닐 때만 `오는 사람 N명 · 포지션 합계 M` 한 줄을 렌더(`null`이면 DOM에 아무것도
    남기지 않음). 계산은 이 파일에서 하지 않는다.
  - `src/app/(protected)/admin/schedule/[id]/page.tsx`: `resolveAssignedHeadcount` 호출과 값 전달만
    추가(얇은 어댑터 유지).
  - `tests/e2e/assignment-eligibility.spec.ts`: 기존 test 본문은 무수정. 신규 test 1개를 더해 겸직
    성립·한쪽만 제거(사람 안 사라짐)·마지막 제거(사람 사라짐)·두 번째 포지션 자격 거부·헤드카운트
    줄 표시/비표시를 실DB로 검증했다. 기존 헬퍼 `createAdminSession`이 `email`·`password`도 함께
    반환하도록 그 파일 안에서만 넓혔다(허용 경로가 명시한 확장 규칙).
- **기술 인수 조건 1~7 모두 충족**(아래 「인수 조건별 근거」).
- `pnpm verify` 전체 GREEN: format·lint·typecheck·unit(209 files/1345 tests)·harness self-test
  (321/321)·check:docs·build·gate:bundle·check:app-build·check:client-secret-scan·**E2E 68/68**
  (신규 test 포함)·gate:motion-render-budget·gate:all.
- TDD RED→GREEN 3쌍(entries 6개)을 `docs/execution/runs/P3-T04/tdd.json`에 남겼다(unit 2쌍 + e2e
  1쌍, 명령·exit code·실제 시각 전부 이번 세션의 실제 명령 실행에서 얻었다). e2e RED→GREEN 쌍은
  동일 명령(`npx playwright test tests/e2e/assignment-eligibility.spec.ts --reporter=list`)으로
  재실행해 `gate:tdd`의 명령 일치 요구를 맞췄다 — 첫 시도(RED는 `-g` 필터, GREEN은 stash pop
  접두)가 명령 문자열 불일치로 `gate:all`에 걸려 재실행했다.

### 인수 조건별 근거

1. **겸직 성립** — 충족. e2e에서 한 근무자를 메인+스캔에 배정, DB 조회로 `assignments` 1행 +
   `assignment_positions` 2행(각 포지션 1개씩) 확인. 화면 「필요 1 / 배정 1」도 두 포지션 각각에서
   확인.
2. **한쪽만 제거** — 충족. 메인만 해제해도 `assignments` 행이 남고(admin 클라이언트로 직접 조회),
   스캔 시트에서 그 사람이 "선택됨"으로 계속 보임.
3. **마지막 제거** — 충족. 스캔까지 해제하면 `assignments` 행이 사라짐(admin 클라이언트로 직접
   조회해 0행 확인).
4. **두 번째 포지션의 자격** — 충족. `groupAssignmentCandidates`가 처음부터 자격 없는(그리고
   현재 미배정인) 후보는 선택 버튼 자체를 렌더하지 않아 UI로는 "선택 후 거부"를 재현할 화면 경로가
   없다 — RADIO 위험 렌즈 표의 AC4 권한 칸("거부가 DB 함수에서 나온다")이 이미 그렇게 읽힌다.
   그래서 실제 관리자 세션으로 `replace_position_assignments` RPC를 직접 호출해, 성별 조건이 맞지
   않는 두 번째 포지션(드레스) 추가 시도가 `LB023`으로 거부되고 기존 첫 포지션(메인) 배정은
   그대로 남는 것을 확인했다.
5. **실인원 줄** — 충족. 겸직 성립 전후로 줄이 DOM에 없다가(포지션 합계=실인원) 겸직 성립 후에만
   `오는 사람 1명 · 포지션 합계 2`가 뜨고, 마지막 제거 후 다시 사라지는 것을 e2e로 확인. 경계값
   (배정 0명, 겸직자 여럿)은 `resolveAssignedHeadcount` unit test로 확인.
6. **상한 없음** — 충족. `list-schedule-requirements.test.ts`의 신규 케이스가 한 사람이 **세**
   `position_id`(메인·스캔·드레스)를 가진 행에서 `assignedCounts`가 셋 다 1로 상한 없이 집계되고
   `assignedWorkerCount`는 1로 유지되는 것을 단언한다(집계 로직 자체가 개수 상한을 두지 않는 구조임을
   확인). 봉인표 AC6 행의 Happy Path·경계값이 요구한 "세 position_id"·"셋째 포지션"과 일치한다.
   e2e에서 셋 이상은 별도로 만들지 않았다 — RADIO 위험 렌즈 표가 이 항목을 unit 전담으로 지정했다.
7. **회귀** — 충족. `pnpm verify` 전체 GREEN(위 항목).

### 조회 수가 늘지 않았다는 근거

`list-schedule-requirements.ts`의 diff는 기존에 이미 가져오던 `assignmentsResult.data` 배열에
`.length`를 적용하는 것뿐이라 `supabase.from(...)` 호출문이 기존 2개(`schedule_position_requirements`,
`assignments`) 그대로다. `resolveAssignedHeadcount`는 이미 응답에 있는 값만 계산하는 순수 함수라
네트워크 호출이 없다. `page.tsx`도 새 함수 호출만 추가했을 뿐 새 `await supabase...` 호출이 없다.

### 실제로 깨진 곳

없다. 정지 조건이 예상한 두 갈래(화면·집계 코드 불일치 / DB 함수·`features/assignment/api` 불일치)
어느 쪽도 실행 중 발견되지 않았다. 상세 근거는 `docs/execution/runs/P3-T04/radio.md`.

### 미결 사항

- RADIO 자체의 미결 사항 4건(급여 이중 계산 여부는 P6, 출퇴근 기록 이중 여부는 P5, 감사 로그
  "누가 들어갔나" 미비는 후속 제안, spec 분할 시점은 별도 제안)은 그대로 열려 있다 — 이번 task
  범위가 아니다.
- backlog 제안 2건을 `docs/execution/runs/P3-T04/radio.md`에 남겼다(spec 파일 400줄 초과, 필요
  인원 표 자체의 겸직 표시 강화). 둘 다 구현하지 않았다.

### 다음 행동

1. 조정자가 검증(교차 리뷰) 진행 여부와 `index.jsonl` 상태 전환을 판단한다 — 이 세션은 status를
   `in_progress`에서 바꾸지 않았다.
2. `ci-finisher`가 이 커밋을 push하고 CI(특히 신규 e2e test)를 확인한다. 이 세션은 push하지 않았다.
3. 로컬 재현 시 주의: `tests/e2e/recruitment-manage.spec.ts`·`recruitment-open.spec.ts`는 날짜를
   `work-date-band.ts`가 아니라 "오늘 날짜 + 고정 offset"으로 계산해 같은 날 재실행하면 잔존 행과
   충돌(23505)한다 — P3-T04 범위 밖의 기존 결함이라 고치지 않았다. `pnpm db:reset` 후 1회만
   실행하면 재현되지 않는다.
   - 추가로 확인한 사실: `recruitment-manage.spec.ts:114`(마감일 연장·재오픈)는 완전히 깨끗한 DB
     에서도 `pnpm verify`의 e2e 전체(68개, `fullyParallel: true`, 재시도 미설정)를 병렬로 돌릴 때만
     간헐적으로 "새 마감일 입력값이 저장 전 값으로 보인다"는 형태로 깨진다. 이 spec 파일만 격리
     실행(2/2)하면 항상 통과했고, 이번 세션에서 전체 스위트를 5회 돌린 결과 3회 실패·2회 성공으로
     내 변경 유무와 무관하게 재현됐다(매 시도 모두 P3-T04 변경이 적용된 상태였다) — 부하에 따른
     타이밍 플레이키니스로 판단한다. `src/features/recruitment/**`(마감일 연장 Server Action)와
     `playwright.config.ts`(재시도 없음) 모두 이 task의 변경 허용 경로 밖이라 고치지 않았고, 재현
     증거만 여기 남긴다 — 후속 task에서 재시도 설정 또는 이 spec의 대기 방식을 검토할 만하다.

### 증거·산출물 경로

- `docs/execution/runs/P3-T04/tdd.json` — RED→GREEN 3쌍(명령·exit code·ISO8601 시각).
- `docs/execution/runs/P3-T04/radio.md` — "이미 돌아간다" 전제의 실행 확인 근거, AC4를 RPC 직접
  호출로 검증한 이유, 조회 수 불변 근거, backlog 제안 2건.
- `src/entities/schedule/api/list-schedule-requirements.ts`(+test 확장).
- `src/views/admin-schedule/model/requirement-section-data.ts`(+test 확장).
- `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`.
- `tests/e2e/assignment-eligibility.spec.ts`(신규 test 1개 + `createAdminSession` 반환값 확장).
- `docs/execution/phases/index.jsonl`(P3-T04만 `in_progress`로 전환).

## 2026-08-11 · 교차 리뷰 수정 라운드

- 작업 식별자: P3-T04 (수동 배정과 복수 포지션)
- 현재 단계: 수정 라운드 종료 → 다음 재검증
- 기준 시각: 2026-08-11T09:56:56Z

### 확정된 사실

- 교차 검증 확정 발견 5건(high 3·low 2, 종합 92점, critical 없음) 전부 "봉인표가 '테스트함'으로
  적은 칸이 실제 단언으로 옮겨지지 않았다" 계열이었다. 재봉인 없이 봉인된 「변경 허용 경로」 안에서
  전부 메웠다.
- **F-01(high, AC6 세 포지션 단언 부재)**: `src/entities/schedule/api/__tests__/list-schedule-requirements.test.ts`에
  "AC6: 한 사람이 세 포지션을 겸해도 상한 없이 모두 집계된다" 케이스를 추가했다(메인·스캔·드레스
  세 `position_id`를 가진 배정 행 1개 → `assignedCounts`가 셋 다 1, `assignedWorkerCount`는 1).
  회귀를 잡는지는 `list-schedule-requirements.ts`를 P3-T04 이전 커밋(83456b8, `assignedWorkerCount`
  없음)으로 되돌려 확인했다 — 신규 케이스 포함 5/8 실패(RED), 복원 후 8/8 통과(GREEN). `handoff.md`
  6번 항목의 "두 position_id" 서술도 "세 position_id"로 고쳤다(이 문단 자체가 F-01 대상이었다).
- **F-02(high, 겸직 배지 무방비)**: `tests/e2e/assignment-eligibility.spec.ts`에 두 단언을 추가했다.
  - 385행 부근: 겸직 상태(coWorker가 메인+스캔)에서 메인 시트를 다시 열어 coWorker 행에 "스캔"
    배지가 보이는지 확인(`mainSheetForRemoval` 열람 직후, 해제 전).
  - 411행 부근: 메인 해제 후 스캔 시트를 열어 coWorker 행에서 "메인" 배지가 사라졌는지 확인
    (`scanSheetAfterOneRemoved` 열람 직후, 스캔 해제 전).
  - 배지를 렌더하는 `AssignmentCandidateSheet.tsx`는 `src/features/assignment/**`라 이 task의
    「변경 허용 경로」 밖이라 구현을 되돌려 RED를 만들 수 없었다. 대신 단언 자체를 반대로 걸어
    진짜로 실패하는지 확인했다 — 처음엔 "배지 존재" 쪽을 `toHaveCount(0)`으로 반전했더니 데이터
    로딩 전 0건인 순간을 우연히 잡아 공허하게 통과해 버렸다(플레이키니스 원인 규명, 되돌림
    비용 없음). `toBeVisible()`로 존재할 수 없는 "드레스" 배지를 기대하도록 바꾸자 진짜로
    element not found로 실패했다(RED, spec:386). "배지 소멸" 쪽은 반대로 `toBeVisible()`을 걸어
    똑같이 element not found로 실패했다(RED, spec:416). 둘 다 원래 값으로 되돌린 뒤 재실행해
    통과를 확인했다(GREEN).
- **F-03(high, NOT_ELIGIBLE 분기 미행사)**: 드레스 가능 포지션이 없는 여성 근무자
  (`dressNotEligibleWorker`)를 추가로 세우고 같은 `replace_position_assignments` RPC를 호출해
  NOT_ELIGIBLE 분기를 열었다(spec:456-467). errcode(`LB023`)는 두 분기가 같으므로 대신 메시지로
  분기를 구분했다 — GENDER_MISMATCH는 "포지션 성별 조건에 맞지 않습니다", NOT_ELIGIBLE은 "가능
  포지션으로 등록되지 않았습니다"이고 서로 다름을 `.not.toBe()`로도 고정했다. 두 메시지 단언을
  각각 상대 메시지로 바꿔 걸어 실행 → 둘 다 Expected/Received 불일치로 진짜 실패했다(RED,
  spec:454·spec:466). 원래 값으로 되돌린 뒤 재실행해 통과를 확인했다(GREEN) — errcode만으로는
  드러나지 않던 분기 구분이 이제 회귀를 잡는다.
- **F-05(low, 증거 문서 개수 불일치)**: `handoff.md`가 "4쌍"으로 적어 `tdd.json`의 실제 3쌍(entries
  6개)과 어긋났던 문장을 고쳤다(이 파일의 위쪽 절 두 곳).
- **F-04(low, work_date 밴드 충돌 확률)**는 지시대로 건드리지 않았다 — 고치려면
  `tests/e2e/support/**`가 필요한데 「변경 허용 경로」 밖이라 backlog로 남는다.
- 새 entries 7개(F-01 unit RED·GREEN 1쌍 + F-02·F-03 e2e RED 4개 + e2e GREEN 1개)를
  `docs/execution/runs/P3-T04/tdd.json`에 추가했다 — entries 6개에서 13개로 늘었다. e2e 쪽은
  RED 4개가 GREEN 1개보다 모두 앞서 있고 명령 문자열이 전부 동일해 `gate:tdd`를 만족한다.
- `pnpm verify` 전체 GREEN을 수정 라운드 종료 시점에 재확인했다(아래 「다음 행동」 참고).

### 인수 조건별 근거(수정 라운드로 강화된 부분만)

- AC6: 이제 단위 테스트가 봉인표가 요구한 "세 position_id" 그대로를 단언한다(위 F-01).
- AC3(연장): 배지 소멸이 이제 e2e에서 직접 단언된다(위 F-02) — 기존 `assignments` 행 부재 확인과
  함께 이중으로 보호된다.
- AC4: 두 번째 포지션 거부가 이제 GENDER_MISMATCH·NOT_ELIGIBLE 두 분기 모두에서 각각 다른 사유로
  확인된다(위 F-03).

### 미결 사항

- F-04(work_date 밴드 충돌 확률 약 2/864)는 `tests/e2e/support/**`가 있어야 고칠 수 있어 backlog로
  남는다 — 별도 task의 헬퍼 추출 시점에 함께 처리할 만하다.
- 그 외 미결 사항은 최초 개발 단계 절과 `docs/execution/runs/P3-T04/radio.md`가 그대로 소유한다.

### 다음 행동

1. 조정자가 재검증(교차 리뷰)을 다시 열지 판단한다. 이 세션은 `index.jsonl`의 P3-T04 상태를
   바꾸지 않았다(계속 `in_progress`).
2. `ci-finisher`가 이 커밋을 push하고 CI를 확인한다. 이 세션은 push하지 않았다.

### 증거·산출물 경로(수정 라운드분)

- `docs/execution/runs/P3-T04/tdd.json` — entries 13개(F-01·F-02·F-03 신규분 7개 포함).
- `docs/execution/runs/P3-T04/radio.md` — 수정 라운드 절에 F-01~F-05 처리 내역을 이어 적었다.
- `src/entities/schedule/api/__tests__/list-schedule-requirements.test.ts`(AC6 세 포지션 케이스).
- `tests/e2e/assignment-eligibility.spec.ts`(배지 존재·소멸 단언, NOT_ELIGIBLE 거부 fixture와
  메시지 구분 단언).
