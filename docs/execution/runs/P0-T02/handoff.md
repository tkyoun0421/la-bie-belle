# P0-T02 handoff

## 2026-08-04 · 개발 종료

- 작업 식별자: P0-T02 (코드 품질과 테스트 도구 구성)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-04

### 확정된 사실

- 승인 정본은 `docs/execution/radio/P0-T02-radio.md` **revision 4**(Approved)다. 실행 중 네 번 재승인했고 봉인 해시는 `733125a0e4a316c7…`다. `pnpm gate:radio`로 일치를 확인했다.

- **구조 계약 `config/fsd.json`이 정본으로 섰다.** ESLint의 `project/*` 규칙과 `.claude/hooks/tdd-guard.sh`가 같은 파일을 읽는다. `model` 세그먼트의 `unitTest`를 `exempt`로 바꾸면 훅 판정이 즉시 바뀌고 되돌리면 복구되는 것을 실측으로 확인했다.

- **로컬 ESLint 플러그인 `tools/eslint-plugin-project/`에 규칙 7개를 구현했다**: `layer-direction`, `segment-name`, `segment-imports`, `no-runtime-export`, `require-server-only`, `file-naming`, `no-comments`. 경로 파싱은 `lib/resolve-path.mjs`와 `lib/import-target.mjs`가, 계약 로드는 `lib/contract.mjs`가, glob 변환은 `lib/glob.mjs`가 소유하고 일곱 규칙이 공유한다.

- **TDD로 진행했다.** 규칙마다 스텁을 먼저 두어 "Should have 1 error but had 0"(아무것도 막지 못함)을 RED로 확인한 뒤 구현했다. `tdd.json`에 명령별 RED→GREEN을 기록했다. 최종 테스트 109개 통과.

- **의존성 실행 결과 확정된 사항**
  - TypeScript **7.0.2 → 6.0.3**. `typescript-eslint` 8.66.0(최신)이 TS 7에서 경고가 아니라 **에러로 중단**한다(`typescript-eslint does not support TS 7.0`). `.ts`를 파싱할 다른 파서가 없어 우회 불가였다. Next.js 16은 `typescript`를 peer로 요구하지 않고, P0-T01도 TS 7을 적극 선택한 게 아니라 "기존 7.0.2를 그대로 쓴다"였다.
  - `eslint-plugin-import`(peer `^9`)는 ESLint 10에서 쓸 수 없어 `eslint-plugin-import-x`를 채택했다.
  - `eslint-plugin-boundaries`는 채택하지 않았다. `fsd.json`을 플러그인 설정으로 변환하는 어댑터가 필요해 정본이 한 겹 멀어진다.

- **설계 대비 변경 4건(revision 4)**
  1. `runtimeExports`를 불리언에서 `true`/`false`/`"constants"` 세 값으로 확장. 불리언으로 두면 `config` 세그먼트가 상수조차 export할 수 없어 존재 이유를 잃는다. 테스트가 이 결함을 드러냈다.
  2. `appLayer`를 계약에 추가. `src/app/**` 전체 면제는 `route.ts`(API 엔드포인트)를 검증 없이 통과시킨다. 표현 파일만 면제하고 `route.ts`와 `src/` 최상위 파일은 테스트를 요구한다. Next.js 16에서 `middleware.ts`는 deprecated되고 **`proxy.ts`**로 개명됐으며 위치는 `app`과 같은 레벨이다.
  3. Prettier·ESLint 대상을 `src/`로 한정(사용자 결정). 저장소 전체 포맷이 문서 21개와 봉인된 RADIO까지 건드려 `gate:radio`가 해시 불일치를 잡아냈다.
  4. pre-commit이 `package.json`·`node_modules` 없는 환경에서 프로젝트 검사를 건너뛰고 그 사실을 stderr에 알린다. 하네스 수용 테스트가 의존성 없는 임시 저장소에서 훅을 돌리기 때문이며, 이 가드 없이는 self-test 2건이 실패한다.

