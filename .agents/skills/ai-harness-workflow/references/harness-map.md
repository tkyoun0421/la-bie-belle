# 하네스 파일 지도

이 참조는 AI 하네스 관련 파일 위치를 빠르게 찾기 위한 지도다.

## 핵심 설정

- `.agents/harness/config.yaml`: 에이전트, 워크플로우, 스크립트, 템플릿, 게이트 설정.
- `.agents/harness/README.md`: 하네스 개요와 실행 명령.

## 에이전트 정의

- `.agents/harness/agents/planner.agent.md`
- `.agents/harness/agents/implementer.agent.md`
- `.agents/harness/agents/verifier.agent.md`
- `.agents/harness/agents/reviewer.agent.md`
- `.agents/harness/agents/draft-pr.agent.md`
- `.agents/harness/agents/harness-evaluator.agent.md`

## 프롬프트

- `.agents/harness/prompts/planner.md`
- `.agents/harness/prompts/spec.md`
- `.agents/harness/prompts/implementer.md`
- `.agents/harness/prompts/verifier.md`
- `.agents/harness/prompts/reviewer.md`
- `.agents/harness/prompts/harness-evaluator.md`

## 루브릭

- `.agents/harness/rubrics/issue-execution.v1.yaml`: 이슈 실행 점수. 총 100점, 결과물 70점, 과정 30점.
- `.agents/harness/rubrics/harness-health.v1.yaml`: 하네스 건강도 점수. 총 100점.

## 스크립트

- `.agents/harness/scripts/start-issue.mjs`: 이슈 실행 디렉터리와 기본 산출물 생성.
- `.agents/harness/scripts/validate-score.mjs`: `review-score.json` 점수 합계와 게이트 결정 검증.
- `.agents/harness/scripts/build-dashboard-data.mjs`: `.agents/runs/**`를 대시보드 데이터로 변환.

## 템플릿

- `.agents/harness/templates/task-spec.md`
- `.agents/harness/templates/plan.md`
- `.agents/harness/templates/spec.md`
- `.agents/harness/templates/implementation-notes.md`
- `.agents/harness/templates/verification.md`
- `.agents/harness/templates/review.md`
- `.agents/harness/templates/review-score.json`

## 대시보드

- `.agents/harness/dashboard/index.html`: 정적 HTML 대시보드.
- `.agents/harness/dashboard/data/runs.js`: 실제 실행 데이터.
- `.agents/harness/dashboard/data/sample-runs.js`: 실행 데이터가 없을 때의 샘플 데이터.

## 깃허브 이슈 폼

- `.github/ISSUE_TEMPLATE/ai-harness-task.yml`: AI 하네스 작업용 엄격한 폼.
- `.github/ISSUE_TEMPLATE/bug-report.yml`: 버그 리포트용 가벼운 폼.
- `.github/ISSUE_TEMPLATE/feature-request.yml`: 기능 요청용 가벼운 폼.
