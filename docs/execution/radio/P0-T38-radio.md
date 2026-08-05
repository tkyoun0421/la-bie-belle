# P0-T38 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-05
- 개발 설계 승인: user, 2026-08-05

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-05 | 최초 작성. |

- 관련 spec: DOCS:SDD, ADR:0008
- 적용 깊이: 일반 (린트 도구·훅·테스트 재배치. DB·권한·캐시·오프라인 경로 없음)
- test mode: tdd
- 예정 check IDs: import-lint-test, placement-lint-test, guard-placement-selftest

## Requirements

### 범위와 비목표

- 범위: `project/import-alias` ESLint 룰(fixer 포함)과 `project/test-placement` ESLint 룰 + RuleTester 테스트, `eslint.config.mjs` 등록, `config/fsd.json` 테스트 배치 계약 신설, `.claude/hooks/tdd-guard.sh` 배치 인정 후보 축소와 안내 문구 정정, 기존 colocated 테스트 9건의 `__tests__/` 이동과 상대 import 전면 치환, [개발 컨벤션](../../standards/DEVELOPMENT.md) `DEV-NAME-06`·`DEV-TEST-05` 신설.
- 비목표(기획 승인 그대로): `src/` 밖 도구 코드의 import 표기(tools/·harness/·scripts/ 관행 유지), 루트 `tests/` 미러 구조, E2E 테스트 배치(루트 `tests/` 소유 그대로).
- 설계 비목표: 기존 룰(layer-direction 등) 개편, tdd-guard의 이번 축소와 무관한 알려진 약점 수리(backlog의 P0-T02 발견 소유권을 가져오지 않는다), contract 파싱 캐시(기존 관행 그대로).

### 불변 규칙

- `src/` 안 import 표기는 `@/` alias 1종이다. 상대경로(`./`·`../`)는 정적 `import`·재export(`export … from`)·동적 `import()` 리터럴 모두 금지다. alias는 파일 확장자를 붙이지 않는다(CLAUDE.md 기존 규칙).
- `src/` 안 단위 테스트는 소스와 같은 폴더의 `__tests__/` 하위에만 두고, 파일명은 `<대상>.test.<확장자>`다. `.spec` 표기는 쓰지 않는다.
- 테스트 배치 계약의 정본은 `config/fsd.json` 하나이고, ESLint 룰과 tdd-guard가 같은 값을 읽는다(DEV-SSOT-01, 기존 구조 그대로).
- 규칙 ID 신설은 기존 ID 전수 확인을 선행한다 — 이번 설계에서 확인 완료: `DEV-NAME`은 01~05, `DEV-TEST`는 01~04 사용 중이라 `DEV-NAME-06`·`DEV-TEST-05`가 충돌 없이 비어 있다.

### 기술 인수 조건

- `src/` 안 상대경로 import(정적·재export·동적 리터럴)가 lint를 실패시키고, `eslint --fix`가 `@/` alias로 자동 치환한다(`.ts`·`.tsx` 확장자 제거 포함). RuleTester가 fixer `output`을 단언한다.
- `src/` 안 테스트 패턴 파일(`*.test.*`·`*.spec.*`)이 `__tests__/` 폴더 밖에 있으면 lint가 실패한다. `.spec` 접미사는 위치와 무관하게 `.test`로 바꾸라는 위반이다.
- tdd-guard가 `<소스 폴더>/__tests__/<대상>.test.<확장자>`만 테스트 존재로 인정하고(`.spec`·colocated·부모 `__tests__`·`src/__tests__`·루트 `tests/` 폴백 제거), 거부 안내 문구도 `__tests__/` 경로만 제안한다. 배치 폴더명은 `config/fsd.json`의 계약 값을 읽는다.
- 이동·치환 완료 후: `src/` 상대 import 0건, colocated 테스트 0건, `pnpm lint`·`typecheck`·`test`(파일·테스트 수가 이동 전과 동일: 19 files, 161 tests)·`harness:self-test`·게이트 4종 전부 통과.
- 테스트 파일 자체 편집은 가드가 계속 면제한다(기존 `*/__tests__/*` 면제 분기 유지).

### 위험 기반 테스트

