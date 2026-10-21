---
status: open
target: .claude/agents/test-planner.md
date: 2026-10-21
resolved:
---

**일**: DB 열 이름(snake_case)을 문자열에 직접 넣는 필터 함수를 `utils`에 두는 테스트가 먼저 세워졌다(`wageRateCursor`, #628). 구현 쪽에서 `house/dto-segment`와 `house/no-snake-case-field`가 `utils`의 그 함수를 막아, 테스트를 `api/__tests__/`로 옮기고 구현을 `api/`에 두는 한 라운드가 더 들었다.

**고침**: 아직 없다. 이번에는 구현 단계에서 테스트 경로만 옮겨 해소했다.

**원칙**: DB 열 이름을 다루는 함수는 `api/`나 `*.mapper.ts`에 속한다. test-planner가 배정할 때 이 가름을 알면 한 라운드가 안 든다. 같은 배정이 더 나오면 정의문에 한 줄로 넣을지 정한다.
