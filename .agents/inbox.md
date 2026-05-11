# Inbox

## Open

- [ ] 2026-05-11 | id: inbox-2026-05-11-008 | manual | current issue: none | type: Harness | tag: candidate-issue | content: 작업 중 생긴 inbox 항목을 `in-scope`, `blocker`, `follow-up`, `candidate-issue`, `discarded`로 분류하고 PR 포함 기준을 문서화한다.
- [ ] 2026-05-11 | id: inbox-2026-05-11-009 | manual | current issue: none | type: Harness | tag: candidate-issue | content: PR 생성 전 현재 Issue 관련 inbox 항목을 `included-in-pr`, `promoted-to-issue`, `deferred` 중 하나로 정리하는 규칙을 추가한다.
- [ ] 2026-05-11 | id: inbox-2026-05-11-010 | manual | current issue: none | type: Harness | tag: candidate-issue | content: 하네스 평가와 이슈별 실행 결과가 실제 실행된 run만 평가 대상으로 삼도록 dashboard/status/review 표시 기준을 개선한다.
- [ ] 2026-05-11 | id: inbox-2026-05-11-011 | manual | current issue: none | type: Harness | tag: candidate-issue | content: `state.json.inbox_refs`와 PR 본문의 Included follow-ups 섹션을 연결해 같은 PR에 포함된 로컬 발견 작업을 추적한다.
- [ ] 2026-05-10 | id: inbox-2026-05-10-001 | auto | current issue: none | type: Product | tag: candidate-issue | content: 프로젝트 개발 스펙 정리 작업을 다음 세션에서 `product-prd`와 `ai-harness-plan` 흐름으로 분리해 진행한다.
- [ ] 2026-05-10 | id: inbox-2026-05-10-002 | auto | current issue: none | type: Design | tag: candidate-issue | content: 디자인 시스템 결정 작업을 다음 세션에서 별도 아이디어/계획 항목으로 분리해 진행한다.

## Rules

- Capture ad-hoc ideas, bugs, improvements, ops tasks, and harness tasks here without requiring a skill call.
- Give every item a stable `id: inbox-YYYY-MM-DD-NNN` field so run state can reference it.
- Keep only unresolved items in this file.
- If an item directly blocks the current issue's completion criteria, reflect it in the current issue artifacts instead of leaving it only in the inbox.
- Mark related follow-up work as `related`.
- Mark separate feature, ops, or improvement work as `candidate-issue`.
- Create a GitHub Issue only when the user explicitly asks or triage decides to promote the item.
- Before creating a PR, check current-issue inbox items and resolve them as completed, promoted, or explicitly deferred.
- Remove items after they are reflected, resolved, or promoted to a GitHub Issue.
- Before automatic removal based on AI judgment, report it in one line.
