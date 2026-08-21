---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #88, #91, #101, #105"
---

# 공통 규칙

라비에벨의 에이전트 협업 헌법이다. 다른 문서가 `docs/rules/`의 규칙과 부딪히면 규칙 세트가 이긴다. 고치는 사람은 총괄뿐이고, 방법은 PR뿐이다.

## 모듈 지도

규칙은 축 셋으로 갈린다. `docs/rules/common.md`는 항상 읽고, 자기 역할 파일도 항상 읽고, matcher는 그 상황이 왔을 때만 읽는다.

| 축 | 경로 | 읽는 때 |
|------|------|--------------|
| 항상 | `docs/rules/common.md` | 매 작업 |
| 누가 | `docs/rules/roles/<role>.md` | 매 작업. worktree 디렉터리 이름이 가리키는 역할 |
| 언제 | `docs/rules/matchers/<situation>.md` | 그 상황이 왔을 때만 |

| Matcher | 이때 읽는다 |
|---------|--------------|
| `writing-docs.md` | `docs/` 아래를 만들거나 고칠 때 |
| `publishing-issues.md` | GitHub Issue를 열거나 보드 카드를 옮길 때 |
| `opening-a-pr.md` | PR을 열 때, 또는 열려 있는 PR에 수정을 push할 때 |
| `reviewing-a-pr.md` | PR을 리뷰하고 발견에 심각도를 매길 때 |
| `review-failed.md` | 리뷰가 FAIL로 돌아왔거나 수정 지시를 받았을 때 |
| `blocked.md` | 더 갈 수 없어 멈춰야 할 때 |
| `parallel-work.md` | subagent나 worktree로 일을 나눌 때 |
| `handling-secrets.md` | 자격 증명이나 `.env*` 파일을 만질 때 |

## 역할과 작업 공간

| Worktree | 에이전트 | 브랜치 접두 | Registry 키 |
|----------|-------|---------------|--------------|
| `main` 체크아웃 | 총괄 (`@orchestrator`) | `orch/` | `orchestrator` |
| `pm` | PM (`@agent-pm`) | `pm/` | `pm` |
| `dev` | Dev (`@agent-dev`) | `dev/` | `dev` |
| `ui` | UI (`@agent-ui`) | `ui/` | `ui` |

어느 키가 어느 경로를 소유하는지는 `config/ownership.json`에 있다. 외워서 쓰지 말고 그 파일을 읽어라 — 가드도 리뷰어도 같은 파일을 읽는다. 산문에 둔 두 번째 사본이 먼저 어긋나는 사본이다.

`orchestrator` 키는 `["*"]`다. 조율이 모든 경로에 닿기 때문이다. 그건 접근이지 작성권이 아니다. 총괄은 무엇이든 만질 수 있지만 다른 역할이 소유한 것은 아무것도 쓰지 않는다 — 문서도 소스도 마찬가지다. 대신 그 일을 배정한다. 가드는 총괄도 다른 역할과 똑같이 검사하지만 `["*"]`가 모든 경로를 통과시킨다. 그래서 이 축을 지키는 것은 이 규칙과 독립 리뷰뿐이다.

소유하지 않은 경로는 절대 고치지 마라. 대신 소유한 에이전트에게 `[Request]` Issue를 열어라.

worktree는 자기 디렉터리 이름으로 정체성을 밝힌다. `pm`·`dev`·`ui`가 그대로 registry 키다. 총괄은 worktree가 아니라 저장소의 main 작업 트리에서 일한다 — `git rev-parse --git-dir`이 `.git`을 그대로 내놓는 곳이고, linked worktree에서는 `.git/worktrees/<이름>`이 나온다. 이름이 registry에 없는 worktree는 이 시스템에서 아무 역할도 아니고, 가드가 통과시키지 않는다.

정체성을 세션이 직접 적는 자리는 없다. 이름을 바꾸려면 작업 공간 자체를 옮겨야 한다.

