# P0-T41 handoff

## 2026-08-07 · 개발 단계 종료

- 작업 식별자: P0-T41 (pre-commit 테스트 범위 슬리밍)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-07

### 확정된 사실

- 실행 전 승인 SHA-256(revision 1, `1fd6c2e602bcdb0e2adb71a8d93321849a784d702c10cce11954f23acf65c064`)과 실제 `docs/execution/radio/P0-T41-radio.md` 파일 해시가 일치함을 확인한 뒤 시작했다. `docs/execution/phases/index.jsonl`에서 P0-T41을 `planned` → `in_progress`로 바꿨다(같은 줄 다른 필드·다른 task 무수정, `pnpm gate:index` 통과 확인).
- `harness/lib/precommit-test-scope.ts`(신규): `classifyStagedFiles(paths): TestScopeJudgment`, `buildVitestCommand(judgment): VitestCommand | null`, `runPrecommitTestScope(stagedFiles, runVitest)`(러너 주입형 fail-closed 오케스트레이션)와 `CODE_PATH_GLOBS`·`BROAD_IMPACT_GLOBS` 상수(판정 모듈 단일 선언, `harness/lib/glob.ts`의 `matchesAnyGlob` 재사용)를 구현했다.
  - `CODE_PATH_GLOBS`: `src/**·tests/**·harness/**·tools/**·supabase/**·config/**·scripts/**·.githooks/**` + 루트 설정 파일(`next.config.ts`·`eslint.config.mjs`·`eslint.config.ci.mjs`·`postcss.config.mjs`·`playwright.config.ts`·`components.json`·`.prettierrc`).
  - `BROAD_IMPACT_GLOBS`: `package.json`·`pnpm-lock.yaml`·`vitest.config.*`·`tsconfig*`·`config/fsd.json`·`tests/setup-*.ts`(마지막 항목은 아래 미결 사항 실측에서 추가로 확정한 항목이다).
  - 판정 순서: 분류 불가(빈 문자열·절대경로) 항목이 하나라도 있으면 최우선으로 `full` → 빈 스테이징은 `skip` → 광역 파일이 하나라도 있으면 `full` → 코드 경로 파일이 있으면 그 파일 목록만 담아 `related` → 아무 것도 안 걸리면(문서 전용) `skip`.
  - `runPrecommitTestScope`는 `related` 실행이 실패(0이 아닌 exit)하면 fail-closed로 `vitest run`(전체)을 다시 실행해 그 결과를 최종값으로 쓴다. `skip`은 러너를 아예 호출하지 않아 "생략 시 출력 없음" 계약을 지킨다.
