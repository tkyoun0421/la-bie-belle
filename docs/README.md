# 문서 지도

| 문서 | 책임 | 포함하지 않는 내용 |
| --- | --- | --- |
| [PRD](PRD.md) | 사용자, 범위, 요구사항, 비즈니스 규칙 | 기술 구현 세부사항 |
| [Domain](DOMAIN.md) | 공통 언어, 논리적 도메인 경계, aggregate와 domain event | 배포 구조와 서비스 분리 |
| [Architecture](ARCHITECTURE.md) | 시스템 경계, 데이터 모델, 보안, 배포 | 제품 우선순위 |
| [ADR](adr/README.md) | 중요한 기술·도메인 결정과 근거 | 작업 체크리스트 |
| [Phase 계획](phases/README.md) | 구현 순서, task 상세 범위와 인수 조건 | 요구사항 원문 반복 |
| [작업 인덱스](phases/index.jsonl) | AI와 도구가 읽는 상태, 의존성, spec 참조, 검증 항목 | 상세 인수 조건 |

## Spec-driven development (`DOCS:SDD`)

1. 제품 동작을 바꾸기 전에 PRD의 불변 규칙 또는 제품 인수 조건을 수정합니다.
2. 용어나 업무 경계가 바뀌면 Domain 문서를 함께 수정합니다.
3. 되돌리기 어려운 구현 결정이면 ADR을 추가하거나 대체합니다.
4. Phase task의 상세 범위와 인수 조건을 수정하고 작업 인덱스의 `spec_refs`를 연결합니다.
5. 구현과 회귀 테스트는 관련 spec ID를 테스트 이름, 주석 또는 PR·커밋 검증 증거에 남깁니다.

PRD의 `INV-*`, `AC-*` ID는 한번 사용하면 의미를 바꾸거나 재사용하지 않습니다. 요구가 폐기되면 삭제해 번호를 재사용하지 않고 폐기 사실과 대체 ID를 기록합니다.

`spec_refs`는 요구사항 원문을 복사하는 필드가 아닙니다. task가 충족하거나 보존해야 하는 PRD spec, Domain 경계, ADR을 가리키는 추적 링크입니다.

## Domain-driven development (`DOCS:DDD`)

- 제품과 코드에서 [Domain 문서](DOMAIN.md)의 공통 언어를 사용합니다.
- 도메인 경계는 모듈과 트랜잭션 책임을 나누지만 배포 단위는 나누지 않습니다.
- aggregate를 넘는 변경은 명시적 command에서 현재 상태를 다시 검사합니다.
- domain event는 실제 후속 처리나 감사가 필요한 사건만 영속화합니다.
- repository, service, event bus 같은 패턴은 이름 자체가 아니라 인수 조건에 필요할 때만 도입합니다.

## 변경 규칙

- 사용자 요구가 바뀌면 PRD를 먼저 수정합니다.
- 공통 언어, aggregate, context 의존성이 바뀌면 Domain 문서를 수정합니다.
- 되돌리기 어려운 기술 또는 도메인 결정은 ADR을 추가하거나 대체합니다.
- 구현 순서나 작업 분해만 바뀌면 Phase 문서와 `index.jsonl`을 수정합니다.
- Architecture는 승인된 PRD, Domain, ADR의 현재 결과를 반영합니다.

## MVP 이후 보류 항목

- 자동 배정 및 추천
- 사고 이력
- 실제 급여 정산 및 명세서
- 문자·카카오톡 알림
- 다중 지점·다중 홀
- 시간대별 포지션 변경
- 데스크톱 전용 UI

이 항목은 별도 승인 없이 현재 Phase에 추가하지 않습니다.
