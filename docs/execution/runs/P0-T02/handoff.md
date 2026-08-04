# P0-T02 handoff

## 2026-08-04 · 개발 종료

- 작업 식별자: P0-T02 (코드 품질과 테스트 도구 구성)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-04

### 확정된 사실

- **구조 계약 `config/fsd.json`이 정본으로 섰다.** ESLint의 `project/*` 규칙과 `.claude/hooks/tdd-guard.sh`가 같은 파일을 읽는다. `model` 세그먼트의 `unitTest`를 `exempt`로 바꾸면 훅 판정이 즉시 바뀌고 되돌리면 복구되는 것을 실측으로 확인했다.

- **로컬 ESLint 플러그인 `tools/eslint-plugin-project/`에 규칙 7개를 구현했다**: `layer-direction`, `segment-name`, `segment-imports`, `no-runtime-export`, `require-server-only`, `file-naming`, `no-comments`. 경로 파싱은 `lib/resolve-path.mjs`와 `lib/import-target.mjs`가, 계약 로드는 `lib/contract.mjs`가, glob 변환은 `lib/glob.mjs`가 소유하고 일곱 규칙이 공유한다.

- **TDD로 진행했다.** 규칙마다 스텁을 먼저 두어 "Should have 1 error but had 0"(아무것도 막지 못함)을 RED로 확인한 뒤 구현했다. `tdd.json`에 명령별 RED→GREEN을 기록했다.

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

## 2026-08-04 · 검증 종료

- 현재 단계: 검증 종료 → 다음 리팩토링
- 기준 커밋: `b2288bba84602628d29aabf82177161c39d287b5`
- 승인 정본: `docs/execution/radio/P0-T02-radio.md` **revision 7**(Approved), 봉인 해시 `6e28c9508c80546b…`. `index.jsonl`의 `development_approval`과 일치하며 `pnpm gate:radio`로 확인했다.

### 등록 check 결과

여섯 check 모두 GREEN이다.

| check | 근거 |
| --- | --- |
| `lint` | 규칙 7종에 의도적 위반 fixture를 각각 심어 전부 정확히 1건씩 차단. 실제 `src/`는 통과(오탐 대조군) |
| `unit` | 113개 통과 |
| `mobile-e2e` | 모바일 뷰포트 1개 통과 |
| `harness-regression` | self-test 131개와 `harness:typecheck` 통과 |
| `fsd-contract` | `config/fsd.json`에 `helpers` 세그먼트를 추가하는 한 번의 수정으로 ESLint 판정(`segment-name` → `no-runtime-export`)과 tdd-guard 판정(deny → 허용)이 함께 바뀌고, 되돌리면 둘 다 복구됨 |
| `git-hooks` | 새 clone에서 `pnpm install`만으로 `core.hooksPath`가 `.githooks`로 설정됨. task ID 없는 메시지(commit-msg), 주석 위반(pre-commit), 실패하는 단위 테스트(pre-commit), 타입 에러 push(pre-push)가 각각 거부됨 |

### 검증 중 발견해 고친 구현 결함 2건

1. **`__tests__` 폴더를 ESLint가 차단했다.** `tdd-guard.sh`는 테스트가 없을 때 `<dir>/__tests__/<stem>.test.ts`를 예상 경로로 안내하는데 `project/file-naming`이 그 폴더를 kebab-case 위반으로 막았다. 훅이 시킨 대로 하면 커밋이 거부되는 상태였고, 이 task의 핵심 주장인 "두 도구가 같은 정본을 읽어 판정이 갈리지 않는다"가 실제로는 성립하지 않았다. `naming.exceptions`에 `**/__tests__/**`를 추가해 해소했다(RADIO revision 6, 사용자 결정). 예외가 넓어지지 않도록 `__mocks__`와 `__tests__helper`가 계속 막히는 반례를 테스트로 고정했다.
   - 이 결함 때문에 `git-hooks`의 "실패하는 단위 테스트가 커밋을 막는가" 시나리오가 처음에는 확인 불가였다. lint-staged가 먼저 막아 `vitest`까지 도달하지 못했다. 고친 뒤 재실행해 확인했다.
2. **`.tsbuildinfo`가 gitignore에 없었다.** pre-commit이 `--tsBuildInfoFile .tsbuildinfo`를 만드는데 `.gitignore`에는 `tsconfig.tsbuildinfo`만 있었다. RADIO가 "`.tsbuildinfo`는 gitignore 대상"이라고 명시했으므로 설계와 구현이 어긋난 누락이다.

### 교차 검증 결과

