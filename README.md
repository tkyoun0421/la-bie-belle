# 라비에벨 근무 관리

라비에벨 웨딩홀의 근무 신청, 포지션 배정, 출퇴근 기록, 예상 급여를 관리하는 모바일 PWA입니다.

제품 범위와 구현 순서는 다음 문서에서 관리하며, 현재 구현 상태는 작업 인덱스를 기준으로 확인합니다.

- [딥인터뷰 설계와 자율 개발 운영 계약](docs/WORKFLOW.md)
- [제품 요구사항](docs/PRD.md)
- [도메인 언어와 경계](docs/DOMAIN.md)
- [시스템 아키텍처](docs/ARCHITECTURE.md)
- [개발 규칙과 하네스](docs/DEVELOPMENT.md)
- [제품 디자인 시스템](docs/DESIGN.md)
- [Architecture Decision Records](docs/adr/README.md)
- [Phase 실행 계획](docs/phases/README.md)
- [기계 판독용 작업 인덱스](docs/phases/index.jsonl)

## 협업 방식

제품·프로젝트 설계는 기획 인터뷰에서, 구현 구조와 기술 계약은 RADIO 개발 인터뷰에서 각각 만들고 승인합니다. 두 승인을 받은 단일 task만 AI 자율 개발 루프로 넘겨 TDD, 구현, 검증과 기술적 재시도를 수행합니다. 개발 루프는 다음 task를 자동 선택하거나 승인된 설계를 임의로 확장하지 않습니다.

현재 미구현 제품 계획은 기획 인터뷰에서 검토할 `proposed` 기준안입니다. 기획 승인 후 개발 설계를 기다리는 task는 `design_pending`, 두 설계가 모두 승인된 실행 가능 task는 `planned`입니다.

## MVP 성공 기준

다음 달 스케줄 모집부터 기존 단체 채팅과 수기 배정표를 완전히 대체한다.

## 문서 책임과 충돌 처리

- 제품 동작, 범위, 불변 규칙, 제품 인수 조건은 PRD가 기준입니다.
- 공통 언어, 도메인 경계, aggregate 일관성 경계는 Domain 문서가 기준입니다.
- 되돌리기 어려운 기술·데이터·운영 결정은 승인된 ADR이 기준입니다.
- Architecture는 승인된 PRD, Domain, ADR을 구현 구조로 반영합니다.
- Development는 공통 `DEV-*` 컨벤션과 RADIO 작성 규칙의 기준입니다.
- task별 승인된 RADIO는 해당 구현의 기술 설계 기준입니다.
- Design은 승인된 제품 규칙을 화면 구조, 상호작용, 시각 토큰과 역할별 흐름으로 반영합니다.
- Phase 문서는 구현 범위와 상세 인수 조건, `index.jsonl`은 실행 상태·의존성·검증 항목을 관리합니다.

이 문서들은 [운영 계약](docs/WORKFLOW.md)에 따라 인터뷰에서 승인된 범위만 신규 구현의 기준이 됩니다.

서로 다른 책임의 문서가 충돌하면 임의로 우선 적용하지 않습니다. 구현을 멈추고 PRD부터 Domain, ADR, Architecture, Development·RADIO, Phase, 작업 인덱스 순서로 정합하게 수정합니다.
