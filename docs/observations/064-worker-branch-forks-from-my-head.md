---
status: actioned
target: session-recorder
date: 2026-10-09
resolved: 2026-10-09
---

# worktree 없이 띄운 worker가 브랜치를 따면 총괄이 선 자리에서 갈라진다

`session-recorder`를 worktree 없이 띄웠다. 「네 커밋만 얹는다」와 「`git checkout`으로 다른 브랜치로 옮기지 마라」를 프롬프트에 박았는데, agent가 `docs/session-log-2026-10-09`를 따고 거기에 커밋했다.

## 무엇이 깨지나

**총괄의 작업 디렉터리가 그 브랜치로 옮겨졌다.** 같은 디렉터리를 공유하니 worker의 `git checkout -b`가 총괄의 HEAD를 움직인다.

**그 브랜치가 총괄의 미merge 커밋을 업었다.** `feat/suspense-probe`에 커밋 둘(실험 코드와 ADR-016)이 있었고, 그 위에서 갈라졌으니 기록 PR이 그 둘까지 들고 올라갔다.

**CI가 엉뚱한 자리에서 떨어졌다.** 업힌 커밋이 `ADR-015`를 건드렸고 그 문서가 `fsd-read-write-layers` plan의 `sources:`에 있어서, 기록 PR의 본문에 「영향 확인」이 없다고 `checkSourcesImpact`가 걸렸다. 기록은 그 plan과 아무 상관이 없다.

복구는 `git branch -f <새 이름> origin/main` 뒤에 기록 커밋 둘만 cherry-pick하고 force push였다.

## 왜 agent를 탓할 수 없나

정의문이 「단명 브랜치를 따고 커밋해 PR을 연다. merge는 총괄이 한다」고 적는다. agent는 그것을 따랐다 — 프롬프트의 금지와 정의문의 지시가 부딪히고, 둘 중 어느 쪽이 이기는지가 어디에도 없다.

## 무엇을 고쳤나

정의문에 「worktree 없이 띄워졌으면 브랜치를 따지 않는다」를 더했다. worker가 자기 worktree를 가졌으면 브랜치가 격리되니 따도 된다.

## 남는 축

**worktree 없이 띄운 worker는 총괄과 같은 손을 쓴다.** `session-recorder`처럼 문서만 건드리는 worker도 `git` 명령 하나로 총괄의 자리를 움직일 수 있다. 다음에 또 밟으면 그때는 「문서 worker도 worktree로 띄운다」가 선다 — 지금은 비용이 더 커서(install 한 번) 미룬다.
