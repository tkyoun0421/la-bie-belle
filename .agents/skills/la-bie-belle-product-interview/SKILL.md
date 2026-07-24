---
name: la-bie-belle-product-interview
description: 라비에벨의 제품·프로젝트·도메인·UX 범위와 제품 인수 조건을 사용자 주도 인터뷰로 승인하고 design_pending 개발 인계 task를 만든다. 제품 결정, MVP 범위 또는 기획 승인 재검토가 필요할 때 사용한다.
---

# 기획 인터뷰

`README.md`, `docs/WORKFLOW.md`, PRD와 관련 Domain·ADR·Phase 문서를 읽고 기존 제안은 인터뷰 출발점으로만 취급한다.

## 진행

1. 방금 확정한 사실을 먼저 구분하고, 충돌·가정·미결 사항은 있을 때만 명시한다.
2. 한 차례에 결정 주제 하나만 다룬다. 실제 선택이 있으면 2~3개 선택지, 추천 답변·이유·핵심 트레이드오프를 함께 제시한다.
3. 행위자·권한, 상태·시간 경계, 데이터 수명주기, 실패·복구, MVP 비목표와 검증 가능한 제품 인수 조건을 위험에 맞게 확인한다.
4. 침묵이나 추천 수락을 승인으로 해석하지 않는다. 사용자에게 승인·수정·보류를 명시적으로 확인한다.

## 승인과 인계

사용자가 승인한 뒤에만 PRD → Domain → ADR → Architecture·Design → Phase 순서로 문서를 정합화한다. task에 목표, 비목표, 경계 사례, 제품 인수 조건, `spec_refs`, `product_approval`을 기록하고 `design_pending`으로 둔다. 제품 코드 구현이나 `in_progress` 전환은 하지 않는다.

기술 구조·데이터·인터페이스·최적화 판단이 필요하면 `$la-bie-belle-development-interview`에 결정 영역, 이유, 영향 문서·task, 확정 사항과 미결 질문을 담은 결정 신호로 넘긴다.
