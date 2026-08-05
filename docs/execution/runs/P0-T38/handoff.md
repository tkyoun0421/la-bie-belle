# P0-T38 handoff

## 2026-08-05 · 개발 단계 종료

- 작업 식별자: P0-T38 (import 표기와 테스트 배치 규칙)
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-05

### 확정된 사실

- 구현 착수 전 RADIO revision 1의 "DEV-TEST는 01~04만 사용 중" 주장이 틀렸음을 발견했다(`DEV-TEST-05`는 P0-T02부터 `DEVELOPMENT.md`에 존재 — "커버리지 수치만으로 완료를 판단하지 않는다"). 조정자가 사용자 결정을 받아 신설 규칙 ID를 `DEV-TEST-06`으로 정정하고 RADIO를 revision 2로 재승인·재봉인했다(개정 이력에 사유 기록: 조정자 확인 명령의 `head -60` 출력 절단). `index.jsonl`의 `development_approval`이 `radio_revision:2`로 갱신됐다.
- 구현 완료 후 커밋 준비 단계에서 RADIO의 "변경 허용 경로" 절이 불릿 목록이라 `harness/lib/radio-doc.ts`의 `parseAllowedPaths()`(코드펜스 안 줄만 읽음)와 형식이 맞지 않아 `gate:scope`가 항상 실패함을 발견했다(`pnpm gate:all`로 재현). 조정자가 사용자 결정을 받아 경로 값 14개는 그대로 두고 코드펜스 형식으로만 정정해 RADIO를 revision 3으로 재봉인했다. `index.jsonl`의 `development_approval`은 `radio_revision:3`, SHA-256 `7a4c5eb93298c247810e399a3052d4eb9af913bbf418ae9b5e2cadc55fe2bebf`가 정본이다.
- `project/import-alias`(fixer 포함)·`project/test-placement` ESLint 룰을 TDD RED→GREEN으로 구현했다(RuleTester 각 10·6 케이스, fixer `output` 단언 포함). `tools/eslint-plugin-project/lib/contract.mjs`에 `testPlacement` 읽기(디폴트 `{ directory: "__tests__", suffix: ".test" }`)를 추가해 ESLint 룰과 `tdd-guard.sh`가 `config/fsd.json`의 같은 값을 읽는다(DEV-SSOT-01).
- `.claude/hooks/tdd-guard.sh`의 테스트 탐색 후보를 7종 + 루트 `tests/` 폴백에서 `<DIR>/<PLACEMENT_DIR>/<STEM>.test.<EXT>`(`PLACEMENT_DIR`는 `jq`로 계약에서 읽음) 하나로 축소했다. 거부 안내 문구도 같은 경로 하나만 제안한다. `harness/self-test/tdd-guard-placement.test.ts`를 신설해 실제 스크립트를 stdin JSON으로 호출하는 재현 테스트 3건(정상 배치 통과·colocated 거부·루트 `tests/` 동명 파일 거부)을 RED(축소 전 스크립트가 colocated·루트 폴백을 accept)→GREEN(축소 후 deny)으로 확인했다.
- 기존 colocated 테스트 9건을 RADIO 매핑표 그대로 `git mv`로 `__tests__/`에 옮겼다. 이동 후 `eslint --fix`가 각 파일의 "자기 자신"(테스트 대상) 상대 import를 새 디렉터리 기준으로 재계산해 `@/.../__tests__/<이름>`(존재하지 않는 경로)으로 잘못 고치는 것을 발견해, 9건 중 8건(alias 9곳)을 수작업으로 `@/.../<이름>`(실제 소스 경로)로 정정했다. `env.test.ts`의 `.env.example` 파일시스템 상대 경로도 한 단계 깊어진 만큼(`../../../` → `../../../../`) 재계산했다. `src/app/layout.tsx`·`global-error.tsx`의 기존 상대 import(`./globals.css`, 이번 이동과 무관)도 같은 `--fix`로 `@/app/globals.css`가 됐다.
- 이동 후 `pnpm test`는 21 files, 177 tests다. 이동 전 기준(19 files, 161 tests)과 다르지만, 그 차이(+2 files, +16 tests)는 정확히 이번에 신설한 두 룰의 RuleTester 테스트 파일(`import-alias.test.mjs` 10케이스, `test-placement.test.mjs` 6케이스)과 일치한다. 이동한 9개 파일은 전부 vitest에 그대로 잡히고 각 파일의 기존 테스트 케이스 수도 그대로라, 이동으로 인한 누락(glob 이탈)은 없다.
- `docs/standards/DEVELOPMENT.md`에 `DEV-NAME-06`(이름 규칙 절)·`DEV-TEST-06`(위험 기반 테스트 포트폴리오 절)을 MUST로 신설했다. 기존 규칙 문구는 건드리지 않았다.
- `pnpm lint`·`pnpm typecheck`·`pnpm test`·`pnpm harness:self-test`(134 tests)·`pnpm gate:all`(index·radio·handoff·tdd·scope) 모두 통과했다. `src/` 상대 import 0건, colocated 테스트 0건을 확인했다.

