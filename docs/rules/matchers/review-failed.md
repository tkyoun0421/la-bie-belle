---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101"
---

# Matcher: 리뷰가 FAIL일 때

리뷰가 FAIL로 돌아왔거나 수정 지시를 받았을 때 읽는다.

## 총괄

merge를 멈춘다. `critical`이나 `high` 발견 하나가 merge를 막는다.

1. PR에 코멘트로 고칠 항목을 적는다. 이 코멘트가 지시다 — 터미널로만 전달된 지시는 일어나지 않은 것이다.
2. 작성한 역할의 세션에 벨을 울린다.

받는 쪽은 언제나 그 PR을 쓴 역할이다 — `pm/` PR은 PM에게, `ui/` PR은 UI에게 간다.

`normal` 발견은 수정 지시가 아니다. merge한 다음 `[Ticket]` Issue를 연다.

## 작성한 역할

같은 브랜치에서 고쳐 **같은 PR**에 push하고 재리뷰를 요청한다. `critical`·`high` 수정은 절대 새 PR로 가지 않는다.
