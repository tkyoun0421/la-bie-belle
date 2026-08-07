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
