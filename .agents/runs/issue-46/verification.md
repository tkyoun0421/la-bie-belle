# 검증 기록

## 실행한 명령

```txt
rg -n "Included follow-ups|inbox_refs|included-in-pr|promoted-to-issue|deferred" .github\pull_request_template.md .agents\harness\inbox-policy.md .agents\skills\ai-harness-draft-pr\SKILL.md .agents\harness\agents\draft-pr.agent.md .agents\harness\workflows\issue-execution.workflow.md .agents\harness\schemas\run-state.schema.json
node .agents/harness/scripts/diagnose-status.mjs
git diff --stat
```

## 결과

- PR template에 `Included follow-ups` 섹션이 추가됐다.
- inbox policy에 `state.json.inbox_refs`와 PR 본문 연결 규칙이 추가됐다.
- draft-pr skill, draft-pr agent, issue workflow가 `included-in-pr` 항목을 `state.json.inbox_refs`와 PR 본문에 함께 기록하도록 설명한다.
- run-state schema가 `inbox_refs`를 `inbox-YYYY-MM-DD-NNN` 형식의 unique string 배열로 제한한다.
- `diagnose-status.mjs` 실행은 완료됐고 inbox unresolved count는 0이다.

## 완료 기준 매핑

- `state.json.inbox_refs` 사용 기준이 inbox policy와 schema에 문서화됐다.
- PR 본문 `Included follow-ups` 섹션이 생겼다.
- 포함/승격/보류 처리 결과와 inbox 제거 흐름이 draft-pr 관련 문서에 반영됐다.
- 자동화 구현 없이 PR 생성 단계의 수동 확인 체크리스트가 생겼다.

## 건너뛴 검증

- 없음.

## 남은 리스크

- PR 작성자가 수동으로 `Included follow-ups`를 채우는 방식이므로 자동 누락 방지는 아직 없다.
