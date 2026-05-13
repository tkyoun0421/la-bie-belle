# 작업 명세

## 목표

같은 PR에 포함된 로컬 발견 작업을 `state.json.inbox_refs`, run 산출물, PR 본문에서 일관되게 추적하도록 기준을 정한다.

## 범위

- `state.json.inbox_refs` 사용 기준 정의
- PR 본문에 `Included follow-ups` 섹션을 추가하는 규칙 정의
- `included-in-pr`, `promoted-to-issue`, `deferred` 처리 결과와 `inbox_refs`의 관계 정리
- draft-pr 스킬과 PR agent가 해당 기준을 따르도록 문서 갱신
- PR template에 관련 섹션 추가

## 제외 범위

- 자동 PR 본문 생성 코드 구현
- inbox 항목 자동 분류 구현
- GitHub Issue 자동 생성 로직 변경
- dashboard UI 변경
- 제품 코드 변경

## 관련 파일 또는 영역

- `.agents/harness/inbox-policy.md`
- `.agents/skills/ai-harness-draft-pr/SKILL.md`
- `.agents/harness/agents/draft-pr.agent.md`
- `.agents/harness/workflows/issue-execution.workflow.md`
- `.agents/harness/schemas/run-state.schema.json`
- `.github/pull_request_template.md`
- `.agents/runs/issue-46/*`

## 검증 방법

- `rg`로 `Included follow-ups`, `inbox_refs`, `included-in-pr`, `promoted-to-issue`, `deferred` 규칙이 관련 문서에 반영됐는지 확인한다.
- PR template이 템플릿 섹션을 유지하면서 included follow-ups 기록 위치를 제공하는지 확인한다.
- `diagnose-status.mjs`로 run 상태 파싱이 깨지지 않는지 확인한다.

## 완료 기준

- `state.json.inbox_refs`가 현재 PR과 연결된 inbox id 추적용이라는 기준이 문서화된다.
- PR 본문에 같은 PR에 포함된 follow-up을 기록할 섹션이 생긴다.
- 포함/승격/보류된 inbox 항목이 중복으로 `.agents/inbox.md`에 남지 않는 종료 흐름이 명시된다.
- 자동화 구현 없이도 PR 생성 단계에서 수동 확인할 수 있는 체크리스트가 있다.

## 리스크

- 자동화가 아니므로 PR 작성자가 섹션을 누락할 수 있다.
- `inbox_refs`에 id만 남기면 세부 결과는 PR 본문이나 run 산출물에 함께 기록해야 한다.
