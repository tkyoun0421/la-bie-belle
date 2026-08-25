---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101, #114, #66, #94, #96, #113, #120, #130, #150"
---

# Matcher: Issue를 발행할 때

GitHub Issue를 열거나 보드 카드를 옮길 때, 그리고 Issue에 보고 코멘트를 쓸 때 읽는다.

## Issue를 읽는 사람

Issue 본문은 GitHub을 보는 사람에게 내는 보고서다. 파일을 열지 않아도 무슨 일인지 알 만큼 써라. 정확한 계약 — endpoint 이름, 컬럼 타입, 응답 형태 같은 것 — 은 `docs/` 아래 문서에 남고 그 문서가 정본이다.

본문 문장은 `docs/rules/matchers/writing-korean.md`를 따른다. 초고부터 적용한다.

## 코멘트로 내는 보고

보고 코멘트도 사람이 훑는 문서다. 산문 벽으로 쓰지 마라. 문장 규칙은 본문과 같이 `writing-korean.md`를 따르되 짜임은 아래를 지킨다.

- 첫 문단은 세 문장 이하의 결론이다. 무엇을 했고 무엇이 막혔는지가 거기 다 있어야 한다
- 본문은 `##` 소제목으로 가른다. 나열은 문단에 눌러 담지 말고 목록이나 표로 꺼내라
- 막힌 것과 결정이 필요한 것은 **막힘**이나 **결정 요청** 소제목 아래 따로 세워라. 산문 끝에 묻으면 읽는 사람이 놓친다
- 다 달았으면 총괄에게 벨을 울려라. 코멘트가 정본이고 벨은 신호다

## 종류

제목 접두가 종류를 정한다. `.github/ISSUE_TEMPLATE/`에는 종류 넷에 폼 다섯이 있다. `[Slice]`가 기능 폼과 디자인 폼으로 갈리기 때문이다. `gh`로 연 Issue는 폼을 우회하므로 폼이 묻는 항목을 그대로 채워라.

| 종류 | 여는 사람 | 내용 |
|------|-----------|---------|
| `[Epic]` | PM 또는 총괄 | sub-issue 여럿으로 갈라지는 작업 단위 하나 — 기능이거나 총괄의 다단계 작업이다. 기능 Epic은 SPEC 파일을 링크하고, 총괄 Epic은 링크할 파일이 없다. sub-issue가 전부 닫히면 닫는다 |
| `[Slice]` | Dev | Epic의 수직 슬라이스 하나. GitHub sub-issue로 Epic에 붙는다. 디자인 슬라이스는 이미 있는 화면에 `docs/ui/` 명세를 적용하는 것이라 부모 Epic이 없고 자기 폼을 쓴다 |
| `[Ticket]` | 총괄 | `normal` 리뷰 발견의 후속, 개선, 부채 |
| `[Request]` | 모든 역할 | 소유 밖의 변경. 소유한 역할이 스스로 정한다 — 받아서 구현하거나, 이유를 달고 거절하며 닫는다. 총괄은 두 역할이 어긋날 때만 중재한다 |

`[Orch]` 접두는 더 쓰지 않는다. 총괄의 다단계 작업은 `[Epic]`이 받는다. 이미 열려 있는 `[Orch]` Issue는 제목을 그대로 두고 닫힐 때까지 간다. 제목을 옮기면 그걸 가리키는 링크가 전부 어긋난다.

담당은 경로가 정한다. `[Ticket]`과 `[Request]`는 본문에 적은 경로를 `config/ownership.json`에 대면 소유 역할이 나온다. `orchestrator`도 목록 하나일 뿐이라 총괄이 받는 것도 그 목록으로 정해진다. 거꾸로 네 목록에 다 들어 있는 경로도 하나 있다. `.gates/`는 역할마다 자기 작업의 원장을 쓰는 자리라 소유가 넷으로 갈리지 않는다. 그 경로로는 `[Ticket]`도 `[Request]`도 열지 마라 — 원장은 브랜치와 함께 죽는 작업 중 파일이라서다. 고칠 것이 있다면 그건 원장이 아니라 `scripts/gate-check.py`나 `docs/rules/matchers/gates.md`다.

