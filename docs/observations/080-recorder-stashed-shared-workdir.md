---
status: open
target: .claude/agents/session-recorder.md
date: 2026-10-22
resolved:
---

**일**: #641 회차 마감에서 `session-recorder`가 총괄과 같은 작업 디렉터리에서 브랜치(`docs/log-2026-10-22`)를 땄다. 한 테스트 스위트가 죽자 원인을 가르려고 `git stash`로 자기 변경을 치우고 다시 돌리려 했다. 그 명령은 중간에 끊겼고, 기록자가 `git stash pop`으로 되돌렸다. 잃은 것은 없다. 정의문은 「worktree 없이 띄워졌으면 브랜치를 따지 않는다」고 적었지만 stash는 따로 막지 않는다. 총괄은 스폰할 때 worktree 격리를 주지 않았다.

**고침**: 두 갈래가 있다. 하나는 총괄이 기록자를 늘 `isolation: "worktree"`로 띄우는 것이고, 다른 하나는 정의문에 `git stash`·`git checkout <파일>` 금지를 적는 것이다. 첫 갈래는 구조로 막고, 둘째는 규칙을 더 적는 것이다. 같은 일이 다시 나면 첫 갈래로 간다.

**원칙**: 작업 디렉터리를 나눠 쓰는 subagent는 총괄의 작업 트리를 바꾸는 git 명령을 하나도 쓰지 않는다. 막는 자리는 정의문의 문장보다 스폰할 때의 격리다.