- `harness/gates/precommit-test.ts`(신규, 실행부): `listStagedFiles`(`harness/lib/repo.ts` 기존 함수 재사용, `git diff --cached --name-only -z`)로 스테이징 목록을 수집하고 `runPrecommitTestScope`에 실제 `spawnSync("pnpm", ["exec","vitest",...args], { cwd: root, stdio: "inherit" })` 러너를 주입한 뒤 `process.exitCode`에 결과를 반영한다. 분기 로직은 셸이 아니라 이 실행부와 판정 모듈에만 있다.
- `.githooks/pre-commit`: 무조건적 `pnpm exec vitest run` 한 줄을 `node ... harness/gates/precommit-test.ts` 호출로 교체했다. 게이트 4종(`harness/gates/pre-commit.ts`)·`lint-staged`·`tsc --noEmit --incremental`·의존성 부재 시 조기 종료 안내는 무수정이다.
- `harness/self-test/precommit-test-scope.test.ts`(신규, 38 case): 빈 스테이징·비코드만·문서+코드 혼합·코드만·광역 1개 승격·분류 불가(빈 문자열/절대경로) 5+2가지 조합, `CODE_PATH_GLOBS`·`BROAD_IMPACT_GLOBS` 각 대표 항목별 분류(경계값 렌즈), `buildVitestCommand`의 skip/related/full 명령 산출, `runPrecommitTestScope`의 skip 무호출·related 성공·related 실패 시 full 재실행·full 재실행도 실패 시 그 결과 반환·full 직행 5가지를 가짜 러너 주입으로 단언한다.
- TDD RED→GREEN(실제 실행, 사후 재구성 없음): 구현 전에 `harness/self-test/precommit-test-scope.test.ts`부터 작성하고 `harness/lib/precommit-test-scope.ts`가 없는 상태에서 실행해 `ERR_MODULE_NOT_FOUND`로 exit 1을 실제로 확인했다(RED, `at: 2026-08-07T02:24:00Z`). 그다음 `harness/lib/precommit-test-scope.ts`를 작성해 같은 명령으로 재실행해 38/38 통과(GREEN, `at: 2026-08-07T02:24:21Z`)를 확인했다. 두 시각 모두 실제 명령 실행 직후 `date -u` 출력에서 그대로 옮겨 `docs/execution/runs/P0-T41/tdd.json`에 기록했다.
  - `harness/self-test/hook-acceptance.test.ts`의 신규 3 case(문서 전용 스테이징의 vitest 무개입·exit 0, 코드 스테이징의 vitest 실행 시도, 훅 파일 내용 검증)는 실행부·훅 교체가 이미 끝난 뒤에 작성해 곧바로 GREEN을 확인했다 — P0-T40 교차 검증이 지적한 "stash 사후 재구성 RED"를 피하려고 이 파일에 대해서는 인위적인 RED를 만들지 않았다. `gate:tdd`가 요구하는 RED→GREEN 증거는 `precommit-test-scope.test.ts`의 진짜 test-first 기록 하나로 충족한다(같은 `command` 문자열의 red/green 쌍 존재, `pnpm gate:tdd` 무출력 통과로 확인).
- `vitest related` 실측(RADIO 미결 사항): 이 저장소 구성(`@/` alias·`tests/setup-dom.ts` setupFiles)에서 직접 확인했다.
  - alias를 거친 간접 의존은 정확히 추적한다 — `vitest related src/shared/lib/format-date-time-seoul.ts`는 그 파일의 자체 테스트뿐 아니라 이를 `@/shared/lib/format-date-time-seoul`로 import하는 `src/views/admin/ui/ApprovalListView.tsx`의 테스트(`ApprovalListView.test.tsx`)까지 정확히 찾아냈다(2홉 그래프 순회 확인).
  - `tests/setup-dom.ts`(`vitest.config.ts`의 dom 프로젝트 `setupFiles`)는 **불안정했다** — 이 파일 자체를 `vitest related` 대상으로 주면 "No test files found, exiting with code 0"을 반환한다. `setupFiles`로만 연결된 의존은 vitest의 관련성 그래프에 잡히지 않아, 이 파일이 바뀌어도 전체 dom 테스트에 영향을 줄 수 있는데 related 모드는 그 사실을 놓친다. RADIO의 지시대로 fail-closed 규칙에 맞춰 `tests/setup-*.ts`를 `BROAD_IMPACT_GLOBS`에 추가해 이 케이스를 항상 `full`로 승격하도록 넓혔다.
  - 존재하지 않는 파일 경로(삭제된 파일)를 `vitest related`에 줘도 에러 없이 "No test files found, exit 0"으로 조용히 통과한다 — exit code만으로는 "related 실행 실패"를 항상 잡아내지 못한다는 뜻이라, 위 setupFiles 사례처럼 정적 광역 파일 목록으로 보강하는 것이 유일한 안전판이다(실행 실패 시 fail-closed 재실행은 `related` 명령 자체가 비정상 종료할 때만 작동하는 보조 안전판이고, 1차 방어는 `BROAD_IMPACT_GLOBS`다).
  - `harness/**`·`.githooks/**`는 `vitest.config.ts`의 어느 프로젝트 include에도 없어(`tools/**/*.test.mjs`·`src/**/*.test.{ts,tsx}`만 포함) `vitest related`가 이 경로들에 대해 항상 0건을 찾는다. 이는 기존 동작(무조건 `vitest run`도 `harness/`를 커버하지 않았다 — `pnpm harness:self-test`가 별개 러너로 그 몫을 맡는다, RADIO 비목표에 "하네스 self-test 실행 방식 변경 없음"으로 명시)과 동일해 회귀가 아니다.
