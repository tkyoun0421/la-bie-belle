---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101"
---

# Matcher: PR을 열 때

PR을 열 때, 또는 이미 열려 있는 PR에 수정을 push할 때 읽는다.

## 제목과 본문

제목은 `type(scope): 요약`이다. 본문은 `.github/PULL_REQUEST_TEMPLATE.md`를 따른다. 관련 Issue 번호(`Closes #N`, merge가 Issue를 자동으로 닫는다)와 변경 영향 — Domain, Spec, Arch — 을 담는다.

커밋 메시지 관례는 PR 수준에서만 강제한다. 작업 중에 만든 커밋은 자유다.

## 열고 나서

보드 카드를 **In Review**로 옮기고 총괄 세션에 벨을 울린다. PR을 여는 것이 완료 보고이고, 벨은 신호일 뿐이다.

자기 PR은 자기가 리뷰하지 않는다.

## 수정을 push할 때

`critical`이나 `high` 발견의 수정은 새 PR이 아니라 **같은 PR**에 새 push로 간다. 그리고 다시 리뷰받는다. `docs/rules/matchers/review-failed.md`를 봐라.
