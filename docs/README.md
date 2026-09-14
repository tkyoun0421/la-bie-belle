# docs — 문서 지도

무엇이 어디 있는지는 이 파일이 정본이다. 다른 문서는 여기를 가리키고, 새 갈래가 생기면 한 줄을 더한다. 다른 곳에 정본이 있는 내용은 여기 옮겨 적지 않는다. 단계 재편은 [ADR-005](2-design/adr/ADR-005-sdlc-stage-folders-and-artifact-chain.md), 제안과 실행 계획의 구분은 [ADR-008](2-design/adr/ADR-008-proposals-and-implementation-plans.md), 설계 안의 업무 영역 배치와 단계 사이 참조는 [ADR-009](2-design/adr/ADR-009-design-modules-and-stage-links.md)에 있다.

## 문서 지도

- [`docs/handoff.md`](handoff.md) — 다음 작업과 재개 맥락. 세션은 여기서 시작한다
- [`docs/backlog.md`](backlog.md) — task 보드. 작업 ID·상태·선행 작업·산출물 링크. 완료 조건은 행이 링크하는 spec(기능)이나 plan(비기능)에 산다
- [`docs/CHANGELOG.md`](CHANGELOG.md) — 날짜·변경·PR 표. 왜는 log와 PR에
- [`docs/log/`](log/) — 회차 기록. 왜 그렇게 정했는지
- [`docs/observations/`](observations/) — 관찰 로그. 정의문·훅이 삐걱인 자리, 증축 규칙의 카운터. 규칙은 그 안 `README.md`, 근거는 ADR-006
- [`docs/proposals/`](proposals/) — 단계에 걸치는 변경 방향의 검토 제안. 작성 기준·상태·목록은 그 안 `README.md`, 근거는 ADR-008
- [`docs/1-plan/`](1-plan/) — 기획: prd, 시나리오, 로드맵, 지표, `intent/`
- [`docs/2-design/`](2-design/) — 설계. 지도는 그 안 `README.md`
  - `2-design/system/` — 시스템 전체의 원칙과 복합 화면. `architecture/`에서 옮겨 세운다
  - [`docs/2-design/modules/`](2-design/modules/) — 업무 영역별 용어·규칙(`README.md`)·기술 설계(`design.md`)·화면(`screens/`). 영역 지도는 그 안 `README.md`
  - [`docs/2-design/domain/`](2-design/domain/)·[`docs/2-design/architecture/`](2-design/architecture/) — modules로 옮기는 중인 옛 자리. 아직 안 옮긴 영역만 남아 있다
  - [`docs/2-design/design-system/`](2-design/design-system/) — 토큰·컴포넌트·문안의 공통 시각 기준
  - [`docs/2-design/spec/`](2-design/spec/) — 기능별 완료 조건·승인 마크
  - [`docs/2-design/adr/`](2-design/adr/) — 중요한 선택의 이유
- [`docs/3-build/`](3-build/) ~ [`docs/6-maintain/`](6-maintain/) — 구현 계획, 테스트 전략, 배포, 운영. 각 안내는 그 안 `README.md`
- [`REVIEW.md`](../REVIEW.md) — PR 리뷰 정책 정본. CI 자동 리뷰와 `pr-diff`가 같은 축을 읽는다
- [`.claude/agents/`](../.claude/agents/) — subagent 정의문
- [`.claude/skills/`](../.claude/skills/) — 스킬 정의문

## 기준의 소유권

같은 사실을 두 문서가 들지 않는다. 아래 자리가 그 사실의 정본이고, 다른 문서는 링크한다.

| 사실 | 소유 문서 |
| --- | --- |
| 작업 상태·우선순위·선행 관계 | `backlog.md` |
| 기능 승인 | `2-design/spec/<task>.md`의 `status`와 승인 근거. `approved`는 작업 완료가 아니다 |
| 제안 채택 | `proposals/<제안>.md`의 `status` |
| 재개 정보 | `handoff.md`. 완료 목록과 전체 설계 상태를 되풀이하지 않는다 |
| 업무 규칙과 용어 | `2-design/modules/<영역>/README.md` |
| 데이터·API·실행 동작 | `2-design/modules/<영역>/design.md`. 공통 원칙은 `2-design/system/` |
| 화면의 짜임·문안·모션·흐름 | 그 화면의 `screens/<화면>.md` |
| 토큰 값 | `2-design/design-system/tokens.md` |
| 미정 | 사용자 문제는 intent, 업무·기술·화면 결정은 해당 설계 문서. backlog는 그 미정이 막는 작업에서 원문을 링크한다 |
| 결과 근거 | CI·PR·log. 완료 작업이 링크한다 |

## 단계 사이의 참조

기능 하나는 같은 작업 슬러그로 `1-plan/intent/` → `2-design/spec/` → `3-build/plans/`를 지난다. spec은 intent와 이번에 적용하는 설계 조항을, plan은 spec을 frontmatter `sources`에 상대 경로로 적는다. 형식은 [설계 안내](2-design/README.md#sources)에 있다. 규칙은 `#acc-001` 같은 고정 ID 앵커로 가리킨다.

기준을 고치는 PR은 그것을 `sources`로 든 spec·plan과 관련 테스트를 같은 PR에서 고치거나, 영향이 없는 이유를 남기거나, 전환 작업을 연결한다.
