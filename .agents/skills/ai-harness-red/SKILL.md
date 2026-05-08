---
name: ai-harness-red
description: 이 프로젝트에서 AI 하네스 구현의 Red 단계만 수행할 때 사용한다. spec.md의 테스트 케이스와 Red 단계 우선순위를 기준으로 실패 테스트를 작성하고, 그 테스트가 의도한 이유로 실패하는지 확인해야 할 때 사용한다. 기능 구현, Green 단계, 검증, 리뷰는 수행하지 않는다.
---

# AI 하네스 Red

실패 테스트 작성과 실패 확인만 수행한다.

## 선행 조건

다음 파일이 없으면 진행하지 말고 누락 파일을 보고한다.

- `.agents/runs/issue-{number}/task-spec.md`
- `.agents/runs/issue-{number}/plan.md`
- `.agents/runs/issue-{number}/spec.md`

## 절차

1. `task-spec.md`, `plan.md`, `spec.md`를 읽고 완료 기준과 테스트 가능한 동작을 찾는다.
2. 기존 테스트 구조와 명령을 확인한다.
3. 가능한 가장 작은 실패 테스트를 작성한다.
4. 테스트를 실행해 의도한 이유로 실패하는지 확인한다.
5. 실패 결과, 실행 명령, 테스트 파일, 의도한 실패 이유를 `implementation-notes.md`에 기록한다.

## 테스트를 만들 수 없는 경우

테스트 인프라가 없거나 문서/설정 작업이라 실패 테스트가 부적절하면 구현하지 말고 다음을 기록한다.

- 테스트를 만들 수 없는 이유
- 대신 Green 단계에서 확인해야 할 최소 조건
- Verify 단계에서 반드시 실행해야 할 검증

## 산출물

- 실패 테스트 또는 테스트 불가 사유
- `.agents/runs/issue-{number}/implementation-notes.md`의 Red 기록

## 금지

- 실패 테스트를 통과시키는 구현을 하지 않는다.
- 리팩터링하지 않는다.
- 검증 단계 전체를 수행하지 않는다.
- 리뷰어 점수를 만들지 않는다.
