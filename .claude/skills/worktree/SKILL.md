---
name: worktree
description: Orca가 관리하는 작업 트리를 열고 닫고 이름 바꾸고 목록을 본다. 트리를 열면 세션도 같이 띄운다. git worktree 명령은 안 쓴다. 트리거 — "작업트리 열어", "worktree 만들어줘", "트리 닫아", "트리 목록", "트리 이름 바꿔", "브랜치 따로 딸 트리", "세션 하나 더 띄워줘", "작업 공간 하나 만들어줘", "작업 공간 정리하자", "트리 정리해줘". 저장소 트리를 열고 닫고 이름 바꾸는 일은 여기가 맡고, 터미널 조작과 브라우저와 아티팩트 같은 나머지 Orca 조작은 orca-cli가 정본이다.
---

# 작업 트리

Orca가 관리한다. `orca` CLI를 쓰고 `git worktree add|remove|move`는 안 쓴다. 바닥이 git이라 `git worktree list`에는 뜨지만, git으로 만든 트리는 Orca가 몰라서 앱에 안 뜨고 터미널을 못 붙이고 `orca worktree rm`으로 못 지운다.

트리를 열고 닫고 이름 바꾸는 것까지가 여기다. 터미널을 읽고 보내는 일, 저장소와 자동화, 브라우저 조작은 `orca-cli` 스킬이 정본이라 그쪽으로 넘긴다.

## 목록부터

```sh
orca worktree list          # displayName, 브랜치, 경로
git worktree list           # 대조용. git에만 있으면 반쪽짜리다
```

사람이 말한 이름이 어느 줄인지 확인하고 움직인다. 여럿에 걸리거나 하나도 안 걸리면 묻는다. **이름과 브랜치는 다른 것이라** 보여줄 때 둘을 같이 적는다.

## 열기

```sh
orca worktree create --name <이름> --repo name:<저장소> --base-branch main
```

저장소 선택자는 `orca repo list`가 알려준다. 이름이 겹치면 `--repo id:<id>`.

**Orca가 브랜치를 같이 만든다.** `--name design`이면 그 이름으로 브랜치가 선다. 계정 이름이 앞에 붙는 형태라 실제 이름은 `orca worktree list`의 브랜치 열에서 확인한다. detached가 아니니 그 트리에서 바로 커밋하고 PR을 낸다.

`orca.yaml`이 없어 setup 훅이 안 도니 셋을 손으로 챙긴다.

```sh
git -C <경로> config core.hooksPath .githooks   # worktree마다 따로 산다
cp .env .env.local <경로>/                        # 커밋 대상이 아니라 안 따라온다
cd <경로> && pnpm install --frozen-lockfile
```

## 세션 붙이기

**트리를 열면 세션도 같이 연다.** 명령은 언제나 `claude`고, 다른 것을 쓰려면 사람이 말해야 한다. 빈 셸만 띄우지 않는다.

```sh
orca terminal create --worktree name:<이름> --command "claude" --title "<이름>"
```

`--focus`는 타임아웃이 잦다. 빈 셸로 남았으면 `orca terminal send --terminal <handle> --text "claude" --enter`로 띄우고, `orca terminal read`로 실제로 떴는지 확인한다.

## 닫기

```sh
git -C <경로> status --short        # 먼저 본다
orca worktree rm --worktree name:<이름>
```

**미커밋 변경이 있으면 안 지운다.** 무엇이 남았는지 보여주고 판단을 받는다. `--force`는 명시 요청에만.

**브랜치는 같이 안 지운다.** PR이 열려 있을 수 있다.

## 이름 바꾸기

```sh
orca worktree set --worktree <선택자> --name <새 이름>
```

디스크 경로까지 바꾸려면 `rm` 뒤에 다시 `create`한다. `git worktree move`는 Orca 메타데이터와 어긋난다.

**경로와 이름에 한글을 안 쓴다.** "디자인으로 바꿔"는 `design`으로 만들고 그 사실을 알린다.

## 안 건드리는 것

목록에 없는 디렉터리와 `.orca-worktree-trash/`. 사실만 보고하고 지우지 않는다.

## 보고

무엇을 했나 / 지금 목록(이름·브랜치·경로) / 어긋난 자리(뒤처짐, Orca가 모르는 트리, 준비 덜 됨).
