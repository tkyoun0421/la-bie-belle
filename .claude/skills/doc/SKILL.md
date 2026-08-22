---
name: doc
description: "이 프로젝트가 만드는 모든 문서의 라우터. 종류와 주제를 받아 — /doc spec 예약취소, /doc adr 결제수단 — 소유권을 확인하고 브랜치를 뗀 뒤 stage 스킬로 넘긴다. PRD·도메인 문서·ADR·TDR·스펙·UI 스펙·아키텍처 개요를 쓰거나 고치는 요청, Epic을 슬라이스로 쪼개는 요청에 쓴다. 트리거: PRD 쓰자, ADR 남겨, 스펙 만들어, 도메인 용어 정리, UI 스펙 작성, 에픽 슬라이스로 쪼개."
---

# Doc 라우터

너는 문서 작업의 진입점이다. 문서를 직접 쓰지 않는다 — 누가 무엇을 소유하는지 가리고, 브랜치를 준비하고, 넘긴다.

## 1. 규칙을 읽는다

`basename "$(git rev-parse --show-toplevel)"`를 돌려라. 그 값이 네 역할 키다. `git rev-parse --absolute-git-dir`과 `--git-common-dir`이 같은 곳을 가리키면 main 작업 트리이며, 너는 총괄이다.

그다음 이 순서로 읽는다.

- `docs/rules/common.md`
- `docs/rules/roles/<role>.md`
- `docs/rules/matchers/writing-docs.md`

아래는 전부 그것들이 로드됐다고 전제한다. 내용을 다시 적지 말고 따라라.

## 2. 종류를 가린다

종류마다 대상 경로, 템플릿, stage 스킬이 `config/documents.json`에 있다. 외워서 쓰지 말고 그 파일을 읽어라 — 산문에 둔 두 번째 사본이 먼저 어긋나는 사본이다. `aliases`에 적힌 이름도 같은 종류로 받는다. `slices`는 `path`가 `null`이다. 파일이 아니라 GitHub Issue를 만들기 때문이다.

소유는 여기 없다. 3번에서 그 `path`를 `config/ownership.json`에 대서 정한다. 같은 사실을 두 파일에 적으면 둘이 갈린다. `path`가 없는 `slices`는 대조할 것이 없으니 `docs/rules/matchers/publishing-issues.md`의 종류 표가 담당을 정한다.

종류가 주어지지 않았으면 어느 쪽인지 물어라. 스펙과 결정 기록 사이에서 짐작하지 마라 — 둘은 다른 자리에 다른 손으로 간다.

`decision`은 그 자체로 종류가 아니다. 소유권을 확인하기 전에 `adr`이나 `tdr`로 가려라. 둘의 소유가 다르기 때문이다. 제품·도메인 선택은 ADR이고 기술 선택은 TDR이다. 부르는 역할이 이미 정해 놨으면 어느 쪽을 골랐는지 말하고 계속한다.

총괄 자신의 문서 — `docs/rules/`와 `docs/templates/` — 에는 stage 스킬이 없다. `main` 체크아웃에서는 `docs/rules/matchers/writing-docs.md`를 직접 따르고 4번으로 건너뛴다.

이렇게 갈라라. 제품이 무엇이고 왜 있는지는 PRD다. 어떤 말이 무슨 뜻이고 무엇이 언제나 참이어야 하는지는 도메인 문서다. 갈림길에서 한쪽을 골랐고 나중에 누군가 "왜 이렇게 했지"라고 물을 자리는 결정 기록이다. 기능 하나가 어떻게 동작하는지는 스펙이다. 이미 있는 화면의 시각·상호작용 마감은 UI 스펙이다. 코드베이스가 어떻게 배치되고 어떤 관례를 따르는지는 아키텍처 개요다.

## 3. 소유권을 확인한다

대상 경로를 `config/ownership.json`과 네 역할에 대조해라.

네 소유가 아니면 **여기서 멈춰라**. `gh-issue-generator`를 붙여 소유한 역할에게 `[Request]` Issue를 열고, 무엇이 왜 필요한지 적은 뒤 Issue 번호를 보고해라. 파일을 쓰지도, 브랜치를 열지도 마라.

총괄도 같은 대조를 받는다. `orchestrator` 키에 든 `docs/` 경로는 `docs/rules/`와 `docs/templates/` 둘뿐이라 `config/documents.json`에 실린 문서는 하나도 총괄 것이 아니다. `main` 작업 트리에서의 답은 언제나 `[Request]`이거나 소유한 역할에게 하는 배정이다.

## 4. 브랜치를 딴다

`slices`는 파일을 만들지 않고 PR도 열지 않으니 브랜치가 없다. 그 종류는 5번으로 건너뛴다.

나머지는 전부:

```
git fetch origin && git checkout -b <role>/<task-name> origin/main
```

그다음 관련 보드 카드를 **In Progress**로 옮긴다 — 명령과 option id는 `docs/rules/matchers/publishing-issues.md`에 있다.

## 5. 넘긴다

Skill 도구로 stage 스킬을 부르고 주제와 대화에서 이미 알아낸 것을 함께 넘겨라. 나머지는 stage 스킬의 몫이다 — 수집, 작성, 발행이다.

넘기기 전에, 만들 문서가 기존 문서에 기대게 될 때는 `docs-locator`를 돌려라. 스펙은 도메인 어휘와 그것을 묶는 결정이 필요하고, 결정 기록은 앞선 기록이 이미 그 자리를 덮었는지 알아야 한다. 인용을 stage 스킬에 함께 넘기고 네가 돌렸다고 말해라. 같은 자리를 또 뒤지지 않게.
