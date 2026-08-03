# P0-T31 handoff

## 2026-08-03 · 설계(실행 직전 구체화) 종료

- 작업 식별자: P0-T31 (5단계 하네스 구현 — 경량 게이트형)
- 현재 단계: 설계 종료 → 다음 개발
- 기준 시각: 2026-08-03

### 확정된 사실

- 기획 승인(user, 2026-08-03)과 개발 설계 승인(user, 2026-08-03)이 모두 있고, 승인 정본은 `docs/execution/radio/P0-T31-radio.md`(revision 1)다.
- 승인 SHA-256 `411f6be925906d984be896402260365103fe6ae3a1de1b7d89ba212aed89e9b3`과 실제 RADIO 파일 해시가 일치함을 실행 전에 확인했다. RADIO 본문은 수정하지 않는다.
- `docs/execution/phases/index.jsonl`에서 P0-T31을 `planned` → `in_progress`로 바꿨다. 같은 줄의 다른 필드와 다른 task는 손대지 않았다(`updated_at`은 이미 `2026-08-03`).
- 실행 환경을 확인했다. Node v22.14.0, pnpm 8.15.2, `core.hooksPath=.githooks`.
- Node 22.14에서 `node --experimental-strip-types`로 `.ts` 직접 실행과 `node:test` 직접 실행(실패 시 종료 코드 1)이 동작함을 사전 검증했다.

#### 구현 파일 목록 (RADIO Architecture 절의 구체화)

- 공용 판정 로직 `harness/lib/`
  - `violation.ts` — 위반 레코드 타입과 한국어 stderr 포맷·종료 코드 처리
  - `repo.ts` — 저장소 루트 해석, 파일 읽기, SHA-256, git staged 목록
  - `task-index.ts` — `index.jsonl` 파싱과 현재 `in_progress` task 식별
  - `json-schema.ts` — `index.schema.json`이 실제로 쓰는 keyword 부분집합 검증기
  - `glob.ts` — 변경 허용 경로용 glob → 정규식 변환
  - `radio-doc.ts` — RADIO의 `## 변경 허용 경로` 첫 코드블록 파싱
  - `index-gate.ts`, `radio-gate.ts`, `handoff-gate.ts`, `commit-msg-gate.ts`, `tdd-gate.ts`, `scope-gate.ts` — 게이트별 순수 판정 함수 + 저장소 루트를 받는 실행 함수
- 실행 진입점 `harness/gates/` — `index.ts`, `radio.ts`, `handoff.ts`, `commit-msg.ts`, `tdd.ts`, `scope.ts`, `all.ts`, `pre-commit.ts`
- 셀프테스트 `harness/self-test/` — `run.ts`(집계 실행), `fixture.ts`(임시 fixture 저장소 생성), 게이트별 `*.test.ts` 6개, `hook-acceptance.test.ts`
- 타입 검사 설정 `harness/tsconfig.json` (`erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions`)
- 훅 `.githooks/pre-commit`, `.githooks/commit-msg` 교체
- 저장소 설정 `package.json`(scripts·engines·devDependencies), `.gitignore` 신설
- 문서 `CLAUDE.md`의 Commands·Git Hooks 절, 이 handoff, `docs/execution/runs/P0-T31/tdd.json`

#### 테스트 목록과 작업 순서 (RED → GREEN 단위)

각 단위는 "위반 fixture 테스트 작성 + 통과만 하는 stub → RED 기록 → 구현 → GREEN 기록" 순서로 진행한다. 명령은 모두
`node --experimental-strip-types --disable-warning=ExperimentalWarning harness/self-test/<파일>`이다.

1. `index-gate.test.ts` — 잘못된 JSON 줄, 스키마 위반, `in_progress` 2개, 승인 없는 `planned`, 없는 `depends_on`, 빈 `spec_refs`를 차단하고 정상 fixture는 통과
2. `radio-gate.test.ts` — RADIO 파일 없음·해시 불일치 차단, 일치 통과
3. `handoff-gate.test.ts` — handoff 파일 없음·필수 필드 누락·빈 값 차단, 7개 필드 완비 통과
4. `commit-msg-gate.test.ts` — task ID 없는 메시지 차단, 주석 줄에만 ID가 있는 메시지 차단, 정상 메시지 통과
5. `tdd-gate.test.ts` — `tdd.json` 없음·GREEN만 있음·GREEN이 RED보다 앞섬·phase와 exit_code 불일치 차단, 정상 기록 통과
6. `scope-gate.test.ts` — 허용 경로 밖 staged 파일 차단, 허용 경로 안 통과, glob 변환 단위 테스트
7. `hook-acceptance.test.ts` — 임시 git fixture 저장소에서 위반 커밋 거부와 정상 커밋 통과(`--no-verify` 없이)