- 결과 파일: `docs/execution/reviews/P0-T02-review.json`
- 리뷰어 2자(`opus`·`codex`)가 독립 리뷰 후 교차 확인했고 **19건 전부 양쪽 인정으로 확정**됐다. 기각된 발견은 없다.
- 종합 72점 — 테스트 60, 아키텍처 68, 코드 품질 72, 성능 80, 보안 82.
- `critical` 0건이라 안전 중단 없이 진행했다. `high` 3건은 사용자에게 즉시 보고했고 **셋 다 이번 task에서 해소하기로 결정**됐다(RADIO revision 7).

`high` 3건 처리:

1. **F-02 · 훅이 인정하는 테스트를 vitest가 수집하지 않았다.** `src/app/**/route.ts`와 `src/proxy.ts`의 형제 테스트, `src/__tests__/`, 슬라이스 상위 `__tests__/`가 `pnpm test` 대상 밖이었다. "테스트가 있다"가 "테스트가 돈다"를 뜻하지 않는 상태였다. `node` 프로젝트가 `src/**/*.test.{ts,tsx}` 전체를 수집하고 `ui`·`hooks`만 제외하도록 바꿨다. 훅이 인정하는 경로에 probe 테스트를 두고 수집되지 않는 RED(`No test files found`, exit 1)를 확인한 뒤 수정해 GREEN을 얻었고 probe는 제거했다.
2. **F-03 · harness 회귀 안전망이 `pnpm verify` 밖에 있었다.** `harness:typecheck`와 `harness:self-test`를 `verify`에 넣었다.
3. **F-01 · pre-commit 인수 조건 문구가 실제 거동과 달랐다.** `lint-staged`의 `prettier --write` 때문에 포맷 위반은 거부가 아니라 자동 수정 후 통과한다. 설계는 승인된 대로 두고 `index.jsonl`의 인수 조건 문구를 정정했다. 거부형 포맷 검사는 `verify`의 `format:check`가 담당한다.

나머지 `medium` 15건과 `low` 1건은 `docs/execution/reviews/backlog.md`에 누적했다.

### 미결 사항

- **`harness/`의 주석 재발을 기계가 막지 못한다** — 결정 주체: 사용자, 반환할 단계: 설계. 린트 범위를 `src/`로 한정한 결과다. `DEV-CODE-07`은 여전히 저장소 전체에 적용되는 `MUST`이며 달라진 것은 기계 강제 범위뿐이다. 교차 검증이 실제로 `.claude/hooks/tdd-guard.sh`의 주석 잔존을 잡아냈다(F-10, backlog).
- **`pnpm verify`에 `check:app-build`가 없다** — F-11(medium, backlog). 서버 전용 값의 클라이언트 번들 유출을 실제로 확인하는 유일한 검사이며 한 줄로 추가 가능하지만, 사용자가 정한 이번 처리 범위(`high` 3건)를 넘으므로 backlog에 둔다.
- **`harness:self-test` 중 git stderr 노이즈 1건** — 조정자 관찰이며 리뷰어 확정 발견이 아니다. `harness/lib/repo.ts`의 `listStagedFiles`가 git 저장소가 아닌 fixture 디렉터리에서 호출되면 git이 `--no-index` 사용법을 stderr에 찍는다. self-test 131개는 모두 통과하므로 판정에는 영향이 없고, `verify`에 self-test를 넣은 뒤 그 출력이 보이게 됐을 뿐이다.
- P0-T29가 남긴 F-08(low, 미결 부채 집계 가정)은 backlog에서 계속 추적한다.

### 다음 행동

1. 리팩토링 단계에서 동작 변경 없는 정리만 수행하고 같은 검증을 재실행한다.
2. 단일 commit으로 통합하고 `done`으로 갱신한 뒤 대시보드를 재생성한다.
3. 다음 후보는 `P0-T03`(Supabase 로컬 개발과 초기 스키마)이나 `proposed` 상태라 기획 승인이 먼저 필요하다. 실행 가능한 `planned` 큐는 비어 있다.

### 증거·산출물 경로

- `config/fsd.json` (구조 계약 정본)
- `tools/eslint-plugin-project/` (규칙 7개와 공유 라이브러리, 테스트 113개)
- `eslint.config.mjs`, `eslint.config.ci.mjs`, `.prettierrc`, `.prettierignore`, `vitest.config.ts`, `playwright.config.ts`
- `.githooks/pre-commit`, `.githooks/pre-push`, `.claude/hooks/tdd-guard.sh`
- `tests/e2e/bootstrap.spec.ts`, `tests/setup-dom.ts`
- `docs/execution/runs/P0-T02/tdd.json` (RED→GREEN 기록)
- `docs/execution/reviews/P0-T02-review.json`, `docs/execution/reviews/backlog.md`
- `docs/standards/DEVELOPMENT.md` (`DEV-NAME-*`), `docs/workflow/TOOLING.md`, `CLAUDE.md`