| 위험 | 검증 |
| --- | --- |
| fixer가 잘못된 alias를 만든다 | RuleTester fixture로 중첩 폴더·`../` 다단·확장자 포함·동적 `import()` 케이스의 `output`을 단언한다 (`import-lint-test`) |
| 이동 후 vitest glob 이탈로 테스트가 조용히 빠진다 | 이동 후 `pnpm test`의 파일 수·테스트 수가 이동 전(19 files, 161 tests)과 동일함을 handoff에 기록한다 |
| guard 축소가 정상 배치를 거부하거나 잘못된 배치를 계속 인정한다 | harness self-test에 가드 호출 재현 테스트를 신설한다 — `__tests__/` 배치는 통과, colocated·루트 `tests/` 동명 파일은 거부됨을 stdin JSON 호출로 단언 (`guard-placement-selftest`) |
| `.env.example`을 읽는 파일시스템 상대 경로가 이동으로 깨진다 | `env.test.ts`의 `resolve(import.meta.dirname, …)` 깊이를 재계산하고 테스트 통과로 확인한다 |

### DEV-* 적용 상태

- `DEV-NAME-06` 신설: `src/` import는 `@/` alias만 쓴다(상대경로 금지). 기계 강제: `project/import-alias`.
- `DEV-TEST-05` 신설: 단위 테스트는 소스 폴더의 `__tests__/` 하위 `<대상>.test.<확장자>`에 둔다. 기계 강제: `project/test-placement` + tdd-guard.
- `DEV-CODE-07`(주석 금지)·`DEV-SSOT-01`(계약 단일 정본) 등 기존 규칙은 그대로 적용된다.

## Architecture

- `tools/eslint-plugin-project/rules/import-alias.mjs` (신규): `ImportDeclaration`·`ExportNamedDeclaration`(source 있는 것)·`ExportAllDeclaration`·`ImportExpression`(문자열 리터럴 인자)의 source가 `./` 또는 `../`로 시작하면 보고한다. fixer는 기존 관행대로 `lib/resolve-path.mjs`의 `resolveLocation(context.filename, context.cwd)`으로 파일의 저장소 상대 경로를 얻고, POSIX 경로 연산으로 import 대상을 절대화한 뒤 `src/` 접두를 `@/`로 바꾸고 `.ts`·`.tsx` 확장자를 제거해 치환한다. 비리터럴 동적 import(변수·템플릿)는 정적 판정 불가라 검사하지 않는다(기존 layer-direction과 같은 공백, backlog P0-T02 소유).
- `tools/eslint-plugin-project/rules/test-placement.mjs` (신규): 파일 경로가 테스트 패턴이면 ① 접미사가 `.test`인지 ② 상위 폴더명이 계약의 배치 폴더(`__tests__`)인지 검사한다. 계약은 기존 `lib/contract.mjs`로 읽는다.
- `tools/eslint-plugin-project/index.mjs`·`eslint.config.mjs`: 두 룰을 기존 project 룰 블록(`src/**/*.{ts,tsx}`)에 `"error"`로 등록한다.
- `config/fsd.json`: 최상위에 `testPlacement` 계약을 추가한다(Data model 참고). ESLint 룰과 tdd-guard가 이 값을 읽는다.
- `.claude/hooks/tdd-guard.sh`: 후보 목록(현행 7종 + 루트 `tests/` 폴백)을 `"$DIR/$PLACEMENT_DIR/$STEM.test.$EXT"`(확장자 6종) 하나로 축소하고, `PLACEMENT_DIR`은 `jq`로 계약에서 읽는다. 거부 안내 문구의 예상 경로도 같은 값으로 만든다. 테스트 파일 자체 면제 분기는 그대로 둔다.
- `harness/self-test/`: 가드 배치 재현 테스트를 신설한다. 임시 디렉터리에 fixture를 만들고 가드를 stdin JSON으로 호출해 deny/통과를 단언한다.
- 기존 테스트 9건 이동: `git mv`로 각 소스 폴더의 `__tests__/`로 옮기고, 이동 후 `eslint --fix`로 상대 import를 일괄 치환한다. `env.test.ts`의 `.env.example` 파일시스템 경로는 한 단계 깊어진 만큼 재계산한다.

## Data model

