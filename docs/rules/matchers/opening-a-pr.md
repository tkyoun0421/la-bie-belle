---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101, #114, #130"
---

# Matcher: PR을 열 때

PR을 열 때, 또는 이미 열려 있는 PR에 수정을 push할 때 읽는다.

## 제목과 본문

제목은 `type(scope): 요약`이다. 본문은 `.github/PULL_REQUEST_TEMPLATE.md`를 따른다. 관련 Issue 번호(`Closes #N`, merge가 Issue를 자동으로 닫는다)와 변경 영향 — Domain, Spec, Arch — 을 담는다.

커밋 메시지 관례는 PR 수준에서만 강제한다. 작업 중에 만든 커밋은 자유다.

본문 문장은 `docs/rules/matchers/writing-korean.md`를 따른다. 리뷰의 문체 축이 PR 본문도 본다.

## 원장을 옮긴다

`.gates/` 아래 원장을 쓴 작업이면 PR을 열기 전에 `python3 scripts/gate-check.py --reverify`를 돌리고, **원장 전문을 PR 본문에 붙인다**. 요약이 아니라 `CHECK:`와 `EXPECT:`까지 그대로다.

로컬 파일은 추적되지 않아 브랜치와 함께 죽는다. PR 본문이 그 원장의 정본이고, 리뷰어가 `CHECK:`를 읽는 유일한 자리다. `docs/rules/matchers/gates.md`를 봐라.

미충족 gate가 남은 채로 PR을 열지 마라. 채울 수 없는 것은 `ABANDON:`에 사유를 달고, 그 줄도 본문에 함께 나른다.

## 열고 나서

보드 카드를 **In Review**로 옮기고 총괄 세션에 벨을 울린다. PR을 여는 것이 완료 보고이고, 벨은 신호일 뿐이다.

자기 PR은 자기가 리뷰하지 않는다.

## 수정을 push할 때

`critical`이나 `high` 발견의 수정은 새 PR이 아니라 **같은 PR**에 새 push로 간다. 그리고 다시 리뷰받는다. `docs/rules/matchers/review-failed.md`를 봐라.
