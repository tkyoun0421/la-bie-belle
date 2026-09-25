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
  - [`docs/2-design/system/`](2-design/system/) — 시스템 전체의 원칙과 복합 화면. 구성(`architecture.md`)·데이터 접근(`data-access.md`)·런타임(`runtime.md`)·탐색(`navigation.md`)
  - [`docs/2-design/modules/`](2-design/modules/) — 업무 영역별 용어·규칙(`README.md`)·기술 설계(`design.md`)·화면(`screens/`). 영역 지도는 그 안 `README.md`
  - [`docs/2-design/design-system/`](2-design/design-system/) — 토큰·컴포넌트·문안·그림의 공통 시각 기준
  - [`docs/2-design/spec/`](2-design/spec/) — 기능별 완료 조건·승인 마크
  - [`docs/2-design/adr/`](2-design/adr/) — 중요한 선택의 이유
- [`docs/3-build/`](3-build/) ~ [`docs/6-maintain/`](6-maintain/) — 구현 계획, 테스트 전략, 배포, 운영. 각 안내는 그 안 `README.md`
  - [`docs/4-test/strategy.md`](4-test/strategy.md)·[`docs/4-test/execution.md`](4-test/execution.md) — 층 배정 기준과 실행·훅·실패 진단
  - [`docs/5-deploy/environments.md`](5-deploy/environments.md)·[`docs/5-deploy/procedure.md`](5-deploy/procedure.md) — 환경·설정과 적용·되돌리기 순서
  - [`docs/6-maintain/monitoring.md`](6-maintain/monitoring.md)·[`docs/6-maintain/response.md`](6-maintain/response.md)·[`docs/6-maintain/metrics.md`](6-maintain/metrics.md) — 관측·대응·측정
- [`REVIEW.md`](../REVIEW.md) — PR 리뷰 정책 정본. CI 자동 리뷰와 `pr-diff`가 같은 축을 읽는다
- [`.claude/agents/`](../.claude/agents/) — subagent 정의문
- [`.claude/skills/`](../.claude/skills/) — 스킬 정의문

단계 문서를 무엇으로 채우는지는 그 단계 README의 「입력과 산출물」 절이 든다. 이 파일은 모든 문서에 공통인 것만 든다.

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

## 참조와 작성 규칙

### 소유 문서를 고른다

1. 이번에 답할 질문을 한 문장으로 적는다. 「누구의 문제인가」는 intent, 「항상 어떤 판정을 하나」는 업무 규칙, 「이번에 어디까지 만드나」는 spec이다.
2. 현재 소유 문서와 결정 근거를 읽는다. 코드에서 확인한 동작과 합의된 목표를 구별한다.
3. 기존 결정은 원문을 링크한다. 새로 결정할 내용만 해당 소유 문서에 쓴다.
4. 초안을 실제 사례로 읽는다. 같은 입력에서 서로 다른 답이 나오면 표현이나 결정이 덜 된 것이다.