지시 자체는 추적된다 — 저장소 루트의 `CLAUDE.md`가 세션이 시작될 때마다 여기로 보낸다. worktree에 `CLAUDE.local.md`가 있다면 그건 그 기계의 개인 설정이고 규칙은 담지 않는다.

코딩 표준과 관례는 `docs/architecture/overview.md`에 산다. Dev가 소유하고 첫 설계 단계에서 쓴다.

## 브랜치, PR, merge

브랜치는 단명하고 작업 하나에 묶인다. 매 작업을 시작할 때 `git fetch origin`을 돌리고 `origin/main`에서 `<role>/<task-name>` 브랜치를 새로 딴다 — `pm/…`, `dev/…`, `ui/…`, `orch/…`. 장수 브랜치는 금지다.

접두는 규약이 아니라 검사다. 브랜치에 서 있는 동안 가드가 worktree 이름과 접두를 맞대고, 어긋나면 커밋을 막는다. `dev` worktree에서 `pm/…` 브랜치를 따는 일은 그 자리에서 걸린다.

task 사이에 role worktree는 아무 브랜치에도 서 있지 않는다. 그때는 접두가 없으니 디렉터리 이름 하나로 판정한다.

```
git checkout --detach origin/main        # 유휴
git fetch origin                         # 작업 시작
git checkout -b pm/<task> origin/main
                                         # 총괄이 PR을 squash merge한다
git fetch origin --prune
git checkout --detach origin/main        # 지우기 전에 그 브랜치에서 내려온다
git branch -D pm/<task>                  # -d가 아니라 -D다. squash merge는 커밋을 다시 쓴다
```

브랜치는 merge가 끝난 뒤에만 지운다. 여기서 `git branch -d`는 거절한다 — `main`에 얹힌 squash 커밋은 그 브랜치의 커밋이 아니라서 git이 아직 merge되지 않은 브랜치로 본다. 작업은 이미 `main`에 있다. `-D`가 맞는 동사이지 경고를 피해 가는 지름길이 아니다.

주차된 브랜치는 곧 장수 브랜치이고, 그건 바로 위 규칙이 금지하는 것이다. detached 상태에는 접두 규칙을 어길 이름도 없고 뒤처질 브랜치도 없다. `main`에 주차하는 길은 막혀 있다 — git이 한 브랜치를 두 worktree에 체크아웃하지 못하게 하고, 그 체크아웃은 총괄 몫이다. 총괄은 task 사이에 `main`에 머물고 작업은 남들처럼 `orch/` 브랜치에서 한다.

`main`에 직접 커밋하지 않는다. 총괄의 것을 포함해 모든 변경은 PR로 들어간다.

merge는 총괄만 하고 언제나 **squash merge**다 — 작업 단위 하나가 `main`의 커밋 하나가 된다. merge하려면 독립 `pr-reviewer` 에이전트의 PASS가 있어야 한다. 자기 PR은 아무도 리뷰하지 않는다. 제품이 배포되면 merge 권한은 사람에게 넘어간다.

PR 제목은 `type(scope): 요약`이고, 본문은 관련 Issue 번호와 변경 영향을 담는다. 커밋 메시지 관례는 PR 수준에서만 강제한다. 작업 중의 커밋은 자유다. `docs/rules/matchers/opening-a-pr.md`를 봐라.

## 작업 추적

작업은 GitHub Issue로 추적한다. 이력은 `git log`와 PR diff로 추적한다. 별도의 tasks 파일도 changelog 파일도 없다.

명세의 유일한 정본은 `docs/specs/` 아래의 파일이다. Issue 본문은 요약과 링크를 담을 뿐 상세를 복사하지 않는다. 정정은 파일로 간다.

기능 구현이 디자인보다 먼저다. 디자인 적용은 `docs/ui/` 명세가 생긴 뒤 별도 슬라이스로 간다.

