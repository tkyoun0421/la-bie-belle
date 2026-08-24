---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #88, #91, #101, #105, #106, #114, #109, #63, #111, #112, #113, #126, #130"
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
| `writing-korean.md` | 사람이 읽을 한국어 문장을 쓸 때 — 문서 본문, Issue·PR 본문, 코멘트 |
| `writing-docs.md` | `docs/` 아래를 만들거나 고칠 때 |
| `gates.md` | 슬라이스를 구현하거나 그 완료를 판정할 때 |
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

`orchestrator` 키도 다른 셋과 같은 목록이다. 총괄이 쥔 것은 규칙 세트, 템플릿, 설정, 스크립트, 훅, 워크플로, 그리고 저장소 진입점 파일 몇이다. 그 밖은 총괄도 쓰지 못하고 가드가 그 자리에서 막는다. 다른 역할이 소유한 것은 배정한다.

목록에 없는 경로를 총괄이 만들려 하면 막힌다. 그때 할 일은 우회가 아니라 registry에 그 경로를 넣는 PR을 먼저 여는 것이다. 그 마찰이 이 목록의 요점이다.

`CLAUDE.local.md`는 네 목록 어디에도 없다. 일부러 뺐다. 추적되지 않는 기계별 개인 파일이라 훅만 이 파일을 보고 pre-commit도 CI도 보지 않으며, 자기 부트스트랩을 스스로 고치는 것은 가드가 막으려는 바로 그 일이다. 고칠 것이 있으면 사람이 직접 고친다. 네 역할 모두에 똑같이 적용된다.

소유하지 않은 경로는 절대 고치지 마라. 대신 소유한 에이전트에게 `[Request]` Issue를 열어라.

worktree는 자기 디렉터리 이름으로 정체성을 밝힌다. `pm`·`dev`·`ui`가 그대로 registry 키다. 총괄은 worktree가 아니라 저장소의 main 작업 트리에서 일한다 — `git rev-parse --absolute-git-dir`과 `--git-common-dir`이 같은 곳을 가리키는 곳이고, linked worktree에서는 앞쪽이 `.git/worktrees/<이름>`이라 둘이 갈린다.

역할 키가 아닌 이름의 worktree는 이 시스템에서 아무 역할도 아니고, 가드가 통과시키지 않는다. `orchestrator`도 그 이름으로는 얻을 수 없다 — 총괄 자리는 디렉터리 이름이 아니라 main 작업 트리라는 사실이 정한다.

정체성을 세션이 직접 적는 자리는 없다. 이름을 바꾸려면 작업 공간 자체를 옮겨야 한다.

지시 자체는 추적된다 — 저장소 루트의 `CLAUDE.md`가 세션이 시작될 때마다 여기로 보낸다. worktree에 `CLAUDE.local.md`가 있다면 그건 그 기계의 개인 설정이고 규칙은 담지 않는다.

코딩 표준과 관례는 `docs/architecture/overview.md`에 산다. Dev가 소유하고 첫 설계 단계에서 쓴다.

## 브랜치, PR, merge

브랜치는 단명하고 작업 하나에 묶인다. 매 작업을 시작할 때 `git fetch origin`을 돌리고 `origin/main`에서 `<role>/<task-name>` 브랜치를 새로 딴다 — `pm/…`, `dev/…`, `ui/…`, `orch/…`. 장수 브랜치는 금지다.

접두는 규약이면서 검사다. 브랜치에 서 있는 동안 가드가 worktree 이름과 접두를 맞대고 어긋나면 편집과 커밋을 막는다. `pm` worktree에서 `dev/…` 브랜치를 따는 것 자체는 git이 막지 않는다. 걸리는 것은 그다음 편집이나 커밋이다.

접두 넷 중 어느 것도 아닌 이름은 대조에서 빠지고, 그때는 worktree 이름 하나로 판정한다. 소유는 그래도 지켜지지만 접두 규칙 자체는 리뷰가 지킨다.

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

어느 언어로 쓸지는 여기서 정한다. 그 언어를 어떻게 쓸지는 `docs/rules/matchers/writing-korean.md`가 정한다. 문서 본문이든 Issue·PR 본문이든 사람이 읽을 한국어 문장을 쓰기 전에 그 파일을 읽어라.

## 소통

**기록이 정본이고 벨은 신호일 뿐이다.** 에이전트 사이의 지시·요청·보고는 전부 GitHub에 쓴다 — PR 코멘트나 Issue다. Orca `terminal send` 벨은 "가서 봐라" 한 줄을 나른다. 터미널로만 전달된 지시는 일어나지 않은 것이다.

