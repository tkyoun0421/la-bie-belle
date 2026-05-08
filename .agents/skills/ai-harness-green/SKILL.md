---
name: ai-harness-green
description: 이 프로젝트에서 AI 하네스 구현의 Green 단계만 수행할 때 사용한다. Red 단계에서 작성한 실패 테스트나 기록된 최소 조건을 기준으로 테스트를 통과시키는 가장 작은 구현을 해야 할 때 사용한다. 검증/리뷰/초안 PR은 수행하지 않는다.
---

# AI 하네스 Green

실패 테스트를 통과시키는 최소 구현만 수행한다.

## 선행 조건

다음 파일이 없으면 진행하지 말고 누락 파일을 보고한다.

- `.agents/runs/issue-{number}/task-spec.md`
- `.agents/runs/issue-{number}/plan.md`
- `.agents/runs/issue-{number}/implementation-notes.md`

`implementation-notes.md`에 Red 기록이 없으면 먼저 `ai-harness-red`를 요청하라고 안내한다.

## 절차

1. Red 기록에서 실패 테스트, 실행 명령, 의도한 실패 이유를 확인한다.
2. 테스트를 통과시키는 가장 작은 코드 또는 설정 변경을 한다.
3. Red 단계의 테스트를 다시 실행해 통과 여부를 확인한다.
4. 테스트가 통과하면 구조 개선은 하지 않고 멈춘다.
5. 변경 파일, 주요 결정, 계획에서 벗어난 점, 남은 리스크를 `implementation-notes.md`에 기록한다.
6. 구조 개선이 필요하면 다음 단계로 `ai-harness-refactor`를 요청하라고 안내한다.

## 테스트가 없었던 경우

Red 단계에서 테스트 불가 사유가 기록된 경우:

- 기록된 최소 조건만 만족하도록 구현한다.
- Verify 단계에서 확인해야 할 검증 항목을 `implementation-notes.md`에 남긴다.

## 산출물

- 최소 구현
- Red 테스트 통과 결과 또는 테스트 불가 조건 충족 기록
- `.agents/runs/issue-{number}/implementation-notes.md`의 Green 기록

## 금지

- 리팩토링을 하지 않는다. 구조 개선은 `ai-harness-refactor`에서만 수행한다.
- 전체 검증을 수행하지 않는다.
- 리뷰어 점수를 만들지 않는다.
- 초안 PR을 만들지 않는다.
