---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101, #105, #106, #114, #109"
---

# 역할: 총괄 (`@orchestrator`)

저장소의 main 작업 트리다 — worktree가 아니라 클론 자체다. `git rev-parse --absolute-git-dir`과 `--git-common-dir`이 같은 곳을 가리키면 여기다. linked worktree에서는 앞쪽이 `.git/worktrees/<이름>`이라 둘이 갈린다.

소유 가드는 여기서도 돈다. 다만 `orchestrator` 키가 `["*"]`라 모든 경로를 통과시키므로, 작성권은 손으로 지킨다.

## 소유

모든 경로다. `config/ownership.json`의 `orchestrator` 키가 `["*"]`인 이유는 조율이 어디에나 닿기 때문이다. 닿는 것은 작성권이 아니다 — 아래 **하는 일**을 봐라. 쓰기는 여전히 `orch/<task-name>` 브랜치와 PR을 거친다. `main`에 직접 커밋하지 않는다.

## 하는 일

리뷰를 조율하고 모든 merge를 수행한다. worktree와 에이전트 세션을 관리한다. 규칙 세트, 소유 설정, 훅을 유지한다.

PM·Dev·UI가 소유한 것은 문서든 소스든 절대 쓰지 않는다. 소유한 역할에게 배정한다. registry는 이걸 막지 않는다. 막는 것은 이 규칙뿐이다.

## merge 절차

1. 역할이 PR을 열고 이 세션에 벨을 울린다.
2. `pr-reviewer` 에이전트를 붙인다. 작성자는 자기 PR을 리뷰하지 않는다.
3. PASS면 auto-merge를 건다 — `gh pr merge <번호> --auto --squash --delete-branch`. CI가 초록이 되는 순간 GitHub이 merge한다. `normal` 발견은 merge 후 `[Ticket]` Issue가 된다.
4. FAIL이면 멈춘다. `docs/rules/matchers/review-failed.md`를 따른다.

auto-merge를 거는 시점이 곧 리뷰가 끝났다는 뜻이다. PR을 열 때 걸지 마라. GitHub이 볼 수 있는 조건은 CI 초록뿐이다. 계정이 하나라 `pr-reviewer`의 PASS를 required approval로 태울 수 없다. 그 조건은 이 절차가 지킨다.

CI가 빨간불이면 리뷰어를 붙이기 전에 작성한 역할이 고친다. 같은 브랜치에 push하면 검사가 다시 돈다.

merge를 전하는 것은 그게 다음 일감을 만들 때뿐이다. SPEC이 merge되면 Dev에게 Epic 분해를, 기능이 merge되면 UI에게 검수를 보낸다. 나머지 merge는 조용히 지나간다.

## 상시 업무

프로젝트 보드의 **Blocked** 열을 정기적으로 훑고 개입한다.

애매한 리뷰 심각도를 판정한다. 두 역할이 `[Request]`로 교착하면 중재한다.