#### 실행 명령 (RADIO Interface 절의 구체화)

- `gate:index`, `gate:radio`, `gate:handoff`, `gate:tdd`, `gate:scope`, `gate:all`, `harness:self-test`, `harness:typecheck`
- `gate:all`은 index·RADIO 해시·handoff·TDD·커밋 범위 5종을 한 번에 실행한다. commit-msg 게이트는 메시지 파일 인자가 필요해 훅과 셀프테스트에서만 발동한다.
- `.githooks/pre-commit`은 `harness/gates/pre-commit.ts`(index·RADIO 해시·TDD·커밋 범위)를 실행한다.

### 미결 사항

- `@types/node`를 dev 의존성으로 추가했다. RADIO Optimizations 절은 "dev 의존성 1개(`typescript`)"라고 적었으나, 승인된 기술 인수 조건 `tsc --noEmit` 오류 0건을 Node 표준 라이브러리를 쓰는 코드에서 만족하려면 타입 선언이 필수다. 런타임 의존성 0개라는 실질 불변 규칙과 "타입 검사 전용"이라는 성격은 그대로 유지된다 — 사후 확인 주체: 사용자, 반환할 단계: 설계(불수용 시 RADIO Optimizations 절만 개정).
- 그 밖의 새 제품·기술 결정은 없다. RADIO의 미결 사항도 "없음"이다.

### 다음 행동

1. 위 순서 1번(`index-gate.test.ts`)부터 RED → GREEN 사이클을 진행하고 매 실행을 `docs/execution/runs/P0-T31/tdd.json`에 기록한다.

### 증거·산출물 경로

- `docs/execution/radio/P0-T31-radio.md` (승인 정본, 수정 금지)
- `docs/execution/phases/index.jsonl` (P0-T31 = `in_progress`)
- `docs/execution/runs/P0-T31/handoff.md` (이 파일)

## 2026-08-03 · 개발 종료

- 작업 식별자: P0-T31
- 현재 단계: 개발 종료 → 다음 검증
- 기준 시각: 2026-08-03

### 확정된 사실

- 게이트 6종과 훅 수용까지 7개 단위를 모두 RED → GREEN 순서로 구현했다. 실행 기록은 `docs/execution/runs/P0-T31/tdd.json`에 15건 남았다(RED 8, GREEN 7).
  - `index-gate.test.ts`: RED 09:22Z(16개 중 14개 실패) → GREEN 09:24Z(16/16)
  - `radio-gate.test.ts`: RED 09:24Z(6개 중 4개 실패) → GREEN 09:24Z(6/6)
  - `handoff-gate.test.ts`: RED 09:25Z(8개 중 5개 실패) → RED 09:25Z(1개 실패) → GREEN 09:26Z(8/8)
  - `commit-msg-gate.test.ts`: RED 09:27Z(6개 중 5개 실패) → GREEN 09:27Z(6/6)
  - `tdd-gate.test.ts`: RED 09:28Z(11개 중 8개 실패) → GREEN 09:28Z(11/11)
  - `scope-gate.test.ts`: RED 09:29Z(7개 중 5개 실패) → GREEN 09:30Z(7/7)
  - `hook-acceptance.test.ts`: RED 09:31Z(5개 전부 실패) → GREEN 09:32Z(5/5)
- 두 번째 handoff RED는 테스트가 실제 결함을 잡아낸 기록이다. 라벨 필드 검사 정규식의 `\s*`가 줄바꿈을 넘어가 다음 줄의 문자를 값으로 인정했다. 문자 클래스를 `[ \t]*`로 좁혀 고쳤다.
- 게이트별 위반 fixture는 다음을 차단한다.
  - `gate:index`: JSON 파싱 실패, 스키마 위반(status·필수 필드·추가 필드·id 패턴), `in_progress` 2개, 승인 없는 `planned`·`in_progress`, 없는 `depends_on`, 빈 `spec_refs`, index 파일 부재
  - `gate:radio`: RADIO 파일 부재, 해시 불일치, `radio_sha256` 부재. `planned`·`in_progress` 외 상태는 검사하지 않는다
  - `gate:handoff`: 파일 부재, 필수 절 누락, 라벨 값 공백, 절 내용 공백, index 부재
  - `commit-msg`: task ID 없음, 주석 줄에만 있음, 빈 메시지, 메시지 파일 부재, 자릿수 오류
  - `gate:tdd`: `tdd.json` 부재, 깨진 JSON, 빈 기록, GREEN만 존재, GREEN이 RED보다 앞섬, 다른 command의 RED, phase와 exit_code 불일치, 형식 오류
  - `gate:scope`: 허용 경로 밖 staged 파일, RADIO의 변경 허용 경로 절 부재, RADIO 파일 부재
