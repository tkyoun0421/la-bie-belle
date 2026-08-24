---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101, #130, #131"
---

# Matcher: 병렬 작업

subagent나 worktree로 일을 나눌 때 읽는다.

역할 사이의 병렬은 언제나 허용된다.

worktree 하나 안에서는 쓰기 작업을 격리해야 한다. 슬라이스마다 임시 worktree를 준다(`isolation: worktree`). 같은 체크아웃에서 동시에 쓰는 것은 금지다.

다른 역할의 worktree 디렉터리는 읽지도 고치지도 마라. 통합은 `main`에서만 일어난다.

## 지금은 임시 worktree를 쓰지 못한다

위 문단과 소유 가드가 부딪힌다. `scripts/ownership-check.py`는 linked worktree의 디렉터리 이름이 역할 키가 아니면 차단하는데, 임시 worktree의 이름은 역할 키가 아니다.

그래서 `slice-worker`는 한 번에 하나씩 던진다. 같은 체크아웃에서 동시에 쓰지 않는다는 규칙은 그대로 지켜진다. 푸는 것은 #131이다. 그때까지 병렬 파견은 없다.
