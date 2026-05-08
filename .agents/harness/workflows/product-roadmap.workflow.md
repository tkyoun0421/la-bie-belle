# 제품 로드맵 워크플로우

## 목적

제품 전체 PRD, 수시 발생 작업, GitHub Issue, GitHub Project를 하나의 운영 흐름으로 연결한다.

## 원칙

- 제품 전체 기준은 `docs/product/prd.md`에 둔다.
- 로드맵은 하나의 GitHub Project에서 관리한다.
- MVP별로 Project를 나누지 않고 `MVP` 필드로 구분한다.
- 떠오른 작업은 즉시 GitHub Issue로 캡처하되, 기본적으로 Inbox에 둔다.
- Inbox 작업은 triage 전 구현하지 않는다.

## 단계

0. Product PRD
   - `product-prd`로 제품 목표, 사용자 역할, MVP 범위, 제외 범위, 핵심 흐름, 열린 질문을 정리한다.

1. Roadmap Project
   - 단일 GitHub Project를 제품 로드맵으로 사용한다.
   - 필드는 `MVP`, `Type`, `Source`, `Priority`, `Status`를 사용한다.

2. PRD 기반 작업
   - `ai-harness-idea`로 다음 작업 후보를 고른다.
   - `ai-harness-plan`으로 이슈 초안을 만든다.
   - 승인 후 GitHub Issue를 생성하고 Project에 추가한다.

3. 수시 발생 작업
   - `ai-harness-capture`로 이슈 초안을 만든다.
   - 승인 후 GitHub Issue를 생성하고 Project Inbox에 추가한다.
   - 기본 필드는 `MVP=Backlog`, `Type=Idea`, `Source=Ad-hoc`, `Status=Inbox`다.

4. Triage
   - Inbox 작업의 가치, 범위, 완료 기준을 확인한다.
   - `MVP`, `Type`, `Priority`, `Status`를 갱신한다.
   - 실행하기로 한 작업은 `Ready`로 옮긴다.

5. Issue Execution
   - `Ready` 이슈는 `issue-execution.workflow.md`를 따른다.

## 중단 조건

- PRD와 충돌하는 작업인데 사용자 승인이 없는 경우.
- GitHub Project 번호나 필드가 확인되지 않은 상태에서 원격 Project 반영이 필요한 경우.
- Inbox 작업의 목표가 불명확해 이슈 본문조차 작성할 수 없는 경우.
