# 구현 기록

## 변경 파일

- `.agents/harness/inbox-policy.md`
- `.agents/inbox.md`
- `.agents/harness/workflows/issue-execution.workflow.md`
- `.agents/harness/agents/draft-pr.agent.md`
- `.agents/skills/ai-harness-draft-pr/SKILL.md`
- `.agents/skills/ai-harness-capture/SKILL.md`
- `.agents/skills/ai-harness-status/SKILL.md`

## 주요 결정

- inbox 처리 기준은 별도 `.agents/harness/inbox-policy.md` 문서에 둔다.
- `.agents/inbox.md`는 unresolved active queue로 유지한다.
- 완료/승격/보류/폐기된 항목은 inbox에서 제거하고 장기 기록은 run 산출물, PR 본문, GitHub Issue에 남긴다.
- PR 전 현재 이슈 관련 inbox 항목은 `included-in-pr`, `promoted-to-issue`, `deferred` 중 하나로 정리한다.

## 계획에서 달라진 점

- 없음.

## 알려진 리스크

- 자동 분류나 PR 생성 자동화는 구현하지 않았으므로, 실제 준수 여부는 각 스킬 실행 시 확인해야 한다.
