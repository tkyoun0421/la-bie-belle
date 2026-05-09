# 프로젝트 헌법

이 문서는 이 프로젝트에서 AI 에이전트가 작업할 때 지켜야 할 기준이다.

## 언어

- 문서, 이슈, PR 설명, 하네스 산출물은 한국어로 작성한다.
- 파일명, 스킬명, 명령어, JSON/YAML 키, `PASS`, `REWORK`, `FAIL` 같은 자동화 계약은 영어를 유지한다.

## 기본 작업 단위

- 기본 작업 단위는 GitHub Issue다.
- 제품 전체 방향은 `product-prd`로 `docs/product/prd.md`에 정리한다.
- 제품 로드맵은 하나의 GitHub Project로 관리하고, MVP 구분은 Project의 `MVP` 필드로 한다.
- PRD 기반 새 GitHub Issue를 만들기 전에는 `ai-harness-idea`로 다음 할 일을 정하고, `ai-harness-plan`으로 이슈 초안을 만든 뒤 사람의 승인을 받는다.
- 작업 중 떠오른 수시 발생 작업은 별도 스킬 호출 없이 `.agents/inbox.md`에 자동 캡처한다.
- 사용자가 명시하거나 triage에서 승격이 결정된 항목만 `ai-harness-capture`로 GitHub Issue 초안을 만들고, 기본값 `MVP=Backlog`, `Type=Idea`, `Source=Ad-hoc`, `Status=Inbox`로 Project에 넣는다.
- 승인 없이 GitHub Issue를 생성하지 않는다.
- 작업은 `.agents/runs/issue-{issue_number}/`에 기록한다.
- 대화만으로 끝내지 말고 필요한 산출물을 파일로 남긴다.

## 자동 inbox 캡처

- 작업 중 사용자가 추가 아이디어, 버그, 개선, 운영 작업, 하네스 작업을 언급하면 별도 스킬 호출 없이 `.agents/inbox.md`에 자동으로 기록한다.
- inbox는 하나의 파일로 관리하고, 미처리 항목만 유지한다.
- 현재 이슈 완료 기준을 직접 막는 항목은 현재 이슈 산출물에 반영하고, 별도 후속 작업은 inbox에 남긴다.
- 현재 이슈와 관련 있지만 완료를 막지 않는 항목은 `related`로 표시한다.
- 별도 기능, 운영, 개선 작업은 `candidate-issue`로 표시한다.
- 사용자가 이슈 생성을 지시하거나 triage에서 승격하기로 한 항목만 GitHub Issue로 만든다.
- 항목이 반영 완료되거나 GitHub Issue로 승격되면 inbox에서 제거한다.
- AI가 반영 완료를 판단해 자동 삭제할 때는 삭제 전에 한 줄로 보고하고 진행한다.

## 하네스 스킬

작업은 전체 자동 실행이 아니라 단계별 스킬로 나누어 진행한다.

- 현재 상태 확인: `ai-harness-status`
- 제품 PRD 정리: `product-prd`
- 수시 작업 캡처: `ai-harness-capture`
- 아이디어 정리: `ai-harness-idea`
- 계획과 이슈 초안: `ai-harness-plan`
- 상세 스펙 작성: `ai-harness-spec`
- 구현 안내: `ai-harness-implement`
- 실패 테스트 작성: `ai-harness-red`
- 최소 구현: `ai-harness-green`
- 리팩토링: `ai-harness-refactor`
- 검증: `ai-harness-verify`
- 리뷰와 점수 산출: `ai-harness-review`
- 대시보드 갱신: `ai-harness-dashboard`
- 하네스 건강도 평가: `ai-harness-evaluate`
- PR 생성: `ai-harness-draft-pr`

스킬 하나를 호출했다고 전체 파이프라인을 실행하지 않는다. 사용자가 요청한 단계만 수행한다.

## 구현 원칙

- 구현은 테스트 주도 개발 방식으로 진행한다.
- `ai-harness-red`는 실패 테스트 작성과 실패 확인만 수행한다.
- `ai-harness-green`은 실패 테스트를 통과시키는 최소 구현만 수행한다.
- `ai-harness-refactor`는 테스트가 통과하는 상태에서 동작 변경 없이 구조만 개선한다.
- 계획 범위 밖 리팩터링은 하지 않는다.
- 기존 사용자의 변경을 되돌리지 않는다.

## 검증 원칙

- 검증은 완료 기준과 연결된 근거를 남겨야 한다.
- 실행한 명령, 결과, 건너뛴 검증, 남은 리스크를 기록한다.
- 검증하지 않은 내용을 완료로 주장하지 않는다.

## 리뷰 게이트

Reviewer 점수는 PR 생성 전 게이트다.

- `PASS`: 80-100점. 바로 리뷰/머지 가능한 일반 PR 생성 가능.
- `REWORK`: 65-79점. 구현 재작업 필요.
- `FAIL`: 0-64점. 사람 확인 필요.

리뷰어는 원본 이슈, 산출물, 변경 diff, 검증 기록을 보고 채점한다.

## AI-impact

다음 변경은 AI-impact로 본다.

- `.agents/**` 변경
- 프롬프트, 스킬, 루브릭, 평가 데이터, 하네스 설정 변경
- AI의 입력, 판단, 출력, 평가, 권한, 안전 경계 변경

AI-impact 변경은 하네스 건강도 평가와 개선 제안 대상이 될 수 있다.

## PR 원칙

- 모든 작업은 `develop` 브랜치에서 수행한다.
- `master`에는 직접 커밋하거나 직접 푸시하지 않는다.
- 작업이 끝나면 `develop` 기준 변경사항으로 PR을 올린다.
- PR은 GitHub Draft 상태가 아닌 바로 리뷰/머지 가능한 일반 PR로 생성한다.
- PR 생성 전에는 원본 이슈 완료 기준, 작업 중 추가된 사항, 현재 이슈 관련 inbox 항목이 완료/승격/보류 중 하나로 정리되었는지 확인한다.
- PR 본문 첫 부분에는 원본 이슈가 머지 시 자동 종료되도록 `Closes #이슈번호` closing keyword를 포함한다.
- PR 본문은 `.github/pull_request_template.md`를 기준으로 작성하고, 템플릿 섹션을 임의로 생략하지 않는다.
- PR 본문에는 관련 이슈, 하네스 단계, 완료 기준 체크 결과, 추가 작업 처리 결과, inbox 확인 결과, Reviewer 점수, 검증 결과, 리스크를 포함한다.
- PR 템플릿이 실제 하네스 흐름과 맞지 않으면 PR 본문을 임의 구성하지 말고 템플릿을 먼저 수정한다.
- 머지와 배포는 사람 승인 전에는 수행하지 않는다.
