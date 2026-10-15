---
status: open
target: docs/4-test/execution.md
date: 2026-10-15
---

**일**: 워크트리 여럿이 병렬로 돌던 날 `fix: wage_rates 이력을 1000행에서 안 잘리게 페이지로 받는다`(#581)의 integration 실행이 두 번 부딪혔다. 하나는 공유 로컬 DB에 다른 워크트리의 마이그레이션(`20261015074243`)이 먼저 올라가 있어 이 브랜치에서 `pnpm test:integration:run` 앞의 `supabase migration up`이 멈춘 것이다. 브랜치에 없는 마이그레이션을 DB가 이미 안다. 그래서 jest만 바로 돌렸고 94개 가운데 `sendWorkRequest` 하나가 떨어졌다. 단독으로 다시 돌리면 아홉 건 모두 통과했다.

**고침**: [관찰 066](066-parallel-worktrees-share-one-local-db.md)과 같은 축이고 증상이 하나 늘었다. `execution.md`의 병렬 판정에 「`migration up`이 이 브랜치에 없는 버전 때문에 멈추면 다른 워크트리가 DB를 앞질렀다는 뜻이니 jest만 돌리고 PR에 그 사실을 적는다」를 더하는 자리다. 066이 든 세 길 중 어느 것을 택할지는 아직 정해지지 않았다.

**원칙**: 공유 상태를 한 실행의 밖에서 바꾸는 작업이 있으면 그 상태를 읽는 모든 검사가 환경 탓으로 흔들린다. 실패가 코드 탓인지는 단독 재실행으로 가린다.
