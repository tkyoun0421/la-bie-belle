---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101"
---

# Matcher: 병렬 작업

subagent나 worktree로 일을 나눌 때 읽는다.

역할 사이의 병렬은 언제나 허용된다.

worktree 하나 안에서는 쓰기 작업을 격리해야 한다. 슬라이스마다 임시 worktree를 준다(`isolation: worktree`). 같은 체크아웃에서 동시에 쓰는 것은 금지다.

다른 역할의 worktree 디렉터리는 읽지도 고치지도 마라. 통합은 `main`에서만 일어난다.
