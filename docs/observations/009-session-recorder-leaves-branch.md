---
status: open
target: .claude/agents/session-recorder.md
date: 2026-09-07
resolved:
---

# 회차 마감이 작업 브랜치를 체크아웃한 채 끝난다

## 일

회차 마감 두 번(#249, #254) 다 session-recorder가 PR을 열고 나서 워킹 트리를 자기 작업 브랜치(`docs/session-close-2026-09-06`, `docs/session-2026-09-07-record`)에 둔 채 끝냈다. 다음에 총괄이 `git pull`을 치면 「no such ref was fetched」가 나고, main 복귀·브랜치 삭제를 매번 손으로 한다. merge 뒤 로컬 정리가 총괄 턴으로 새는 구조다.

## 고침

session-recorder 정의문의 마무리 절차에 한 줄을 더한다: PR을 연 뒤 `git checkout main`으로 워킹 트리를 되돌리고 끝낸다. 로컬 작업 브랜치 삭제는 merge 뒤에나 가능하니 총괄 몫으로 남는다 — 되돌리기만 정의문에 박는다.

## 원칙

워킹 트리를 빌려 쓰는 에이전트는 빌리기 전 상태로 되돌려 놓고 끝낸다.
