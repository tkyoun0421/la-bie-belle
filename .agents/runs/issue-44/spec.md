# 기능 상세 스펙

## 사용자 시나리오

- 작업자가 이슈 수행 중 새로 떠오른 작업을 발견하면 `.agents/inbox.md`에 임시로 캡처한다.
- 작업자가 PR을 만들기 전 현재 이슈와 관련된 inbox 항목을 확인하고, PR 포함, 별도 이슈 승격, 명시적 보류 중 하나로 정리한다.
- 상태 진단자는 `.agents/inbox.md`를 active queue로 보고 unresolved 항목만 다음 작업 후보나 차단 항목으로 판단한다.

## 정상 흐름

- inbox 처리 기준은 `.agents/harness/inbox-policy.md`에 둔다.
- `.agents/inbox.md`의 Rules는 상세 정책을 반복하지 않고 정책 문서를 참조한다.
- 새 inbox 항목은 처음 캡처될 때 `in-scope`, `blocker`, `follow-up`, `candidate-issue`, `discarded` 중 하나의 성격으로 판단할 수 있어야 한다.
- PR 생성 전 현재 이슈 관련 항목은 `included-in-pr`, `promoted-to-issue`, `deferred` 중 하나로 처리한다.
- 완료, 승격, 보류, 폐기된 항목은 `.agents/inbox.md`에서 제거하고 장기 기록은 run 산출물, PR 본문, GitHub Issue에 남긴다.

## 엣지케이스

- 한 항목이 현재 PR에도 일부 포함되고 후속 작업도 필요한 경우, 현재 PR 포함분은 `included-in-pr`로 기록하고 남은 범위는 별도 GitHub Issue로 승격한다.
- 현재 이슈 완료 기준을 직접 막는 항목은 `blocker`로 보고 현재 이슈 산출물에 반영한다.
- 구현 중 떠오른 별도 기능/운영 개선은 `candidate-issue`로 남기고 triage 전 구현하지 않는다.
- 단순 메모, 중복, 범위 밖 아이디어는 `discarded` 사유를 기록한 뒤 inbox에서 제거할 수 있다.

## 에러 상태

- inbox 항목에 stable id가 없으면 장기 기록에서 추적할 수 없으므로 보정 대상이다.
- 현재 이슈 관련 항목이 PR 생성 전 처리되지 않으면 PR 생성 단계의 차단 조건이다.
- GitHub Issue로 승격되었는데 inbox에 남아 있으면 active queue 중복으로 본다.

## 빈 상태

- `.agents/inbox.md`의 `## Open` 아래 항목이 없어도 정상 상태다.
- unresolved 항목이 0개이면 status 진단은 inbox 차단 또는 후보가 없다고 보고한다.

## 로딩 상태

- 해당 없음. 문서 운영 정책이며 UI 로딩 상태를 다루지 않는다.

## 권한과 인증 조건

- GitHub Issue 생성이나 PR 작성은 인증된 `gh` 권한이 필요하다.
- inbox 정책 문서와 run 산출물 수정은 로컬 저장소 쓰기 권한이 필요하다.

## 입력 검증

- inbox 항목은 `id: inbox-YYYY-MM-DD-NNN`, `current issue`, `type`, `tag`, `content`를 포함해야 한다.
- `current issue`는 특정 이슈 번호 또는 `none`으로 기록한다.
- `tag`는 현재 정책에서 정의한 분류 또는 처리 상태와 충돌하지 않아야 한다.

## 데이터 규칙

- `.agents/inbox.md`는 unresolved active queue다.
- `completed`는 `.agents/inbox.md`에 장기 보관하는 체크 상태가 아니라, 제거 전에 run/PR/Issue에 남기는 종료 처리 의미다.
- `included-in-pr`, `promoted-to-issue`, `deferred`는 PR 전 처리 결과다.
- `in-scope`, `blocker`, `follow-up`, `candidate-issue`, `discarded`는 항목 성격을 판단하는 분류다.

## UI 동작

- 해당 없음. UI 변경을 포함하지 않는다.

## API 또는 모듈 계약

- 자동화 코드 계약 변경은 없다.
- `diagnose-status.mjs`가 기존 `.agents/inbox.md` 형식을 계속 파싱할 수 있어야 한다.

## 테스트 케이스

- `.agents/harness/inbox-policy.md`가 존재하고 필수 분류/처리 상태를 모두 설명한다.
- `.agents/inbox.md`가 정책 문서를 참조하고 active queue 원칙을 유지한다.
- draft-pr 관련 문서가 PR 전 inbox 항목을 `included-in-pr`, `promoted-to-issue`, `deferred` 중 하나로 처리해야 한다고 설명한다.
- capture/status 관련 문서가 승격된 항목 제거와 unresolved active queue 원칙을 유지한다.
- `diagnose-status.mjs` 실행 결과가 inbox 파싱 오류 없이 반환된다.

## Red 단계 우선순위

1. `rg`로 `.agents/harness/inbox-policy.md`가 없고 필수 용어가 중앙 정책 문서에 정의되지 않았음을 확인한다.
2. `rg`로 `.agents/inbox.md`가 별도 정책 문서를 참조하지 않음을 확인한다.
3. `rg`로 PR 전 처리 상태 `included-in-pr|promoted-to-issue|deferred`가 draft-pr 문서에 충분히 반영되지 않았음을 확인한다.
