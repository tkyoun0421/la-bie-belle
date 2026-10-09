---
status: actioned
target: implementer
date: 2026-10-09
resolved: 2026-10-09
---

# worktree에 `node_modules`가 없어 검증 명령이 안 돈다

`screens-orchestration-only`에서 implementer 다섯을 worktree에 띄웠다. 셋이 같은 벽을 따로 만났다 — `pnpm typecheck`·`pnpm lint`·`pnpm test`가 바이너리를 못 찾는다.

## 무엇이 막히나

`git worktree add`는 추적되는 파일만 복사한다. `node_modules/`는 `.gitignore` 대상이라 새 worktree에 없다.

- `pnpm typecheck`가 `pnpm routes:types`를 먼저 돌리고, 그것이 `node_modules/.bin/expo`를 상대 경로로 찾아 죽는다
- `tests/lint/formatCheck.test.ts`가 `path.join(process.cwd(), "node_modules/.bin/prettier")`를 `spawnSync`해서 `status`가 `null`로 온다 — 세 단언이 그 자리에서 빨개진다
- `tsc`가 보려면 있어야 하는 생성물 둘(`expo-env.d.ts`·`.expo/types/`)도 없다

## 셋이 각자 다른 길로 넘었다

하나는 `pnpm install --frozen-lockfile`을 돌렸다. 하나는 루트 `node_modules`로 심링크를 걸고 검증 뒤 지웠다. 하나는 본 저장소의 바이너리를 절대 경로로 부르고 생성물 둘을 복사했다. 셋 다 같은 결론에 닿았지만 각자 시간을 썼고, 보고에 「못 돌린 것」이 남았다.

**`.gitignore`의 `node_modules/`가 트레일링 슬래시라 심링크를 안 걸러낸다.** 심링크로 넘는 길을 택하면 그것이 `git status`에 뜬다.

## 고칠 길

**`implementer` 정의문이 worktree의 첫 수를 적었다.** 「worktree에서 시작하면 `pnpm install --frozen-lockfile`이 첫 수다」와 우회 둘을 쓰지 않는 까닭이 섰다. 심링크 쪽을 안 고른 것은 `.gitignore`의 트레일링 슬래시 때문이다 — 그 길을 택하면 `.gitignore`도 같이 고쳐야 하고, 설치 한 번이 더 싸다.

**또는 스폰하는 쪽이 worktree를 만들 때 설치를 끝낸다.** 그쪽이 agent의 도구 호출을 안 먹지만, worktree를 만드는 것이 도구의 일이라 저장소가 손댈 자리가 아니다.

## 전체 `pnpm test`가 경합으로 흔들리는 것도 같이 보였다

셋이 동시에 jest를 돌려 load average가 31까지 올랐고 전체 실행이 65분 걸렸다(평소 3분). 5초 훅 타임아웃을 넘긴 스위트가 실행마다 다른 자리에서 둘에서 일곱씩 떨어졌고, 격리해서 돌리면 전부 통과했다. 관찰 060이 「남의 미완을 내 실패로 읽는다」를 적은 것과 다른 축이다 — 그쪽은 파일을 읽어 생기고 이쪽은 CPU를 나눠 생긴다.

**병렬 implementer가 전체 테스트를 각자 돌리는 것이 비용이다.** 정의문이 「병렬로 띄워졌으면 담당 슬라이스만 돌린다」를 받았다 — 셋의 보고가 전부 「전체는 흔들리고 내 슬라이스는 통과」였다.
