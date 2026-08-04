# P0-T02 RADIO 개발 설계

- 상태: Approved
- revision: 7
- 기획 승인: user, 2026-08-04
- 개발 설계 승인: user, 2026-08-04 (revision 7 재승인)

## 개정 이력

| revision | 날짜       | 내용                                                                                                                                                                         |
| -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | 2026-08-04 | 최초 승인.                                                                                                                                                                   |
| 2        | 2026-08-04 | 개발 착수 직후 `typescript-eslint`가 TypeScript 7을 지원하지 않아 실행이 막혔다. TypeScript를 7.0.2에서 **6.0.3**으로 내리는 결정을 반영해 재승인했다(사용자 결정).          |
| 3        | 2026-08-04 | 훅 파일명을 `use-kebab-case`에서 **`useCamelCase`**로 바꿨다(사용자 결정). 파일 이름과 export 이름이 일치해 컴포넌트 규칙(`ShiftCard.tsx` → `ShiftCard`)과 같은 형태가 된다. |
| 4 | 2026-08-04 | 구현 중 드러난 네 가지를 반영해 재승인했다. ①`runtimeExports`를 불리언에서 `true`/`false`/`"constants"` 세 값으로 확장 ②`appLayer`를 계약에 추가해 `route.ts`가 테스트를 요구하도록 정정 ③Prettier·ESLint 적용 범위를 `src/`로 한정(사용자 결정) ④pre-commit이 의존성 없는 환경에서 프로젝트 검사를 건너뛰되 그 사실을 알리도록 변경. |
| 5 | 2026-08-04 | 변경 허용 경로에 `docs/execution/phases/00-foundation.md`를 추가했다. 훅 파일명 결정(revision 3)을 기획 문서의 네이밍 표에 반영해야 하는데 그 경로가 봉인 범위 밖이었다. |
| 6 | 2026-08-04 | 검증 단계에서 두 도구의 판정이 어긋나는 것을 발견해 `naming.exceptions`에 **`**/__tests__/**`**를 추가했다(사용자 결정). `tdd-guard.sh`가 테스트 경로로 안내하는 `__tests__` 폴더를 `file-naming`이 kebab-case 위반으로 막고 있었다. 아래 [테스트 폴더 예외](#테스트-폴더-예외-revision-6) 참고. |
| 7 | 2026-08-04 | 교차 검증의 확정 `high` 3건을 해소했다(사용자 결정). ①`vitest.config.ts`의 수집 범위를 `tdd-guard.sh`가 인정하는 경로와 맞췄다 ②`pnpm verify`에 `harness:typecheck`와 `harness:self-test`를 넣었다 ③pre-commit 인수 조건 문구를 실제 거동에 맞게 정정했다. 아래 [교차 검증 high 해소](#교차-검증-high-해소-revision-7) 참고. |

- 관련 spec: ADR:0001, ADR:0008, ADR:0013, ADR:0014, DOCS:SDD
- 적용 깊이: 일반
- test mode: tdd
- 예정 check IDs: fsd-contract, lint, unit, mobile-e2e, git-hooks, harness-regression

## Requirements

### 범위와 비목표

- 범위: FSD 구조 계약 정본(`config/fsd.json`), 그것을 읽는 로컬 ESLint 플러그인, 네이밍 규칙(`DEV-NAME-*`) 신설과 강제, formatter, Vitest + Testing Library, Playwright 모바일 프로젝트, 검사 3단계 배치(pre-commit·pre-push·CI용 단일 명령), barrel 제거, **기존 `harness/`의 주석 정리**(`DEV-CODE-07` 위반 141건 해소).
- 비목표: CI 파이프라인 구성(P0-T05), 커버리지 임계값 정책(`DEV-TEST-05`), Supabase 연동과 DB 테스트 환경(P0-T03), 디자인 토큰과 컴포넌트(P0-T34).

### 불변 규칙

- 구조 지식의 정본은 `config/fsd.json` 하나다. ESLint와 `.claude/hooks/tdd-guard.sh`는 그 파일을 읽으며, 어느 쪽도 계층·세그먼트 목록을 자체 보관하지 않는다(`DEV-SSOT-01`).
- 단위 테스트를 면제하는 세그먼트는 런타임 export를 금지한다. 면제가 우회 통로가 되지 않아야 한다.
- 승인 계약을 지키는 검사를 편의와 바꾸지 않는다. harness 게이트 4종은 어떤 훅 구성에서도 계속 실행된다.
- 규칙은 취향이 아니라 [개발 컨벤션](../../standards/DEVELOPMENT.md)의 구조 규칙만 강제한다.

### 기술 인수 조건

- 의도적 위반 fixture가 각 규칙마다 존재하고, 규칙 적용 전에는 통과하며 적용 후에는 차단된다.
- `config/fsd.json`의 세그먼트 하나를 바꾸면 ESLint 판정과 `tdd-guard.sh` 판정이 함께 바뀐다.
- 포맷 위반·린트 오류·타입 오류·테스트 실패 커밋이 pre-commit에서 거부되고 harness 게이트 4종도 같은 훅에서 실행된다.
- build 실패 push가 pre-push에서 거부된다.
- 새로 clone한 저장소에서 `pnpm install` 후 별도 명령 없이 훅이 동작한다.
- 모바일 뷰포트 E2E smoke test가 부트스트랩 화면 렌더를 확인하고, 통과만 하는 빈 테스트가 아님을 대조군으로 증명한다.
- CI에서 쓸 단일 검증 명령이 존재한다.
- 저장소에 `DEV-CODE-07` 위반이 남지 않는다. `harness/`의 주석을 제거한 뒤 `pnpm harness:self-test` 131개가 전부 통과한다.

### 위험 기반 테스트

이 task의 위험은 **"규칙을 만들었는데 실제로는 아무것도 막지 못한다"** 이다. P0-T01에서 클라이언트 번들 검사가 `"use client"`가 하나도 없는 상태에서는 항상 통과하는 판별력 없는 검사였던 것과 같은 종류다.

따라서 `test_mode`를 `tdd`로 둔다. 규칙마다 다음을 증명한다.

1. 위반 fixture를 만들고 규칙 없이 린트 → 통과한다(RED: 아직 아무것도 막지 못함).
2. 규칙을 구현하고 같은 명령으로 린트 → 차단된다(GREEN).
3. 정상 코드가 그 규칙에 걸리지 않는지도 함께 확인한다(오탐 대조군).

`tdd.json`에는 각 규칙의 RED와 GREEN을 같은 명령으로 기록한다.

### DEV-* 적용 상태

- `DEV-SSOT-01`: 추가 결정 — 구조 지식의 정본을 `config/fsd.json`으로 고정하고 두 소비자가 그것만 읽게 한다.
- `DEV-ARCH-01`~`DEV-ARCH-03`: 추가 결정 — P0-T01이 규약으로만 세운 것을 이 task가 기계 강제로 옮긴다.
- `DEV-CODE-02`: 추가 결정 — `model`의 React import 금지로 기계 검사 대상이 된다.
- `DEV-CODE-07`: 추가 결정 — 주석 금지를 로컬 규칙으로 강제하고 **강제 범위에 예외를 두지 않는다**(`src/`·`tools/`·`harness/`). 규칙 등급이 `MUST`라 RADIO에서 면제할 수 없으므로, 기존 `harness/`의 위반 141건도 이 task에서 함께 해소한다(사용자 결정, 2026-08-04).
- `DEV-TEST-01`: 추가 결정 — 세그먼트별 검증 계층을 `verifiedBy`로 명시해 검증 계획 없는 면제 구역이 드러나게 한다.
- `DEV-SEC-02`, `DEV-SEC-04`, `DEV-OBS-02`: 추가 결정 — `process.env` 접근 차단과 `no-console`로 부분 강제한다.
- `DEV-DATA-*`, `DEV-CACHE-*`, `DEV-OFFLINE-*`, `DEV-ERR-*`: 해당 없음 — 도메인 데이터와 런타임 동작이 없다.

## Architecture

### 구조 계약 파일의 위치

`config/fsd.json`을 저장소 루트의 `config/`에 둔다.

- `src/` 안에 두면 앱 번들 대상이 되고, 계층 규칙이 자기 자신을 검사하는 순환이 생긴다.
- `docs/standards/` 안에 두면 사람이 읽는 문서 디렉터리에 기계 판독 설정이 섞인다.
- 논리적 소속은 L3(기술 기준)이지만 도구가 읽는 파일이라 루트에 남는다. [ADR-0013](../../standards/adr/0013-project-layer-structure.md) §2의 "루트 고정 파일의 논리적 소속" 규칙을 그대로 적용한다. 규범 설명은 [개발 컨벤션](../../standards/DEVELOPMENT.md)이 소유하고 이 파일은 기계 판독 값만 갖는다.

### 로컬 ESLint 플러그인

`tools/eslint-plugin-project/`에 둔다.

- `src/` 밖에 두는 이유는 구조 계약 파일과 같다. 앱 번들과 계층 규칙의 대상이 되면 안 된다.
- 순수 ESM JavaScript(`.mjs`)로 작성한다. harness는 `node --experimental-strip-types`로 직접 실행하지만 ESLint 플러그인은 ESLint가 로드하므로 type stripping 경로를 탈 수 없다. TypeScript 설정 파일 지원(`eslint.config.ts`)은 추가 로더를 요구하므로 쓰지 않는다.
- 제공하는 규칙은 일곱 개다.

| 규칙                          | 강제 대상                                             | 근거                         |
| ----------------------------- | ----------------------------------------------------- | ---------------------------- |
| `project/layer-direction`     | 계층 단방향 import (위 → 아래)                        | `DEV-ARCH-01`, `DEV-CODE-03` |
| `project/segment-name`        | `fsd.json`에 없는 세그먼트 디렉터리 금지              | `DEV-ARCH-05`                |
| `project/segment-imports`     | 세그먼트별 `forbidImports`                            | `DEV-ARCH-02`, `DEV-CODE-02` |
| `project/no-runtime-export`   | `runtimeExports: false` 세그먼트의 런타임 export 금지 | 면제 구역 잠금               |
| `project/require-server-only` | `requireServerOnly: true` 세그먼트의 첫 import 선언   | `DEV-ARCH-03`                |
| `project/file-naming`         | 폴더·파일·컴포넌트 네이밍                             | `DEV-NAME-*`                 |
| `project/no-comments`         | 설명 주석과 JSDoc 금지                                | `DEV-CODE-07`                |

- `project/no-comments`가 기성 규칙으로 불가능한 이유: 주석은 AST 노드가 아니라 토큰이라 일반 셀렉터로 잡히지 않는다. `SourceCode.getAllComments()`를 직접 순회한다. 예외는 `eslint-disable*`, `@ts-expect-error`/`@ts-ignore`, shebang뿐이다.
- 경로에서 계층·슬라이스·세그먼트를 뽑는 규칙은 한 곳(`tools/eslint-plugin-project/lib/resolve-path.mjs`)에 두고 일곱 규칙이 공유한다. 같은 파싱을 일곱 번 구현하면 `DEV-REUSE-01`을 어긴다.

```text
src/<layer>/<slice>/<segment>/<file>   views · widgets · features · entities
src/shared/<segment>/<file>            shared는 슬라이스가 없다
src/app/**                             Next.js 라우트, 세그먼트 판정 대상 아님
```

### TypeScript 버전 (revision 2)

TypeScript **6.0.3**을 쓴다. 7.0.2에서 내린다.

`typescript-eslint` 8.66.0(최신, `next` 태그 없음)은 TS 7에서 **경고가 아니라 에러로 중단한다**: `typescript-eslint does not support TS 7.0`. `.ts` 파일을 파싱할 다른 실질적 파서가 없으므로 이 블록은 우회할 수 없다. 추적 이슈는 [typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)이다.

내리는 쪽을 고른 근거는 다음과 같다.

- Next.js 16은 `typescript`를 peer dependency로 요구하지 않는다. TS 7이 필수가 아니다.
- P0-T01은 TS 7을 적극 선택하지 않았다. handoff에 "TypeScript는 기존 7.0.2를 그대로 쓴다"고 적혀 있어 관성이었지 승인된 결정이 아니다.
- 잃는 것은 TS 7의 Go 재작성 성능인데, 현 규모의 `tsc --noEmit`이 0.46s라 체감이 없다.
- MS가 안내하는 TS 6 side-by-side 설치는 두 컴파일러를 공존시켜 타입 검사와 린트가 서로 다른 판단을 할 여지를 만든다. 이 규모에서 감당할 복잡도가 아니다.
- 되돌림 조건: `typescript-eslint`가 TS 7을 지원하면 올린다. `package.json` 한 줄이다.

전환 후 기존 검증이 전부 통과함을 확인했다 — `typescript-eslint` 파서 동작(위반을 실제로 검출), `pnpm typecheck`, `pnpm harness:typecheck`, `pnpm harness:self-test`, `pnpm build` 모두 정상이다.

### 외부 ESLint 의존

ESLint **10**을 쓴다. 그에 따라 다음이 확정된다.

- `eslint-plugin-import`(2.32.0)는 peer가 `^9`까지라 **쓸 수 없다.** `eslint-plugin-import-x`(4.17.1, `^10.0.0` 명시 지원)로 `import-x/no-cycle`을 쓴다.
- `eslint-plugin-boundaries`는 채택하지 않는다. peer가 `>=6.0.0`으로 느슨해 ESLint 10 지원이 확인되지 않고, 채택하면 `fsd.json`을 그 플러그인 설정으로 바꾸는 어댑터가 필요해 정본이 한 겹 멀어진다.
- `typescript-eslint`(8.66.0), `eslint-plugin-react-hooks`(7.1.1), `@next/eslint-plugin-next`(16.3.0)를 쓴다. 앞의 둘은 ESLint 10을 명시 지원하고 마지막은 Next와 버전이 동기다.
- 네이밍은 `eslint-plugin-check-file`을 쓰지 않고 `project/file-naming`이 처리한다. `fsd.json`을 이미 읽는 플러그인이 있는데 네이밍만 별도 설정으로 분리할 이유가 없다.

### 설정 파일 두 벌

`eslint.config.mjs`가 기본 설정을, `eslint.config.ci.mjs`가 기본 설정을 확장해 type-aware 규칙을 더한다.

- type-aware 규칙(`no-floating-promises`, `no-misused-promises`, `no-explicit-any`, `no-unsafe-*`)은 프로젝트 전체 타입 정보를 요구해 린트가 타입 검사만큼 느려지고, 변경 파일만 검사하는 `lint-staged`와 상성이 나쁘다.
- CI 설정은 기본 설정을 import해서 확장한다. 규칙 목록을 두 벌로 복제하지 않는다.

### tdd-guard.sh 연동

`.claude/hooks/tdd-guard.sh`가 `jq`로 `config/fsd.json`을 읽어 면제 판정을 만든다.

- 제거: 하드코딩된 `*/ui/*`, `*/components/*`, `*/types/*` 패턴과 `*/index.ts` 예외.
- 유지: 테스트 파일 자체(`*.test.*` 등), `*.d.ts`, `*.config.*`, `src/app/*`. 이들은 세그먼트 개념 밖이라 `fsd.json`이 다루지 않는다.
- `jq`가 없을 때의 현재 동작(경고 후 편집 허용)은 그대로 둔다. 계약 파일을 못 읽는다고 작업을 막으면 훅이 단일 장애점이 된다.

### barrel 제거

`src/views/bootstrap/index.ts`를 제거하고 `src/app/page.tsx`가 `@/views/bootstrap/ui/BootstrapScreen`을 직접 import한다.

- Next.js에서 barrel은 빌드 성능 문제를 만들고 순환 의존의 주 통로다.
- FSD의 슬라이스 public API 개념은 잃지만, 실제로 지켜야 할 계층 방향은 `project/layer-direction`이 직접 강제하므로 손실이 없다.
- 파일명이 `bootstrap-screen.tsx` → `BootstrapScreen.tsx`로 바뀐다(네이밍 규칙 적용).

### 세그먼트 런타임 코드의 세 단계 (revision 4)

`runtimeExports`를 불리언으로 두면 `config` 세그먼트가 상수조차 export할 수 없어 존재 이유를 잃는다. 구현 중 테스트가 이 결함을 드러냈다. 세 값으로 나눈다.

| 값 | 의미 | 적용 |
| --- | --- | --- |
| `true` | 제한 없음 | `ui` `hooks` `model` `api` `lib` |
| `"constants"` | 값 선언만 허용. 함수·클래스·화살표 함수 초기값 금지 | `config` |
| `false` | 런타임 export 전면 금지 | `types` |

### app 계층과 src 최상위 (revision 4)

`src/app/**`를 통째로 면제하면 **`route.ts`(Route Handler = API 엔드포인트)** 가 테스트 없이 통과한다. 면제가 우회 통로가 되지 않게 하려는 이 task의 취지와 어긋난다.

- `appLayer.unitTest`는 `required`가 기본이고, `appLayer.exemptFiles`에 나열한 Next.js 예약 표현 파일(`page`·`layout`·`loading`·`error`·`global-error`·`not-found`·`template`·`default`)만 면제한다.
- `src/` 바로 아래 파일도 테스트를 요구한다. Next.js 16은 `middleware.ts`를 **deprecated 처리하고 `proxy.ts`로 개명**했으며, 위치는 프로젝트 루트 또는 `src/` 바로 아래(`app`과 같은 레벨)다. 계층 밖이지만 요청을 가로채는 서버 코드다. 근거: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

### 포맷·린트 적용 범위 (revision 4)

Prettier와 ESLint는 **`src/` 안의 애플리케이션 코드만** 대상으로 한다(사용자 결정, 2026-08-04).

- 첫 구현은 저장소 전체를 대상으로 했는데, 포맷이 문서 21개와 봉인된 RADIO까지 건드려 `gate:radio`가 해시 불일치를 잡아냈다. 승인 해시에 결속된 문서를 도구가 수정하면 안 된다.
- 받아들이는 비용: `harness/`의 주석 재발을 자동으로 막지 못한다. 이번에 정리한 128건의 상태는 유지되지만 앞으로는 사람과 교차 검증이 지킨다. `DEV-CODE-07` 자체는 여전히 저장소 전체에 적용되는 `MUST`이며 달라진 것은 기계 강제 범위뿐이다.

### 테스트 폴더 예외 (revision 6)

`naming.exceptions`에 `**/__tests__/**`를 추가한다(사용자 결정, 2026-08-04).

- 검증 단계에서 두 도구의 판정이 갈리는 것이 드러났다. `tdd-guard.sh`는 테스트가 없을 때 `<dir>/__tests__/<stem>.test.ts`를 예상 경로로 안내하고 그 위치의 테스트를 유효한 것으로 인정하는데, `file-naming`은 같은 폴더를 kebab-case 위반으로 막았다. 훅이 시킨 대로 만들면 커밋이 거부되는 상태였고, 이 task의 핵심 주장인 "두 도구가 같은 정본을 읽어 판정이 갈리지 않는다"가 실제로는 성립하지 않았다.
- 계약 파일 한 줄로 해소한다. 규칙 코드에 테스트 폴더 지식을 넣지 않으므로 정본은 `config/fsd.json` 하나로 남는다.
- 예외는 `__tests__` 하나뿐이다. `__mocks__`와 `__tests__helper` 같은 유사 폴더는 계속 막히며 반례 테스트로 고정했다.
- 받아들이는 비용: `__tests__` 안에서는 파일 이름 규칙도 묻지 않는다. 테스트 파일명은 대상 파일이 결정하므로 독립된 판단 재료가 아니다.

### 교차 검증 high 해소 (revision 7)

교차 검증에서 리뷰어 2자가 모두 인정한 `high` 3건을 해소한다(사용자 결정, 2026-08-04). 근거는 `docs/execution/reviews/P0-T02-review.json`의 F-01·F-02·F-03이다.

**F-02 — vitest 수집 범위를 훅과 맞춘다.**

`tdd-guard.sh`는 형제 테스트, `<dir>/__tests__/`, `<parent>/__tests__/`, `src/__tests__/`를 유효한 테스트로 인정하는데 `vitest.config.ts`는 `model`·`lib`·`api`·`ui`·`hooks` 세그먼트 안만 수집했다. revision 4가 일부러 테스트를 요구하게 만든 `src/app/**/route.ts`와 `src/proxy.ts`의 테스트가 한 번도 실행되지 않는 상태였다. 훅이 통과시키고 러너가 돌리지 않으면 "테스트가 있다"가 "테스트가 돈다"를 뜻하지 않는다.

- `node` 프로젝트는 `src/**/*.test.{ts,tsx}` 전체를 수집하고 `ui`·`hooks` 세그먼트만 제외한다. `dom` 프로젝트가 그 둘을 jsdom 환경으로 가져간다. 두 프로젝트의 합집합이 `src/` 전체이고 교집합은 비어 있다.
- 루트 `tests/` 트리는 수집 대상에 넣지 않는다. Playwright 스펙이 있는 곳이라 vitest가 가져가면 안 된다. 훅이 그 트리를 단위 테스트로 인정하는 문제는 별도 발견(F-07)으로 backlog에 있다.
- 받아들이는 비용: 슬라이스 바로 아래 `__tests__/`에 둔 컴포넌트 테스트는 node 환경으로 간다. 컴포넌트 테스트의 자연스러운 위치는 `ui/` 안이며, 수집되지 않던 이전 상태보다는 낫다.

**F-03 — harness 회귀 안전망을 단일 검증 명령에 넣는다.**

이 task는 `harness/` 32개 파일에서 주석 128건을 제거하고 이름을 바꿨다. 그 안전망으로 선언한 `harness:self-test`(131개)와 `harness:typecheck`가 `pnpm verify`에도 pre-commit에도 없어, 가장 크게 손댄 코드의 회귀 보호가 사람이 별도 명령을 기억할 때만 작동했다. `verify`의 `pnpm test` 뒤에 둘을 넣는다. `tsconfig.json`이 `harness`를 exclude하고 vitest가 `harness/`를 수집하지 않는 구조는 그대로 두며, harness는 자체 tsconfig와 self-test 러너가 담당한다.

**F-01 — pre-commit 인수 조건 문구를 실제 거동에 맞게 정정한다.**

인수 조건은 "포맷·린트·타입·테스트 실패 커밋의 pre-commit 거부"였으나 `lint-staged`가 `prettier --write`라서 포맷 위반은 거부가 아니라 자동 수정 후 통과한다. 설계는 바꾸지 않는다 — `lint-staged`에 `prettier --write`와 `eslint --fix`를 거는 것은 이 RADIO가 승인받은 결정이고, `project/*` 규칙 7종은 `meta.fixable`을 정의하지 않아 구조 위반은 실제로 커밋을 막으며, 타입과 테스트도 그 뒤에서 거부한다. 거부형 포맷 검사는 `verify`의 `format:check`가 담당한다. 실제와 다른 쪽은 문구이므로 `index.jsonl`의 인수 조건을 고친다.

### harness 주석 정리

`DEV-CODE-07`은 `MUST`라 RADIO에서 면제할 수 없다. 규칙이 P0-T01에서 신설될 때 기존 코드를 정리하지 않아 `harness/`에 JSDoc 141개와 줄 주석 9개가 남았고, 이는 방치된 규칙 위반이다. 강제 범위에 예외를 두면 규칙이 복잡해지고 예외가 굳는다.

- 대상: `harness/` 44개 `.ts` 중 주석이 있는 32개. 가장 많은 곳은 `dashboard/rubric.ts`(18), `dashboard/reviews.ts`(15), `dashboard/collect.ts`(12)다.
- 주석을 지운 뒤 이름만으로 의도가 드러나지 않는 곳은 **이름을 고친다.** 동작을 바꾸지 않는 리팩토링이며, 주석을 이름으로 옮기는 것이 `DEV-CODE-07`의 취지다.
- 안전망은 `pnpm harness:self-test`(131개)다. 주석 제거와 개명 후 전부 통과해야 한다.
- 남기는 주석: `eslint-disable*`, `@ts-expect-error`/`@ts-ignore`, shebang. `project/no-comments` 규칙의 예외와 같다.

### 테스트 환경 분리

Vitest를 두 환경으로 나눈다.

| 대상                    | 환경    | 이유                                                                                         |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------- |
| `model` · `lib` · `api` | `node`  | React를 import하지 않으므로 jsdom이 불필요하다. `model`의 React 금지 규칙이 이것을 보장한다. |
| `ui` · `hooks`          | `jsdom` | 렌더와 훅 실행에 DOM이 필요하다.                                                             |

pre-commit에서 단위 테스트 전체를 돌리기로 했으므로 도메인 규칙 테스트가 jsdom을 띄우지 않는 것이 직접적인 이득이다.

## Data model

이 task는 도메인 데이터를 다루지 않는다. `config/fsd.json`의 스키마만 정한다.

```jsonc
{
  "layers": ["app", "views", "widgets", "features", "entities", "shared"],

  "segments": {
    "ui": {
      "unitTest": "exempt",
      "verifiedBy": ["component", "e2e"],
      "runtimeExports": true,
      "forbidImports": ["server-only", "**/api/**"],
    },
    "hooks": {
      "unitTest": "required",
      "verifiedBy": ["unit"],
      "runtimeExports": true,
      "forbidImports": ["server-only"],
    },
    "model": {
      "unitTest": "required",
      "verifiedBy": ["unit"],
      "runtimeExports": true,
      "forbidImports": ["react", "react-dom", "server-only"],
    },
    "api": {
      "unitTest": "required",
      "verifiedBy": ["unit"],
      "runtimeExports": true,
      "requireServerOnly": true,
    },
    "lib": { "unitTest": "required", "verifiedBy": ["unit"], "runtimeExports": true },
    "config": { "unitTest": "exempt", "verifiedBy": [], "runtimeExports": false },
    "types": { "unitTest": "exempt", "verifiedBy": [], "runtimeExports": false },
  },

  "exemptPaths": ["**/generated/**"],

  "naming": {
    "folder": "kebab-case",
    "file": "kebab-case",
    "componentFile": "PascalCase",
    "hookFile": "useCamelCase",
    "exceptions": ["src/app/**", "src/shared/ui/**", "**/__tests__/**"],
  },
}
```

- `layers` 배열의 **순서가 의존 방향**이다. 앞의 계층이 뒤의 계층을 import할 수 있고 그 반대는 막힌다. 순서를 바꾸면 규칙이 따라 바뀐다.
- `unitTest`는 `tdd-guard.sh`가, 나머지는 ESLint 플러그인이 읽는다. `verifiedBy`는 어느 도구도 강제하지 않고 사람이 읽는 값이지만, 비어 있으면 검증 계획 없는 면제 구역이라는 사실이 파일에서 바로 보인다.
- `config`와 `types`의 `verifiedBy`가 빈 배열인 것은 의도적이다. 런타임 코드가 없으므로 검증할 동작이 없다.
- `exemptPaths`는 생성물(Supabase DB 타입)이 `api` 세그먼트의 `unitTest: required`에 걸리지 않게 한다.
- 형식 검증은 플러그인 로드 시점에 수행하고, 어긋나면 어느 필드가 왜 잘못됐는지 한국어로 알린다. 잘못된 계약이 조용히 "규칙 없음"으로 해석되면 안 된다.

## Interface

### package scripts

| 명령                | 내용                                                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`         | `eslint .` (기본 설정, type-aware 제외)                                                                                                                                                                                                       |
| `pnpm lint:ci`      | `eslint . -c eslint.config.ci.mjs` (type-aware 포함)                                                                                                                                                                                          |
| `pnpm format`       | `prettier --write .`                                                                                                                                                                                                                          |
| `pnpm format:check` | `prettier --check .`                                                                                                                                                                                                                          |
|                     | Prettier 설정에 `prettier-plugin-tailwindcss`와 `tailwindStylesheet: "./src/app/globals.css"`를 둔다. Tailwind v4는 CSS-first라 이 옵션으로 CSS 진입점을 알려줘야 `@theme`의 커스텀 토큰까지 정렬된다. 실측으로 확인했다(0.8.1 + Tailwind 4). |
| `pnpm test`         | `vitest run`                                                                                                                                                                                                                                  |
| `pnpm test:e2e`     | `playwright test`                                                                                                                                                                                                                             |
| `pnpm verify`       | CI용 단일 검증 명령                                                                                                                                                                                                                           |

`pnpm verify` = `format:check` → `lint:ci` → `typecheck` → `test` → `build` → `test:e2e` → `gate:all`. 앞의 검사가 실패하면 뒤를 돌리지 않아 CI 피드백이 빨라진다.

### 훅

| 훅                          | 실행                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| `.githooks/pre-commit`      | harness 게이트 4종 → `lint-staged` → `tsc --incremental` → `vitest run` |
| `.githooks/pre-push` (신설) | `pnpm build`                                                            |
| `commit-msg`                | 현행 유지                                                               |

- harness 게이트를 **먼저** 돌린다. 가장 빠르고(0.09s) 승인 계약 위반은 포맷 문제보다 먼저 알아야 한다.
- `prepare` 스크립트가 `git config core.hooksPath .githooks`를 실행한다. husky는 쓰지 않는다 — 설치 시 `core.hooksPath`를 자기 디렉터리로 바꿔 harness 게이트 4종을 조용히 무력화한다.
- `lint-staged`는 staged 파일에만 `prettier --write`와 `eslint --fix`를 건다. 부분 stage 처리 같은 함정을 직접 구현하지 않는다.
- `tsc --incremental`과 `build`는 변경 파일만 검사할 수 없다. TypeScript는 프로그램 단위로 검사하고 파일 목록을 직접 주면 `tsconfig.json` 옵션이 무시된다. 증분 캐시(`.tsbuildinfo`, `.next/cache`)로 실제 작업량만 줄인다. `.tsbuildinfo`는 gitignore 대상이다.

### 등록 check

| check ID             | 판정                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `fsd-contract`       | `config/fsd.json`의 세그먼트 정의를 바꾸면 ESLint와 `tdd-guard.sh`의 판정이 함께 바뀐다. 두 도구가 같은 정본을 읽는다는 증거를 남긴다.         |
| `lint`               | 위반 fixture 전부가 차단되고 정상 코드는 통과한다(오탐 대조군 포함).                                                                           |
| `unit`               | `pnpm test` 통과. 샘플 단위 테스트가 실제 동작을 검증한다.                                                                                     |
| `mobile-e2e`         | 모바일 뷰포트에서 부트스트랩 화면 렌더 확인. 화면을 깨뜨리면 실패하는지 대조군으로 증명한다.                                                   |
| `git-hooks`          | 위반 커밋이 pre-commit에서, build 실패 push가 pre-push에서 거부된다. 새로 clone한 임시 저장소에서 `pnpm install` 후 훅이 도는 것까지 확인한다. |
| `harness-regression` | `harness/` 주석 제거와 개명 후 `pnpm harness:self-test` 131개와 `pnpm harness:typecheck`가 통과한다.                                           |

## Optimizations

- 근거 없는 최적화를 하지 않는다. 현재 규모 실측은 harness 게이트 4종 0.09s, `tsc --noEmit` 0.46s, `pnpm build` 캐시 있음 2.79s / clean 5.03s다.
- type-aware 린트를 CI로 분리한 것이 이 task의 유일한 성능 결정이다. 근거는 위 Architecture에 있다.
- Playwright 브라우저는 CI에서만 설치한다. 로컬 pre-push에는 E2E가 없으므로 개발자가 브라우저 바이너리를 받지 않아도 커밋·푸시가 가능하다.
- 규칙 일곱 개를 한 플러그인에 두면 `fsd.json`을 한 번만 읽고 파싱 결과를 공유할 수 있다.

## 변경 허용 경로

```
package.json
pnpm-lock.yaml
tsconfig.json
eslint.config.mjs
eslint.config.ci.mjs
.prettierrc
.prettierignore
vitest.config.ts
playwright.config.ts
.gitignore
config/**
tools/**
src/**
tests/**
harness/**
.githooks/**
.claude/hooks/tdd-guard.sh
docs/standards/DEVELOPMENT.md
docs/workflow/TOOLING.md
CLAUDE.md
docs/execution/radio/P0-T02-radio.md
docs/execution/runs/P0-T02/**
docs/execution/reviews/**
docs/execution/phases/index.jsonl
docs/execution/phases/00-foundation.md
docs/execution/dashboard/**
```

## 미결 사항

- 없음.

설계 인터뷰에서 나왔던 두 건은 승인 전에 해소했다.

- **`DEV-CODE-07`의 적용 범위**: 강제 범위에 예외를 두지 않고 `harness/`의 위반 141건을 이 task에서 함께 정리한다(사용자 결정, 2026-08-04). `MUST` 규칙은 RADIO에서 면제할 수 없다는 [규칙 등급](../../standards/DEVELOPMENT.md#규칙-등급과-예외) 정의에 따른 유일한 정합 처리다.
- **`prettier-plugin-tailwindcss`의 Tailwind v4 지원**: 실측으로 확인했다. 임시 디렉터리에 Prettier 3 + 플러그인 0.8.1 + Tailwind 4를 설치하고 CSS-first 진입점(`@import "tailwindcss"` + `@theme`)을 지정한 뒤 클래스가 뒤섞인 JSX를 포맷하니 `text-brand p-4 flex bg-white hover:underline items-center rounded-lg` → `flex items-center rounded-lg bg-white p-4 text-brand hover:underline`으로 정렬됐다. `@theme`에 정의한 커스텀 색상이 올바른 그룹에 놓인 것이 플러그인이 CSS를 실제로 읽었다는 증거다. 필요한 설정은 `tailwindStylesheet` 하나뿐이다.
