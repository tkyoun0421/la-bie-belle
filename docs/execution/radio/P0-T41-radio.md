# P0-T41 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 기획 확정(문서 전용 커밋 vitest 생략 + 코드 커밋 연관 테스트 축소, CI 전체 스위트 백스톱 불변) 반영. |

- 관련 spec: DOCS:SDD, ADR:0011
- 적용 깊이: 경량 (훅 실행 조건 분기 — 게이트·CI 의미 불변)
- test mode: tdd
- 예정 check IDs: precommit-scope-selftest (봉인 시 index에 기록)

## Requirements

### 범위와 비목표

- 범위: pre-commit의 `pnpm exec vitest run`(무조건 전체)을 스테이징 내용 기반 분기로 바꾼다 — ① 스테이징 전체가 비코드 경로면 vitest 생략 ② 코드 경로가 있으면 연관 테스트만(`vitest related`) ③ 광역 영향 파일이 포함되면 전체 스위트로 승격. 분류·명령 산출은 순수 함수로 분리해 self-test로 단언한다.
- 비목표: 게이트 4종·lint-staged·incremental typecheck·pre-push 빌드·commit-msg 검사 변경(전부 유지), CI `pnpm verify` 변경(전체 스위트 백스톱 불변), 하네스 self-test 실행 방식 변경(vitest와 별개 러너 유지), vitest 설정 변경.

### 불변 규칙

- CI의 `pnpm verify`는 계속 전체 스위트를 실행한다 — 연관 추적이 놓치는 간접 파손의 백스톱이다. 이 불변이 이 task의 위험 통제 근거다.
- 분류 판정은 fail-closed다: 분류 불가·`vitest related` 실행 실패 등 판단이 흔들리는 모든 경우 전체 스위트로 승격한다. 생략은 "코드 경로 없음"이 확실할 때만이다.
- 코드 경로 정의(예: `src/**`·`tests/**`·`harness/**`·`supabase/**`·`config/**`·루트 설정 파일)와 광역 영향 파일 정의(예: `package.json`·`pnpm-lock.yaml`·`vitest.config.*`·`tsconfig*`·`config/fsd.json`)는 판정 모듈이 소유하는 단일 선언이다.
- 훅 셸은 판정 결과(생략·연관·전체)를 소비만 한다 — 분기 로직을 셸에 두지 않는다.

### 기술 인수 조건

1. 스테이징 전체가 비코드 경로(문서·메모 등)인 커밋에서 pre-commit이 vitest를 생략하고, 게이트·lint-staged·typecheck는 그대로 수행된다.
2. 코드 경로가 스테이징된 커밋에서 스테이징 파일 연관 테스트만 실행되고, 광역 영향 파일이 하나라도 포함되면 전체 스위트로 승격된다.
3. 분류·명령 산출 판정이 순수 함수 self-test로 단언된다: 비코드만·코드 포함·광역 포함·빈 스테이징·분류 불가 각각의 산출.
4. `pnpm verify`(CI)의 전체 스위트 실행이 불변이고, `pnpm harness:self-test`와 `pnpm verify` 전체가 통과한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 문서 생략 | 테스트함 — 문서 전용 스테이징의 생략 판정 self-test | 테스트함 — 문서+코드 혼합은 생략되지 않음 | 테스트함 — 빈 스테이징·삭제만 있는 스테이징의 판정 | 해당 없음 — 로컬 훅이라 주체 분기가 없다 | 해당 없음 — 판정은 상태를 만들지 않는다 | 해당 없음 — 단일 프로세스 판정이다 |
| 2 연관·승격 | 테스트함 — 코드 스테이징의 related 명령 산출 self-test | 테스트함 — related 실행 실패 시 전체 승격(fail-closed) | 테스트함 — 광역 파일 1개 포함만으로 전체 승격 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 |
| 3 판정 분리 | 테스트함 — 5가지 스테이징 조합의 산출 self-test | 테스트함 — 분류 불가 입력이 전체 승격으로 수렴 | 테스트함 — 경로 정의 목록의 대표 항목별 분류 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 |
| 4 백스톱 불변 | 테스트함 — verify 스크립트가 전체 스위트를 계속 호출함을 수용 테스트로 | 테스트함 — 훅 수정이 verify 경로에 영향 없음 | 해당 없음 — CI 정의 무수정이라 추가 경계가 없다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 | 해당 없음 — 위와 같다 |

- 보충: 실제 훅 셸의 소비(생략·연관·전체 분기 실행)는 hook-acceptance 계열 self-test가 소유한다.

### DEV-* 적용 상태

- `DEV-TEST-01`: 위 렌즈 표. self-test 케이스 선작성으로 RED→GREEN 증거를 남긴다.
- `DEV-SSOT-01`: 코드 경로·광역 파일 정의는 판정 모듈 단일 선언.

## Architecture

- `harness/lib/precommit-test-scope.ts`(신규): 스테이징 파일 목록 → `{ mode: "skip" | "related" | "full", files? }` 순수 판정 + 경로 정의 상수.
- `harness/gates/` 또는 실행 스크립트: 판정 결과를 받아 vitest 명령을 산출·실행하는 실행부(스테이징 목록은 `git diff --cached --name-only`로 실행부가 수집).
- `.githooks/pre-commit`: `pnpm exec vitest run` 고정 호출을 실행부 호출로 교체. 다른 단계는 무수정.
- `harness/self-test/precommit-test-scope.test.ts`(신규) + hook-acceptance 갱신.

## Data model

- 없음.

## Interface

- 생략 시 출력 없음(통과 게이트 규약과 정합). 승격 시에도 별도 안내 없이 전체 실행 — 훅 출력은 vitest 자신의 출력만이다.

## Optimizations

- 문서 전용 커밋에서 vitest 기동(~15초) 전부 절감, 코드 커밋에서 연관 범위만큼 절감. 측정은 handoff에 기록한다.

## 변경 허용 경로

```
harness/**
.githooks/**
docs/execution/radio/P0-T41-radio.md
docs/execution/runs/P0-T41/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- `vitest related`가 이 저장소 구성(경로 별칭·setup 파일)에서 연관을 정확히 추적하는지 구현이 실측하고, 불안정하면 fail-closed 규칙에 따라 전체 승격 기본값을 넓힌다 — handoff에 실측 기록.
