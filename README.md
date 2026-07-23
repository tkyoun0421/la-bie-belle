# 라비에벨 근무 관리

라비에벨 웨딩홀의 근무 신청, 포지션 배정, 출퇴근 기록, 예상 급여를 관리하는 모바일 PWA입니다.

현재 저장소는 구현 전 설계 단계입니다. 제품 범위와 구현 순서는 다음 문서에서 관리합니다.

- [제품 요구사항](docs/PRD.md)
- [시스템 아키텍처](docs/ARCHITECTURE.md)
- [Architecture Decision Records](docs/adr/README.md)
- [Phase 실행 계획](docs/phases/README.md)
- [기계 판독용 작업 인덱스](docs/phases/index.jsonl)

## MVP 성공 기준

다음 달 스케줄 모집부터 기존 단체 채팅과 수기 배정표를 완전히 대체한다.

## 문서 우선순위

문서 간 내용이 충돌하면 다음 순서로 판단합니다.

1. 승인된 ADR
2. PRD의 불변 규칙과 인수 조건
3. Architecture
4. 현재 Phase 문서
5. `index.jsonl`

충돌을 발견하면 임의로 구현하지 말고 문서를 먼저 정합하게 수정합니다.