### 미결 사항

- `docs/execution/reviews/backlog.md`의 P0-T02 발견 중 "tdd-guard.sh에 자동 테스트가 하나도 없음"(30행) 항목이 이번에 `harness/self-test/tdd-guard-placement.test.ts`로 부분 해소됐다(배치 판정 3가지 시나리오만 커버 — 세그먼트별 `unitTest=exempt`·`app` 계층 예외 등 다른 분기는 미커버). 같은 backlog의 "이름만 맞으면 통과"(33행)·"세그먼트 없는 파일명 오독"(34행)·"계층 지식 하드코딩 중복"(43행) 등은 이번 축소와 무관해 그대로 남는다. RADIO 미결 사항대로 `[x]` 표기 전환 여부는 검증 단계에서 조정자가 개별 판정한다 — 결정 주체: 조정자, 반환할 단계: P0-T38 검증.
- 비리터럴 동적 import(변수·템플릿)의 구조 검사는 RADIO 설계 비목표(backlog P0-T02 항목 소유)로 남는다.
- 교차 검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 이 handoff 시점에 `in_progress`로 남긴다.

### 다음 행동

1. 등록된 `check_ids`(`import-lint-test`, `placement-lint-test`, `guard-placement-selftest`)와 관련 회귀를 검증 단계에서 실행한다.
2. [교차 검증 계약](../../../workflow/REVIEW.md)에 따라 리뷰어 2자 교차 검증을 수행하고 `docs/execution/reviews/P0-T38-review.json`에 기록한다.
3. backlog P0-T02 "tdd-guard 자동 테스트 없음" 항목의 `[x]` 전환 여부를 조정자가 판정한다.
4. 검증 통과 후 `index.jsonl`의 P0-T38을 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `tools/eslint-plugin-project/rules/import-alias.mjs`, `rules/__tests__/import-alias.test.mjs`
- `tools/eslint-plugin-project/rules/test-placement.mjs`, `rules/__tests__/test-placement.test.mjs`
- `tools/eslint-plugin-project/lib/contract.mjs`(`testPlacement` 읽기 추가)
- `tools/eslint-plugin-project/index.mjs`, `eslint.config.mjs`(두 룰 등록)
- `config/fsd.json`(`testPlacement` 계약)
- `.claude/hooks/tdd-guard.sh`(후보 축소, `PLACEMENT_DIR` 계약 읽기)
- `harness/self-test/tdd-guard-placement.test.ts`
- 이동된 9개 테스트 파일(RADIO Data model 매핑표, `git mv`)
- `docs/standards/DEVELOPMENT.md`(`DEV-NAME-06`·`DEV-TEST-06`)
- `docs/execution/radio/P0-T38-radio.md`(revision 3)
- `docs/execution/phases/index.jsonl`(P0-T38 `in_progress`, `development_approval` revision 3)
- `docs/execution/runs/P0-T38/tdd.json`
