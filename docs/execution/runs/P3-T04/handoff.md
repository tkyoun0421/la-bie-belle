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
- TDD RED→GREEN 4쌍을 `docs/execution/runs/P3-T04/tdd.json`에 남겼다(unit 2쌍 + e2e 1쌍, 명령·
  exit code·실제 시각 전부 이번 세션의 실제 명령 실행에서 얻었다). e2e RED→GREEN 쌍은 동일 명령
  (`npx playwright test tests/e2e/assignment-eligibility.spec.ts --reporter=list`)으로 재실행해
  `gate:tdd`의 명령 일치 요구를 맞췄다 — 첫 시도(RED는 `-g` 필터, GREEN은 stash pop 접두)가
  명령 문자열 불일치로 `gate:all`에 걸려 재실행했다.

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
6. **상한 없음** — 충족. `list-schedule-requirements.test.ts`의 신규 케이스가 한 사람이 두
   `position_id`를 가진 행에서 `assignedWorkerCount`는 1, `assignedCounts` 합은 2가 되는 것을
   단언한다(집계 로직 자체가 개수 상한을 두지 않는 구조임을 확인). e2e에서 셋 이상은 별도로 만들지
   않았다 — RADIO 위험 렌즈 표가 이 항목을 unit 전담으로 지정했다.
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

- `docs/execution/runs/P3-T04/tdd.json` — RED→GREEN 4쌍(명령·exit code·ISO8601 시각).
- `docs/execution/runs/P3-T04/radio.md` — "이미 돌아간다" 전제의 실행 확인 근거, AC4를 RPC 직접
  호출로 검증한 이유, 조회 수 불변 근거, backlog 제안 2건.
- `src/entities/schedule/api/list-schedule-requirements.ts`(+test 확장).
- `src/views/admin-schedule/model/requirement-section-data.ts`(+test 확장).
- `src/views/admin-schedule/ui/AdminSchedulePrepView.tsx`.
- `src/app/(protected)/admin/schedule/[id]/page.tsx`.
- `tests/e2e/assignment-eligibility.spec.ts`(신규 test 1개 + `createAdminSession` 반환값 확장).
- `docs/execution/phases/index.jsonl`(P3-T04만 `in_progress`로 전환).