- 구현 세부 두 가지를 확정했다.
  - 모든 명령에 `--disable-warning=ExperimentalWarning`을 함께 준다. Node 22의 type stripping 실험 경고가 stderr로 나오면 "통과는 무출력"이라는 승인된 출력 계약이 깨진다.
  - `tsc` 설정은 `harness/tsconfig.json`에 둔다. 루트 `tsconfig.json`은 이 task의 변경 허용 경로가 아니다.
- 훅은 `.githooks/pre-commit`(index·RADIO 해시·TDD·커밋 범위 4종을 모두 실행해 위반을 한 번에 보고)과 `.githooks/commit-msg`(task ID)로 교체했다. 두 훅 모두 `$(dirname "$0")/..`로 저장소 루트를 계산해 실행 위치에 의존하지 않는다.
- `CLAUDE.md`의 Commands·Git Hooks 절을 실제 명령·훅 동작 문서로 교체했다.

### 미결 사항

- `@types/node` dev 의존성 추가(설계 단계 기록과 동일) — 사후 확인 주체: 사용자, 반환할 단계: 설계.

### 다음 행동

1. `pnpm harness:self-test`, `pnpm harness:typecheck`, `pnpm gate:all`, 훅 수용 테스트를 실행해 검증 단계를 마친다.

### 증거·산출물 경로

- `harness/gates/`(8개), `harness/lib/`(15개), `harness/self-test/`(9개), `harness/tsconfig.json`
- `.githooks/pre-commit`, `.githooks/commit-msg`
- `package.json`, `pnpm-lock.yaml`, `.gitignore`, `CLAUDE.md`
- `docs/execution/runs/P0-T31/tdd.json`

## 2026-08-03 · 검증 종료

- 작업 식별자: P0-T31
- 현재 단계: 검증 종료 → 다음 리팩토링
- 기준 시각: 2026-08-03

### 확정된 사실

- 등록 check 4종을 모두 실행해 통과했다.
  - `gate-self-test`: `pnpm harness:self-test` → 59개 테스트 전부 통과, 종료 코드 0.
  - `typecheck`: `pnpm harness:typecheck`(`tsc --noEmit --project harness/tsconfig.json`) → 오류 0건, 종료 코드 0. `--listFiles`로 `harness/` 파일 30개가 실제 검사 대상임을 확인했다.
  - `hook-acceptance`: `harness/self-test/hook-acceptance.test.ts` 단독 실행 → 5개 전부 통과. 임시 git fixture 저장소에서 `--no-verify` 없는 정상 커밋 성공, 허용 경로 밖 커밋 거부, task ID 없는 메시지 거부, TDD 증거 삭제 커밋 거부, RADIO 변조 상태 커밋 거부를 실제 `git commit`으로 확인했다.
  - `repo-gates-green`: `pnpm gate:all` → 출력 없이 종료 코드 0. 개별 명령 `gate:index`·`gate:radio`·`gate:handoff`·`gate:tdd`·`gate:scope`도 각각 출력 0바이트, 종료 코드 0.
- 실제 저장소를 대상으로 커밋 범위 게이트의 차단 동작도 확인했다. `src/scope-probe.txt`(허용 경로 밖)와 `harness/lib/glob.ts`(허용 경로 안)를 함께 staged 상태로 두면 앞의 파일만 위반으로 보고하고 종료 코드 1을 반환했다. 확인 후 staged 상태와 probe 파일을 모두 원복했다.
- 인수 조건 대응: 게이트 6종 셀프테스트 단일 명령 실행(DOCS:SDD), 훅 교체 후 정상 커밋(ADR:0008), 현재 저장소 게이트 전체 통과(ADR:0011), `CLAUDE.md` 명령 문서화(ADR:0013).

### 미결 사항

