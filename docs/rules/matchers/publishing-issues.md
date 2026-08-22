---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101, #114, #66, #94, #96, #113"
---

# Matcher: Issue를 발행할 때

GitHub Issue를 열거나 보드 카드를 옮길 때 읽는다.

## Issue를 읽는 사람

Issue 본문은 GitHub을 보는 사람에게 내는 보고서다. 파일을 열지 않아도 무슨 일인지 알 만큼 써라. 정확한 계약 — endpoint 이름, 컬럼 타입, 응답 형태 같은 것 — 은 `docs/` 아래 문서에 남고 그 문서가 정본이다.

본문 문장은 `docs/rules/matchers/writing-korean.md`를 따른다. 초고부터 적용한다.

## 종류

제목 접두가 종류를 정한다. `.github/ISSUE_TEMPLATE/`에는 종류 넷에 폼 다섯이 있다. `[Slice]`가 기능 폼과 디자인 폼으로 갈리기 때문이다. `gh`로 연 Issue는 폼을 우회하므로 폼이 묻는 항목을 그대로 채워라.

| 종류 | 여는 사람 | 내용 |
|------|-----------|---------|
| `[Epic]` | PM 또는 총괄 | sub-issue 여럿으로 갈라지는 작업 단위 하나 — 기능이거나 총괄의 다단계 작업이다. 기능 Epic은 SPEC 파일을 링크하고, 총괄 Epic은 링크할 파일이 없다. sub-issue가 전부 닫히면 닫는다 |
| `[Slice]` | Dev | Epic의 수직 슬라이스 하나. GitHub sub-issue로 Epic에 붙는다. 디자인 슬라이스는 이미 있는 화면에 `docs/ui/` 명세를 적용하는 것이라 부모 Epic이 없고 자기 폼을 쓴다 |
| `[Ticket]` | 총괄 | `normal` 리뷰 발견의 후속, 개선, 부채 |
| `[Request]` | 모든 역할 | 소유 밖의 변경. 소유한 역할이 스스로 정한다 — 받아서 구현하거나, 이유를 달고 거절하며 닫는다. 총괄은 두 역할이 어긋날 때만 중재한다 |

`[Orch]` 접두는 더 쓰지 않는다. 총괄의 다단계 작업은 `[Epic]`이 받는다. 이미 열려 있는 `[Orch]` Issue는 제목을 그대로 두고 닫힐 때까지 간다. 제목을 옮기면 그걸 가리키는 링크가 전부 어긋난다.

담당은 경로가 정한다. `[Ticket]`과 `[Request]`는 본문에 적은 경로를 `config/ownership.json`에 대면 소유 역할이 나온다. `orchestrator`도 목록 하나일 뿐이라 총괄이 받는 것도 그 목록으로 정해진다. 네 목록 어디에도 없으면 담당이 아니라 registry의 구멍이다. 그 경로를 어느 키에 넣을지 정하는 것이 먼저인데, `config/ownership.json`이 총괄 소유라 `[Request]`로 갈 자리가 없다. registry에 경로를 넣는 `[Ticket]`을 총괄이 열고, 그것이 merge된 뒤에 본래 일이 이어진다. 폼에서 담당을 고르는 칸을 뺀 이유가 이것이다 — 손으로 고르게 두면 경로와 어긋나며, 어긋난 쪽은 언제나 손으로 고른 쪽이다. `[Slice]`는 언제나 Dev다. `[Epic]`의 담당은 경로가 정하지 않는다. 스펙 파일이 PM 것이어도 그 Epic을 받아 쪼개는 것은 Dev이기 때문이고, 그래서 폼의 담당 칸에서 고른다.

PR은 `Closes #N`으로 Issue와 이어라. merge가 Issue를 자동으로 닫는다.

## 라벨

라벨은 분류한다. 상태는 절대 담지 않는다.

| 축 | 값 |
|------|--------|
| type | `type:feature` `type:bug` `type:refactor` `type:docs` `type:chore` |
| surface | `surface:ui` `surface:db` `surface:auth` `surface:api` `surface:workflow` `surface:docs` |
| risk | `risk:security` `risk:privacy` `risk:performance` `risk:concurrency` `risk:migration` `risk:external` |

폼의 `dropdown` 필드는 그 축을 본문에 기록할 뿐 라벨을 붙이지 않는다. 라벨을 붙이는 것은 폼 맨 위의 정적 `labels:` 키뿐이다. 발행하면서 `gh issue create --label`로 달거나, 웹 폼으로 들어온 Issue라면 발행 직후에 달아라.

## 보드

상태는 [La Bie Belle](https://github.com/users/tkyoun0421/projects/8) 프로젝트 보드의 Status 필드에 산다. 새 Issue를 보드에 올린 다음 상태를 정해라. 카드를 추가한다고 상태가 정해지지는 않는다 — 추가만 하고 둔 카드는 `No Status`에 앉아 어느 열에도 보이지 않는다.

```
gh project item-add 8 --owner tkyoun0421 --url <issue-url>          # item id를 출력한다
gh project item-edit --project-id PVT_kwHOBd4HfM4Bg89n \
  --id <item-id> \
  --field-id PVTSSF_lAHOBd4HfM4Bg89nzhf6jUI \
  --single-select-option-id <option-id>
```

| Status | Option id |
|--------|-----------|
| Backlog | `f025dca8` |
| Todo | `f66a47cd` |
| In Progress | `c2dd621b` |
| In Review | `b9e12ba6` |
| Done | `b9771004` |
| Blocked | `5b4d353f` |

이미 보드에 있는 카드를 옮기려면 `gh project item-list 8 --owner tkyoun0421 --format json`으로 item id를 찾아 같은 `item-edit`을 돌린다.

| Status | 뜻 | 옮기는 사람 |
|--------|---------|--------------|
| Backlog | 발행됐고 아직 줄 서지 않았다 | 연 사람 |
| Todo | 다음 차례로 확정됐다 — 배정 대기열이다 | PM(슬라이스 순서), 총괄 |
| In Progress | 브랜치를 땄고 작업 중이다 | 배정된 역할 |
| In Review | PR이 열렸고 리뷰·수정 루프가 돈다 | 배정된 역할 |
| Done | merge됐거나 닫혔다 | 자동 |
| Blocked | 명세 공백, Request 대기, 충족되지 않은 의존성. **사유 코멘트가 의무다** | 배정된 역할 |

각 역할이 자기 카드를 옮긴다. 브랜치를 따면 In Progress, PR을 열면 In Review다.

## 우선순위

우선순위는 라벨에 담지 않는다. 라벨 축 셋은 분류만 한다.

**Todo** 열의 위아래 순서가 곧 우선순위다. 위에 있을수록 먼저 간다. 슬라이스는 PM이, 나머지는 총괄이 그 열에 올리며 자리를 정한다. 급한 것이 생기면 카드를 Todo 위쪽으로 옮기지, 라벨을 새로 만들지 않는다.

Backlog에는 순서가 없다. 줄을 서는 것은 Todo로 올라온 뒤부터다.
