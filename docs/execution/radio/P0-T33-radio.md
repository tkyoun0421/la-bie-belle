# P0-T33 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-03
- 개발 설계 승인: user, 2026-08-04
- 관련 spec: DOCS:SDD, ADR:0011, ADR:0013
- 적용 깊이: 일반
- test mode: tdd
- 예정 check IDs: dashboard-parser-test, typecheck

## Requirements

- 범위와 비목표:
  - 범위: `verify` 스킬(`.claude/skills/verify/SKILL.md`), reviewer 서브 에이전트 정의(`.claude/agents/reviewer.md`), [교차 검증 계약](../../workflow/REVIEW.md) 개정, reviews 파서(`harness/dashboard/reviews.ts`)와 `example-review.json`·테스트 정합, F-09(total 평균 규칙 미검증) 해소.
  - 비목표: 대시보드 렌더 변경, 게이트 신설, 수동 전체 스캔 자동화, CI 연동(P0-T05).
- 불변 규칙:
  - 검증은 읽기 전용이다. 리뷰어도 조정자도 코드를 고치지 않는다.
  - 메인 에이전트는 독립 리뷰를 산출하지 않는다. 발견의 확정은 리뷰어 2자의 인정으로만 이뤄진다.
  - 결과 파일·backlog의 정본 위치와 중요도 에스컬레이션 규칙(critical=blocked+즉시 보고, high=보고+계속, medium·low=backlog)은 유지한다.
- 기술 인수 조건:
  - `verify` 스킬 실행 한 번으로 대상 확정 → 2자 독립 리뷰 → 병합·중요도 판독 → `docs/execution/reviews/<task-id>-review.json`·backlog 기록이 이어진다.
  - reviews 파서가 `total`=5영역 평균(반올림 정수) 규칙을 검증하고, 위반 시 형식 오류로 표시한다(F-09).
  - 개정 fixture 포함 `pnpm harness:self-test` 전체와 `pnpm harness:typecheck`가 통과한다.
- 위험 기반 테스트:
  - 파서 개정은 위반 fixture(잘못된 total, 규칙 밖 participants·agreed_by)로 RED를 먼저 만든 뒤 GREEN을 기록한다.
  - 스킬·에이전트 정의는 코드가 아니므로 문서 인수 조건(구조 명시·링크 정합)으로 검증한다.

## Architecture

- `.claude/skills/verify/SKILL.md` — 절차의 정본. 대상 확정(기준 커밋·변경 파일·spec/RADIO 링크) → 리뷰어 2자 병렬 호출 → 결과 병합 → 확정·중요도 판독 → 기록 → 에스컬레이션 순서를 지시문으로 소유한다. REVIEW.md를 참조하고 절차를 중복 기술하지 않는다.
- `.claude/agents/reviewer.md` — Opus 리뷰어 서브 에이전트 정의. 입력은 대상 범위와 평가 영역 5종뿐이며(조정자의 의견 전달 금지), 출력은 아래 Data model의 리뷰어 결과 JSON이다.
- Codex 리뷰어 — 플러그인 명령이 아니라 Codex CLI를 비대화식으로 직접 호출한다(모델 미지정). 같은 리뷰 지시문을 전달하고 같은 형식의 결과를 회수한다. 정확한 호출 플래그는 실행 직전 구체화가 정한다.
- Codex CLI 사용 불가 시(사용자 확정, 2026-08-04): 독립 Opus 서브 에이전트 2자로 대체해 검증을 중단하지 않는다. 두 번째 Opus 리뷰어의 식별자는 `opus-2`이고, `participants_note`에 대체 사유를 남긴다.
- 메인 에이전트(조정자) — 호출·병합·확정(리뷰어 2자 모두 인정한 발견만)·중요도 판독·최종 영역 점수 판정·기록. 독립 리뷰 산출 금지를 SKILL.md와 REVIEW.md 양쪽에 명시한다.

## Data model

- 리뷰어 결과 JSON(서브 에이전트·Codex 공통): `{ "findings": [{ "title", "severity_candidate", "area", "description", "file" }], "scores": {5영역}, "score_rationale": {5영역} }`.
- 결과 파일(`<task-id>-review.json`)은 기존 형식을 유지하되 규칙을 개정한다(사용자 확정, 2026-08-04).
  - `participants`: 실제 리뷰를 산출한 리뷰어만(`opus`, `codex`, 대체 진행 시 `opus`·`opus-2`). 조정자 `main`은 포함하지 않고, 조정 사실은 REVIEW.md가 계약으로 소유한다. 파서의 리뷰어 식별자 목록에 `opus-2`를 추가하되 `main`은 기존 결과 파일(P0-T29 등) 호환을 위해 유지한다.
  - `agreed_by`: 리뷰어 2자 전원. 최소 2명 규칙에 더해 `agreed_by ⊆ participants` 검증을 추가한다.
  - `total`: 5영역 평균 반올림 정수 — 파서가 실제로 검증한다(F-09 해소).
- 수동 전체 스캔 결과 파일(사용자 확정, 2026-08-04): 이름 `scan-<YYYY-MM-DD>-review.json`. 스키마는 task 결과와 같되 `task_id` 대신 `scope: "full-scan"` 필수. 파서가 인정 목록에 추가해 대시보드에 "전체 스캔 <날짜>"로 표시한다. 최신 결과 선택은 기존대로 `at` 기준이다.
- `example-review.json`을 개정 규칙에 맞게 갱신하고, 위반 fixture 케이스를 `dashboard-reviews.test.ts`에 추가한다.

## Interface

- 실행: `verify` 스킬 호출(대상 task ID 인자, 기본값은 현재 검증 단계 task).
- 등록 check: `dashboard-parser-test`(개정 파서·fixture), `typecheck`.
- 회귀: `pnpm harness:self-test`, `pnpm gate:all`.

## Optimizations

- 리뷰어 2자는 병렬로 호출한다. 그 외 성능 목표 없음.

## 변경 허용 경로

```
.claude/skills/verify/**
.claude/agents/reviewer.md
docs/workflow/REVIEW.md
harness/dashboard/reviews.ts
harness/self-test/dashboard-reviews.test.ts
docs/execution/reviews/example-review.json
docs/execution/reviews/backlog.md
docs/execution/runs/P0-T33/**
docs/execution/phases/index.jsonl
docs/execution/dashboard/**
CLAUDE.md
```

## 미결 사항

- 없음. 승인 전 미결 3건(Codex 불가 시 Opus 2자 대체, `participants`에 `main` 미포함, 수동 스캔 파일명 `scan-<YYYY-MM-DD>-review.json`)은 2026-08-04 사용자 결정으로 본문에 확정 반영했다.
