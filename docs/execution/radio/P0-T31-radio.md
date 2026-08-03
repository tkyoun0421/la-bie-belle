# P0-T31 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-03
- 개발 설계 승인: user, 2026-08-03
- 관련 spec: DOCS:SDD, ADR:0008, ADR:0011, ADR:0013
- 적용 깊이: 일반
- test mode: tdd
- 예정 check IDs: gate-self-test, typecheck, hook-acceptance, repo-gates-green

## Requirements

- 범위와 비목표:
  - 범위: 게이트 6종(index, RADIO 해시, handoff, commit-msg, TDD 증거, 커밋 범위), `.githooks/pre-commit`·`commit-msg` 재구축, `node:test` 기반 셀프테스트, `tsc --noEmit` 타입 검사, `CLAUDE.md` 실행 명령 문서화.
  - 비목표: 대시보드 재생성(P0-T29), readiness 리포트, 스킬 검증기, 풀 러너 오케스트레이션, repository-local 스킬 재구축.
- 불변 규칙:
  - 게이트는 정본(`index.jsonl`, RADIO, handoff, tdd.json)을 읽기만 하고 절대 변경하지 않는다.
  - `dual-approval-v3` 의미론과 [운영 계약](../../workflow/WORKFLOW.md)의 5단계·연속 루프 규칙을 판정 기준으로 삼는다.
- 기술 인수 조건:
  - 게이트 6종 각각 위반 fixture 차단과 정상 fixture 통과를 셀프테스트가 증명하고 `pnpm harness:self-test` 하나로 실행된다.
  - `tsc --noEmit` 오류 0건.
  - 새 훅 설치 후 `--no-verify` 없이 정상 커밋이 성공하고 위반 커밋은 거부된다.
  - 현재 저장소 상태가 `pnpm gate:all`을 통과한다.
- 위험 기반 테스트:
  - 게이트별 위반 fixture로 실패(RED)를 먼저 확인한 뒤 구현으로 GREEN을 만들고 `tdd.json`에 기록한다.
  - 훅 수용 테스트는 임시 git 저장소 fixture에서 실제 커밋 시도로 검증한다.
  - 로컬 훅은 `--no-verify`로 우회할 수 있다. git의 본질적 한계로 기록하고 P0-T05 CI에서 `gate:all` 재실행으로 보완한다.
- DEV-* 적용 상태:
  - `DEV-TEST-01`: 추가 결정 — 게이트 판정 로직을 순수 함수로 분리해 `node:test` 단위 테스트로 검증한다.
  - `DEV-TEST-02`, `DEV-TEST-03`: 해당 없음 — DB·버그 수정이 아니다.
  - `DEV-TEST-04`, `DEV-TEST-05`: 추가 결정 — 훅·명령 수준 수용 테스트를 fixture 저장소로 수행한다.
  - `DEV-SEC-*`: 기본 적용 — 게이트는 비밀값·개인정보를 다루지 않으며 출력에도 남기지 않는다.

## Architecture

- 책임과 FSD 경계:
  - 위치는 루트 `harness/`(L1 협업 레이어). `src/` FSD와 무관하며 제품 코드에서 import하지 않는다.
  - 구조: `harness/gates/*.ts`(게이트별 실행 진입점), `harness/lib/*.ts`(공용 판정 로직), `harness/self-test/`(fixture·테스트).
- 서버·보안 경계: 해당 없음 — 로컬 CLI 스크립트다.
- Clean Code·SOLID·재사용:
  - 판정 로직(순수 함수)과 프로세스 종료·출력(진입점)을 분리해 단위 테스트를 가능하게 한다.
  - `index.jsonl` 파싱·스키마 검사 로직은 `lib` 하나가 소유하고 모든 게이트가 재사용한다.
- 추가 결정 — TypeScript 실행 방식:
  - Node 22 type stripping(`--experimental-strip-types`)으로 빌드 없이 `.ts`를 직접 실행한다. erasable 문법만 사용한다(enum·namespace·parameter properties 금지). import에는 `.ts` 확장자를 명시한다.
  - Node 22.18+/24로 올리면 플래그를 제거할 수 있다. `package.json`에 `engines.node`를 명시한다.
- DEV-* 적용 상태:
  - `DEV-ARCH-*`: 해당 없음 — 제품 FSD 코드가 아니다.
  - `DEV-REUSE-*`: 기본 적용.

