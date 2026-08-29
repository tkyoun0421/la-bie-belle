---
name: worktree
description: 작업 트리를 열고 닫고 이름을 바꾼다. 목록을 먼저 보여주고, 새 트리를 열 때 훅 경로와 env와 의존성까지 챙긴다. 트리거 — "작업트리 열어", "worktree 만들어", "트리 닫아", "트리 목록", "작업트리 이름 바꿔", "트리 지워".
---

# 작업 트리 다루기

작업 트리 이야기가 나오면 이 문서를 따른다. 사람이 말한 트리가 어느 것인지 확인하고 나서 손을 댄다.

## 자리

트리는 `~/orca/workspaces/<저장소 이름>/<트리 이름>`에 산다. 저장소 본체는 `~/Desktop/projects/<저장소 이름>`이고 이 규칙 밖이다.

저장소 이름은 `basename $(git rev-parse --show-toplevel)`로 얻는다. 본체가 아닌 트리에서 이 스킬을 부르면 `--show-toplevel`이 그 트리를 가리키니, 공용 저장소 디렉터리는 `git rev-parse --git-common-dir`로 찾는다.

## 무엇을 하든 목록부터

```sh
git worktree list
```

이걸 먼저 돌려 사람에게 보여준다. 사람이 말한 이름이 목록의 어느 줄인지 확인하고 나서 움직인다. 이름이 여럿에 걸리거나 하나도 안 걸리면 짐작하지 말고 묻는다.

**디렉터리 이름과 브랜치는 다른 것이다.** 이름이 `main`인 트리가 main 브랜치를 갖는다는 뜻이 아니다. 목록을 보여줄 때 둘을 같이 적는다.

```sh
for p in $(git worktree list --porcelain | awk '/^worktree /{print $2}'); do
  printf "%-56s %s\n" "$p" "$(git -C "$p" branch --show-current || echo '(detached)')"
done
```

## 열기

```sh
B=~/orca/workspaces/<저장소 이름>
git worktree add --detach "$B/<이름>" origin/main
git -C "$B/<이름>" config core.hooksPath .githooks
cp .env .env.local "$B/<이름>/"
cd "$B/<이름>" && pnpm install --frozen-lockfile
```

네 단계를 다 한다. 하나라도 빠지면 그 트리에서 바로 일을 못 시작한다.

**`--detach`로 여는 이유.** 브랜치 하나는 트리 하나만 가진다. main을 새 트리에 주면 본체가 main을 못 쓴다. task 브랜치는 그 트리에 앉은 세션이 `git checkout -b`로 딴다.

**env를 복사하는 이유.** `.env`는 커밋 대상이 아니라 새 트리에 안 따라온다. 없으면 로컬 실행과 `pnpm test:integration`이 그 자리에서 죽는다.

**hooksPath를 따로 거는 이유.** worktree마다 설정이 따로 산다. 안 걸면 시크릿 검사와 포맷 훅이 그 트리에서만 조용히 안 돈다.

열고 나서 무엇이 준비됐는지 한 줄로 보고한다 — 경로, 선 커밋, 훅·env·의존성 여부.

## 닫기

```sh
git -C <경로> status --short
git worktree remove <경로>
```

**미커밋 변경이 있으면 지우지 않는다.** 무엇이 남아 있는지 보여주고 사람 판단을 받는다. `--force`는 사람이 명시로 요청할 때만 쓴다.

**브랜치는 같이 안 지운다.** PR이 열려 있을 수 있고, 트리를 닫는 것과 작업을 버리는 것은 다른 일이다. 브랜치까지 지우려면 사람이 따로 말해야 한다.

## 이름 바꾸기

```sh
git worktree move <옛 경로> <새 경로>
```

`mv`를 쓰지 않는다. 트리 안 `.git` 파일이 절대 경로를 담고 있어서 그냥 옮기면 그 트리가 저장소를 못 찾는다.

**경로에 한글을 안 쓴다.** 스크립트와 도구가 걸리는 자리가 생긴다. "디자인으로 바꿔"라고 하면 `design`으로 만들고 영문으로 지었다는 사실을 알린다.

옮긴 뒤 새 자리에서 `git -C <새 경로> status`가 도는지 확인하고 보고한다.

## 지저분한 자리

`git worktree list`에 안 잡히는데 디렉터리는 남아 있는 경우가 있다. 등록이 풀린 잔재다. 눈에 띄면 사실만 보고하고 지우지 않는다 — 사람이 아직 쓰는 것일 수 있다.

`git worktree prune`도 시키지 않으면 안 돌린다.

## 보고

한 번에 셋을 적는다.

1. 무엇을 했나 — 옛 경로와 새 경로, 또는 만든 경로
2. 지금 트리 목록 — 경로와 브랜치를 같이
3. 어긋난 자리 — 뒤처진 트리, detached 상태, 등록 안 된 디렉터리
