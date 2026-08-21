---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101"
---

# Matcher: 비밀 정보를 다룰 때

자격 증명이나 `.env*` 파일을 만질 때 읽는다.

**이 저장소는 공개다.**

비밀 정보는 `.env`와 `.env.local`에만 산다. `.env.example`은 자리표시자를 담는다 — 키 이름과 형태일 뿐 동작하는 값은 아니다.

`.githooks/pre-commit`이 트리 어디에 있든 `.env*`와 `.envrc`를 막는다. 유일한 예외는 `.env.example`이다.

리뷰에서 diff 안의 비밀 정보는 `critical` 발견이고 merge는 멈춘다.
