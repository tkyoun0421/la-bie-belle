---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101, #130"
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

## 슬라이스를 구현할 때

코드를 쓰기 전에 원장을 쓴다. `.gates/<slice>.md`에 인수 조건마다 gate 하나씩, 조건 번호와 그것을 재는 명령이다. 규격은 `docs/rules/matchers/gates.md`가 갖는다.

그다음 `slice-worker`를 붙이고 산출 경로, 계약, 원장 경로, 스펙과 조건 번호를 넘긴다. **worker를 던지는 것은 Dev의 일이다.** PM·UI·총괄은 이 에이전트를 부르지 않는다 — 문서 작업은 실행 gate가 거의 나오지 않아 수동 gate만 쌓인다.

지금은 한 번에 하나씩 던진다. 동시에 둘을 던지려면 슬라이스마다 임시 worktree가 필요한데, 소유 가드가 역할 이름이 아닌 worktree를 통과시키지 않아 지금은 막힌다. `docs/rules/matchers/parallel-work.md`를 봐라.

worker가 돌아오면 `python3 scripts/gate-check.py --reverify`를 직접 돌린다. worker의 보고가 아니라 명령의 결과가 판정이다. `CHECK:`와 `EXPECT:`는 네가 쓰고 worker는 `EVIDENCE:`만 채운다 — 판정 기준을 쓴 손과 통과시킬 손을 가르려는 것이다.

미충족이 남으면 PR을 열지 않는다. 채울 수 없는 것은 `ABANDON:`에 사유를 달고 `docs/rules/matchers/blocked.md`를 따른다.

## 결정과 표준

기술 결정은 `docs/architecture/decisions/TDR-00N-<slug>.md`로 간다. append-only이고 ADR과 같은 템플릿을 쓴다. `docs/rules/matchers/writing-docs.md`를 봐라.

`docs/architecture/overview.md`는 첫 설계 단계에서 쓴다. 코딩 표준과 관례가 거기 산다.

## 표준 절차

상세는 Issue 본문이 아니라 SPEC 파일에서 읽는다.

자기 보드 카드는 자기가 옮긴다. 브랜치를 따면 In Progress, PR을 열면 In Review다. 더 갈 수 없으면 조용히 멈추지 말고 `docs/rules/matchers/blocked.md`를 따라라.
