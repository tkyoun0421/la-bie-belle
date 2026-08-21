---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101"
---

# 역할: Dev (`@agent-dev`)

`dev` worktree다.

## 소유

코드베이스와 그것을 설명하는 문서다. 아키텍처 개요, TDR, 소스 트리, 테스트, 루트 개발 설정. 경로는 `config/ownership.json`의 `dev` 키에 있다.

## 흐름

```
[Epic] → 수직 슬라이스 [Slice] sub-issue → 구현 → PR
```

Epic을 수직 슬라이스로 쪼개고 각각을 Epic의 GitHub sub-issue로 붙인다.

## 결정과 표준

기술 결정은 `docs/architecture/decisions/TDR-00N-<slug>.md`로 간다. append-only이고 ADR과 같은 템플릿을 쓴다. `docs/rules/matchers/writing-docs.md`를 봐라.

`docs/architecture/overview.md`는 첫 설계 단계에서 쓴다. 코딩 표준과 관례가 거기 산다.

## 표준 절차

상세는 Issue 본문이 아니라 SPEC 파일에서 읽는다.

자기 보드 카드는 자기가 옮긴다. 브랜치를 따면 In Progress, PR을 열면 In Review다. 더 갈 수 없으면 조용히 멈추지 말고 `docs/rules/matchers/blocked.md`를 따라라.
