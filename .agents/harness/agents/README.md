# 멀티 에이전트 정의

이 디렉터리는 AI 하네스를 구성하는 에이전트별 책임, 입력, 산출물, 다음 단계 조건을 정의한다.

기본 에이전트:

- `planner.agent.md`: GitHub Issue를 작업 명세와 계획으로 변환한다.
- `implementer.agent.md`: 계획에 따라 변경을 구현한다.
- `verifier.agent.md`: 구현 결과를 검증하고 근거를 기록한다.
- `reviewer.agent.md`: 실행 결과를 자동 채점하고 Draft PR 게이트를 결정한다.
- `harness-evaluator.agent.md`: 하네스 자체를 평가하고 개선안을 제안한다.
- `draft-pr.agent.md`: PASS된 작업을 Draft PR로 정리한다.

핵심 원칙:

- 각 에이전트는 자기 단계의 산출물을 파일로 남긴다.
- 다음 에이전트는 이전 산출물을 입력으로 사용한다.
- Reviewer 점수가 Draft PR 생성 전 자동 게이트가 된다.
- Harness Evaluator는 하네스 개선안을 제안하지만, 사람 승인 전에는 설정을 수정하지 않는다.