PR 자체가 완료 보고다. 역할이 PR을 열고 총괄에게 벨을 울린다.

merge 소식은 뿌리지 않는다. 총괄은 그 merge가 특정 역할에게 다음 일감을 만들 때만 전한다 — SPEC이 merge되면 Dev에게 슬라이스 분해가, 기능이 merge되면 UI에게 검수가 간다. 나머지는 각 역할이 다음 작업을 시작하며 `main`을 pull할 때 자연히 딸려온다.

## 집행

판정 module이 둘이다. `scripts/ownership-check.py`는 "역할 R이 경로 P를 쓸 수 있나"에 답한다. `scripts/secrets-check.py`는 "이 경로가 자격 증명 파일인가"에 답한다. 아래 셋이 그것들을 부른다.

경로 목록은 `scripts/secrets-check.py`가 git의 NUL 구분 출력에서 꺼낸다. 줄 단위로 자르면 git이 이름을 인용해 내놓는 경로 — 따옴표나 탭이 든 것 — 에서 그 인용이 패턴을 깨뜨려 `"이상한 폴더/.env"`가 그냥 지나간다.

`scripts/ownership-check.py`는 줄 단위로 읽는다. 그래서 꺼내는 자리가 줄바꿈으로 읽히는 문자가 든 경로를 아예 거절한다. 개행만이 아니라 수직 탭이나 다음 줄 문자도 파이썬은 줄 경계로 본다. 거절하지 않으면 경로 하나가 조각으로 갈려 각 조각이 소유를 통과한다. `scripts/test-ownership.py`가 두 경우를 케이스로 잡아 둔다.

셋 다 **fail closed**다. `config/ownership.json`을 읽을 수 없으면 어디서든 차단이다. 훅 둘은 worktree 이름이 역할 키가 아니거나 브랜치 접두가 가리키는 역할과 다를 때 막고, CI는 worktree가 없는 자리라 접두가 등록된 넷이 아니거나 그 값이 비었을 때 막는다.

총괄도 예외가 아니다. 판정도 목록도 다른 셋과 같다.

secrets 차단은 별개 축이다. `.githooks/pre-commit`은 역할을 가리기도 전에 `.env*`와 `.envrc`를 거절하므로 총괄도 여기에 걸린다.

- **PreToolUse 훅** `.claude/hooks/ownership-guard.sh`가 판정 module을 불러, 편집 시점에 역할 소유 밖 경로의 `Edit`·`Write`·`NotebookEdit`를 거절한다. 자기 worktree 밖의 절대 경로도 거절한다 — 다른 worktree도 포함이고, 임시 디렉터리와 `~/.claude`만 예외다.
- **pre-commit 훅** `.githooks/pre-commit`이 스테이지된 변경의 소유를 검사한다 — 추가·수정·삭제와 rename 양쪽이다. 그리고 트리 어디에 있든 `.env*`와 `.envrc`를 막는다. 유일한 예외는 `.env.example`이다. 저장소를 클론하거나 리셋한 뒤에는 `git config core.hooksPath .githooks`를 한 번 돌려라.
- **CI** `.github/workflows/ownership.yml`이 PR마다 같은 판정을 다시 돌린다. 역할은 브랜치 접두에서 오고 `--branch`가 그 값을 나른다. 판정 module과 registry는 PR이 아니라 base 커밋에서 꺼내 읽는다. 그러지 않으면 PR이 registry에 자기 줄을 넣어 스스로를 통과시킨다. 두 검사가 서로 다른 목록을 본다. 소유 검사는 base와 head를 견준 **최종 diff**만 본다 — 중간에 건드렸다가 되돌린 파일은 merge될 트리에 없으니 소유를 묻지 않는다. `.env` 계열 차단은 그 최종 diff에 **브랜치의 모든 커밋**과 **force-push로 떨어져 나간 이력**을 더해 훑는다. 넣었다 지운 키가 공개 저장소의 이력에 남기 때문이고, merge 커밋에서 얹은 파일은 커밋 목록에 나오지 않기 때문이다. 떨어져 나간 이력은 `synchronize` 이벤트가 나르는 갈아타기 전 head에서 온다. 그 커밋을 가져오지 못하면 통과가 아니라 차단이다. 이 검사는 required status check라 빨간불이면 merge가 거부된다.

