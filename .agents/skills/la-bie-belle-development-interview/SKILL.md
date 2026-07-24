---
name: la-bie-belle-development-interview
description: 기획 승인을 받은 라비에벨 design_pending task의 Requirements, Architecture, Data model, Interface, Optimizations(RADIO) 기술 설계를 사용자와 승인하고 planned 실행 계약으로 인계한다. 구현 구조나 기술 인수 조건 결정이 필요할 때 사용한다.
---

# RADIO 개발 인터뷰

기획 승인, `docs/DEVELOPMENT.md`, 관련 Architecture·ADR·Phase와 task 상세를 읽는다. 승인된 제품 동작을 다시 결정하지 않는다.

## 진행

1. 방금 확정한 사항을 먼저 보여주고 충돌·가정·미결 사항은 있을 때만 구분한다.
2. Requirements, Architecture, Data model, Interface, Optimizations 순서에서 현재의 주 기술 결정 하나만 질문한다.
3. 선택지가 있으면 2~3개와 추천 답변·이유·핵심 트레이드오프를 제공하고, 사용자 승인·수정·보류를 명시적으로 받는다.
4. `DEV-*` 규칙은 반복하지 않고 각 항목에 `기본 적용`, `해당 없음`, `추가 결정`, `예외` 중 하나와 task별 차이만 기록한다.

## 승인과 인계

RADIO 정본을 `docs/development/<task-id>-radio.md`에 revision과 `Approved` 상태로 기록한다. 전체 파일의 UTF-8 SHA-256, revision, `development_approval`, `radio_ref`, `test_mode`, `check_ids`를 task에 기록한 뒤에만 `planned`로 바꾼다.

제품 범위·역할·UX·정책 판단이 새로 필요하면 `$la-bie-belle-product-interview`에 결정 영역, 이유, 영향 문서·task, 확정 사항과 미결 질문을 담은 결정 신호로 반환한다. 구현은 시작하지 않는다.
