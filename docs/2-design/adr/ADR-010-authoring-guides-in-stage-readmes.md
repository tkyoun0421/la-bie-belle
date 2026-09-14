# ADR-010 — 작성법은 단계 README가 소유하고 틀은 그 안의 코드 블록이다

2026-09-14에 정했다. [ADR-009](ADR-009-design-modules-and-stage-links.md)가 파일의 자리와 절 순서를 정했고, 여기는 그 절을 어떻게 채우는지의 소유권이다. 검토 근거는 [docs-authoring-playbook 제안](../../proposals/docs-authoring-playbook.md), 실행은 [plan](../../3-build/plans/docs-authoring-playbook.md)이다.

## 배경과 제약

단계 안내는 어느 문서가 무엇을 담는지까지만 말했다. 규칙 한 줄을 판정 예시로 바꾸는 법, 완료 조건을 검증에 잇는 법, 화면 상태를 빠짐없이 도는 법은 작성자마다 다시 정했고, 테스트 층을 고르는 기준은 `test-planner` 정의문에만 있었다. 지켜야 할 것은 여섯 단계와 intent→spec→plan 사슬, spec 승인 관문, 그리고 문서 검사(`doc-links`·`doc-map`·`design-map`)가 읽는 자리다.

## 대안과 선택

- **단계 README에 틀과 작성법을 함께 둔다** — 문서를 고르는 자리에서 작성까지 이어진다. README가 길어진다
- **별도 `templates/` 폴더와 작성 가이드** — 파일을 바로 복사하기 쉽다. 단계 안내·틀·작성법이 다시 세 곳으로 갈라진다
- **생성기나 스키마로 강제** — 일괄 생성과 검사가 된다. 형식과 도구를 같이 유지해야 하고 지금 문서량에 비해 무겁다

첫째를 고른다. 각 작성법은 「용도·작성 시점 / 필요한 입력 / 복사용 틀 / 절별 질문 / 검토 기준」 순서로 단계 README의 「입력과 산출물」 아래에 산다. 모든 문서에 공통인 것 — 소유 문서 고르기, 사실·결정·제안·미정의 구별, 참조와 식별자, 마지막에 확인할 질문, 변경 전파, backlog·handoff·log·CHANGELOG의 틀 — 은 `docs/README.md`가 한 번만 들고 각 작성법이 링크한다. 업무 README는 규칙만 담고 작성법을 다시 싣지 않는다. 정의문은 읽을 작성법을 링크한다.

받아들이는 비용은 README의 길이다. 목차와 문서 종류별 하위 절로 버틴다.

## 적용과 결과

- 단계 README 여섯은 「역할 / 문서 지도 / 입력과 산출물 / 다음 단계로 넘기는 조건」 네 절이다. `modules/README.md`만 「영역 지도 / 공통 용어 / 영역 사이의 책임과 의존 / 경계의 미정」이다
- 틀은 새 문서와 활성 문서의 이번 변경부터 적용한다. 완료된 spec·plan·ADR·log는 당시 기록이라 소급하지 않는다. 빈 미래 기록(release·incident·evidence)은 사건이 있을 때 만든다
- 활성 설계 문서를 틀에 맞춰 다시 쓸 때 문장은 재구성해도 결정 내용은 바꾸지 않는다. 판정 예시·상태 전이·계약 표는 규칙에서 도출하며 총괄이 확인한다 — 규칙 문서와 design을 총괄이 쓴다는 [ADR-004](ADR-004-domain-rules-home.md)의 조항은 그대로다
- 테스트 층 배정 기준은 `4-test/strategy.md`가 소유하고 `test-planner` 정의문은 그것을 읽는다. [ADR-003](ADR-003-supabase-and-integration-tests.md)은 선택의 이유를 보존한다
- 작업 상태는 backlog 표 한 곳(`candidate / blocked / ready / active / done`)이, 재개 정보는 handoff의 「다음 작업 / 재개 맥락」이 든다

## 재검토 조건

단계 README가 목차로도 못 버틸 만큼 길어지거나, 틀을 복사하다 경로를 틀리는 일이 반복되면 `templates/` 폴더를 다시 본다. 문서 수가 늘어 형식 검사를 사람이 못 따라가면 스키마 검사를 본다.
