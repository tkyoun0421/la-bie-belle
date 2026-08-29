---
name: worktree
description: Orca가 관리하는 작업 트리를 열고 닫고 이름을 바꾼다. orca CLI를 쓰고 git worktree 명령을 직접 쓰지 않는다. 목록을 먼저 보여주고, 새 트리를 열 때 env와 의존성까지 챙긴다. 트리거 — "작업트리 열어", "worktree 만들어", "트리 닫아", "트리 목록", "작업트리 이름 바꿔", "트리 지워".
---

# 작업 트리 다루기

작업 트리는 **Orca가 관리한다.** `orca` CLI로 다루고 `git worktree add`나 `git worktree remove`나 `git worktree move`를 직접 쓰지 않는다.

## 왜 git 명령을 안 쓰나

Orca 워크트리도 바닥은 git worktree라서 `git worktree list`에 뜬다. 그래서 git 명령으로도 만들어지는 것처럼 보이는데, 그렇게 만든 트리는 **Orca가 모른다.** 앱에 안 뜨고 터미널을 못 붙이고 `orca worktree rm`으로 못 지운다. 반쪽짜리가 생기고 나중에 손으로 치워야 한다.

`git worktree list`는 읽기용으로만 쓴다. 무엇이 Orca 것이고 무엇이 아닌지 대조할 때 쓸모가 있다.

## 무엇을 하든 목록부터

```sh
orca worktree list
```

이걸 먼저 돌려 사람에게 보여준다. 사람이 말한 이름이 목록의 어느 줄인지 확인하고 나서 움직인다. 이름이 여럿에 걸리거나 하나도 안 걸리면 짐작하지 말고 묻는다.

출력에서 볼 것은 `displayName`과 경로와 브랜치 셋이다. **디렉터리 이름과 브랜치는 다른 것이다** — 이름이 `main`인 트리가 main 브랜치를 갖는다는 뜻이 아니다. 보여줄 때 둘을 같이 적는다.

Orca 밖에서 만들어진 트리가 있는지 의심되면 `git worktree list`와 대조한다. git에는 있는데 orca에는 없으면 그것이 반쪽짜리다.

## 저장소 선택자

`orca repo list`가 등록된 저장소와 id를 보여준다. 생성할 때 `--repo name:la-bie-belle`처럼 이름으로 가리키면 된다. 이름이 겹치면 `--repo id:<id>`를 쓴다.

## 열기

```sh
orca worktree create --name <이름> --repo name:<저장소> --base-branch main
```

**Orca가 브랜치를 같이 만든다.** `--name design`으로 만들면 `tkyoun0421/design` 브랜치가 생기고 트리가 거기 선다. detached가 아니라서 task 브랜치를 따로 딸 필요가 없다 — 그 트리에서 바로 커밋하고 PR을 낸다. 트리 이름이 곧 브랜치 이름이니 `--name`을 지을 때 그걸 감안한다.

`orca.yaml`이 이 저장소에 없어서 setup 훅이 안 돈다. 만든 뒤에 손으로 셋을 챙긴다. 경로는 `orca worktree list`나 create 출력이 알려준다.

```sh
git -C <경로> config core.hooksPath .githooks
cp .env .env.local <경로>/
cd <경로> && pnpm install --frozen-lockfile
```

**env를 복사하는 이유.** `.env`는 커밋 대상이 아니라 새 트리에 안 따라온다. 없으면 로컬 실행과 `pnpm test:integration`이 그 자리에서 죽는다.

**hooksPath를 따로 거는 이유.** worktree마다 설정이 따로 산다. 안 걸면 시크릿 검사와 포맷 훅이 그 트리에서만 조용히 안 돈다.

열고 나서 무엇이 준비됐는지 한 줄로 보고한다 — 경로, 선 커밋, 훅·env·의존성 여부.

## 세션 붙이기

트리를 만드는 것과 거기서 에이전트를 돌리는 것은 다른 일이다.

```sh
orca terminal create --worktree name:<이름> --command "claude" --focus
```

만들 때 같이 열려면 `orca worktree create`에 `--agent <id>`와 `--prompt <text>`를 준다. `--activate`를 붙이면 Orca 앱이 그 트리를 띄운다.

## 닫기

```sh
git -C <경로> status --short
orca worktree rm --worktree name:<이름>
```

**미커밋 변경이 있으면 지우지 않는다.** 무엇이 남아 있는지 보여주고 사람 판단을 받는다. `--force`는 사람이 명시로 요청할 때만 쓴다.

**브랜치는 같이 안 지운다.** PR이 열려 있을 수 있고, 트리를 닫는 것과 작업을 버리는 것은 다른 일이다. 브랜치까지 지우려면 사람이 따로 말해야 한다.

## 이름 바꾸기

Orca가 아는 이름은 `displayName`이다.

```sh
orca worktree set --worktree <선택자> --name <새 이름>
```

디스크 경로까지 바꿔야 하면 `orca worktree rm` 뒤에 다시 `create`한다. `git worktree move`로 옮기면 경로가 Orca 메타데이터와 어긋난다.

**경로와 이름에 한글을 안 쓴다.** 스크립트와 도구가 걸리는 자리가 생긴다. "디자인으로 바꿔"라고 하면 `design`으로 만들고 영문으로 지었다는 사실을 알린다.

## 지저분한 자리

`~/orca/workspaces/<저장소>/` 아래에 목록에 없는 디렉터리가 남아 있을 수 있다. 등록이 풀린 잔재이거나 git 명령으로 만들어진 반쪽짜리다. 눈에 띄면 사실만 보고하고 지우지 않는다 — 사람이 아직 쓰는 것일 수 있다.

`.orca-worktree-trash/`는 Orca가 쓰는 자리다. 건드리지 않는다.

## 보고

한 번에 셋을 적는다.

1. 무엇을 했나 — 만든 경로, 지운 이름, 바꾼 이름
2. 지금 트리 목록 — 이름과 경로와 브랜치를 같이
3. 어긋난 자리 — 뒤처진 트리, Orca가 모르는 트리, 준비가 덜 된 트리
