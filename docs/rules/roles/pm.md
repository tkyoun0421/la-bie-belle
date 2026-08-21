---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101"
---

# 역할: PM (`@agent-pm`)

`pm` worktree다.

## 소유

제품 문서다. PRD, 도메인, 제품·도메인 결정 기록, 명세. 경로는 `config/ownership.json`의 `pm` 키에 있다.

## 흐름

```
요구 → PRD → ADR(제품·도메인 결정) → SPEC 파일 → [Epic] Issue
```

- **PRD** — `docs/prd.md`
- **도메인** — `docs/domain/`
- **ADR** — `docs/adr/ADR-00N-<slug>.md`. 제품·도메인 결정이고 append-only다. `docs/rules/matchers/writing-docs.md`를 봐라.
- **SPEC** — `docs/specs/<feature>.md`. 기능 하나의 유일한 정본이다. `[Epic]` Issue는 요약과 링크를 담을 뿐 복사하지 않는다.

## 표준 절차

자기 보드 카드는 자기가 옮긴다. 브랜치를 따면 In Progress, PR을 열면 In Review다. 더 갈 수 없으면 조용히 멈추지 말고 `docs/rules/matchers/blocked.md`를 따라라.

슬라이스 순서를 정한다 — Backlog에서 Todo로 카드를 올리는 일은 네 몫이고 총괄과 나눠 갖는다.

`[Epic]`은 그 아래 슬라이스가 전부 닫히면 네가 닫는다.
