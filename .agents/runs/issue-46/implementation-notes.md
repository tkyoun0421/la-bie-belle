# 구현 기록

## 변경 파일

- `.agents/harness/inbox-policy.md`
- `.agents/skills/ai-harness-draft-pr/SKILL.md`
- `.agents/harness/agents/draft-pr.agent.md`
- `.agents/harness/workflows/issue-execution.workflow.md`
- `.agents/harness/schemas/run-state.schema.json`
- `.github/pull_request_template.md`

## 주요 결정

- 자동 PR 본문 생성은 구현하지 않고, PR 생성 스킬에서 수동 확인/작성하는 규칙으로 확정했다.
- `state.json.inbox_refs`는 현재 PR에 포함되거나 직접 연결된 stable inbox id 목록으로 사용한다.
- 상세 처리 결과는 `Included follow-ups` PR 섹션과 run 산출물에 남긴다.
- 포함된 follow-up이 없더라도 PR 본문에는 `없음`을 명시한다.

## 계획에서 달라진 점

- 없음.

## 알려진 리스크

- 자동화가 아니므로 PR 작성자가 `Included follow-ups` 섹션을 누락할 수 있다.
- `inbox_refs`에는 id만 남기므로 설명과 검증 근거는 PR 본문과 산출물에 함께 남겨야 한다.
