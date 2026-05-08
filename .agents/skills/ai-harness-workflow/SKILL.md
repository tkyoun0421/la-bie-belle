---
name: ai-harness-workflow
description: 이 프로젝트의 AI 하네스 스킬 구조를 파악하거나 어떤 세부 스킬을 써야 하는지 고를 때 사용한다. 맨 처음 다음 할 일을 정할 때는 ai-harness-idea를 사용하고, 선택된 큰 아이디어를 이슈 초안으로 나눌 때는 ai-harness-plan을 사용한다. 생성된 이슈를 상세 구현 스펙으로 구체화할 때는 ai-harness-spec을 사용한다. 실제 구현, 검증, 리뷰, 대시보드, 하네스 평가, 초안 PR 작업은 각 세부 스킬을 직접 사용한다.
---

# AI 하네스 스킬 안내

이 스킬은 실행용이 아니라 안내용이다. 실제 작업은 아래 세부 스킬을 직접 호출한다.

## 이슈 생성 원칙

새 GitHub Issue를 만들기 전에는 `ai-harness-idea`로 다음 할 일을 정하고, `ai-harness-plan`으로 이슈 초안을 만든 뒤 사용자 승인을 받아야 한다. 승인 없이 이슈를 생성하지 않는다.

## 스킬 선택

- 아이디어 정리: `ai-harness-idea`
- 계획과 이슈 초안: `ai-harness-plan`
- 상세 스펙 작성: `ai-harness-spec`
- 구현 안내: `ai-harness-implement`
- 실패 테스트 작성: `ai-harness-red`
- 최소 구현: `ai-harness-green`
- 리팩토링: `ai-harness-refactor`
- 검증: `ai-harness-verify`
- 리뷰: `ai-harness-review`
- 현재 상태 확인: `ai-harness-status`
- 대시보드 갱신: `ai-harness-dashboard`
- 하네스 건강도 평가: `ai-harness-evaluate`
- 초안 PR 생성: `ai-harness-draft-pr`

요청이 모호하면 세부 스킬 중 무엇을 호출해야 하는지 한 가지 질문한다.

## 참조

하네스 파일 지도와 관련 문서는 `references/harness-map.md`를 필요할 때만 읽는다.
