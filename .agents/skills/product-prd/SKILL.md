---
name: product-prd
description: 이 프로젝트에서 제품 전체 PRD를 만들거나 갱신할 때 사용한다. 라비벨 웨딩홀 예도팀 근무 관리 앱의 목표, 사용자 역할, MVP 범위, 제외 범위, 핵심 업무 흐름, 도메인 규칙, 상태값, GitHub Project 로드맵 연결 기준을 docs/product/prd.md에 정리해야 할 때 사용한다. 구현, 이슈 실행, 검증, 리뷰는 수행하지 않는다.
---

# Product PRD

제품 전체 그림을 문서화하는 단계다. 특정 기능 구현 전에 제품 기준을 세우고, 이후 GitHub Issue와 하네스 실행이 이 기준을 참조하게 한다.

## 목적

- 제품의 목표와 대상 사용자를 한 문서에 고정한다.
- MVP 범위와 제외 범위를 분리한다.
- 핵심 업무 흐름, 권한, 상태값, 도메인 규칙을 정리한다.
- GitHub Project의 `MVP`, `Type`, `Source`, `Priority`, `Status` 필드와 연결 가능한 기준을 남긴다.

## 절차

1. 현재 맥락 확인
   - `AGENT.md`, `.agents/harness/README.md`, `docs/product/prd.md`가 있으면 먼저 읽는다.
   - 코드베이스에서 확인 가능한 내용은 사용자에게 묻지 않는다.

2. 불확실성 정리
   - 제품 목표, 사용자 역할, MVP 범위, 제외 범위, 완료 기준 중 가장 큰 불확실성 하나만 질문한다.
   - 질문이 필요하면 `deep-interview` 방식으로 한 번에 하나씩 묻는다.

3. PRD 작성 또는 갱신
   - 산출물은 `docs/product/prd.md`에 남긴다.
   - 문서는 한국어로 작성한다.
   - 다음 섹션을 포함한다.
     - 제품 요약
     - 사용자 역할과 권한
     - MVP 1 범위
     - MVP 1 제외 범위
     - 핵심 업무 흐름
     - 도메인 규칙
     - 상태값
     - 알림 정책
     - GitHub Project 운영 기준
     - 열린 질문

4. 다음 단계 안내
   - PRD에서 바로 구현하지 않는다.
   - PRD 기반 작업 후보는 `ai-harness-idea` 또는 `ai-harness-capture`로 넘긴다.
   - 큰 작업을 실행 가능한 이슈로 나눌 때는 `ai-harness-plan`을 사용한다.

## 금지

- GitHub Issue를 생성하지 않는다.
- 제품 코드나 테스트 코드를 수정하지 않는다.
- 하네스 실행 산출물인 `.agents/runs/**`를 생성하거나 수정하지 않는다.
- PRD에 없는 기능을 확정된 요구사항처럼 쓰지 않는다.
