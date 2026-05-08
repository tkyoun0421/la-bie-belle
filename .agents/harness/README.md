# AI 하네스

이 디렉터리는 AI를 활용한 개발 작업의 운영 하네스를 정의한다.

하네스는 두 가지 점수 체계를 가진다.

- 이슈 실행 점수: 에이전트들이 특정 GitHub Issue를 얼마나 잘 수행했는지 평가한다.
- 하네스 건강도 점수: 현재 하네스 설정이 안정적인 AI 작업을 얼마나 잘 지원하는지 평가한다.

기본 흐름:

0. `product-prd`가 제품 전체 PRD와 MVP 기준을 정리한다.
1. PRD 기반 작업은 `ai-harness-idea`와 `ai-harness-plan`으로 이슈 초안을 만든다.
2. 수시 발생 작업은 `ai-harness-capture`로 즉시 GitHub Issue와 Project Inbox에 캡처한다.
3. Planner가 GitHub Issue를 작업 명세와 계획으로 변환한다.
4. Implementer가 코드 또는 설정을 변경한다.
5. Verifier가 필요한 검증을 실행하고 근거를 기록한다.
6. Reviewer가 Draft PR 생성 전에 이슈 실행 점수를 산출한다.
7. Harness Evaluator가 각 이슈 종료 후, 그리고 주기적으로 하네스 설정을 평가한다.

Reviewer 게이트:

- `PASS`: 80-100점. Draft PR을 생성할 수 있다.
- `REWORK`: 65-79점. Implementer가 재작업하고 Reviewer가 다시 채점해야 한다.
- `FAIL`: 0-64점. 계속 진행하기 전에 사람의 확인이 필요하다.

하네스 개선안은 AI가 제안하고, 사람이 승인, 기각, 보류를 결정한다. 승인된 개선안은 별도의 Draft PR로 구현할 수 있다.

## GitHub Issue Form

이 저장소는 세 가지 Issue Form을 사용한다.

- `AI 하네스 작업`: AI 멀티 에이전트 흐름으로 처리할 작업. 목표, 범위, 제외 범위, 관련 파일/영역, 검증 방법, 완료 기준, 리스크를 필수로 받는다.
- `버그 리포트`: 재현 가능한 문제를 가볍게 등록한다. AI 하네스 처리 여부와 AI-impact 여부를 체크할 수 있다.
- `기능 요청`: 새 기능이나 개선 아이디어를 등록한다. AI 하네스 처리 여부와 AI-impact 여부를 체크할 수 있다.

Planner는 `AI 하네스 작업` 폼의 입력을 우선적으로 `task-spec.md`로 변환한다. 버그와 기능 요청은 triage 이후 AI 하네스 작업으로 전환하거나 그대로 하네스로 실행할 수 있다.

## GitHub Project 로드맵

제품 로드맵은 하나의 GitHub Project에서 관리한다. MVP별로 Project를 나누지 않고 `MVP` 필드로 구분한다.

권장 필드는 다음과 같다.

- `MVP`: `MVP 1`, `MVP 1.1`, `MVP 2`, `Backlog`
- `Type`: `Product`, `Bug`, `Ops`, `Harness`, `Idea`
- `Source`: `PRD`, `Ad-hoc`, `Review`, `User Feedback`
- `Priority`: `P0`, `P1`, `P2`, `P3`
- `Status`: `Inbox`, `Ready`, `In Progress`, `Review`, `Done`, `Blocked`

작업 중 떠오른 수시 발생 작업은 기본값 `MVP=Backlog`, `Type=Idea`, `Source=Ad-hoc`, `Status=Inbox`로 등록하고, triage 전에는 구현하지 않는다. 자세한 운영 방식은 `docs/product/roadmap-workflow.md`를 따른다.

## 실행 명령

이슈 실행 디렉터리를 만든다.

```bash
node .agents/harness/scripts/start-issue.mjs 24 --title="결제 버튼 문구 수정" --url="https://github.com/OWNER/REPO/issues/24"
```

Reviewer 점수 기록을 검증한다.

```bash
node .agents/harness/scripts/validate-score.mjs .agents/runs/issue-24/review-score.json
```

실행 기록을 대시보드 데이터로 변환한다.

```bash
node .agents/harness/scripts/build-dashboard-data.mjs
```

브라우저에서 대시보드를 연다.

```txt
.agents/harness/dashboard/index.html
```

대시보드는 `.agents/harness/dashboard/data/runs.js`에 실제 실행 기록이 있으면 그 데이터를 우선 사용하고, 아직 실행 기록이 없으면 샘플 데이터를 표시한다.
