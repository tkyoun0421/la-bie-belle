# P0-T32 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-03
- 개발 설계 승인: user, 2026-08-03
- 관련 spec: DOCS:SDD, ADR:0011, ADR:0013
- 적용 깊이: 간결
- test mode: docs_only
- 예정 check IDs: review-format-example, doc-link-integrity

## Requirements

- 범위와 비목표:
  - 범위: 3자 교차 검증 프로세스 정본 `docs/workflow/REVIEW.md` 신설, 결과 파일·backlog 형식 정의, 예시 fixture 작성, [운영 계약](../../workflow/WORKFLOW.md) 검증 단계의 참조 갱신.
  - 비목표: 검증 자동화 코드(프로세스는 AI 세션이 수행), 대시보드 표시(P0-T29), Codex 플러그인 자체의 설치·설정.
- 불변 규칙:
  - 검증은 읽기 전용이다. 리뷰어는 코드를 수정하지 않고 발견과 점수만 산출한다.
  - 발견은 3자 중 2자 이상이 인정해야 확정된다.
  - `critical`·`high` 에스컬레이션은 연속 루프 규칙과 모순 없이 연결된다.
  - 리뷰 결과에 비밀값·개인정보를 기재하지 않는다.
- 기술 인수 조건:
  - 예시 fixture가 형식 정의와 일치한다.
  - 관련 문서의 상대 링크가 실제 파일을 가리킨다.
  - 운영 계약의 검증 단계가 `REVIEW.md`를 참조한다.
- DEV-* 적용 상태:
  - `DEV-TEST-*`: 해당 없음 — 문서 작업이며 docs_only 검증(형식 일치·링크 확인)으로 대체한다.
  - `DEV-SEC-*`: 기본 적용 — 비밀값·개인정보 기재 금지를 프로세스 문서에 명시한다.

## Architecture

- 문서 전용 task다. 프로세스 실행 주체는 AI 세션이다.
- 리뷰어 3자와 호출 방식:
  - 메인 에이전트: 현재 세션이 전체 맥락으로 리뷰한다.
  - Codex 플러그인: `/codex:review`(소규모 `--wait`, 그 외 `--background`), 설계·가정 공격이 필요하면 `/codex:adversarial-review`.
  - Claude Opus: 독립 서브 에이전트로 리뷰한다.
- 독립성 규칙: 세 리뷰어는 서로의 결과를 보기 전에 독립 리뷰를 먼저 산출하고, 그 뒤에 교차 확인·반박 단계를 진행한다.
- 성능 저하 규칙: Codex 플러그인을 사용할 수 없으면 2자(메인+Opus)로 진행하고 결과 파일의 참여자 기록에 그 사실을 남긴다.

## Data model

- 결과 정본: `docs/execution/reviews/<task-id>-review.json`
  - `{task_id, at(ISO8601), base_commit, participants[], scores{code_quality, tests, security, performance, architecture}(0~100), total, findings[{id, severity(critical|high|medium|low), area, title, description, file, agreed_by[]}]}`
  - `agreed_by`는 `main`·`codex`·`opus`의 부분집합이며 2개 이상일 때만 findings에 남긴다.
  - 영역 점수는 메인 에이전트가 확정 발견과 각 리뷰어의 영역 평가를 근거로 최종 판정하고, 근거를 결과 파일에 기록한다. `total`은 5개 영역 평균이다.
- backlog 정본: `docs/execution/reviews/backlog.md` — `- [ ] [severity] [task-id] 제목 — 근거 파일` 한 줄 형식을 고정하고 완료 시 체크한다.
- 예시 fixture: `docs/execution/reviews/example-review.json` — 형식 정의와 일치하는 예시이며 P0-T29 대시보드 파서 테스트의 입력으로도 쓴다.
- DEV-* 적용 상태: `DEV-SSOT-*` 기본 적용(결과 정본은 reviews/, 대시보드는 파생 표시), `DEV-DATA-*` 해당 없음.

## Interface

- 운영 계약 연결:
  - 검증 단계는 해당 task 변경분을 대상으로 이 프로세스를 실행한다. 수동 전체 스캔은 코드베이스 전체를 대상으로 같은 절차를 쓴다.
  - `critical` 확정: 해당 task를 `blocked`로 전환하고 결정 신호·handoff를 기록한 뒤 즉시 사용자에게 보고한다(연속 루프 규칙 2와 동일 경로).
  - `high` 확정: 즉시 사용자에게 보고하되 루프는 계속한다.
  - `medium`·`low`: backlog에 누적한다.
- 개선 사항의 task 승격은 사용자 승인 시에만 하며 기획 인터뷰를 경유한다.
- DEV-* 적용 상태: `DEV-CACHE-*`, `DEV-OFFLINE-*` 해당 없음.

## Optimizations

- 기본값 유지 — 새 도구·의존성 없음.
- 관측성: 결과 파일과 backlog가 유일한 기록이다.
- 복잡도·되돌림: 문서 삭제로 완전 원복.
- DEV-* 적용 상태: `DEV-OPT-*`, `DEV-DEP-*` 기본 적용.

## 변경 허용 경로

```
docs/workflow/REVIEW.md
docs/workflow/WORKFLOW.md
docs/execution/reviews/**
docs/execution/runs/P0-T32/**
docs/execution/phases/index.jsonl
```

## 미결 사항

없음