`config/fsd.json` 추가 계약:

```json
"testPlacement": { "directory": "__tests__", "suffix": ".test" }
```

- `directory`: 단위 테스트가 놓이는 폴더명. 소스와 같은 폴더 바로 아래다.
- `suffix`: 허용되는 테스트 접미사. `.spec`은 위반이다.

이동 대상 9건 매핑:

| 현재 (colocated) | 이동 후 |
| --- | --- |
| `src/app/manifest.test.ts` | `src/app/__tests__/manifest.test.ts` |
| `src/shared/model/env.test.ts` | `src/shared/model/__tests__/env.test.ts` |
| `src/shared/lib/supabase-browser.test.ts` | `src/shared/lib/__tests__/supabase-browser.test.ts` |
| `src/shared/api/supabase-server.test.ts` | `src/shared/api/__tests__/supabase-server.test.ts` |
| `src/views/status/ui/ErrorScreen.test.tsx` | `src/views/status/ui/__tests__/ErrorScreen.test.tsx` |
| `src/views/status/ui/AccessDeniedScreen.test.tsx` | `src/views/status/ui/__tests__/AccessDeniedScreen.test.tsx` |
| `src/views/status/ui/NotFoundScreen.test.tsx` | `src/views/status/ui/__tests__/NotFoundScreen.test.tsx` |
| `src/widgets/offline/ui/OfflineBanner.test.tsx` | `src/widgets/offline/ui/__tests__/OfflineBanner.test.tsx` |
| `src/widgets/offline/hooks/useOnlineStatus.test.ts` | `src/widgets/offline/hooks/__tests__/useOnlineStatus.test.ts` |

vitest 설정은 바꾸지 않는다 — 현행 glob(`src/**/*.test.{ts,tsx}`, jsdom 분리는 `src/**/ui/**`·`src/**/hooks/**`)이 이동 후 경로를 그대로 포함한다.

## Interface

- `project/import-alias` 위반 메시지: `상대경로 import 대신 @/ alias를 쓰세요 (DEV-NAME-06): "<제안 경로>"`. 제안 경로는 fixer가 넣을 값과 같다.
- `project/test-placement` 위반 메시지: 배치 위반은 `테스트 파일은 <소스 폴더>/__tests__/ 하위에 두세요 (DEV-TEST-05)`, 접미사 위반은 `.spec 대신 .test 접미사를 쓰세요 (DEV-TEST-05)`.
- tdd-guard 거부 문구의 예상 경로: `<소스 폴더>/__tests__/<대상>.test.ts` 하나만 제안한다.
- `DEVELOPMENT.md`: `DEV-NAME-06`은 DEV-NAME 절에, `DEV-TEST-05`는 DEV-TEST 절에 MUST로 추가하고 각 룰 이름을 병기한다.

## Optimizations

- 없음. 룰 2종은 파일 경로·AST 노드 판정만 하고 I/O가 없다(계약 읽기는 기존 `lib/contract.mjs` 관행 그대로).

## 변경 허용 경로

- `tools/eslint-plugin-project/rules/import-alias.mjs`
- `tools/eslint-plugin-project/rules/test-placement.mjs`
- `tools/eslint-plugin-project/rules/__tests__/**`
- `tools/eslint-plugin-project/index.mjs`
- `tools/eslint-plugin-project/lib/**`
- `eslint.config.mjs`
- `config/fsd.json`
- `.claude/hooks/tdd-guard.sh`
- `harness/self-test/**`
- `src/**`
- `docs/standards/DEVELOPMENT.md`
- `docs/execution/radio/P0-T38-radio.md`
- `docs/execution/runs/P0-T38/**`
- `docs/execution/phases/index.jsonl`

## 미결 사항

- backlog의 P0-T02 tdd-guard 발견 중 이번 축소로 부분·전부 해소되는 항목(`이름만 맞으면 통과`, `배치 후보 하드코딩` 등)의 완료 표기 여부는 검증 단계에서 조정자가 개별 판정한다 — 결정 주체: 조정자, 반환할 단계: P0-T38 검증.
- 비리터럴 동적 import의 구조 검사(layer-direction 포함 공통 공백)는 backlog P0-T02 항목이 소유한다.