- 자기 커밋 수용 테스트(RADIO 요구): 이 task의 실제 커밋 스테이징(문서 `docs/execution/runs/P0-T41/**`·`docs/execution/phases/index.jsonl` + 코드 `harness/**`·`.githooks/**` 혼합, 8개 파일)에 `node harness/gates/precommit-test.ts`를 그대로 실행해 확인했다. 판정은 `related`였고(광역 파일 미포함, `harness/**`·`.githooks/**` 코드 경로 존재), `vitest related` 자체는 실제로 기동해 배너를 출력했으나 대상 파일들이 어느 vitest include 패턴에도 없어 0 test로 즉시 종료했다(위 항목에서 설명한 기존 한계와 동일, 회귀 아님) — `time` 측정 결과 0.99초, exit 0이었다. 같은 저장소에서 `pnpm exec vitest run`(구 방식, 전체 스위트)을 직접 측정하면 21.0초였다 — 이 커밋 기준 약 20초 절감이다.
- `pnpm harness:typecheck`, `pnpm harness:self-test`(242/242, 기존 201 + 신규 41), `pnpm gate:tdd`/`gate:radio`/`gate:index`(무출력 통과)가 모두 통과했다. `pnpm verify` 전체(format → lint:ci → typecheck → test 775/775 → harness:typecheck → harness:self-test 242/242 → check:docs → build → check:app-build → check:client-secret-scan → test:e2e 27/27 → gate:all)를 실행해 gate:handoff를 제외한 전 단계 통과를 확인했다(이 handoff 작성 전이라 gate:handoff만 당시 실패, 정상). e2e 1회차는 로컬 Supabase의 이전 실행 잔여 사용자(`e2e-p1-t01@labiebelle.test`)로 `global-setup.ts`의 `listUsers` 기본 페이지 크기를 넘는 사용자 누적 때문에 실패했다 — `pnpm db:reset`으로 로컬 DB를 초기화한 뒤 재실행해 27/27 통과했다(P0-T41 코드와 무관한 로컬 환경 문제, RADIO 허용 경로 밖이라 `global-setup.ts`는 수정하지 않았다).
- 변경 파일은 전부 RADIO의 변경 허용 경로 안이다: `harness/lib/precommit-test-scope.ts`, `harness/gates/precommit-test.ts`, `harness/self-test/precommit-test-scope.test.ts`, `harness/self-test/hook-acceptance.test.ts`, `.githooks/pre-commit`, `docs/execution/runs/P0-T41/**`, `docs/execution/phases/index.jsonl`.

### 미결 사항

- 없음. RADIO의 유일한 미결 사항(`vitest related` 실측)은 위에서 실측하고 `tests/setup-*.ts`를 `BROAD_IMPACT_GLOBS`에 반영해 닫았다.
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남겨 둔다.

### 다음 행동

