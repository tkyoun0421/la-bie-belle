---
status: open
target: docs/4-test/execution.md
date: 2026-10-19
resolved:
---

**일**: 새 worktree에서 첫 jest 실행이 watchman의 첫 수집 때문에 3분쯤 매달렸다가 출력 없이 끝났다. `pnpm test -- --no-watchman`으로 피하면 돈다. `pnpm test --no-watchman`은 플래그가 `pnpm`에 먹혀 0.2초에 출력 없이 끝난다. 「돌릴 때」의 watchman 줄은 0건으로 끝나는 꼴만 다뤄서, 매달리는 꼴과 `--` 위치는 어디에도 없었다.

**고침**: `execution.md` 「돌릴 때」에 한 줄을 더한다. 새 worktree의 첫 실행이 매달리면 `pnpm test -- --no-watchman`으로 돌리고, `--`가 빠지면 0.2초에 끝난다는 것을 적는다.

**원칙**: 검사가 아무것도 안 돌고 빨리 끝나면 통과가 아니라 비어 있는 것이다([관찰 074](archive/074-watchman-recrawl-makes-jest-match-zero.md)와 같은 축). 플래그는 스크립트 이름 뒤 `--` 다음에 둔다.
