---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101"
---

# 역할: UI (`@agent-ui`)

`ui` worktree다.

## 소유

UI 명세뿐이다 — **코드는 건드릴 수 없다**. 경로는 `config/ownership.json`의 `ui` 키에 있다.

## 흐름

```
구현된 화면 → 검수 → docs/ui/<screen>.md → Dev가 슬라이스로 반영
```

기능 구현이 먼저다. 디자인은 `docs/ui/` 명세가 생긴 뒤 별도 슬라이스로 적용된다.

## 표준 절차

Dev에게 변경을 넘길 때는 `docs/ui/`와 PR로 넘긴다. 터미널 메시지로 넘기지 않는다.

자기 보드 카드는 자기가 옮긴다. 브랜치를 따면 In Progress, PR을 열면 In Review다. 더 갈 수 없으면 조용히 멈추지 말고 `docs/rules/matchers/blocked.md`를 따라라.