1. 등록된 `check_ids`(`precommit-scope-selftest`)와 관련 회귀를 검증 단계에서 재실행한다.
2. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T41-review.json`에 기록한다.
3. 검증 통과 후 `index.jsonl`의 P0-T41을 `done`으로 전환하고 대시보드를 재생성한다.
4. ci-finisher가 push와 CI 감시를 백그라운드로 수행한다(이 handoff는 push하지 않는다).
5. P0 루프의 마지막 task이므로, `done` 전환 뒤 phase 종료 조건 확인이 뒤따라야 한다(조정자 판단).

### 증거·산출물 경로

- `harness/lib/precommit-test-scope.ts`(판정·명령 산출·fail-closed 오케스트레이션, 신규)
- `harness/gates/precommit-test.ts`(실행부, 신규)
- `harness/self-test/precommit-test-scope.test.ts`(38 case, 신규)
- `harness/self-test/hook-acceptance.test.ts`(기존 5 case 무수정 + 신규 3 case, 총 8 case)
- `.githooks/pre-commit`(무조건 vitest 전체 실행 → 판정 기반 실행부 호출)
- `docs/execution/runs/P0-T41/tdd.json`
- `docs/execution/phases/index.jsonl`(P0-T41 `in_progress`)

## 2026-08-07 · 교차 검증 수정 라운드(F-01만 해소)

- 대상: 교차 검증 확정 7건 중 high 1건(F-01)만 이 라운드에서 해소한다. medium 4건(F-02·F-03·F-04·F-05)과 low 2건(F-06·F-07)은 조정자 지시대로 backlog·조정자 소유로 남기고 손대지 않았다. 재봉인은 하지 않았다(RADIO의 fail-closed 불변 규칙을 실제로 이행하는 수정이라 설계 변경이 아니라는 조정자 판단).
- F-01의 두 근본 원인을 실측으로 재현한 뒤 고쳤다.
  1. **`vitest related`의 `passWithNoTests` 강제**: `pnpm exec vitest related <파일> --run`을 이 저장소에서 직접 실행하면(예: `harness/lib/precommit-test-scope.ts` — vitest include 밖 경로) "No test files found, exiting with code 0"으로 항상 exit 0이었다. `--passWithNoTests=false`를 명시적으로 추가하면(`??=`는 이미 정의된 `false`를 덮어쓰지 않는다) 같은 조건에서 "exiting with code 1"로 바뀌는 것을 실측으로 확인했다 — `buildVitestCommand`의 related 분기 args 끝에 `--passWithNoTests=false`를 추가했다. `runPrecommitTestScope`의 기존 "related 실패(exitCode !== 0) → fail-closed로 full 재실행" 로직은 무수정이다 — 이제 exit code가 정확해지니 기존 재시도 로직이 그대로 올바르게 작동한다.
  2. **`git diff --cached --name-only`의 삭제·rename 상태 손실**: `harness/lib/repo.ts`에 `listStagedFileChanges(root)`(신규, `git diff --cached --name-status -z` 기반, NUL 필드를 상태 코드별로 파싱 — R/C는 `previousPath`+`path` 2필드, 그 외는 `path` 1필드)를 추가했다. 기존 `listStagedFiles`(name-only, scope-gate가 쓰는 함수)는 무수정으로 남겨 다른 소비자에 영향이 없다. `classifyStagedFiles`의 입력을 `readonly string[]`에서 `readonly StagedFileChange[]`(status·path·previousPath)로 바꾸고, 분류 불가 판정 다음·빈 스테이징 판정 다음 우선순위로 "상태가 D 또는 R로 시작하는 항목이 하나라도 있으면 full"을 추가했다 — 목적지 경로가 코드 경로 glob에 걸리는지와 무관하게 D·R은 항상 full로 승격하는 블런트 규칙이다(조정자 지시 그대로: "D·R 상태가 하나라도 있으면 full로 승격하라"). `harness/gates/precommit-test.ts`는 `listStagedFiles` 대신 `listStagedFileChanges`를 쓰도록 바꿨다.
- TDD RED→GREEN(실제 실행): `harness/self-test/precommit-test-scope.test.ts`를 구현보다 먼저 새 계약(`StagedFileChange` 입력, D·R 승격 케이스 3개, `passWithNoTests=false`를 포함한 명령 산출 단언, 0건 related를 실제 vitest로 재현하는 통합 테스트 1개)으로 다시 써서 수정 전 구현(문자열 배열을 기대하는 옛 `classifyStagedFiles`)에 그대로 실행해 44개 중 39개가 실패하는 RED를 실제로 확인했다(`at: 2026-08-07T02:59:33Z`, exit 1) — 대부분은 `path.trim is not a function`(옛 구현이 객체를 문자열로 오인)이고, `passWithNoTests` 통합 테스트는 정확히 보고서가 지목한 그 증상("0건 related 실행이 exit 0으로 통과했다")으로 실패했다. `harness/lib/repo.ts`에 `listStagedFileChanges`를 추가하고 `harness/lib/precommit-test-scope.ts`·`harness/gates/precommit-test.ts`를 위 설계대로 고친 뒤 같은 명령으로 재실행해 44/44 통과(GREEN, `at: 2026-08-07T03:00:10Z`)를 확인했다. 두 시각 모두 `date -u` 실제 출력에서 옮겨 `tdd.json`에 추가했다(기존 두 항목은 무수정 보존).
- `pnpm harness:typecheck`, `pnpm harness:self-test`(248/248, 이전 242 + 신규 6: D 삭제·R rename 목적지 코드·R rename 목적지 비코드 3 case + 상태 M 무영향 확인 1 case + `runPrecommitTestScope`의 D 단독 승격 1 case + 실제 vitest 통합 1 case), `pnpm gate:tdd`(무출력 통과)를 확인했다. `pnpm db:reset` 후 `pnpm verify` 전체(format → lint:ci → typecheck → test 775/775 → harness:typecheck → harness:self-test 248/248 → check:docs → build → check:app-build → check:client-secret-scan → test:e2e 27/27 → gate:all)를 실행해 exit 0을 확인했다.
- 자기 커밋 재실측(수정 반영 후): 이 수정 라운드 자체의 스테이징(`harness/gates/precommit-test.ts`·`harness/lib/precommit-test-scope.ts`·`harness/lib/repo.ts`·`harness/self-test/precommit-test-scope.test.ts`, 전부 상태 M — D·R 없음)에 `node harness/gates/precommit-test.ts`를 그대로 실행해 확인했다. 판정은 `related`(코드 경로만 M 상태로 존재, 광역 파일 없음)였고, `vitest related`가 대상 파일 전부 harness/**라 0건을 찾자 이번에는 `--passWithNoTests=false` 덕분에 "exiting with code 1"로 실패했다 — 기존 재시도 로직이 그대로 `vitest run`(전체)을 실행해 775/775 통과 후 exit 0으로 마무리됐다. `time` 측정 결과 총 20.8초(related 시도 ~1초 + full 재실행 ~19.4초)였다.
  - **절감 효과 변화(중요)**: 첫 구현(F-01 수정 전) 때는 이 유형의 커밋(코드 경로가 있지만 vitest include 밖인 harness/.githooks만 스테이징)이 조용히 0.99초에 exit 0으로 끝나 "절감됐다"고 잘못 기록했었다 — 실은 아무것도 검증하지 못한 채 통과한 것이었다(F-01이 지적한 바로 그 결함). 수정 후에는 같은 유형의 커밋이 fail-closed로 전체 스위트를 타 약 20.8초가 걸린다 — 이는 P0-T41 이전의 무조건 `vitest run`(약 21.0초, 위 첫 절 실측)과 사실상 동일한 비용이다. 즉 harness/.githooks만 건드리는 커밋에는 이 task의 속도 이득이 없다(원래도 vitest가 그 경로를 검증한 적이 없어 이득이 있을 수 없는 유형이었고, 이제는 정직하게 그 사실이 비용으로 드러난다). 실제 절감은 여전히 (a) 문서 전용 커밋의 완전 생략, (b) `src/**`처럼 vitest가 실제로 커버하는 코드 경로를 건드리되 광역 파일·삭제·rename이 없는 커밋의 related 축소 두 갈래에서만 발생한다.
- F-02·F-03·F-04·F-05·F-06·F-07은 이 라운드에서 의도적으로 손대지 않았다 — 조정자가 backlog·조정자 소유로 지정했다. 특히 F-07(판별 유니언 아닌 판정 타입)과 F-06(related 실패와 진짜 테스트 실패를 구분하지 않고 병합)은 이번 수정이 만든 `TestScopeJudgment`·`runPrecommitTestScope` 구조를 그대로 재사용했으므로 두 finding의 코드 위치·설명은 여전히 유효하다.

### 미결 사항(수정 라운드)

- 없음(F-01 범위 내). F-02·F-03·F-04·F-05·F-06·F-07은 여전히 미해소 상태로 조정자가 소유한다(위 확정 목록 참고, `docs/execution/reviews/P0-T41-review.json`).

### 다음 행동(수정 라운드)

1. 조정자가 F-01 해소를 확인하고, F-02~F-07의 backlog 편입·후속 task 여부를 결정한다.
2. F-01 재검토 후 문제 없으면 `index.jsonl`의 P0-T41을 `done`으로 전환한다.
3. ci-finisher가 push와 CI 감시를 백그라운드로 수행한다(이 handoff는 push하지 않는다).
