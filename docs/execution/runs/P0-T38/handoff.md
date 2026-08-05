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

## 2026-08-05 · 검증 단계 — 확정 9건, high 3건 수정 재진입

- 작성 주체: 조정자
- 교차 검증 결과: `docs/execution/reviews/P0-T38-review.json` — 확정 9건(high 3·medium 3·low 3), 기각 0건. 총점 84. critical이 없어 blocked 전환 없이 개발 루프를 계속한다(계약의 high 처리).
- 수정 방향(조정자 판독): high 3건은 모두 승인된 RADIO 설계 **안의 구현 결함**이라 설계 재승인 없이 개발 단계 재진입으로 수정 가능하다 — F-01 src 밖 해석 상대 import도 보고(fixer 없이), F-02 src 최상위 파일(location null)에도 룰 적용, F-03 fixer를 계약의 계층 접두로 해석되는 대상에만 적용하고 아니면 보고만(존재 검사 I/O 없이 해소). 세 건 모두 RuleTester fixture로 고정한다.
- medium·low 6건은 backlog에 누적했다. F-05(TOOLING.md 모순)는 봉인된 변경 허용 경로 밖이라 이번 수정에 포함하지 않고 후속 처리로 남긴다.
- backlog 판정(worker가 넘긴 미결): P0-T02 "tdd-guard.sh에 자동 테스트가 하나도 없음"은 `harness/self-test/tdd-guard-placement.test.ts` 신설로 항목 문면이 더 이상 사실이 아니게 되어 `[x]` 처리했다. 미커버 분기(세그먼트 면제·app 예외·파일명 오독 등)는 같은 backlog의 별도 항목들이 계속 소유한다.

### 미결 사항 (검증 단계 추가)

- F-05의 해소 경로(RADIO 개정으로 TOOLING.md 편입 vs 후속 문서 task) — 결정 주체: 조정자, 반환할 단계: P0-T38 종결 또는 후속 등록.

## 2026-08-06 · high 3건 수정 반영

- 작업 식별자: P0-T38 (import 표기와 테스트 배치 규칙)
- 현재 단계: 확정 high 3건 수정 → 다음 재검증
- 기준 시각: 2026-08-06

### 확정된 사실

- `tools/eslint-plugin-project/rules/import-alias.mjs`를 재작성해 F-01·F-02·F-03을 모두 해소했다. 설계 변경 없이 RADIO revision 3 봉인 그대로 구현만 고쳤다.
  - F-01: 상대 import 해석 결과가 `src/` 밖으로 벗어나면(`resolved`가 `src/`로 시작하지 않으면) 이전처럼 무보고 통과하지 않고, 새 messageId `unresolvableImport`로 보고한다(fix 없음).
  - F-02: 룰이 더 이상 `resolveLocation`(계층 없는 최상위 파일에서 null)에 의존하지 않는다. `lib/resolve-path.mjs`의 `toSourceRelative(context.filename, context.cwd)`로 바꿔 `src/` 바로 아래 파일(`src/proxy.ts` 등)에서도 visitor가 등록되고 상대 import가 보고된다.
  - F-03: `loadContract(context.cwd)`로 읽은 `contract.layers`(6종)에 변환 결과의 첫 경로 세그먼트가 있을 때만 `fix`를 붙인다. 아니면 같은 `relativeImport` 메시지로 제안 alias를 보고만 하고 fix는 생략한다(파일 존재 검사 I/O 없이 해소 — RADIO Optimizations 절 유지).
- TDD RED→GREEN: `rules/__tests__/import-alias.test.mjs`에 3개 invalid fixture를 추가했다 — F-01(`src/shared/lib/format-date.ts`에서 `../../../outside`, `unresolvableImport` 단언), F-02(`src/proxy.ts`에서 `./shared/lib/supabase-browser` → `@/shared/lib/supabase-browser`로 fix됨을 단언), F-03(`src/app/layout.tsx`에서 `../proxy` → `relativeImport`는 보고되지만 `output` 미지정으로 fix 없음을 단언). 추가 전 RED(3건 실패, 기존 10건은 그대로 통과)를 확인한 뒤 구현으로 GREEN(13/13)을 만들었다. `docs/execution/runs/P0-T38/tdd.json`에 RED→GREEN 기록을 추가했다.
- `pnpm lint`·`pnpm typecheck`·`pnpm test`(21 files, 180 tests — 이전 177 + 이번 fixture 3건)·`pnpm harness:self-test`(134)·`pnpm gate:all`(index·radio·handoff·tdd·scope) 모두 통과했다.
- F-04·F-05·F-06·F-07·F-08·F-09(medium·low 6건)와 backlog 판정은 이번 수정 범위 밖이다(조정자가 검증 단계 절에서 이미 backlog 반영·판독을 마쳤다) — 건드리지 않았다.
- `docs/execution/reviews/P0-T38-review.json`·`docs/execution/reviews/backlog.md`는 봉인된 변경 허용 경로 밖이라 스테이징하지 않았다. 이번 커밋에는 `import-alias.mjs`·해당 테스트·`tdd.json`·이 handoff 절만 포함한다.

### 미결 사항

- F-05·F-06·F-07·F-08·F-09는 이전 절의 조정자 판독대로 backlog·후속 처리로 남는다. 이번 수정으로 상태가 바뀌지 않았다.
- 재교차검증과 `done` 전환은 조정자가 수행한다. `index.jsonl`의 `status`는 `in_progress`로 남긴다.

### 다음 행동

1. F-01·F-02·F-03 반영을 조정자가 재확인한다(필요하면 재교차검증).
2. 통과 확인 후 `index.jsonl`의 P0-T38을 `done`으로 전환하고 대시보드를 재생성한다.

### 증거·산출물 경로

- `tools/eslint-plugin-project/rules/import-alias.mjs`(F-01·F-02·F-03 반영)
- `tools/eslint-plugin-project/rules/__tests__/import-alias.test.mjs`(fixture 3건 추가, 13 케이스)
- `docs/execution/runs/P0-T38/tdd.json`(2026-08-05 14:59 RED→GREEN 추가)
