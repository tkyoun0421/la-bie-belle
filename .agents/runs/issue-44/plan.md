# 구현 계획

## 가정

- 이 작업은 문서 정합성 개선이며 자동화 구현은 하지 않는다.
- 정책의 기준 문서는 `.agents/inbox.md` 규칙 또는 별도 하네스 문서에 두고, 스킬 문서는 그 기준을 참조하도록 정리한다.
- 기존 inbox 항목은 이미 GitHub Issue로 승격되어 현재 `.agents/inbox.md`에는 미해결 항목이 없다.

## 단계

1. 현재 inbox 관련 문서와 스킬에서 사용 중인 용어를 확인한다.
2. 분류 상태와 처리/종료 상태를 분리해 기준을 확정한다.
3. 기준 문서를 작성하거나 `.agents/inbox.md` Rules를 확장한다.
4. `ai-harness-capture`, `ai-harness-draft-pr`, `ai-harness-status`, issue execution workflow의 문구를 새 기준에 맞게 정리한다.
5. 변경 내용이 #44 범위를 넘지 않는지 확인한다.
6. `rg`와 `diagnose-status`로 문서 정합성과 inbox 파싱을 검증한다.

## 예상 변경 파일

- `.agents/inbox.md`
- `.agents/harness/workflows/issue-execution.workflow.md`
- `.agents/harness/agents/draft-pr.agent.md`
- `.agents/skills/ai-harness-capture/SKILL.md`
- `.agents/skills/ai-harness-draft-pr/SKILL.md`
- `.agents/skills/ai-harness-status/SKILL.md`
- 필요 시 `.agents/harness/inbox-policy.md`

## 열린 질문

- inbox 처리 기준을 `.agents/inbox.md` Rules에 직접 둘지, 별도 `.agents/harness/inbox-policy.md` 문서로 분리할지 결정해야 한다.
- `completed`를 inbox 파일에 체크 상태로 남길지, 완료/승격/보류 후 즉시 제거하고 run/PR/Issue 기록을 장기 기록으로 삼을지 결정해야 한다.
