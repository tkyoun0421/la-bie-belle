# 2-design — 설계

설계의 전체 그림이 이 파일이다. 갈래마다 정본은 하나다.

- [`domain/`](domain/) — 개념 설계. 용어와 규칙의 정본
- [`architecture/`](architecture/) — 구조 설계. [`data-model/`](architecture/data-model/)(테이블과 관계), [`api/`](architecture/api/)(경계와 권한), [`runtime/`](architecture/runtime/)(캐시·시각·경쟁·로딩), [`flows/`](architecture/flows/)(화면 간 흐름). 관심사가 폴더고 도메인이 파일이다
- [`design-system/`](design-system/) — 시각 설계
- [`adr/`](adr/) — 되돌리기 어려운 결정과 그 근거. 어느 단계의 결정이든 전부 이 한 곳에 쌓는다
- [`spec/`](spec/) — 기능별 명세. 프론트매터 `status`가 태관의 승인 마크고, 승인 없이 구현으로 못 간다

기능은 spec이 승인돼야 [`3-build/`](../3-build/)로 넘어간다. 근거는 ADR-005에 있다.

한 화면을 셋이 나눠 적는다. 계정 상태와 권한 같은 업무 규칙은 [`domain/`](domain/), 어느 화면에서 어느 화면으로 가는지는 [`architecture/flows/`](architecture/flows/), 화면 안의 구성·문안·모션은 [`design-system/pages/`](design-system/pages/)다. 셋이 다른 말을 하면 자기 갈래가 아닌 쪽이 따라온다 — 페이지 문서가 목적지를 적었으면 flows가 정본이다.

## spec

기능만 들어온다. 사용자에게 보이는 동작이 새로 생기거나 달라지는 task가 기능이다. 리팩터링·문서·토큰·검사 같은 비기능 task는 실행 방향이 정해지면 [`3-build/plans/`](../3-build/plans/)에 task 문서를 둔다. 여러 단계에 걸친 변경 방향의 검토는 [proposals](../proposals/README.md)가 맡는다.

제안이 채택되면 영향을 받는 기획·설계 정본을 먼저 갱신하고 필요한 구현 계획을 쓴다. 중요한 선택과 근거는 ADR에 남긴다. 제안의 채택은 기능 spec의 승인을 대신하지 않는다([ADR-008](adr/ADR-008-proposals-and-implementation-plans.md)).

한 파일은 넷으로 선다.

- **요구** — 왜 이 task인지, 사용자에게 무엇이 달라지는지
- **설계** — 정본 중 이번에 구현하는 자리를 링크로 가리키고, 정본이 안 정한 것을 이 task에서 어떻게 정했는지만 적는다. 정본을 풀어 옮기지 않는다 — 정본이 바뀌면 spec이 낡는다
- **완료 조건** — 무엇이 되면 끝인지
- **범위 밖** — 이 task가 안 하는 것

정본이 앱 전체가 늘 지키는 것이라면 spec은 task 하나의 문서다. 구현 순서·파일 배치·리스크는 [`3-build/plans/`](../3-build/plans/)가 맡는다.