- **`harness/`의 주석 128건을 제거했다.** `DEV-CODE-07`이 `MUST`라 RADIO에서 면제할 수 없다는 규칙 등급 정의에 따른 처리다. 제거 후 `harness:self-test` 131개와 `harness:typecheck`가 모두 통과한다.

- **barrel을 제거했다.** `src/views/bootstrap/index.ts`를 지우고 `src/app/page.tsx`가 `@/views/bootstrap/ui/BootstrapScreen`을 직접 import한다. 파일명도 `bootstrap-screen.tsx` → `BootstrapScreen.tsx`로 바꿨다.

- **`DEV-NAME-01`~`05`를 `DEVELOPMENT.md`에 신설했다.** 세그먼트별 책임·잠금 표와 `app` 계층 규칙을 함께 기록했다.

- **E2E가 판별력을 갖는다.** 모바일 뷰포트에서 부트스트랩 화면이 렌더되는 것을 확인했고(1 passed), 화면 문구를 일부러 바꾼 대조군에서 실패(exit 1)하는 것까지 확인한 뒤 복원했다.

- 검사 배치: pre-commit(harness 게이트 4종 → lint-staged → `tsc --incremental` → `vitest run`), pre-push(`pnpm build`), CI용 `pnpm verify`.

### 절차 기록

- `tdd.json`에 exit 코드와 phase가 어긋난 기록 1건을 남겼다가 `gate:tdd`가 잡아 바로잡았다. 반례 테스트를 추가하고 RED를 기대했으나 실제로는 통과한 실행이었는데 스크립트가 무조건 `red`로 적었다. 사실대로 `green`으로 고쳤다.
- 구현 중 `contract.mjs`의 glob 변환을 "명백한 버그"로 진단했으나 **틀린 진단이었다.** 실제 파일에는 보이지 않는 제어 문자(`\x01`)가 들어가 해당 두 줄이 no-op이었고 동작은 올바랐다. 의도가 드러나는 형태로 다시 쓰고 반례 테스트 8건을 추가했다.

### 미결 사항

- **`harness/`의 주석 재발을 기계가 막지 못한다** — 결정 주체: 사용자, 반환할 단계: 설계. 린트 범위를 `src/`로 한정한 결과다. 이번에 정리한 상태는 유지되지만 앞으로는 사람과 교차 검증이 지킨다. `DEV-CODE-07`은 여전히 저장소 전체에 적용되는 `MUST`이며 달라진 것은 기계 강제 범위뿐이다.
- P0-T29가 남긴 F-08(low, 미결 부채 집계 가정)은 backlog에서 계속 추적한다.

### 다음 행동

1. 등록 check 6종(`fsd-contract`·`lint`·`unit`·`mobile-e2e`·`git-hooks`·`harness-regression`)을 실행해 검증 단계를 마친다. `git-hooks`는 새로 clone한 임시 저장소에서 `pnpm install` 후 훅이 도는 것까지 확인해야 한다.
2. 교차 검증을 리뷰어 2자로 진행하고 결과를 `docs/execution/reviews/P0-T02-review.json`에 남긴다.

### 증거·산출물 경로

- `config/fsd.json` (구조 계약 정본)
- `tools/eslint-plugin-project/` (규칙 7개와 공유 라이브러리, 테스트 109개)
- `eslint.config.mjs`, `eslint.config.ci.mjs`, `.prettierrc`, `.prettierignore`, `vitest.config.ts`, `playwright.config.ts`
- `.githooks/pre-commit`, `.githooks/pre-push`, `.claude/hooks/tdd-guard.sh`
- `tests/e2e/bootstrap.spec.ts`, `tests/setup-dom.ts`
- `docs/execution/runs/P0-T02/tdd.json` (RED→GREEN 기록)
- `docs/standards/DEVELOPMENT.md` (`DEV-NAME-*`), `docs/workflow/TOOLING.md`, `CLAUDE.md`
