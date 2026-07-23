## Requirements

- `DOCS:SDD`, `PRD:AC-12`를 따른다.
- Codex·하네스가 사용자에게 표시하는 상태, 오류, 안내 문구를 한국어로 정리한다.
- 정적 실행 대시보드는 제품 디자인 시스템의 시각 언어와 접근성 원칙을 반영한다.

## Architecture

- `.codex/hooks.json`과 `.codex/hooks/*.mjs`의 사용자 노출 문구만 변경하고, Codex 이벤트 ID와 실행 경로는 유지한다.
- `.agents/harness/scripts/dashboard.mjs`가 정적 대시보드의 단일 생성 원본이다.

## Data model

- 데이터베이스, migration, RLS, 감사 데이터 변경은 없다.
- readiness JSON의 원본 키와 값은 그대로 두고 표시용 한국어 레이블만 추가한다.

## Interface

- 대시보드는 의미 구조의 제목, 표, 상태 배지와 작은 화면용 카드형 행을 제공한다.
- Phase는 요약형 `details` 패널로 제공하고, ROI는 영향·확신·비용 막대와 계산식으로 설명한다.
- 검증 스크립트는 훅 출력과 생성 HTML의 한국어·디자인 계약을 검사한다.

## Optimizations

- 새 런타임 의존성이나 외부 자산 없이 정적 HTML·CSS·JavaScript만 사용한다.
- 모바일 우선 CSS와 reduced motion 대응을 기본값으로 둔다.
