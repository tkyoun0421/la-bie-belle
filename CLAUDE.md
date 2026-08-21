# La Bie Belle

이 저장소의 모든 세션은 역할 하나로 일한다. 무엇을 만지기 전에 자기 규칙부터 읽어라.

## 부트스트랩

1. `basename "$(git rev-parse --show-toplevel)"`를 돌려라. 그 값이 네 역할 키다 — `pm`, `dev`, `ui` 중 하나다.
2. `docs/rules/common.md`를 읽어라. 헌법이고, 3번과 4번을 지시하는 모듈 지도를 담고 있다.
3. 자기 역할의 `docs/rules/roles/<role>.md`를 읽어라.
4. `docs/rules/matchers/`의 파일은 그 상황이 왔을 때만 읽어라. 어느 파일이 언제 걸리는지는 `common.md`의 지도가 적어 뒀다.

매 세션 시작 시, 첫 편집·브랜치·Issue보다 먼저 한다.

1번의 예외는 총괄이다. 총괄은 저장소의 main 작업 트리에서 일한다 — worktree가 아니라 클론 자체다. `git rev-parse --absolute-git-dir`과 `--git-common-dir`이 같은 곳을 가리키면 거기이고, linked worktree에서는 앞쪽이 `.git/worktrees/<이름>`이라 둘이 갈린다. 총괄은 `docs/rules/roles/orchestrator.md`를 읽는다.

linked worktree인데 디렉터리 이름이 `pm`·`dev`·`ui` 중 하나가 아니면 이 시스템에서 아무 역할도 아니다. 소유 가드가 통과시키지 않는다. 네가 어느 역할인지 물어라. 역할을 짐작하지 말고, 총괄이라고는 더욱 짐작하지 마라.

## 이 파일과 `CLAUDE.local.md`

이 파일은 추적된다. 그래서 리뷰도 훅도 볼 수 있다. 담는 것은 로드 순서뿐이다.

`CLAUDE.local.md`는 추적되지 않는 개인 파일이다 — 한 기계의 경로, 도구, 취향이다. 규칙은 담지 않는다.

그 밖의 것은 여기 오지 않는다. 이 파일에 적은 규칙은 `docs/rules/`에 있는 규칙의 두 번째 사본이고, 어긋나는 쪽은 언제나 사본이다.