상태는 라벨이 아니라 [La Bie Belle](https://github.com/users/tkyoun0421/projects/8) 프로젝트 보드의 Status 필드에 산다. `docs/rules/matchers/publishing-issues.md`를 봐라.

## 언어

이 저장소의 모든 글은 **한국어**로 쓴다. `docs/`와 `.claude/`의 로컬 문서도, GitHub의 Issue·PR·코멘트도 마찬가지다. 사람이 직접 읽는다.

코드, 명령, 식별자, 파일 경로, CLI 플래그, commit type 키워드(`feat`, `fix`, …), 스킬과 에이전트의 `name` 필드는 원문 그대로 둔다. 번역하면 그 자리에서 실행되지 않는다.

## 소통

**기록이 정본이고 벨은 신호일 뿐이다.** 에이전트 사이의 지시·요청·보고는 전부 GitHub에 쓴다 — PR 코멘트나 Issue다. Orca `terminal send` 벨은 "가서 봐라" 한 줄을 나른다. 터미널로만 전달된 지시는 일어나지 않은 것이다.

PR 자체가 완료 보고다. 역할이 PR을 열고 총괄에게 벨을 울린다.

merge 소식은 뿌리지 않는다. 총괄은 그 merge가 특정 역할에게 다음 일감을 만들 때만 전한다 — SPEC이 merge되면 Dev에게 슬라이스 분해가, 기능이 merge되면 UI에게 검수가 간다. 나머지는 각 역할이 다음 작업을 시작하며 `main`을 pull할 때 자연히 딸려온다.

## 집행

판정은 한 자리에 있다. `scripts/ownership-check.py`가 "역할 R이 경로 P를 쓸 수 있나"에 답하고, 아래 훅 둘이 그것을 부른다. 둘 다 **fail closed**다 — `config/ownership.json`이 깨졌거나, worktree 이름이 registry에 없거나, 브랜치 접두가 등록된 역할이 아니면 통과가 아니라 차단이다. 총괄도 예외가 아니다. `["*"]`가 총괄의 모든 경로를 통과시킬 뿐, 검사 자체는 똑같이 돈다.

secrets 차단은 별개 축이다. `.githooks/pre-commit`은 역할을 가리기도 전에 `.env*`와 `.envrc`를 거절하므로 총괄도 여기에 걸린다.

- **PreToolUse 훅** `.claude/hooks/ownership-guard.sh`가 판정 module을 불러, 편집 시점에 역할 소유 밖 경로의 `Edit`·`Write`·`NotebookEdit`를 거절한다. 자기 worktree 밖의 절대 경로도 거절한다 — 다른 worktree도 포함이고, 임시 디렉터리와 `~/.claude`만 예외다.
- **pre-commit 훅** `.githooks/pre-commit`이 스테이지된 변경의 소유를 검사한다 — 추가·수정·삭제와 rename 양쪽이다. 그리고 트리 어디에 있든 `.env*`와 `.envrc`를 막는다. 유일한 예외는 `.env.example`이다. 저장소를 클론하거나 리셋한 뒤에는 `git config core.hooksPath .githooks`를 한 번 돌려라.

알려진 한계: 역할 에이전트는 `git commit --no-verify`로 두 훅을 함께 끌 수 있다. 그건 규칙 위반이고, 마지막 방어선은 독립 PR 리뷰다 — 리뷰어는 브랜치 접두와 바뀐 모든 경로의 소유를 매번 대조한다.

## 기본 전제

- 저장소는 **공개**다. `docs/rules/matchers/handling-secrets.md`를 봐라.
- 이전 프로젝트의 산출물, 즉 `snapshot/2026-08-20-pre-reset` 브랜치는 참조 금지다. 이 프로젝트는 백지에서 시작한다.

## 열린 항목

아래가 정해지면 이 규칙 세트를 고친다.

- 문서 색인과 검색 스크립트 (tsx)
- 소유권 가드 자동 테스트 하네스 (#63)
