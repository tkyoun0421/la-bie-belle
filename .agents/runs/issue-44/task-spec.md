# 작업 명세

## 목표

작업 중 생긴 inbox 항목을 PR과 GitHub Issue 흐름에서 일관되게 처리할 수 있도록 분류 기준과 종료 기준을 문서화한다.

## 범위

- inbox 항목 분류 기준 문서화: `in-scope`, `blocker`, `follow-up`, `candidate-issue`, `discarded`
- PR 생성 전 현재 이슈 관련 inbox 항목 처리 기준 문서화: `included-in-pr`, `promoted-to-issue`, `deferred`
- inbox 항목 종료 상태 문서화: `completed`
- PR 단위로 종료되는 inbox 항목과 장기 추적이 필요한 항목을 구분하는 기준 정리
- 기존 하네스 문서와 스킬 설명이 새 기준을 참조하도록 정합성 점검

## 제외 범위

- inbox 항목 자동 분류 구현
- GitHub Issue 자동 생성 로직 변경
- PR 생성 자동화 로직 변경
- dashboard/status/review 표시 기준 변경
- 기존 open issue의 라벨 또는 Project 필드 정리

## 관련 파일 또는 영역

- `.agents/inbox.md`
- `.agents/harness/workflows/issue-execution.workflow.md`
- `.agents/harness/agents/draft-pr.agent.md`
- `.agents/skills/ai-harness-capture/SKILL.md`
- `.agents/skills/ai-harness-draft-pr/SKILL.md`
- `.agents/skills/ai-harness-status/SKILL.md`
- 필요 시 새 하네스 운영 문서

## 검증 방법

- `rg`로 inbox 처리 용어가 문서 전반에서 일관되게 쓰이는지 확인한다.
- `node .agents/harness/scripts/diagnose-status.mjs`로 inbox 파싱이 깨지지 않는지 확인한다.
- 문서 변경 diff에서 자동화/구현 변경이 섞이지 않았는지 확인한다.

## 완료 기준

- 분류 상태와 처리 상태의 의미가 명확히 구분되어 문서화된다.
- PR 생성 전 현재 이슈 관련 inbox 항목을 완료, 승격, 보류 중 하나로 정리해야 한다는 기준이 명시된다.
- GitHub Issue로 승격되거나 PR에 포함 완료된 항목은 `.agents/inbox.md`에서 제거한다는 기준이 유지된다.
- 관련 스킬/워크플로우 문서의 표현이 새 기준과 충돌하지 않는다.

## 리스크

- 분류 상태와 처리 상태를 같은 축으로 섞으면 실제 PR 생성 시 판단이 모호해질 수 있다.
- 문서가 너무 상세하면 간단한 수시 작업 처리 비용이 커질 수 있다.
- 자동화 변경 없이 문서만 바꾸므로 이후 스크립트 개선 이슈와 범위를 혼동할 수 있다.
