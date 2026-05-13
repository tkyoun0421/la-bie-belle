# 구현 계획

## 가정

- 이번 이슈는 자동화 구현이 아니라 PR 생성 스킬의 수동 확인 규칙과 템플릿 정리다.
- `state.json.inbox_refs`는 상세 본문 저장소가 아니라 추적 가능한 inbox id 목록이다.
- 처리 결과의 장기 설명은 PR 본문, GitHub Issue, run 산출물에 남긴다.

## 단계

1. 현재 inbox 정책, PR 템플릿, draft-pr 스킬, run-state schema에서 `inbox_refs`와 follow-up 기록 상태를 확인한다.
2. Red 단계로 `Included follow-ups` 섹션과 `inbox_refs` 사용 규칙이 없음을 기록한다.
3. inbox policy에 `inbox_refs`와 PR 본문 연결 규칙을 추가한다.
4. PR template에 `Included follow-ups` 섹션을 추가한다.
5. draft-pr 스킬/agent/workflow에 PR 생성 전 `inbox_refs`와 섹션 작성 규칙을 반영한다.
6. run-state schema에 `inbox_refs` 설명과 id 패턴을 보강한다.
7. `rg`와 `diagnose-status`로 문서 정합성을 검증한다.
8. review score와 review 산출물을 작성한다.

## 예상 변경 파일

- `.agents/harness/inbox-policy.md`
- `.agents/skills/ai-harness-draft-pr/SKILL.md`
- `.agents/harness/agents/draft-pr.agent.md`
- `.agents/harness/workflows/issue-execution.workflow.md`
- `.agents/harness/schemas/run-state.schema.json`
- `.github/pull_request_template.md`
- `.agents/runs/issue-46/task-spec.md`
- `.agents/runs/issue-46/plan.md`
- `.agents/runs/issue-46/spec.md`
- `.agents/runs/issue-46/implementation-notes.md`
- `.agents/runs/issue-46/verification.md`
- `.agents/runs/issue-46/review-score.json`
- `.agents/runs/issue-46/review.md`
- `.agents/runs/issue-46/state.json`
- `.agents/runs/issue-46/run-record.json`

## 열린 질문

- PR 생성 스킬이 자동으로 섹션을 채울지, 리뷰/검증 산출물을 통해 수동 확인할지 결정해야 한다. 이번 작업에서는 자동화 없이 PR 생성 스킬의 수동 확인 규칙으로 확정한다.