네 목록 어디에도 없으면 담당이 아니라 registry의 구멍이다. 그 경로를 어느 키에 넣을지 정하는 것이 먼저인데, `config/ownership.json`이 총괄 소유라 `[Request]`로 갈 자리가 없다. registry에 경로를 넣는 `[Ticket]`을 총괄이 열고, 그것이 merge된 뒤에 본래 일이 이어진다. 폼에서 담당을 고르는 칸을 뺀 이유가 이것이다 — 손으로 고르게 두면 경로와 어긋나며, 어긋난 쪽은 언제나 손으로 고른 쪽이다. `[Slice]`는 언제나 Dev다. `[Epic]`의 담당은 경로가 정하지 않는다. 스펙 파일이 PM 것이어도 그 Epic을 받아 쪼개는 것은 Dev이기 때문이고, 그래서 폼의 담당 칸에서 고른다.

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

상태는 [La Bie Belle](https://github.com/users/tkyoun0421/projects/8) 프로젝트 보드의 Status 필드에 산다. 새 Issue를 보드에 올리면 workflow가 Backlog에 앉힌다. 거기서 더 옮길 자리가 있으면 아래 명령으로 옮겨라 — 브랜치를 이미 땄으면 In Progress다.

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
| Backlog | 발행됐고 아직 줄 서지 않았다 | workflow |
| Todo | 다음 차례로 확정됐다 — 배정 대기열이다 | PM(슬라이스 순서), 총괄 |
| In Progress | 브랜치를 땄고 작업 중이다 | 배정된 역할 |
| In Review | PR이 열렸고 리뷰·수정 루프가 돈다 | 배정된 역할 |
| Done | merge됐거나 닫혔다 | workflow |
| Blocked | 명세 공백, Request 대기, 충족되지 않은 의존성. **사유 코멘트가 의무다** | 배정된 역할 |

각 역할이 자기 카드를 옮긴다. 브랜치를 따면 In Progress, PR을 열면 In Review다.

### 보드가 스스로 하는 것

두 열은 손으로 옮기지 않는다. 프로젝트의 내장 workflow가 옮긴다.

| Workflow | 걸리는 때 | 하는 일 |
|----------|------------|---------|
| `Item closed` | Issue나 PR이 닫힐 때 | Status를 Done으로 |
| `Item added to project` | 카드가 보드에 올라올 때 | Status를 Backlog로 |

이 둘이 꺼지면 아무 경고 없이 멈춘다. 2026-08-22에 `Item closed`가 꺼진 채로 있던 것을 발견했고 그때 닫힌 Issue 23건의 카드가 Backlog와 In Progress에 그대로 앉아 있었다. 보드가 상태의 정본이라 그 값이 틀리면 Blocked 열을 훑는 일도 헛돈다.

토글은 저장소 밖에 있어서 git이 지키지 못한다. GraphQL에도 켜고 끄는 mutation이 없다 — `deleteProjectV2Workflow`만 있고 켜는 것은 웹에서만 된다. 상태가 궁금하면 켜짐 여부는 읽을 수 있다.

```
gh api graphql -f query='{ user(login:"tkyoun0421"){ projectV2(number:8){
  workflows(first:30){ nodes{ name enabled } } } } }'
```

카드가 통째로 밀린 것을 보면 이 둘부터 확인해라. 보드를 새로 만들었거나 설정이 초기화됐을 때 제일 먼저 꺼지는 자리다.

`Auto-add sub-issues to project`도 켜져 있다. Status를 만지지 않아 위 표에는 없다. 이것이 꺼지면 `[Slice]` sub-issue가 자동으로는 보드에 올라오지 않는다. 발행할 때 `gh project item-add`를 손수 돌리는 경로는 그대로 남는다. 위 명령이 셋을 다 보여 준다.

## 우선순위

우선순위는 라벨에 담지 않는다. 라벨 축 셋은 분류만 한다.

**Todo** 열의 위아래 순서가 곧 우선순위다. 위에 있을수록 먼저 간다. 슬라이스는 PM이, 나머지는 총괄이 그 열에 올리며 자리를 정한다. 급한 것이 생기면 카드를 Todo 위쪽으로 옮기지, 라벨을 새로 만들지 않는다.

Backlog에는 순서가 없다. 줄을 서는 것은 Todo로 올라온 뒤부터다.
