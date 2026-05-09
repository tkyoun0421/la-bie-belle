---
name: ai-harness-implement
description: 이 프로젝트에서 AI 하네스 구현 단계의 세부 스킬을 고를 때 사용한다. 실제 구현 작업은 ai-harness-red 또는 ai-harness-green을 직접 사용하며, 이 스킬은 Red/Green 중 다음에 필요한 단계를 안내할 때 사용한다.
---

# AI 하네스 구현

이 스킬은 실행용이 아니라 구현 단계 안내용이다. 실제 작업은 아래 스킬을 직접 사용한다.

## 스킬 선택

- 실패 테스트 작성과 실패 확인: `ai-harness-red`
- 최소 구현과 테스트 통과 확인: `ai-harness-green`

## 순서

1. `ai-harness-red`
   - 실패 테스트를 작성한다.
   - 테스트가 의도한 이유로 실패하는지 확인한다.
   - Red 기록을 `implementation-notes.md`에 남긴다.

2. `ai-harness-green`
   - Red 기록을 기준으로 가장 작은 구현을 한다.
   - Red 테스트를 통과시킨다.
   - Green 기록을 `implementation-notes.md`에 남긴다.

요청이 모호하면 Red와 Green 중 어느 단계를 원하는지 한 가지 질문한다.

## 금지

- 이 스킬 자체로 테스트나 코드를 수정하지 않는다.
- 검증 단계 전체를 수행하지 않는다.
- 리뷰어 점수를 만들지 않는다.
- PR을 만들지 않는다.
