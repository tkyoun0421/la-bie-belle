# 기능 상세 스펙

## 사용자 시나리오

- 작업자가 이슈 수행 중 현재 PR에 같이 포함할 작은 follow-up을 발견한다.
- 작업자는 해당 inbox id를 `state.json.inbox_refs`에 남기고, 구현/검증/리뷰 산출물에 처리 결과를 기록한다.
- PR 생성자는 PR 본문의 `Included follow-ups` 섹션에 같은 PR에 포함된 inbox 항목과 처리 결과를 남긴다.
- 상태 진단자는 `inbox_refs`와 PR 본문을 보고 어떤 로컬 발견 작업이 같은 PR에 포함됐는지 추적한다.

## 정상 흐름

- `included-in-pr` 항목은 `state.json.inbox_refs`에 id를 추가한다.
- PR 본문 `Included follow-ups`에는 id, 처리 결과, 근거 위치를 적는다.
- `promoted-to-issue` 항목은 새 GitHub Issue 번호를 PR 본문 추가 작업 처리 영역에 남긴다.
- `deferred` 항목은 보류 사유와 후속 확인 위치를 PR 본문 또는 run 산출물에 남긴다.
- 처리된 항목은 장기 기록을 남긴 뒤 `.agents/inbox.md`에서 제거한다.

## 엣지케이스

- 하나의 inbox 항목 일부만 현재 PR에 포함되면 포함된 범위는 `included-in-pr`, 남은 범위는 `promoted-to-issue` 또는 `deferred`로 분리해 기록한다.
- 현재 PR에 포함된 follow-up이 없으면 PR 본문 `Included follow-ups`에 `없음`을 명시한다.
- `state.json.inbox_refs`에는 id만 저장하고, 자세한 설명은 PR 본문과 run 산출물에 둔다.

## 에러 상태

- `state.json.inbox_refs`에 없는 id가 PR 본문 `Included follow-ups`에만 있으면 추적 불일치다.
- PR에 포함된 follow-up이 있는데 `.agents/inbox.md`에 그대로 남아 있으면 active queue 중복이다.
- `promoted-to-issue` 항목이 새 Issue 번호 없이 제거되면 장기 추적 근거가 부족하다.

## 빈 상태

- 현재 PR에 포함된 follow-up이 없을 수 있다.
- 이 경우 `state.json.inbox_refs`는 빈 배열이고 PR 본문 `Included follow-ups`는 `없음`으로 둔다.

## 로딩 상태

- 해당 없음. 문서/스킬 규칙 변경이다.

## 권한과 인증 조건

- 로컬 문서와 run 산출물 수정 권한이 필요하다.
- PR 본문 갱신과 GitHub Issue 승격은 GitHub 권한이 필요하다.

## 입력 검증

- `inbox_refs` 항목은 `inbox-YYYY-MM-DD-NNN` 형식이어야 한다.
- PR 본문에 포함되는 follow-up id는 `state.json.inbox_refs` 또는 해당 run 산출물에서 확인 가능해야 한다.

## 데이터 규칙

- `state.json.inbox_refs`: 현재 PR에 포함됐거나 현재 PR 처리 결과와 연결된 inbox id 목록이다.
- `included-in-pr`: 같은 PR에 포함된 작업이며 `inbox_refs`와 PR 본문 `Included follow-ups`에 기록한다.
- `promoted-to-issue`: 별도 GitHub Issue로 승격된 작업이며 PR 본문 추가 작업 처리에 issue 번호를 기록한다.
- `deferred`: 보류된 작업이며 PR 본문 또는 run 산출물에 보류 사유를 기록한다.

## UI 동작

- 해당 없음. PR template의 markdown 섹션만 추가한다.

## API 또는 모듈 계약

- 자동화 코드 계약 변경은 없다.
- `run-state.schema.json`은 `inbox_refs` item pattern을 문서화하고 검증한다.

## 테스트 케이스

- PR template에 `Included follow-ups` 섹션이 존재한다.
- draft-pr 스킬과 PR agent가 `inbox_refs`와 PR 본문 섹션 작성 규칙을 설명한다.
- inbox policy가 `included-in-pr`, `promoted-to-issue`, `deferred`와 `inbox_refs` 관계를 설명한다.
- run-state schema가 `inbox_refs`를 inbox id 형식 배열로 제한한다.
- `diagnose-status.mjs`가 issue-46 run을 파싱한다.

## Red 단계 우선순위

1. `rg "Included follow-ups" .github .agents`가 결과를 찾지 못해 PR 본문 추적 섹션이 없음을 확인한다.
2. `run-state.schema.json`의 `inbox_refs`가 단순 string 배열이라 id 형식과 의미를 강제하지 않음을 확인한다.
3. draft-pr 스킬이 `inbox_refs`와 PR 본문 연결을 설명하지 않음을 확인한다.