## Data model

- 정본과 파생 데이터:
  - 게이트가 읽는 정본: `docs/execution/phases/index.jsonl`(+`index.schema.json`), `docs/execution/radio/<task-id>-radio.md`, `docs/execution/runs/<task-id>/handoff.md`, `docs/execution/runs/<task-id>/tdd.json`, git staged 파일 목록.
  - 현재 task 식별: index의 단일 `in_progress` task. `in_progress`가 없으면 TDD 증거·커밋 범위 게이트는 통과 처리(워크플로우 메타 커밋 허용)하고, index·RADIO 해시 게이트는 항상 검사한다.
- 추가 결정 — 변경 허용 경로 형식:
  - RADIO 문서의 `## 변경 허용 경로` 절 안 첫 코드블록에 한 줄당 glob 하나를 선언한다. 승인 SHA-256에 함께 봉인되어 승인 후 변조할 수 없다.
- 추가 결정 — tdd.json 형식:
  - `{"entries":[{"command":string,"exit_code":number,"at":ISO8601,"phase":"red"|"green"}]}`
  - 같은 `command`의 red(exit≠0) 기록이 green(exit=0)보다 시간상 먼저 있어야 통과한다.
- schema·RLS·migration: DB 없음. `index.schema.json`은 변경하지 않는다. task 반환 사유 필드는 추가하지 않고 handoff·phase 문서 기록을 유지한다.
- 감사·보존·복구: 게이트는 판정 결과를 출력할 뿐 기록 파일을 만들지 않는다. 실행 증거는 AI 세션이 handoff에 남긴다.
- DEV-* 적용 상태:
  - `DEV-SSOT-*`: 기본 적용 — 게이트는 정본을 읽기만 한다.
  - `DEV-DATA-*`, `DEV-MIG-*`: 해당 없음.

## Interface

- 추가 결정 — 실행 명령(`package.json` scripts):
  - `gate:index`, `gate:radio`, `gate:handoff`, `gate:tdd`, `gate:scope`, `gate:all`, `harness:self-test`, `harness:typecheck`
  - 모든 명령은 `node --experimental-strip-types`로 `harness/` 진입점을 실행한다.
  - `gate:handoff`·`gate:tdd`·`gate:scope`는 인자가 없으면 현재 `in_progress` task를 대상으로 한다.
- 추가 결정 — 훅 연결:
  - `.githooks/pre-commit` → 커밋 문맥 게이트(index, RADIO 해시, TDD 증거, 커밋 범위) 실행.
  - `.githooks/commit-msg` → task ID 패턴(`P[0-9]+-T[0-9]{2}`) 검사.
  - `core.hooksPath=.githooks` 설정을 유지한다.
- 출력·오류: 위반 항목·대상 파일·수정 힌트를 한국어로 stderr에 출력하고 종료 코드 1. 통과는 출력 없이 0.
- cache·offline: 해당 없음.
- 외부 계약·실패: git CLI(staged 목록 조회)와 Node 표준 라이브러리 외 외부 계약 없음. devDependency `typescript`는 타입 검사 전용이다.
- DEV-* 적용 상태:
  - `DEV-CACHE-*`, `DEV-OFFLINE-*`: 해당 없음.

## Optimizations

- 기본값 유지 또는 최적화 근거: 기본값 유지 — 검사 대상이 파일 수십 개 수준이라 성능 최적화가 불필요하다.
- 관측성: 게이트의 stderr 출력이 유일한 관측 수단이다. 별도 로그 파일을 만들지 않는다.
- 의존성: 런타임 의존성 0개, dev 의존성 1개(`typescript`).
- 복잡도·되돌림: `harness/`·훅 파일 삭제와 `package.json` scripts 제거로 완전히 원복된다.
- DEV-* 적용 상태:
  - `DEV-OPT-*`: 기본 적용.
  - `DEV-DEP-*`: 추가 결정 — dev 전용 `typescript` 1개만 추가하며 런타임 의존성은 계속 0개다.

## 변경 허용 경로

```
harness/**
.githooks/**
package.json
pnpm-lock.yaml
.gitignore
CLAUDE.md
docs/execution/runs/P0-T31/**
docs/execution/phases/index.jsonl
```

## 미결 사항

없음