다섯째 단계는 [변경 전파](#변경-전파)가 든다.

규칙 본문, 입력 예시, 검증 결과는 역할이 다르다. 「번호는 이 형식만 허용한다」는 규칙 한 곳이 소유한다. spec과 테스트에는 그 규칙에서 도출한 입력·기대 결과를 쓸 수 있다. 예시가 규칙을 바꾸거나 다른 예외를 추가해서는 안 된다.

### 사실·결정·제안·미정을 구별한다

| 종류 | 쓰는 방법 | 필요한 근거 |
| --- | --- | --- |
| 확인 사실 | 「기준 커밋에서 이 호출이 이 데이터를 쓴다」 | 코드 위치·실행 결과·관찰 일시 |
| 합의된 결정 | 조건과 결과를 단정문으로 쓴다 | 사용자 결정·채택된 문서·ADR 등 결정 근거 |
| 제안 | 「제안: …」으로 시작하고 대안과 비용을 적는다 | 해결할 문제와 판단할 차이 |
| 미정 | 질문·영향·결정할 사람 또는 역할·필요한 자료·결정 시점을 적는다 | 미정을 소유한 절과 막히는 작업 |
| 해당 없음 | 적용되지 않는 이유를 한 문장으로 쓴다 | 검토한 범위 |

`미정`은 `해당 없음`으로 대체하지 않는다. 해당 절이 실제로 없으면 이유를 적고, 아직 모르면 아래 틀을 쓴다. 빈 파일을 미리 만들지는 않는다.

```markdown
### Q-01

- 질문: <무엇을 정해야 하나>
- 영향: <어떤 판정·화면·작업을 막나>
- 결정 담당과 시점: <누가, 어떤 작업 전에 정하나>
- 필요한 근거와 대안: <확인할 자료, 선택지의 차이>
```

질문은 한 소유 문서에만 둔다. 다른 문서와 backlog에서는 그 절을 링크한다. 결정 뒤에는 규칙을 소유 절에 반영하고 질문 절에는 결정 근거와 목적지를 남긴다. 이미 링크된 질문 앵커는 바로 없애지 않는다.

### 참조와 식별자

기능 하나는 같은 작업 슬러그로 `1-plan/intent/` → `2-design/spec/` → `3-build/plans/`를 지난다. spec은 intent와 이번에 적용하는 설계 조항을, plan은 spec을 frontmatter `sources`에 상대 경로로 적는다. 형식은 [설계 안내](2-design/README.md#sources)에 있다. 규칙은 `#acc-001` 같은 고정 ID 앵커로 가리킨다.

- `sources`는 기능 spec의 intent·적용 설계, plan의 spec 또는 비기능 작업의 입력 문서에 사용한다. 그 입력의 변경이 산출물 재검토를 요구한다는 뜻이다. 단순 참고 자료는 본문 링크로 구별한다.
- 경로는 **실제로 작성될 파일 기준의 상대 경로**다. README의 틀을 복사한 뒤 목적지에서 확인한다. 코드 블록 속 예시 링크는 실제 파일의 링크 검사 통과를 보장하지 않는다.
- 작업 ID는 파일 슬러그에서 얻는다. 기능의 intent·spec·구현 plan은 같게 하고 frontmatter에 ID를 다시 적지 않는다.
- 중요한 규칙은 `### ACC-001`, 완료 조건은 `### AC-01`처럼 제목 자체를 ID로 둔다. 이름은 그 아래 문장에 적는다. AC와 질문 번호는 파일 안에서만 유일하면 된다.
- 업무 규칙 접두사는 `ACC / SCH / ATT / PAY / SWP / NTF`다. 번호는 해당 업무 규칙 문서에서 발급하고 재사용하지 않는다. 공통 설계에도 고정 참조가 필요할 때만 `SYS-…`를 쓴다. 모든 설명 문장에 ID를 붙이지 않는다.
- 규칙을 나누거나 없애면 기존 ID에 대체 조항을 연결한다. 숫자를 다시 매겨 참조를 깨뜨리지 않는다.
- spec·proposal·observation 외 문서에 일괄 `status`를 붙이지 않는다. 작업 진행 상태는 backlog, 기능 승인은 spec, 제안 판단은 proposal이 소유한다.

이 선언으로 직접 의존 문서를 계산하고, 일반 본문 링크로 추가 영향을 찾는다. 간접 영향과 의미 변화까지 참조 선언만으로 알아낼 수 있다고 가정하지 않는다.

### 마지막에 확인할 질문

**근거가 있는가, 이 문서의 책임인가, 입력과 결과가 분명한가, 실패·경계 조건을 보았는가, 바뀌면 어디를 다시 읽어야 하는가.** 다섯 질문을 공통 기준으로 두고 문서별 검토에서는 그 문서만의 질문을 추가한다. 승인되지 않은 정책을 틀의 예시나 테스트 기대값으로 확정하지 않는다.

문서끼리 충돌하면 양쪽 조항·결정 근거·현재 코드·영향 작업을 함께 비교한다. 최근 수정일이나 더 상세한 문서라는 이유로 승자를 고르지 않는다. 근거가 충분하면 소유 문서를 바로잡고, 제품 판단이 남으면 그 문서의 미정에 둔다.

## 변경 전파

변경된 조항을 참조하는 활성 문서와 테스트를 확인한다. 영향 처리 결과는 해당 PR에 남긴다.

기준을 고치는 PR은 그것을 `sources`로 든 spec·plan과 관련 테스트를 같은 PR에서 고치거나, 영향이 없는 이유를 남기거나, 전환 작업을 연결한다.

근거는 [ADR-009](2-design/adr/ADR-009-design-modules-and-stage-links.md)의 「기준을 고치는 PR이 영향을 확인한다」에 있다.

## 협업 기록

[backlog](backlog.md)·[handoff](handoff.md)·[log](log/)·[CHANGELOG](CHANGELOG.md)는 단계 밖에서 작업 상태와 회차를 나른다. 작성법 하나는 「용도·작성 시점 / 필요한 입력 / 복사용 틀 / 절별 질문 / 검토 기준」 순서고, 해당 없는 항목은 뺀다.

### backlog

**복사용 틀:**

```markdown
# backlog

| 작업 ID | 작업 | 상태 | 선행 작업 ID | spec 또는 plan | 검증·완료 근거 |
| --- | --- | --- | --- | --- | --- |
| <task> | <완료할 변화> | candidate | <없음 또는 작업 ID> | <문서 링크 또는 미작성과 이유> | <실제 결과 링크 또는 없음> |
```

**절별 질문:**

| 상태 | 행을 작성·변경할 때 확인할 것 |
| --- | --- |
| `candidate` | 검토할 문제나 개선 후보가 있는가. 아직 방향·착수 조건이 없어도 된다 |
| `blocked` | 선행 작업 또는 소유 문서의 미정이 무엇인지 링크했는가 |
| `ready` | 선행 조건과 plan이 준비되었는가. 기능이면 승인된 spec이 있는가 |
| `active` | 실제로 착수한 작업인가 |
| `done` | spec 또는 비기능 plan의 완료 조건을 충족하는 실제 근거가 있는가 |

**검토 기준:** `ready` 행은 위에서부터 착수하므로 행 순서가 우선순위를 나타낸다. 상태별 목록을 따로 만들지 않는다. 후보가 실행 작업이 될 때는 plan 또는 기능 사슬을 갖춘다. 준비 task의 완료는 구현 완료와 구별하고, 산출물 파일명은 준비 task ID와 다를 수 있다.

### handoff

**복사용 틀:**

```markdown
# Handoff

## 다음 작업
<backlog의 작업 ID와 링크>

## 재개 맥락
<해당 작업 재개에 필요한 회차별 정보. 없으면 없음>
```

**검토 기준:** 문제가 다음 회차에도 필요한 상시 규칙이면 소유 문서로 옮긴다. 열린 제품 질문·전체 완료 목록·복제한 작업 상태를 넣지 않는다. 작업 ID의 구체 행 링크 방식은 보드 검사와 함께 정하고, 그전에는 backlog 파일 링크와 ID를 함께 쓴다. 상태별 절 앵커를 새 보드에도 있는 것처럼 쓰지 않는다.

### log

**복사용 틀:**

```markdown
# <날짜> — <회차의 주요 판단>

## 판단과 근거
<무엇을 왜 정했나 / 실제 사용자 결정·검증·PR 근거>

## 확인한 결과
<merge된 PR·CI·evidence 링크와 그 결과의 의미>

## 남긴 질문과 후속 작업
<소유 문서·backlog 링크. 현재 상태를 복제하지 않음>
```

**검토 기준:** log는 도구 호출을 전부 옮기는 일지가 아니다. 선택 이유·실패에서 배운 사실·다음 판단에 필요한 근거를 남긴다. 미완료 작업은 완료 결과와 구별하고 실제 없는 PR 번호나 merge 사실을 만들지 않는다.

### CHANGELOG

**검토 기준:** CHANGELOG는 `날짜 / 변경 / PR` 표를 유지한다. merge 날짜와 최종 변경 효과를 한 행으로 쓰고 이유는 PR·log로 보낸다. 작성법은 이 절이 소유하고 파일 머리에는 용도와 안내 링크만 둔다. 과거 log·CHANGELOG를 새 틀로 소급 작성하지 않는다.
