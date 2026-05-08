---
name: ai-harness-refactor
description: 이 프로젝트에서 AI 하네스 리팩토링 단계만 수행할 때 사용한다. Green 이후 테스트가 통과하는 상태에서 동작 변경 없이 중복 제거, 이름 정리, 구조 개선을 수행하고 전후 테스트 결과를 implementation-notes.md에 기록해야 할 때 사용한다. 기능 추가, 테스트 의미 변경, 검증/리뷰는 수행하지 않는다.
---

# AI 하네스 리팩토링

Green 이후 조건부로 실행한다. 동작은 바꾸지 않고 구조만 개선한다.

## 선행 조건

다음 파일이 없으면 진행하지 말고 누락 파일을 보고한다.

- `.agents/runs/issue-{number}/task-spec.md`
- `.agents/runs/issue-{number}/plan.md`
- `.agents/runs/issue-{number}/spec.md`
- `.agents/runs/issue-{number}/implementation-notes.md`

`implementation-notes.md`에 Green 통과 기록이 없으면 먼저 `ai-harness-green`을 요청하라고 안내한다.

## 실행 조건

다음 중 하나가 있으면 실행한다.

- 중복 코드
- 불명확한 이름
- 과도하게 긴 함수나 컴포넌트
- 테스트는 통과하지만 구조가 이해하기 어려운 구현
- 기존 프로젝트 패턴과 맞지 않는 구조

리팩토링할 이유가 없으면 실행하지 말고 `implementation-notes.md`에 생략 사유만 기록한다.

## 절차

1. Green 이후 테스트가 통과하는지 확인한다.
2. 리팩토링 대상을 작게 고른다.
3. 동작 변경 없이 구조만 개선한다.
4. Green 단계 테스트를 다시 실행한다.
5. 변경 이유, 변경 파일, 전후 테스트 결과, 남은 리스크를 `implementation-notes.md`에 기록한다.

## 산출물

- 동작 변경 없는 구조 개선
- 리팩토링 생략 사유 또는 수행 기록
- `.agents/runs/issue-{number}/implementation-notes.md`의 Refactor 기록

## 금지

- 새 기능을 추가하지 않는다.
- 테스트 기대값을 바꾸지 않는다.
- 계획 범위 밖 리팩토링을 하지 않는다.
- 전체 검증을 수행하지 않는다.
- 리뷰어 점수를 만들지 않는다.
