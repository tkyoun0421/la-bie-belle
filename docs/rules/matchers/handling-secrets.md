---
owner: "@orchestrator"
status: "active"
related_adr: ""
related_issue: "#69, #101, #111, #112"
---

# Matcher: 비밀 정보를 다룰 때

자격 증명이나 `.env*` 파일을 만질 때 읽는다.

**이 저장소는 공개다.**

비밀 정보는 `.env`와 `.env.local`에만 산다. `.env.example`은 자리표시자를 담는다 — 키 이름과 형태일 뿐 동작하는 값은 아니다.

`.githooks/pre-commit`과 CI가 트리 어디에 있든 `.env*`와 `.envrc`를 막는다. 유일한 예외는 `.env.example`이다. 판정은 `scripts/secrets-check.py` 한 자리에 있다.

한 번이라도 저장소에 닿은 키는 폐기하고 새로 발급해라. 저장소가 공개라 지운 커밋도 SHA로 읽힌다. 검사가 잡았다는 것은 merge를 막았다는 뜻이지 그 값이 안전해졌다는 뜻이 아니다.

리뷰에서 diff 안의 비밀 정보는 `critical` 발견이고 merge는 멈춘다.
