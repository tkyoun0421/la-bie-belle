---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #68, #101, #90, #91"
---

# Matcher: 문서를 쓸 때

`docs/` 아래를 만들거나 고칠 때마다 읽는다.

세션에서 문서 작업을 이끄는 에이전트는 `/doc` 스킬을 쓴다. 그 스킬이 절차를 끝까지 돌린다 — 소유권 확인, 브랜치, 템플릿, 발행이다. 그 스킬이 붙이는 subagent는 아래 규칙을 직접 따르고 스킬로 되돌아오지 않는다.

## 템플릿

`docs/templates/`에서 시작한다. 빈 파일에서 시작하지 않는다.

어느 종류가 어느 경로와 템플릿을 쓰는지, 그리고 어느 stage 스킬이 받는지는 `config/documents.json`에 있다. 외워서 쓰지 말고 그 파일을 읽어라 — 소유 registry와 같은 패턴이며, 산문에 둔 두 번째 사본이 먼저 어긋나는 사본이다.

소유는 그 파일에 없다. 경로를 `config/ownership.json`에 대서 정한다. registry 둘이 같은 사실을 적으면 둘이 갈린다.

## 절차

세 걸음이고 문서 종류와 무관하게 같다. 종류마다 다른 것은 걸음이 아니라 각 걸음에서 무엇을 모으고 무엇을 쓰느냐다. 그건 stage 스킬이 갖는다.

**모으기.** 기댈 상류가 있는 종류는 라우터가 `docs-locator`를 돌려 인용을 함께 넘긴다. 같은 자리를 다시 뒤지지 마라. 인용 없이 도착했는데 기댈 상류가 있다면 — 라우터가 판단을 달리했거나 네가 새 상류를 찾은 것이다 — 그때는 네가 `docs-locator`를 붙여라. 대화에도 저장소에도 답이 없는 결정이 남아 있으면 `interview` 스킬을 부르면서 받은 인용을 그대로 넘겨라. 안 넘기면 인터뷰가 같은 검색을 다시 돈다.

**쓰기.** `docs-generator`를 붙이고 템플릿 경로, 대상 경로, 모은 것 전부를 넘겨라. 그 에이전트가 절을 채운다. 경로와 템플릿은 `config/documents.json`에서 읽는다.

**발행.** `gh-pr-generator`를 붙인다. 짝이 되는 Issue가 함께 나는 종류는 `gh-issue-generator`가 먼저다 — Issue 번호가 있어야 PR 본문이 그것을 참조한다.

## Front matter

모든 문서는 같은 네 필드로 시작한다. 문서를 손댈 때마다 함께 갱신한다.

```yaml
---
owner: "@agent-pm"
status: "active"
related_adr: "ADR-001"
related_issue: "#42"
---
```

`status`는 문서에 따라 어휘 둘 중 하나를 쓴다. 결정 기록 — ADR과 TDR — 은 `proposed` → `accepted` → `superseded`를 쓰고, 나머지는 전부 `draft` → `active` → `superseded`를 쓴다. 둘 다 한 방향으로만 흐른다.

`related_issue`는 Issue 번호를 쉼표로 나열한 문자열이다. 없으면 빈 문자열이다.

```yaml
related_issue: ""
related_issue: "#69"
related_issue: "#69, #88"
```

문서 하나가 Issue 여럿을 거치는 것은 예외가 아니라 정상이다. 문서를 손대면 그 작업의 Issue를 뒤에 덧붙이고, 앞 값은 지우지 않는다.

수정 날짜도 버전 번호도 쓰지 않는다. 정본은 git이다: `git log -1 --format=%as -- <file>`.

## 정본은 하나다

명세의 유일한 정본은 `docs/specs/` 아래의 파일이다. Issue 본문은 요약과 링크를 담을 뿐 상세를 복사하지 않는다. 정정은 파일로 간다.

## 결정 기록

제품·도메인 결정은 ADR이고 기술 결정은 TDR이다. 경로는 `config/documents.json`의 `adr`·`tdr` 항목이, 소유는 그 경로로 본 `config/ownership.json`이 갖는다.

둘 다 **append-only**다. 대체는 옛 기록을 지우지 않는다. 옛 기록의 `status`를 `superseded`로 바꾸고 그것을 대신하는 기록의 이름을 적을 뿐이다.

둘 다 같은 템플릿을 쓴다.

```
맥락 / 결정 / 검토한 대안 / 트레이드오프
```

## 백지 원칙

`snapshot/2026-08-20-pre-reset` 브랜치의 이전 프로젝트 산출물은 절대 참조하지 않는다.
