---
status: actioned
target: tests/lint
date: 2026-10-09
resolved: 2026-10-09
---

# 저장소 전수를 보는 검사가 subagent의 worktree를 센다

`dto-to-domain-shape`의 묶음 넷을 격리(worktree)로 띄웠다. subagent마다 저장소 사본이 `.claude/worktrees/agent-<id>/`에 서고, 그때 구 경로 잔존 검사(`tests/lint/legacyDocPaths.test.ts`)가 1062건으로 빨개졌다 — 걸린 것이 전부 그 사본 안의 문서였다.

## 어떻게 그물을 지났나

그 검사는 디렉터리를 훑으면서 `entry.name.startsWith(".")`로 숨은 디렉터리를 빼는데, **뿌리 목록에 `.claude`가 적혀 있다.** 뿌리는 그 거름을 안 지난다 — 숨은 이름을 빼는 규칙이 뿌리 자신에게는 안 걸리고, 그 아래 `worktrees/`가 열려 저장소 사본이 통째로 들어왔다.

## 고친 것

`EXCLUDED_PREFIXES`에 `.claude/worktrees/` 한 줄을 더했다. `docs/log/`가 이미 그 꼴로 빠져 있어 자리가 서 있었다.

## 같은 함정이 있는 자리

지금은 저장소 전수를 그렇게 훑는 검사가 이 하나다. `tests/lint/`의 나머지는 `docs/`나 `src/`를 지정해 보거나 git이 아는 파일만 본다. **앞으로 저장소 전수를 보는 검사를 세울 때 `.claude/worktrees/`를 빼야 한다** — 격리로 돌린 subagent가 있는 동안에만 나타나는 디렉터리라 평소에는 보이지 않고, 병렬로 묶음을 돌리는 회차에서만 걸린다.

## 기계가 대신할 수 있나

이미 했다. 다만 **다음에 또 걸릴 자리를 기계가 미리 못 찾는다** — 검사가 무엇을 뿌리로 훑는지는 코드마다 다르게 적혀 있어서 한 자리에 모아 둘 수가 없다. 뿌리를 공용 상수로 모으는 길이 있지만 검사마다 보는 범위가 달라 그것이 또 갈린다. 걸리면 그 검사에 한 줄을 더하는 쪽이 싸다.