- 로컬 훅은 `--no-verify`로 우회할 수 있다. git의 본질적 한계이며 승인된 RADIO Requirements 절에 기록된 대로 P0-T05 CI에서 `gate:all` 재실행으로 보완한다 — 결정 주체: 사용자, 반환할 단계: 없음(승인된 범위).

### 다음 행동

1. 동작을 바꾸지 않는 범위에서 중복을 제거하고 셀프테스트·타입 검사·게이트를 재실행한다.

### 증거·산출물 경로

- `docs/execution/runs/P0-T31/tdd.json`
- `harness/self-test/hook-acceptance.test.ts`

## 2026-08-03 · 리팩토링 종료

- 작업 식별자: P0-T31
- 현재 단계: 리팩토링 종료 → 완료(`done`)
- 기준 시각: 2026-08-03

### 확정된 사실

- 관찰 가능한 동작을 유지한 채 중복을 제거했다.
  - `harness/lib/current-task.ts`를 새로 만들어 "index 읽기 + 현재 `in_progress` task 식별 + 읽기 실패 위반"을 한곳이 소유하게 했다. `radio`·`handoff`·`tdd`·`scope` 게이트에 네 번 복제돼 있던 코드가 사라졌다.
  - `harness/lib/json-value.ts`의 `isPlainObject`로 `json-schema.ts`·`tdd-gate.ts`·`task-index.ts`에 있던 같은 타입 가드 3벌을 합쳤다.
  - 셀프테스트의 `joinMessages`·`entriesOf` 복제본 6벌을 `harness/self-test/fixture.ts`의 `joinMessages`·`indexEntriesOf`로 합쳤다.
- 정리 중 드러난 구멍 하나를 메웠다. `gate:handoff`는 index를 읽지 못하면 조용히 통과했으나 이제 다른 게이트와 같은 위반을 보고한다. 이 동작을 덮는 테스트를 추가해 셀프테스트가 60개로 늘었다.
- `harness/tsconfig.json`에 `noUnusedLocals`·`noUnusedParameters`를 추가하고 오류 0건을 확인했다. 정리 후 남은 미사용 import가 없다.
- 재검증 결과: `pnpm harness:self-test` 60/60 통과(종료 코드 0), `pnpm harness:typecheck` 오류 0건, `pnpm gate:all` 출력 없이 종료 코드 0.
- 변경 파일은 모두 승인된 변경 허용 경로 안이다. `harness/**`(33개 신규), `.githooks/**`(2개 교체), `package.json`, `pnpm-lock.yaml`, `.gitignore`(신규), `CLAUDE.md`, `docs/execution/runs/P0-T31/**`(신규 2개), `docs/execution/phases/index.jsonl`.
- `index.jsonl`의 P0-T31을 `done`으로 갱신했다. 같은 줄의 다른 필드와 다른 task는 이 task 내내 변경하지 않았다.

### 미결 사항

- `@types/node` dev 의존성 — RADIO Optimizations 절은 dev 의존성 1개(`typescript`)로 적었다. 승인된 인수 조건 `tsc --noEmit` 오류 0건을 위해 필요한 타입 전용 패키지이며 런타임 의존성은 계속 0개다 — 사후 확인 주체: 사용자, 반환할 단계: 설계(불수용 시 RADIO Optimizations 절만 개정).
- 이번 작업은 커밋하지 않았다. 사용자가 커밋할 때 P0-T31이 이미 `done`이라 현재 `in_progress` task가 없고, 따라서 TDD 증거·커밋 범위 게이트는 그 커밋을 메타 커밋으로 보고 통과시킨다. index·RADIO 해시 게이트와 commit-msg 훅은 그대로 검사한다 — 결정 주체: 사용자.

### 다음 행동

1. 사용자가 변경 전체를 검토하고 커밋 메시지에 `P0-T31`을 포함해 커밋한다(예: `feat(P0-T31): 경량 게이트형 하네스 구현`).
2. 다음 실행 후보는 `planned` 큐를 다시 확인해 정한다. 현재 P0-T29는 `design_pending`이라 개발 루프 후보가 아니다.

### 증거·산출물 경로

- `harness/`(게이트 8개 진입점, 판정 로직 15개, 셀프테스트 9개, tsconfig)
- `.githooks/pre-commit`, `.githooks/commit-msg`
- `docs/execution/runs/P0-T31/tdd.json`, `docs/execution/runs/P0-T31/handoff.md`
- `docs/execution/phases/index.jsonl` (P0-T31 = `done`)