CI는 마지막으로 돌린 검사 하나로 merge를 가른다. force-push 이력은 그것을 밀어낸 push의 검사가 잡으므로, 그 뒤에 또 force-push하면 앞 이력은 다시 훑지 않는다. 한 번 저장소에 닿은 키는 검사 결과와 무관하게 폐기하고 새로 발급해라.

로컬 훅 둘은 끌 수 있다. `git commit --no-verify`가 pre-commit 훅을 건너뛰고, PreToolUse 훅은 Claude Code 설정을 고치면 꺼진다. 둘 다 규칙 위반이고, 그래서 같은 판정이 CI에 한 번 더 있다. CI는 저장소 설정이 지키므로 에이전트가 끄지 못한다.

registry 둘의 대조는 CI에만 있다. `scripts/registry-check.py`가 `config/documents.json`의 모든 `path`를 `config/ownership.json`에 대서 소유 역할이 정확히 하나 나오는지 본다. 문서 종류를 새로 만들면서 소유를 정하지 않으면 여기서 걸린다. 같은 판정을 쓰려고 소유 module의 `owns()`를 그대로 불러 쓴다. 대조 규칙의 두 번째 사본을 만들지 않으려는 것이다.

front matter 검사도 CI에만 있다. `scripts/docs-check.py`가 `docs/` 아래 모든 문서를 훑어 필드 넷이 다 있는지, `status`가 그 종류의 어휘에 드는지, `related_issue`와 `related_adr`이 규격대로인지 본다. 어느 어휘를 쓸지는 `config/documents.json`의 `adr`·`tdr` 항목이 가리키는 자리로 가른다. `scripts/test-docs-check.py`가 이 판정을 케이스 스물로 잡아 둔다. 규격 자체는 `docs/rules/matchers/writing-docs.md`가 갖는다.

이 둘만 base가 아니라 PR의 트리를 읽는다. 묻는 것이 merge될 트리의 정합이라 base를 읽으면 검사할 대상이 없다. 소유 검사의 base 고정은 PR이 registry에 자기 줄을 넣어 스스로를 통과시키는 것을 막는 장치인데, 이 둘은 통과를 주는 검사가 아니라 요구하는 검사라 그 위험이 없다.

완료 판정은 별개 축이라 소유도 묻지 않고 CI에도 없다. 훅 둘이 나눠 진다. **Stop 훅** `.claude/hooks/gate-guard.sh`는 세션이 끝나려 할 때 `.gates/` 아래 원장에 미충족 gate가 남았는지 보고 막는다. 파일에 적힌 증거만 읽지 명령은 돌리지 않는다. **SubagentStop 훅** `.claude/hooks/gate-verify.sh`는 서브에이전트가 돌아올 때마다 실행 gate를 전부 다시 돌려 결과를 덮어쓴다. 증거를 손으로 써넣어도 명령이 다시 돌아 그 자리에서 무너지므로, 위조를 막는 대신 남지 못하게 한다.

원장이 없으면 둘 다 아무것도 하지 않는다. 강제 범위를 정하는 것은 설정이 아니라 원장의 존재다. 원장이 깨졌으면 통과가 아니라 차단이다. 새로 충족된 gate 없이 여섯 번 연속으로 막으면 일곱 번째는 놓아주되 원장에 `RELEASED:` 줄을 남긴다. 그 해제는 세션당 한 번뿐이다. 규격은 `docs/rules/matchers/gates.md`가 갖는다.

CI에 같은 검사가 없는 이유는 원장이 추적되지 않아 읽을 대상이 없어서다. PR 본문에 실린 원장에 묻는 것은 `CHECK:`가 제목이 말하는 것을 실제로 재느냐다. 그 판정은 사람에게 남는다.

CI가 잡지 못하는 축은 남는다. 명세 부합과 정확성은 기계의 몫이 아니다. 그 자리의 방어선은 독립 PR 리뷰다 — 리뷰어는 브랜치 접두와 바뀐 모든 경로의 소유를 매번 대조한다.

## 기본 전제

- 저장소는 **공개**다. `docs/rules/matchers/handling-secrets.md`를 봐라.
- 이전 프로젝트의 산출물, 즉 `snapshot/2026-08-20-pre-reset` 브랜치는 참조 금지다. 이 프로젝트는 백지에서 시작한다.

## 열린 항목

아래가 정해지면 이 규칙 세트를 고친다.

- 문서 색인과 검색 스크립트 (tsx)
