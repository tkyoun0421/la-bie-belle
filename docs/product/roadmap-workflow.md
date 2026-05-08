# 제품 로드맵 운영 방식

## 원칙

라비벨의 제품 작업은 하나의 GitHub Project에서 관리한다. MVP마다 별도 Project를 만들지 않고, Project 필드로 MVP, 작업 유형, 출처, 우선순위, 상태를 구분한다.

## Project 필드

- `MVP`: `MVP 1`, `MVP 1.1`, `MVP 2`, `Backlog`
- `Type`: `Product`, `Bug`, `Ops`, `Harness`, `Idea`
- `Source`: `PRD`, `Ad-hoc`, `Review`, `User Feedback`
- `Priority`: `P0`, `P1`, `P2`, `P3`
- `Status`: `Inbox`, `Ready`, `In Progress`, `Review`, `Done`, `Blocked`

## 작업 유입 경로

- PRD 기반 작업: `docs/product/prd.md`에서 내려온 제품 기능이다. `Source=PRD`로 둔다.
- 수시 발생 작업: 작업 중 떠오른 아이디어나 개선이다. `Source=Ad-hoc`로 둔다.
- 리뷰 후속 작업: 검증, 리뷰, 운영 중 발견된 작업이다. `Source=Review`로 둔다.
- 사용자 피드백: 실제 사용자 피드백에서 나온 작업이다. `Source=User Feedback`으로 둔다.

## 수시 발생 작업 캡처

수시 발생 작업은 즉시 GitHub Issue로 만든다. 기본 필드는 다음과 같다.

- `MVP=Backlog`
- `Type=Idea`
- `Source=Ad-hoc`
- `Status=Inbox`

Inbox 이슈는 바로 구현하지 않는다. triage를 거쳐 `Ready`로 옮기거나, `Backlog`에 유지하거나, 닫는다.

## PRD 기반 작업 흐름

1. `product-prd`로 제품 전체 PRD를 작성하거나 갱신한다.
2. `ai-harness-idea`로 다음 제품 작업 후보를 고른다.
3. `ai-harness-plan`으로 GitHub Issue 초안을 만든다.
4. 사용자 승인 후 GitHub Issue를 생성하고 Project에 추가한다.
5. 생성된 이슈는 기존 하네스 실행 워크플로우를 따른다.

## 수시 발생 작업 흐름

1. `ai-harness-capture`로 이슈 초안을 만든다.
2. 사용자 승인 후 GitHub Issue를 생성한다.
3. 단일 제품 로드맵 Project에 추가한다.
4. 기본 필드로 Inbox에 둔다.
5. triage 후 MVP와 우선순위를 확정한다.

## Triage 기준

- `MVP 1`: 첫 MVP 핵심 흐름을 완성하는 데 반드시 필요한 작업
- `MVP 1.1`: MVP 1 이후 바로 붙일 가치가 있지만 첫 출시를 막지 않는 작업
- `MVP 2`: 제품 방향에는 맞지만 더 큰 설계나 운영 검증이 필요한 작업
- `Backlog`: 아직 가치, 범위, 완료 기준이 불명확한 작업

우선순위는 다음 기준으로 잡는다.

- `P0`: MVP 진행을 막는 작업
- `P1`: MVP 핵심 흐름에 직접 필요한 작업
- `P2`: 사용성, 운영 효율, 후속 안정화 작업
- `P3`: 나중에 검토해도 되는 아이디어
